import { prisma } from "@/lib/prisma";
import { BetStatus, BetType } from "@prisma/client";

/* ───── Types ───── */

export interface PreImportSummary {
  readyRows: Array<{
    rowId: string;
    rowNumber: number;
    homeTeam: string | null;
    awayTeam: string | null;
    betType: string | null;
    outcome: string | null;
    wagerAmount: number | null;
    gameId: string | null;
  }>;
  notReadyRows: Array<{
    rowId: string;
    rowNumber: number;
    reason: string;
  }>;
  summary: {
    readyCount: number;
    notReadyCount: number;
    alreadyImported: number;
    totalWager: number;
    outcomes: { won: number; lost: number; push: number };
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  betIds: string[];
  errors: string[];
}

/* ───── Pre-Import Validation ───── */

export async function preImportValidation(
  uploadId: string
): Promise<PreImportSummary> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  const readyRows: PreImportSummary["readyRows"] = [];
  const notReadyRows: PreImportSummary["notReadyRows"] = [];
  let alreadyImported = 0;
  let totalWager = 0;
  const outcomes = { won: 0, lost: 0, push: 0 };

  for (const row of upload.rows) {
    // Already imported
    if (row.importedBetId) {
      alreadyImported++;
      continue;
    }

    // Only import CORRECT or CORRECTED rows
    if (
      row.validationStatus !== "CORRECT" &&
      row.validationStatus !== "CORRECTED"
    ) {
      notReadyRows.push({
        rowId: row.id,
        rowNumber: row.rowNumber,
        reason: `Status is ${row.validationStatus} — must be CORRECT or CORRECTED`,
      });
      continue;
    }

    // Need a matched game
    if (!row.matchedGameId) {
      notReadyRows.push({
        rowId: row.id,
        rowNumber: row.rowNumber,
        reason: "No matched game",
      });
      continue;
    }

    // Get the data to import (corrected > normalized > original)
    const data = getRowData(row);

    if (!data.teamSelected) {
      notReadyRows.push({
        rowId: row.id,
        rowNumber: row.rowNumber,
        reason: "Missing teamSelected",
      });
      continue;
    }

    if (!data.wagerAmount || data.wagerAmount <= 0) {
      notReadyRows.push({
        rowId: row.id,
        rowNumber: row.rowNumber,
        reason: "Missing or invalid wagerAmount",
      });
      continue;
    }

    readyRows.push({
      rowId: row.id,
      rowNumber: row.rowNumber,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      betType: data.betType,
      outcome: data.outcome,
      wagerAmount: data.wagerAmount,
      gameId: row.matchedGameId,
    });

    totalWager += data.wagerAmount;
    const outcomeUpper = (data.outcome ?? "").toUpperCase();
    if (outcomeUpper === "WON" || outcomeUpper === "W" || outcomeUpper === "WIN")
      outcomes.won++;
    else if (
      outcomeUpper === "LOST" ||
      outcomeUpper === "L" ||
      outcomeUpper === "LOSS"
    )
      outcomes.lost++;
    else if (
      outcomeUpper === "PUSH" ||
      outcomeUpper === "TIE" ||
      outcomeUpper === "DRAW"
    )
      outcomes.push++;
  }

  return {
    readyRows,
    notReadyRows,
    summary: {
      readyCount: readyRows.length,
      notReadyCount: notReadyRows.length,
      alreadyImported,
      totalWager,
      outcomes,
    },
  };
}

/* ───── Import Rows ───── */

export async function importRows(
  uploadId: string,
  adminUserId: string,
  rowIds?: string[]
): Promise<ImportResult> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  // Filter to eligible rows
  let eligibleRows = upload.rows.filter(
    (r) =>
      !r.importedBetId &&
      (r.validationStatus === "CORRECT" || r.validationStatus === "CORRECTED") &&
      r.matchedGameId
  );

  // If specific row IDs provided, filter further
  if (rowIds && rowIds.length > 0) {
    const idSet = new Set(rowIds);
    eligibleRows = eligibleRows.filter((r) => idSet.has(r.id));
  }

  const betIds: string[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Build all operations for the transaction
  const operations: Array<() => ReturnType<typeof prisma.bet.create>> = [];
  const rowUpdates: Array<{
    rowId: string;
    betId: string;
  }> = [];

  for (const row of eligibleRows) {
    const data = getRowData(row);

    if (!data.teamSelected || !data.wagerAmount || data.wagerAmount <= 0) {
      skipped++;
      errors.push(`Row ${row.rowNumber}: missing required fields`);
      continue;
    }

    // Map bet type
    const betType = mapBetType(data.betType);

    // Map outcome to BetStatus
    const status = mapOutcome(data.outcome);

    // Use the actual value for the correct outcome if available
    const actualData = row.actualValue as any;
    const betStatus: BetStatus =
      actualData?.correctOutcome ?? status ?? "PENDING";

    // Get the game for dates
    const game = await prisma.game.findUnique({
      where: { id: row.matchedGameId! },
    });

    if (!game) {
      skipped++;
      errors.push(`Row ${row.rowNumber}: matched game not found`);
      continue;
    }

    // Create bet in transaction
    operations.push(() =>
      prisma.bet.create({
        data: {
          userId: adminUserId,
          betType,
          wagerAmount: data.wagerAmount!,
          potentialPayout: data.payout,
          status: betStatus,
          placedAt: game.gameDate,
          settledAt: game.status === "FINAL" ? game.gameDate : null,
          notes: `Imported from upload "${upload.fileName}", row ${row.rowNumber}`,
          legs: {
            create: [
              {
                gameId: row.matchedGameId!,
                teamSelected: data.teamSelected!,
                lineValue: data.lineValue,
                odds: data.odds,
                outcome: betStatus,
              },
            ],
          },
        },
      })
    );

    rowUpdates.push({ rowId: row.id, betId: "" }); // betId filled after transaction
  }

  if (operations.length === 0) {
    return { imported: 0, skipped, betIds: [], errors };
  }

  // Execute all in a transaction
  const results = await prisma.$transaction(async (tx) => {
    const createdBets: Array<{ id: string; rowId: string }> = [];

    for (let i = 0; i < operations.length; i++) {
      // Re-create the prisma call using the transaction client
      const rowData = getRowData(eligibleRows[i - skipped + (i < eligibleRows.length ? 0 : 0)]);
      // Actually we need to be more careful here. Let me restructure.
      // The operations array and rowUpdates are parallel. Let me just inline the creation.
    }

    // Inline creation in transaction
    let idx = 0;
    for (const row of eligibleRows) {
      const data = getRowData(row);
      if (!data.teamSelected || !data.wagerAmount || data.wagerAmount <= 0) continue;

      const betType = mapBetType(data.betType);
      const actualData = row.actualValue as any;
      const betStatus: BetStatus =
        actualData?.correctOutcome ?? mapOutcome(data.outcome) ?? "PENDING";

      const game = await tx.game.findUnique({
        where: { id: row.matchedGameId! },
      });
      if (!game) continue;

      const bet = await tx.bet.create({
        data: {
          userId: adminUserId,
          betType,
          wagerAmount: data.wagerAmount,
          potentialPayout: data.payout,
          status: betStatus,
          placedAt: game.gameDate,
          settledAt: game.status === "FINAL" ? game.gameDate : null,
          notes: `Imported from upload "${upload.fileName}", row ${row.rowNumber}`,
          legs: {
            create: [
              {
                gameId: row.matchedGameId!,
                teamSelected: data.teamSelected,
                lineValue: data.lineValue,
                odds: data.odds,
                outcome: betStatus,
              },
            ],
          },
        },
      });

      createdBets.push({ id: bet.id, rowId: row.id });
      idx++;
    }

    // Link rows to bets
    for (const { id, rowId } of createdBets) {
      await tx.uploadRow.update({
        where: { id: rowId },
        data: {
          importedBetId: id,
          importedAt: new Date(),
        },
      });
    }

    // Update upload counts
    await tx.excelUpload.update({
      where: { id: uploadId },
      data: {
        status: "IMPORTED",
        importedCount: createdBets.length,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "IMPORT_BETS",
        entityType: "ExcelUpload",
        entityId: uploadId,
        newValue: {
          importedCount: createdBets.length,
          betIds: createdBets.map((b) => b.id),
        } as any,
      },
    });

    return createdBets;
  });

  return {
    imported: results.length,
    skipped,
    betIds: results.map((r) => r.id),
    errors,
  };
}

/* ───── Rollback ───── */

export async function rollbackImport(
  uploadId: string,
  adminUserId: string
): Promise<{ rolledBack: number }> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: {
      rows: {
        where: { importedBetId: { not: null } },
      },
    },
  });

  if (!upload) throw new Error("Upload not found");

  const importedRows = upload.rows;
  if (importedRows.length === 0) {
    return { rolledBack: 0 };
  }

  const betIds = importedRows
    .map((r) => r.importedBetId!)
    .filter(Boolean);

  await prisma.$transaction(async (tx) => {
    // Delete bet legs first (cascade should handle this, but be explicit)
    await tx.betLeg.deleteMany({
      where: { betId: { in: betIds } },
    });

    // Delete bets
    await tx.bet.deleteMany({
      where: { id: { in: betIds } },
    });

    // Clear import links on rows
    for (const row of importedRows) {
      await tx.uploadRow.update({
        where: { id: row.id },
        data: {
          importedBetId: null,
          importedAt: null,
        },
      });
    }

    // Reset upload status
    await tx.excelUpload.update({
      where: { id: uploadId },
      data: {
        status: "VALIDATED",
        importedCount: 0,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "ROLLBACK_IMPORT",
        entityType: "ExcelUpload",
        entityId: uploadId,
        oldValue: {
          rolledBackCount: importedRows.length,
          betIds,
        } as any,
      },
    });
  });

  return { rolledBack: importedRows.length };
}

/* ───── Helpers ───── */

function getRowData(row: any): {
  homeTeam: string | null;
  awayTeam: string | null;
  betType: string | null;
  teamSelected: string | null;
  lineValue: number | null;
  odds: number | null;
  outcome: string | null;
  wagerAmount: number | null;
  payout: number | null;
} {
  // Priority: corrected > normalized > original
  const corrected = row.correctedValue as any;
  const normalized = row.normalizedData as any;
  const original = row.originalValue as any;
  const data = corrected ?? normalized ?? original ?? {};

  return {
    homeTeam: data.homeTeam ?? null,
    awayTeam: data.awayTeam ?? null,
    betType: data.betType ?? null,
    teamSelected: data.teamSelected ?? null,
    lineValue: data.lineValue != null ? Number(data.lineValue) : null,
    odds: data.odds != null ? Number(data.odds) : null,
    outcome: data.outcome ?? null,
    wagerAmount: data.wagerAmount != null ? Number(data.wagerAmount) : null,
    payout: data.payout != null ? Number(data.payout) : null,
  };
}

function mapBetType(raw: string | null): BetType {
  if (!raw) return "MONEY_LINE";
  const upper = raw.toUpperCase().trim();
  if (upper === "POINT_SPREAD" || upper === "SPREAD") return "POINT_SPREAD";
  if (upper === "PARLAY") return "PARLAY";
  return "MONEY_LINE";
}

function mapOutcome(raw: string | null): BetStatus {
  if (!raw) return "PENDING";
  const upper = raw.toUpperCase().trim();
  if (["WON", "W", "WIN", "WINNER"].includes(upper)) return "WON";
  if (["LOST", "L", "LOSS", "LOSE", "LOSER"].includes(upper)) return "LOST";
  if (["PUSH", "TIE", "DRAW", "D", "T", "PK"].includes(upper)) return "PUSH";
  return "PENDING";
}

import { prisma } from "@/lib/prisma";
import { ValidationStatus } from "@prisma/client";
import { matchGame } from "./pass-game-matching";
import { validateOutcome } from "./pass-outcome";
import { validateFinancials } from "./pass-financial";
import { validateCrossRow } from "./pass-cross-row";
import type {
  RowValidationResult,
  UncertainReasonCode,
  ValidationReceiptStep,
  FieldConfidence,
  ESPNSnapshot,
  ValidationFlag,
} from "./types";

export type { RowValidationResult };

export async function validateUpload(uploadId: string): Promise<{
  correct: number;
  flagged: number;
  uncertain: number;
}> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  let correct = 0;
  let flagged = 0;
  let uncertain = 0;

  // Build cross-row context from all rows
  const crossRowContext = upload.rows.map((row) => {
    const data = (row.normalizedData ?? row.originalValue) as any;
    return {
      rowNumber: row.rowNumber,
      date: data?.date ?? null,
      homeTeam: data?.homeTeam ?? null,
      awayTeam: data?.awayTeam ?? null,
      teamSelected: data?.teamSelected ?? null,
      betType: data?.betType ?? null,
      wagerAmount: data?.wagerAmount ?? null,
      matchedGameId: row.matchedGameId,
      homeScore: null as number | null,
      awayScore: null as number | null,
    };
  });

  // Process rows — collect all updates and apply in transaction
  const updates: Array<{
    rowId: string;
    data: {
      matchedGameId: string | null;
      validationStatus: ValidationStatus;
      actualValue: any;
      uncertainReasons: UncertainReasonCode[] | undefined;
      validationReceipt: ValidationReceiptStep[];
      fieldConfidence: FieldConfidence[];
      espnSnapshot: ESPNSnapshot | null | undefined;
    };
  }> = [];

  for (const row of upload.rows) {
    // Skip re-validation of corrected rows
    if (row.validationStatus === "CORRECTED" && row.correctedValue) {
      correct++;
      continue;
    }

    const normalized = row.normalizedData as any;
    const original = normalized || (row.originalValue as any);
    if (!original) {
      uncertain++;
      updates.push({
        rowId: row.id,
        data: {
          matchedGameId: null,
          validationStatus: "UNCERTAIN",
          actualValue: null,
          uncertainReasons: ["MISSING_REQUIRED_FIELD"],
          validationReceipt: [
            {
              pass: "pre_check",
              timestamp: new Date().toISOString(),
              result: "skip",
              details: "No row data available",
            },
          ],
          fieldConfidence: [],
          espnSnapshot: undefined,
        },
      });
      continue;
    }

    // Pass 1: Game Matching
    const gameResult = await matchGame({
      date: original.date,
      sport: original.sport,
      homeTeam: original.homeTeam,
      awayTeam: original.awayTeam,
      teamSelected: original.teamSelected,
    });

    // Update cross-row context with matched game scores
    const ctxRow = crossRowContext.find((r) => r.rowNumber === row.rowNumber);
    if (ctxRow && gameResult.game) {
      ctxRow.matchedGameId = gameResult.game.id;
      ctxRow.homeScore = gameResult.game.homeScore;
      ctxRow.awayScore = gameResult.game.awayScore;
    }

    // Pass 2: Outcome Validation
    const outcomeResult = await validateOutcome(
      {
        outcome: original.outcome,
        betType: original.betType,
        teamSelected: original.teamSelected,
        lineValue: original.lineValue,
      },
      gameResult.game
    );

    // Pass 3: Financial Validation
    const financialResult = validateFinancials(
      {
        odds: original.odds,
        wagerAmount: original.wagerAmount,
        payout: original.payout,
        profit: original.profit,
        outcome: original.outcome,
        teamSelected: original.teamSelected,
      },
      gameResult.game
    );

    // Pass 4: Cross-Row Checks
    const crossRowData = crossRowContext.find(
      (r) => r.rowNumber === row.rowNumber
    )!;
    const crossRowResult = validateCrossRow(crossRowData, crossRowContext);

    // Aggregate results
    const allReasons: UncertainReasonCode[] = [...gameResult.uncertainReasons];
    const allReceipt: ValidationReceiptStep[] = [
      gameResult.receiptStep,
      outcomeResult.receiptStep,
      financialResult.receiptStep,
      crossRowResult.receiptStep,
    ];
    const allConfidences: FieldConfidence[] = [...gameResult.fieldConfidences];
    const allFlags: ValidationFlag[] = [
      ...outcomeResult.flags,
      ...financialResult.flags,
      ...crossRowResult.flags,
    ];

    // Check for missing bet type
    if (!original.betType && !original.lineValue) {
      allReasons.push("NO_BET_TYPE");
    }

    // Check for missing odds
    if (original.odds == null) {
      allReasons.push("NO_ODDS_DATA");
    }

    // Build actual value
    let actualValue: Record<string, any> | null = null;
    if (gameResult.game && gameResult.game.status === "FINAL") {
      actualValue = {
        homeTeam: gameResult.game.homeTeam,
        awayTeam: gameResult.game.awayTeam,
        homeScore: gameResult.game.homeScore,
        awayScore: gameResult.game.awayScore,
        date: gameResult.game.gameDate.toISOString(),
        correctOutcome: outcomeResult.computedOutcome,
        recordedOutcome: original.outcome,
        betType: original.betType ?? "MONEY_LINE",
      };
    }

    // Determine final status
    let validationStatus: ValidationStatus;
    const hasErrors = allFlags.some((f) => f.severity === "error");

    if (outcomeResult.match === true && !hasErrors) {
      validationStatus = "CORRECT";
      correct++;
    } else if (outcomeResult.match === false || hasErrors) {
      validationStatus = "FLAGGED";
      flagged++;
    } else {
      // match is null (couldn't compare) or uncertain reasons exist
      validationStatus = "UNCERTAIN";
      uncertain++;

      // Add reason if game matched but outcome couldn't be computed
      if (gameResult.game && outcomeResult.match === null && !allReasons.length) {
        if (gameResult.game.status !== "FINAL") {
          allReasons.push("GAME_NOT_FINAL");
        } else if (!original.outcome) {
          allReasons.push("MISSING_REQUIRED_FIELD");
        }
      }
      if (!allReasons.length) {
        allReasons.push("NO_GAME_MATCH");
      }
    }

    updates.push({
      rowId: row.id,
      data: {
        matchedGameId: gameResult.game?.id ?? null,
        validationStatus,
        actualValue,
        uncertainReasons: allReasons.length > 0 ? allReasons : undefined,
        validationReceipt: allReceipt,
        fieldConfidence: allConfidences,
        espnSnapshot: gameResult.espnSnapshot ?? undefined,
      },
    });
  }

  // Apply all updates in a transaction
  await prisma.$transaction([
    ...updates.map((u) =>
      prisma.uploadRow.update({
        where: { id: u.rowId },
        data: {
          matchedGameId: u.data.matchedGameId,
          validationStatus: u.data.validationStatus,
          actualValue: u.data.actualValue ?? undefined,
          uncertainReasons: u.data.uncertainReasons,
          validationReceipt: u.data.validationReceipt as any,
          fieldConfidence: u.data.fieldConfidence as any,
          espnSnapshot: u.data.espnSnapshot as any,
        },
      })
    ),
    prisma.excelUpload.update({
      where: { id: uploadId },
      data: {
        status: "VALIDATED",
        correctCount: correct,
        flaggedCount: flagged,
        uncertainCount: uncertain,
      },
    }),
  ]);

  return { correct, flagged, uncertain };
}

/**
 * Re-validate only UNCERTAIN rows (useful when games become FINAL).
 * Skips CORRECT and CORRECTED rows.
 */
export async function revalidateUpload(uploadId: string): Promise<{
  correct: number;
  flagged: number;
  uncertain: number;
  revalidated: number;
}> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  // Only re-validate UNCERTAIN rows
  const uncertainRows = upload.rows.filter(
    (r) => r.validationStatus === "UNCERTAIN"
  );

  if (uncertainRows.length === 0) {
    return {
      correct: upload.correctCount,
      flagged: upload.flaggedCount,
      uncertain: upload.uncertainCount,
      revalidated: 0,
    };
  }

  // Build cross-row context
  const crossRowContext = upload.rows.map((row) => {
    const data = (row.normalizedData ?? row.originalValue) as any;
    return {
      rowNumber: row.rowNumber,
      date: data?.date ?? null,
      homeTeam: data?.homeTeam ?? null,
      awayTeam: data?.awayTeam ?? null,
      teamSelected: data?.teamSelected ?? null,
      betType: data?.betType ?? null,
      wagerAmount: data?.wagerAmount ?? null,
      matchedGameId: row.matchedGameId,
      homeScore: null as number | null,
      awayScore: null as number | null,
    };
  });

  let newCorrect = upload.correctCount;
  let newFlagged = upload.flaggedCount;
  let newUncertain = upload.uncertainCount;
  let revalidated = 0;

  const updates: Array<{
    rowId: string;
    data: any;
    prevStatus: string;
  }> = [];

  for (const row of uncertainRows) {
    const normalized = row.normalizedData as any;
    const original = normalized || (row.originalValue as any);
    if (!original) continue;

    const gameResult = await matchGame({
      date: original.date,
      sport: original.sport,
      homeTeam: original.homeTeam,
      awayTeam: original.awayTeam,
      teamSelected: original.teamSelected,
    });

    const outcomeResult = await validateOutcome(
      {
        outcome: original.outcome,
        betType: original.betType,
        teamSelected: original.teamSelected,
        lineValue: original.lineValue,
      },
      gameResult.game
    );

    const financialResult = validateFinancials(
      {
        odds: original.odds,
        wagerAmount: original.wagerAmount,
        payout: original.payout,
        profit: original.profit,
        outcome: original.outcome,
        teamSelected: original.teamSelected,
      },
      gameResult.game
    );

    const ctxRow = crossRowContext.find((r) => r.rowNumber === row.rowNumber)!;
    if (gameResult.game) {
      ctxRow.matchedGameId = gameResult.game.id;
      ctxRow.homeScore = gameResult.game.homeScore;
      ctxRow.awayScore = gameResult.game.awayScore;
    }
    const crossRowResult = validateCrossRow(ctxRow, crossRowContext);

    const allReasons: UncertainReasonCode[] = [...gameResult.uncertainReasons];
    const allFlags: ValidationFlag[] = [
      ...outcomeResult.flags,
      ...financialResult.flags,
      ...crossRowResult.flags,
    ];

    let validationStatus: ValidationStatus;
    const hasErrors = allFlags.some((f) => f.severity === "error");

    if (outcomeResult.match === true && !hasErrors) {
      validationStatus = "CORRECT";
    } else if (outcomeResult.match === false || hasErrors) {
      validationStatus = "FLAGGED";
    } else {
      validationStatus = "UNCERTAIN";
      if (!allReasons.length) allReasons.push("NO_GAME_MATCH");
    }

    let actualValue: any = null;
    if (gameResult.game && gameResult.game.status === "FINAL") {
      actualValue = {
        homeTeam: gameResult.game.homeTeam,
        awayTeam: gameResult.game.awayTeam,
        homeScore: gameResult.game.homeScore,
        awayScore: gameResult.game.awayScore,
        date: gameResult.game.gameDate.toISOString(),
        correctOutcome: outcomeResult.computedOutcome,
        recordedOutcome: original.outcome,
        betType: original.betType ?? "MONEY_LINE",
      };
    }

    // Track count changes
    if (validationStatus !== "UNCERTAIN") {
      newUncertain--;
      revalidated++;
      if (validationStatus === "CORRECT") newCorrect++;
      else if (validationStatus === "FLAGGED") newFlagged++;
    }

    updates.push({
      rowId: row.id,
      prevStatus: "UNCERTAIN",
      data: {
        matchedGameId: gameResult.game?.id ?? null,
        validationStatus,
        actualValue: actualValue ?? undefined,
        uncertainReasons: allReasons.length > 0 ? allReasons : undefined,
        validationReceipt: [
          gameResult.receiptStep,
          outcomeResult.receiptStep,
          financialResult.receiptStep,
          crossRowResult.receiptStep,
        ] as any,
        fieldConfidence: gameResult.fieldConfidences as any,
        espnSnapshot: gameResult.espnSnapshot
          ? (gameResult.espnSnapshot as any)
          : undefined,
      },
    });
  }

  // Apply in transaction
  if (updates.length > 0) {
    await prisma.$transaction([
      ...updates.map((u) =>
        prisma.uploadRow.update({
          where: { id: u.rowId },
          data: u.data,
        })
      ),
      prisma.excelUpload.update({
        where: { id: uploadId },
        data: {
          correctCount: newCorrect,
          flaggedCount: newFlagged,
          uncertainCount: newUncertain,
        },
      }),
    ]);
  }

  return {
    correct: newCorrect,
    flagged: newFlagged,
    uncertain: newUncertain,
    revalidated,
  };
}

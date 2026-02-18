import type {
  CrossRowResult,
  ValidationFlag,
  ValidationReceiptStep,
} from "./types";

interface RowData {
  rowNumber: number;
  date?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  teamSelected?: string | null;
  betType?: string | null;
  wagerAmount?: number | null;
}

interface RowWithGame extends RowData {
  matchedGameId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

export function validateCrossRow(
  row: RowWithGame,
  allRows: RowWithGame[]
): CrossRowResult {
  const startTime = new Date().toISOString();
  const flags: ValidationFlag[] = [];
  let duplicateOf: number | null = null;

  // Duplicate detection
  const dupes = allRows.filter(
    (other) =>
      other.rowNumber !== row.rowNumber &&
      other.rowNumber < row.rowNumber && // Only flag against earlier rows
      other.date === row.date &&
      other.homeTeam === row.homeTeam &&
      other.awayTeam === row.awayTeam &&
      other.teamSelected === row.teamSelected &&
      other.betType === row.betType &&
      other.wagerAmount === row.wagerAmount
  );

  if (dupes.length > 0) {
    duplicateOf = dupes[0].rowNumber;
    flags.push({
      field: "row",
      severity: "warning",
      message: `Possible duplicate of row ${duplicateOf} (same date, teams, bet type, and wager)`,
      expected: "unique row",
      actual: `duplicate of row ${duplicateOf}`,
    });
  }

  // Score consistency: multiple rows for the same game should not imply different scores
  if (row.matchedGameId) {
    const sameGame = allRows.filter(
      (other) =>
        other.rowNumber !== row.rowNumber &&
        other.matchedGameId === row.matchedGameId
    );

    for (const other of sameGame) {
      if (
        other.homeScore != null &&
        row.homeScore != null &&
        other.homeScore !== row.homeScore
      ) {
        flags.push({
          field: "homeScore",
          severity: "warning",
          message: `Score conflict: row ${row.rowNumber} and row ${other.rowNumber} reference the same game but imply different home scores (${row.homeScore} vs ${other.homeScore})`,
        });
        break;
      }
    }
  }

  const hasFlags = flags.length > 0;

  return {
    duplicateOf,
    flags,
    receiptStep: makeReceipt(
      startTime,
      hasFlags ? "warning" : "pass",
      hasFlags
        ? flags.map((f) => f.message).join("; ")
        : "No cross-row issues detected"
    ),
  };
}

/* ───── Receipt Helper ───── */

function makeReceipt(
  startTime: string,
  result: "pass" | "fail" | "skip" | "warning",
  details: string,
  data?: Record<string, any>
): ValidationReceiptStep {
  return {
    pass: "cross_row_validation",
    timestamp: startTime,
    result,
    details,
    data,
  };
}

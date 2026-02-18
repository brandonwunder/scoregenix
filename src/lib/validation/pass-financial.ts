import type {
  FinancialResult,
  GameRecord,
  ValidationFlag,
  ValidationReceiptStep,
} from "./types";

interface RowData {
  odds?: number | null;
  wagerAmount?: number | null;
  payout?: number | null;
  profit?: number | null;
  outcome?: string | null;
  teamSelected?: string | null;
}

const PAYOUT_TOLERANCE = 0.02; // 2% tolerance for rounding

export function validateFinancials(
  row: RowData,
  game: GameRecord | null
): FinancialResult {
  const startTime = new Date().toISOString();
  const flags: ValidationFlag[] = [];

  // Skip if no financial data
  if (row.wagerAmount == null && row.odds == null && row.payout == null) {
    return {
      expectedPayout: null,
      reportedPayout: row.payout ?? null,
      payoutMatch: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", "No financial data to validate"),
    };
  }

  const receiptData: Record<string, any> = {};

  // Flag negative wagers
  if (row.wagerAmount != null && row.wagerAmount < 0) {
    flags.push({
      field: "wagerAmount",
      severity: "warning",
      message: `Negative wager amount: $${row.wagerAmount}`,
      actual: row.wagerAmount,
    });
  }

  // Flag unreasonable odds
  if (row.odds != null) {
    if (Math.abs(row.odds) < 100 && row.odds !== 0) {
      flags.push({
        field: "odds",
        severity: "info",
        message: `Unusual odds value: ${row.odds} (expected American format)`,
        actual: row.odds,
      });
    }
    if (Math.abs(row.odds) > 50000) {
      flags.push({
        field: "odds",
        severity: "warning",
        message: `Extremely high odds: ${row.odds}`,
        actual: row.odds,
      });
    }
  }

  // Calculate expected payout
  let expectedPayout: number | null = null;
  if (row.wagerAmount != null && row.odds != null && row.wagerAmount > 0) {
    expectedPayout = calculatePayout(row.wagerAmount, row.odds);
    receiptData.wager = row.wagerAmount;
    receiptData.odds = row.odds;
    receiptData.expectedPayout = expectedPayout;
  }

  // Compare reported payout to expected
  let payoutMatch: boolean | null = null;
  if (expectedPayout != null && row.payout != null) {
    const diff = Math.abs(expectedPayout - row.payout);
    const tolerance = Math.max(expectedPayout * PAYOUT_TOLERANCE, 0.01);
    payoutMatch = diff <= tolerance;
    receiptData.reportedPayout = row.payout;
    receiptData.difference = diff;
    receiptData.tolerance = tolerance;

    if (!payoutMatch) {
      flags.push({
        field: "payout",
        severity: "warning",
        message: `Payout mismatch: expected $${expectedPayout.toFixed(2)} but reported $${row.payout.toFixed(2)} (diff: $${diff.toFixed(2)})`,
        expected: expectedPayout,
        actual: row.payout,
      });
    }
  }

  // Flag payout on losses
  const outcomeUpper = row.outcome?.toUpperCase() ?? "";
  const isLoss = ["LOST", "L", "LOSS", "LOSE"].includes(outcomeUpper);
  if (isLoss && row.payout != null && row.payout > 0) {
    flags.push({
      field: "payout",
      severity: "warning",
      message: `Positive payout ($${row.payout}) on a lost bet`,
      actual: row.payout,
    });
  }

  // Cross-check odds against game's locked odds
  if (game && row.odds != null && row.teamSelected) {
    const isHome =
      row.teamSelected.toLowerCase().includes(game.homeTeam.toLowerCase()) ||
      game.homeTeam.toLowerCase().includes(row.teamSelected.toLowerCase());
    const gameOdds = isHome ? game.homeMoneyLine : game.awayMoneyLine;

    if (gameOdds != null) {
      const oddsDiff = Math.abs(row.odds - gameOdds);
      receiptData.gameOdds = gameOdds;
      receiptData.reportedOdds = row.odds;
      receiptData.oddsDifference = oddsDiff;

      if (oddsDiff > 30) {
        flags.push({
          field: "odds",
          severity: "info",
          message: `Odds differ from game data: user ${row.odds} vs game ${gameOdds} (diff: ${oddsDiff})`,
          expected: gameOdds,
          actual: row.odds,
        });
      }
    }
  }

  const hasErrors = flags.some((f) => f.severity === "error");
  const hasWarnings = flags.some((f) => f.severity === "warning");

  return {
    expectedPayout,
    reportedPayout: row.payout ?? null,
    payoutMatch,
    flags,
    receiptStep: makeReceipt(
      startTime,
      hasErrors ? "fail" : hasWarnings ? "warning" : "pass",
      payoutMatch === false
        ? `Payout mismatch: expected $${expectedPayout?.toFixed(2)} vs reported $${row.payout?.toFixed(2)}`
        : payoutMatch === true
          ? `Payout verified: $${row.payout?.toFixed(2)}`
          : "Financial check completed",
      receiptData
    ),
  };
}

/* ───── Payout Calculation ───── */

function calculatePayout(wager: number, americanOdds: number): number {
  if (americanOdds > 0) {
    return wager + wager * (americanOdds / 100);
  } else if (americanOdds < 0) {
    return wager + wager * (100 / Math.abs(americanOdds));
  }
  return wager; // Even odds
}

/* ───── Receipt Helper ───── */

function makeReceipt(
  startTime: string,
  result: "pass" | "fail" | "skip" | "warning",
  details: string,
  data?: Record<string, any>
): ValidationReceiptStep {
  return {
    pass: "financial_validation",
    timestamp: startTime,
    result,
    details,
    data,
  };
}

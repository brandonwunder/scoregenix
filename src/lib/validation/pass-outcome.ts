import { BetStatus } from "@prisma/client";
import { resolveTeamName } from "@/lib/team-matching";
import {
  determineMoneyLineOutcome,
  determineSpreadOutcome,
} from "@/lib/bet-settlement";
import type {
  OutcomeResult,
  GameRecord,
  ValidationFlag,
  ValidationReceiptStep,
} from "./types";

interface RowData {
  outcome?: string | null;
  betType?: string | null;
  teamSelected?: string | null;
  lineValue?: number | null;
}

const OUTCOME_MAP: Record<string, BetStatus> = {
  WIN: "WON",
  W: "WON",
  WON: "WON",
  WINNER: "WON",
  LOSS: "LOST",
  L: "LOST",
  LOST: "LOST",
  LOSE: "LOST",
  LOSER: "LOST",
  PUSH: "PUSH",
  TIE: "PUSH",
  DRAW: "PUSH",
  D: "PUSH",
  T: "PUSH",
  PK: "PUSH",
};

export async function validateOutcome(
  row: RowData,
  game: GameRecord | null
): Promise<OutcomeResult> {
  const startTime = new Date().toISOString();
  const flags: ValidationFlag[] = [];

  // Skip if no game
  if (!game) {
    return {
      computedOutcome: null,
      userOutcome: row.outcome ?? null,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", "No matched game"),
    };
  }

  // Skip if game not final
  if (game.status !== "FINAL") {
    return {
      computedOutcome: null,
      userOutcome: row.outcome ?? null,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", `Game status is ${game.status}, not FINAL`),
    };
  }

  // Skip if scores missing
  if (game.homeScore === null || game.awayScore === null) {
    return {
      computedOutcome: null,
      userOutcome: row.outcome ?? null,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", "Game scores not available"),
    };
  }

  // Need outcome and teamSelected to compare
  if (!row.outcome) {
    flags.push({
      field: "outcome",
      severity: "warning",
      message: "No outcome reported by user",
    });
    return {
      computedOutcome: null,
      userOutcome: null,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", "No user outcome to compare"),
    };
  }

  if (!row.teamSelected) {
    flags.push({
      field: "teamSelected",
      severity: "warning",
      message: "No team selected — cannot determine outcome",
    });
    return {
      computedOutcome: null,
      userOutcome: row.outcome,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "skip", "No teamSelected to compute outcome"),
    };
  }

  // Resolve the selected team
  const selectedTeam = await resolveTeamName(row.teamSelected);
  if (
    selectedTeam.confidence > 0 &&
    selectedTeam.canonical !== game.homeTeam &&
    selectedTeam.canonical !== game.awayTeam
  ) {
    flags.push({
      field: "teamSelected",
      severity: "error",
      message: `Selected team "${selectedTeam.canonical}" is not in this game (${game.homeTeam} vs ${game.awayTeam})`,
      expected: `${game.homeTeam} or ${game.awayTeam}`,
      actual: selectedTeam.canonical,
    });
    return {
      computedOutcome: null,
      userOutcome: row.outcome,
      match: null,
      flags,
      receiptStep: makeReceipt(startTime, "fail", "Team not in matched game"),
    };
  }

  // Determine bet type
  const betType = normalizeBetType(row.betType);

  // Compute outcome using bet-settlement functions
  let computedOutcome: BetStatus;
  const receiptData: Record<string, any> = {
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    teamSelected: selectedTeam.canonical,
    betType,
  };

  if (betType === "POINT_SPREAD" && row.lineValue != null) {
    computedOutcome = determineSpreadOutcome(
      selectedTeam.canonical,
      game.homeTeam,
      game.homeScore,
      game.awayScore,
      Number(row.lineValue)
    );
    receiptData.lineValue = row.lineValue;
    receiptData.method = "spread";
  } else if (betType === "OVER_UNDER" && row.lineValue != null) {
    const totalScore = game.homeScore + game.awayScore;
    const line = Number(row.lineValue);
    if (totalScore > line) {
      computedOutcome = "WON"; // Assuming user took "over" if they selected it
    } else if (totalScore < line) {
      computedOutcome = "LOST";
    } else {
      computedOutcome = "PUSH";
    }
    receiptData.totalScore = totalScore;
    receiptData.line = line;
    receiptData.method = "over_under";

    // O/U outcome depends on whether user took over or under
    // If we can't tell, flag it as a warning
    flags.push({
      field: "betType",
      severity: "info",
      message: `Over/Under: total ${totalScore} vs line ${line}. Cannot determine over/under direction from data.`,
    });
  } else {
    // Default to money line
    computedOutcome = determineMoneyLineOutcome(
      selectedTeam.canonical,
      game.homeTeam,
      game.awayTeam,
      game.homeScore,
      game.awayScore
    );
    receiptData.method = "moneyline";
  }

  receiptData.computedOutcome = computedOutcome;

  // Normalize user's outcome
  const userNormalized = normalizeUserOutcome(row.outcome);
  receiptData.userOutcome = row.outcome;
  receiptData.userNormalized = userNormalized;

  // Compare
  const match = userNormalized === computedOutcome;

  if (!match) {
    flags.push({
      field: "outcome",
      severity: "error",
      message: `Outcome mismatch: user reported "${row.outcome}" (${userNormalized}) but computed ${computedOutcome}`,
      expected: computedOutcome,
      actual: row.outcome,
    });
  }

  return {
    computedOutcome,
    userOutcome: row.outcome,
    match,
    flags,
    receiptStep: makeReceipt(
      startTime,
      match ? "pass" : "fail",
      match
        ? `Outcome verified: ${computedOutcome} (${receiptData.method})`
        : `Outcome MISMATCH: computed ${computedOutcome} vs reported ${userNormalized} (${receiptData.method})`,
      receiptData
    ),
  };
}

/* ───── Helpers ───── */

function normalizeBetType(raw: string | null | undefined): string {
  if (!raw) return "MONEY_LINE";
  const upper = raw.toUpperCase().trim();
  if (upper === "POINT_SPREAD" || upper === "SPREAD" || upper === "ATS") return "POINT_SPREAD";
  if (upper === "OVER_UNDER" || upper === "O/U" || upper === "TOTAL") return "OVER_UNDER";
  if (upper === "PARLAY") return "PARLAY";
  return "MONEY_LINE";
}

function normalizeUserOutcome(outcome: string): BetStatus {
  const upper = outcome.toUpperCase().trim();
  return OUTCOME_MAP[upper] ?? (upper as BetStatus);
}

function makeReceipt(
  startTime: string,
  result: "pass" | "fail" | "skip" | "warning",
  details: string,
  data?: Record<string, any>
): ValidationReceiptStep {
  return {
    pass: "outcome_validation",
    timestamp: startTime,
    result,
    details,
    data,
  };
}

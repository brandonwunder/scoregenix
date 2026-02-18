import { BetStatus, GameStatus, ValidationStatus } from "@prisma/client";

/* ───── Uncertain Reason Codes ───── */

export type UncertainReasonCode =
  | "NO_GAME_MATCH"
  | "GAME_NOT_FINAL"
  | "LOW_CONFIDENCE_TEAM"
  | "ESPN_FETCH_FAILED"
  | "MISSING_REQUIRED_FIELD"
  | "AMBIGUOUS_SPORT"
  | "MULTIPLE_GAME_MATCHES"
  | "TEAM_NOT_IN_GAME"
  | "NO_BET_TYPE"
  | "NO_ODDS_DATA";

/* ───── Per-Field Confidence ───── */

export interface FieldConfidence {
  field: string;
  confidence: number; // 0–1
  source: "exact_alias" | "fuzzy_match" | "header_match" | "value_heuristic" | "user_input" | "espn";
  details?: string;
}

/* ───── Validation Receipt ───── */

export type PassResult = "pass" | "fail" | "skip" | "warning";

export interface ValidationReceiptStep {
  pass: string;
  timestamp: string;
  result: PassResult;
  details: string;
  data?: Record<string, any>;
}

/* ───── Validation Flags ───── */

export type FlagSeverity = "error" | "warning" | "info";

export interface ValidationFlag {
  field: string;
  severity: FlagSeverity;
  message: string;
  expected?: any;
  actual?: any;
}

/* ───── ESPN Snapshot ───── */

export interface ESPNSnapshot {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  homeMoneyLine?: number | null;
  awayMoneyLine?: number | null;
  spreadValue?: string | null;
  capturedAt: string;
}

/* ───── Game Record ───── */

export interface GameRecord {
  id: string;
  sportId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamAbbr: string | null;
  awayTeamAbbr: string | null;
  homeMoneyLine: number | null;
  awayMoneyLine: number | null;
  spreadValue: any; // Decimal from Prisma
  homeSpreadOdds: number | null;
  awaySpreadOdds: number | null;
  oddsLockedAt: Date | null;
}

/* ───── Pass Results ───── */

export interface GameMatchResult {
  game: GameRecord | null;
  receiptStep: ValidationReceiptStep;
  fieldConfidences: FieldConfidence[];
  uncertainReasons: UncertainReasonCode[];
  espnSnapshot: ESPNSnapshot | null;
}

export interface OutcomeResult {
  computedOutcome: BetStatus | null;
  userOutcome: string | null;
  match: boolean | null; // null = couldn't compare
  flags: ValidationFlag[];
  receiptStep: ValidationReceiptStep;
}

export interface FinancialResult {
  expectedPayout: number | null;
  reportedPayout: number | null;
  payoutMatch: boolean | null;
  flags: ValidationFlag[];
  receiptStep: ValidationReceiptStep;
}

export interface CrossRowResult {
  duplicateOf: number | null; // row number of duplicate
  flags: ValidationFlag[];
  receiptStep: ValidationReceiptStep;
}

/* ───── Aggregated Row Result ───── */

export interface RowValidationResult {
  rowId: string;
  rowNumber: number;
  validationStatus: ValidationStatus;
  matchedGameId: string | null;
  actualValue: Record<string, any> | null;
  uncertainReasons: UncertainReasonCode[];
  validationReceipt: ValidationReceiptStep[];
  fieldConfidences: FieldConfidence[];
  espnSnapshot: ESPNSnapshot | null;
  flags: ValidationFlag[];
}

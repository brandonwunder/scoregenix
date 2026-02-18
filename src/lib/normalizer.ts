import { ParsedRow } from "./excel-parser";

/* ───── Exported Types ───── */

export type NormalizedBetType =
  | "MONEY_LINE"
  | "POINT_SPREAD"
  | "OVER_UNDER"
  | "PARLAY";

export type NormalizedOutcome =
  | "WON"
  | "LOST"
  | "PUSH"
  | "VOID"
  | "PENDING";

export interface NormalizationWarning {
  field: string;
  message: string;
  originalValue: any;
  normalizedValue: any;
}

export interface NormalizedRow {
  rowNumber: number;
  date: string | null;
  sport: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  betType: NormalizedBetType | null;
  teamSelected: string | null;
  lineValue: number | null;
  odds: number | null; // always American format
  oddsFormat: "american" | "decimal" | "unknown" | null;
  outcome: NormalizedOutcome | null;
  wagerAmount: number | null;
  payout: number | null;
  profit: number | null;
  warnings: NormalizationWarning[];
}

/* ───── Bet Type Mapping ───── */

const BET_TYPE_MAP: Record<string, NormalizedBetType> = {
  money_line: "MONEY_LINE",
  moneyline: "MONEY_LINE",
  "money line": "MONEY_LINE",
  ml: "MONEY_LINE",
  straight: "MONEY_LINE",
  spread: "POINT_SPREAD",
  point_spread: "POINT_SPREAD",
  "point spread": "POINT_SPREAD",
  ps: "POINT_SPREAD",
  ats: "POINT_SPREAD",
  "against the spread": "POINT_SPREAD",
  pts: "POINT_SPREAD",
  handicap: "POINT_SPREAD",
  "over/under": "OVER_UNDER",
  over_under: "OVER_UNDER",
  "o/u": "OVER_UNDER",
  total: "OVER_UNDER",
  totals: "OVER_UNDER",
  over: "OVER_UNDER",
  under: "OVER_UNDER",
  parlay: "PARLAY",
  accumulator: "PARLAY",
  combo: "PARLAY",
};

function normalizeBetType(
  raw: string | null,
  lineValue: number | null
): { value: NormalizedBetType | null; warning?: NormalizationWarning } {
  if (!raw) {
    // Infer from context
    if (lineValue != null && lineValue !== 0) {
      return {
        value: "POINT_SPREAD",
        warning: {
          field: "betType",
          message: "Inferred POINT_SPREAD from presence of lineValue",
          originalValue: null,
          normalizedValue: "POINT_SPREAD",
        },
      };
    }
    return { value: null };
  }

  const key = raw.toLowerCase().trim();
  const mapped = BET_TYPE_MAP[key];
  if (mapped) return { value: mapped };

  return {
    value: null,
    warning: {
      field: "betType",
      message: `Unrecognized bet type: "${raw}"`,
      originalValue: raw,
      normalizedValue: null,
    },
  };
}

/* ───── Outcome Mapping ───── */

const OUTCOME_MAP: Record<string, NormalizedOutcome> = {
  win: "WON",
  w: "WON",
  won: "WON",
  winner: "WON",
  "1": "WON",
  loss: "LOST",
  l: "LOST",
  lost: "LOST",
  lose: "LOST",
  loser: "LOST",
  "0": "LOST",
  push: "PUSH",
  tie: "PUSH",
  draw: "PUSH",
  d: "PUSH",
  t: "PUSH",
  pk: "PUSH",
  void: "VOID",
  cancelled: "VOID",
  canceled: "VOID",
  "no action": "VOID",
  na: "VOID",
  pending: "PENDING",
  open: "PENDING",
  unsettled: "PENDING",
  tbd: "PENDING",
};

function normalizeOutcome(
  raw: string | null
): { value: NormalizedOutcome | null; warning?: NormalizationWarning } {
  if (!raw) return { value: null };
  const key = raw.toLowerCase().trim();
  const mapped = OUTCOME_MAP[key];
  if (mapped) return { value: mapped };

  return {
    value: null,
    warning: {
      field: "outcome",
      message: `Unrecognized outcome: "${raw}"`,
      originalValue: raw,
      normalizedValue: null,
    },
  };
}

/* ───── Odds Format Detection & Conversion ───── */

function normalizeOdds(raw: number | null): {
  value: number | null;
  format: "american" | "decimal" | "unknown" | null;
  warning?: NormalizationWarning;
} {
  if (raw == null) return { value: null, format: null };

  // American odds: >= 100 or <= -100
  if (raw >= 100 || raw <= -100) {
    return { value: raw, format: "american" };
  }

  // Decimal odds: between 1.01 and 99.99
  if (raw > 1 && raw < 100) {
    let american: number;
    if (raw >= 2.0) {
      american = Math.round((raw - 1) * 100);
    } else {
      american = Math.round(-100 / (raw - 1));
    }
    return {
      value: american,
      format: "decimal",
      warning: {
        field: "odds",
        message: `Detected decimal odds ${raw}, converted to American ${american > 0 ? "+" : ""}${american}`,
        originalValue: raw,
        normalizedValue: american,
      },
    };
  }

  // Edge case: exactly -100 to 100 (excluding above ranges)
  return {
    value: raw,
    format: "unknown",
    warning: {
      field: "odds",
      message: `Unusual odds value: ${raw}. Could not determine format.`,
      originalValue: raw,
      normalizedValue: raw,
    },
  };
}

/* ───── Sport Mapping ───── */

const SPORT_MAP: Record<string, string> = {
  nfl: "nfl",
  football: "nfl",
  "pro football": "nfl",
  "national football league": "nfl",
  nba: "nba",
  basketball: "nba",
  "pro basketball": "nba",
  "national basketball association": "nba",
  mlb: "mlb",
  baseball: "mlb",
  "major league baseball": "mlb",
  nhl: "nhl",
  hockey: "nhl",
  "ice hockey": "nhl",
  "national hockey league": "nhl",
  mls: "mls",
  soccer: "mls",
  "major league soccer": "mls",
  ncaaf: "ncaaf",
  "college football": "ncaaf",
  cfb: "ncaaf",
  "ncaa football": "ncaaf",
  ncaab: "ncaab",
  "college basketball": "ncaab",
  cbb: "ncaab",
  "ncaa basketball": "ncaab",
};

function normalizeSport(
  raw: string | null
): { value: string | null; warning?: NormalizationWarning } {
  if (!raw) return { value: null };
  const key = raw.toLowerCase().trim();

  // Exact match only — no substring matching (Bug #5 fix)
  if (SPORT_MAP[key]) return { value: SPORT_MAP[key] };

  return {
    value: null,
    warning: {
      field: "sport",
      message: `Unrecognized sport: "${raw}"`,
      originalValue: raw,
      normalizedValue: null,
    },
  };
}

/* ───── Financial Sanity Checks ───── */

function checkFinancials(
  wagerAmount: number | null,
  payout: number | null,
  outcome: NormalizedOutcome | null
): NormalizationWarning[] {
  const warnings: NormalizationWarning[] = [];

  if (wagerAmount !== null && wagerAmount < 0) {
    warnings.push({
      field: "wagerAmount",
      message: `Negative wager amount: $${wagerAmount}`,
      originalValue: wagerAmount,
      normalizedValue: wagerAmount,
    });
  }

  if (payout !== null && payout < 0) {
    warnings.push({
      field: "payout",
      message: `Negative payout: $${payout}`,
      originalValue: payout,
      normalizedValue: payout,
    });
  }

  // Payout on a loss should be 0 or negative
  if (
    outcome === "LOST" &&
    payout !== null &&
    payout > 0
  ) {
    warnings.push({
      field: "payout",
      message: `Positive payout ($${payout}) reported on a LOST bet`,
      originalValue: payout,
      normalizedValue: payout,
    });
  }

  return warnings;
}

/* ───── Main Normalization ───── */

export function normalizeRow(parsed: ParsedRow): NormalizedRow {
  const warnings: NormalizationWarning[] = [];

  const betTypeResult = normalizeBetType(parsed.betType, parsed.lineValue);
  if (betTypeResult.warning) warnings.push(betTypeResult.warning);

  const outcomeResult = normalizeOutcome(parsed.outcome);
  if (outcomeResult.warning) warnings.push(outcomeResult.warning);

  const oddsResult = normalizeOdds(parsed.odds);
  if (oddsResult.warning) warnings.push(oddsResult.warning);

  const sportResult = normalizeSport(parsed.sport);
  if (sportResult.warning) warnings.push(sportResult.warning);

  const financialWarnings = checkFinancials(
    parsed.wagerAmount,
    parsed.payout,
    outcomeResult.value
  );
  warnings.push(...financialWarnings);

  return {
    rowNumber: parsed.rowNumber,
    date: parsed.date,
    sport: sportResult.value,
    homeTeam: parsed.homeTeam?.trim() || null,
    awayTeam: parsed.awayTeam?.trim() || null,
    betType: betTypeResult.value,
    teamSelected: parsed.teamSelected?.trim() || null,
    lineValue: parsed.lineValue,
    odds: oddsResult.value,
    oddsFormat: oddsResult.format,
    outcome: outcomeResult.value,
    wagerAmount: parsed.wagerAmount,
    payout: parsed.payout,
    profit: parsed.profit ?? null,
    warnings,
  };
}

export function normalizeRows(parsed: ParsedRow[]): NormalizedRow[] {
  return parsed.map(normalizeRow);
}

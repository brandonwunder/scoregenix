/**
 * Smart column detection for uploaded spreadsheets.
 * Uses header name matching first, then falls back to
 * value-based heuristics for unrecognized columns.
 */

import Fuse from "fuse.js";

/* ───── Types ───── */

export interface ColumnMapping {
  [excelHeader: string]: {
    field: string;
    confidence: number;
    method: "header_match" | "value_heuristic" | "manual";
  };
}

export interface DetectionResult {
  mapping: ColumnMapping;
  overallConfidence: number;
  unmappedColumns: string[];
  ambiguousColumns: { header: string; candidates: string[] }[];
  missingRequired: string[];
}

/* ───── Header-Based Detection ───── */

const HEADER_MAP: Record<string, string> = {
  date: "date",
  game_date: "date",
  gamedate: "date",
  dt: "date",
  sport: "sport",
  league: "sport",
  home: "homeTeam",
  home_team: "homeTeam",
  hometeam: "homeTeam",
  h_team: "homeTeam",
  away: "awayTeam",
  away_team: "awayTeam",
  awayteam: "awayTeam",
  a_team: "awayTeam",
  visitor: "awayTeam",
  bet_type: "betType",
  bettype: "betType",
  type: "betType",
  bet: "betType",
  team: "teamSelected",
  team_selected: "teamSelected",
  pick: "teamSelected",
  selection: "teamSelected",
  selected: "teamSelected",
  line: "lineValue",
  spread: "lineValue",
  line_value: "lineValue",
  point_spread: "lineValue",
  handicap: "lineValue",
  odds: "odds",
  price: "odds",
  juice: "odds",
  outcome: "outcome",
  result: "outcome",
  win_loss: "outcome",
  winloss: "outcome",
  w_l: "outcome",
  wager: "wagerAmount",
  wager_amount: "wagerAmount",
  amount: "wagerAmount",
  stake: "wagerAmount",
  risk: "wagerAmount",
  payout: "payout",
  return: "payout",
  to_win: "payout",
  profit: "profit",
  net: "profit",
  net_profit: "profit",

  // Additional outcome variations
  w_win_loss: "outcome",
  w_winloss: "outcome",
  "w_win/loss": "outcome",
  "win/loss": "outcome",

  // Additional team/wager variations
  team_wagered: "teamSelected",
  team_wager: "teamSelected",
  team_w_agbr: "teamSelected",
  team_w_agr: "teamSelected",
  teamwagered: "teamSelected",
  wagered_team: "teamSelected",

  // Additional odds variations
  o_dds: "odds",
  odd: "odds",
  odss: "odds",
  ods: "odds",

  // Additional wager amount variations (as fallback if not team)
  w_agbr: "wagerAmount",
  w_agr: "wagerAmount",
  wagr: "wagerAmount",
  wgr: "wagerAmount",
};

/* ───── Fuzzy Header Matching ───── */

/**
 * Use fuzzy matching to find the best field match for an unrecognized header.
 * This catches typos, spacing issues, and partial matches.
 */
function fuzzyMatchHeader(header: string): { field: string; confidence: number } | null {
  const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, "_");

  // Create search list of all known header patterns
  const knownHeaders = Object.keys(HEADER_MAP);

  const fuse = new Fuse(knownHeaders, {
    threshold: 0.4, // Allow up to 40% difference
    distance: 100,
    ignoreLocation: true,
    keys: [''],
  });

  const results = fuse.search(normalizedHeader);

  if (results.length > 0 && results[0].score !== undefined) {
    const bestMatch = results[0];
    const matchedKey = bestMatch.item;
    const field = HEADER_MAP[matchedKey];
    const confidence = 1 - (bestMatch.score || 0); // Convert distance to confidence

    // Only accept matches with reasonable confidence
    if (confidence >= 0.6) {
      return { field, confidence };
    }
  }

  return null;
}

const REQUIRED_FIELDS = ["date", "outcome"];
const IMPORTANT_FIELDS = ["homeTeam", "awayTeam", "teamSelected", "betType"];

/* ───── Value-Based Heuristics ───── */

function detectByValues(
  header: string,
  values: any[]
): { field: string; confidence: number }[] {
  const candidates: { field: string; confidence: number }[] = [];
  const samples = values.slice(0, 20).filter((v) => v != null && v !== "");
  if (samples.length === 0) return candidates;

  // Date detection: values that parse as dates or are Excel serial numbers
  const dateCount = samples.filter((v) => {
    if (typeof v === "number" && v > 30000 && v < 60000) return true;
    const str = String(v);
    return /\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}/.test(str);
  }).length;
  if (dateCount > samples.length * 0.6) {
    candidates.push({ field: "date", confidence: 0.7 });
  }

  // Outcome detection: W/L/Won/Lost/Push patterns
  const outcomeCount = samples.filter((v) =>
    /^(win|w|won|loss|l|lost|push|draw|tie|void|pending)$/i.test(
      String(v).trim()
    )
  ).length;
  if (outcomeCount > samples.length * 0.6) {
    candidates.push({ field: "outcome", confidence: 0.8 });
  }

  // Odds detection: American odds patterns (-110, +150, etc.)
  const oddsCount = samples.filter((v) => {
    const str = String(v).trim();
    return /^[+-]?\d{3,4}$/.test(str);
  }).length;
  if (oddsCount > samples.length * 0.5) {
    candidates.push({ field: "odds", confidence: 0.6 });
  }

  // Currency/amount detection: values with $ or reasonable dollar amounts
  const currencyCount = samples.filter((v) =>
    /^\$?\d[\d,.]*$/.test(String(v).trim())
  ).length;
  if (currencyCount > samples.length * 0.5) {
    // Could be wagerAmount or payout — can't distinguish without more context
    candidates.push({ field: "wagerAmount", confidence: 0.4 });
  }

  // Spread/line detection: small numbers with decimals (like -3.5, +7)
  const spreadCount = samples.filter((v) => {
    const n = Number(String(v).replace(/[+]/g, ""));
    return !isNaN(n) && Math.abs(n) < 100 && Math.abs(n) > 0;
  }).length;
  if (
    spreadCount > samples.length * 0.5 &&
    header.toLowerCase().includes("line")
  ) {
    candidates.push({ field: "lineValue", confidence: 0.5 });
  }

  // Sport detection: known sport names
  const sportNames = new Set([
    "nfl",
    "nba",
    "mlb",
    "nhl",
    "mls",
    "ncaaf",
    "ncaab",
    "football",
    "basketball",
    "baseball",
    "hockey",
    "soccer",
  ]);
  const sportCount = samples.filter((v) =>
    sportNames.has(String(v).toLowerCase().trim())
  ).length;
  if (sportCount > samples.length * 0.5) {
    candidates.push({ field: "sport", confidence: 0.8 });
  }

  // Wager amount detection: currency values in a reasonable bet range
  const wagerPatternCount = samples.filter((v) => {
    const str = String(v).trim();
    const cleaned = str.replace(/[$€£,\s]/g, "");
    const num = Number(cleaned);
    // Typical wager amounts: $1 - $10,000
    return !isNaN(num) && num >= 1 && num <= 10000;
  }).length;
  if (wagerPatternCount > samples.length * 0.6 && !header.toLowerCase().includes("payout")) {
    candidates.push({ field: "wagerAmount", confidence: 0.7 });
  }

  return candidates;
}

/* ───── Main Detection ───── */

export function detectColumns(
  headers: string[],
  rows: Record<string, any>[]
): DetectionResult {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<string>();
  const unmappedColumns: string[] = [];
  const ambiguousColumns: { header: string; candidates: string[] }[] = [];

  // Pass 1: Header name matching (exact then fuzzy)
  for (const header of headers) {
    const key = header.toLowerCase().trim().replace(/\s+/g, "_");
    const exactMatch = HEADER_MAP[key];

    if (exactMatch && !usedFields.has(exactMatch)) {
      mapping[header] = { field: exactMatch, confidence: 1.0, method: "header_match" };
      usedFields.add(exactMatch);
    } else if (!exactMatch) {
      // Try fuzzy matching for unrecognized headers
      const fuzzyMatch = fuzzyMatchHeader(header);
      if (fuzzyMatch && !usedFields.has(fuzzyMatch.field)) {
        mapping[header] = {
          field: fuzzyMatch.field,
          confidence: fuzzyMatch.confidence,
          method: "header_match",
        };
        usedFields.add(fuzzyMatch.field);
      }
    }
  }

  // Pass 2: Value-based heuristics for unmapped columns
  const unmappedHeaders = headers.filter((h) => !mapping[h]);
  for (const header of unmappedHeaders) {
    const values = rows.map((r) => r[header]);
    const candidates = detectByValues(header, values).filter(
      (c) => !usedFields.has(c.field)
    );

    if (candidates.length === 1) {
      mapping[header] = {
        field: candidates[0].field,
        confidence: candidates[0].confidence,
        method: "value_heuristic",
      };
      usedFields.add(candidates[0].field);
    } else if (candidates.length > 1) {
      ambiguousColumns.push({
        header,
        candidates: candidates.map((c) => c.field),
      });
    } else {
      unmappedColumns.push(header);
    }
  }

  // Check for missing required fields
  const missingRequired = REQUIRED_FIELDS.filter((f) => !usedFields.has(f));

  // Calculate overall confidence
  const mappedEntries = Object.values(mapping);
  const overallConfidence =
    mappedEntries.length > 0
      ? mappedEntries.reduce((sum, m) => sum + m.confidence, 0) /
        mappedEntries.length
      : 0;

  return {
    mapping,
    overallConfidence,
    unmappedColumns,
    ambiguousColumns,
    missingRequired,
  };
}

import * as XLSX from "xlsx";

export interface ParsedRow {
  rowNumber: number;
  date: string | null;
  sport: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  betType: string | null;
  teamSelected: string | null;
  lineValue: number | null;
  odds: number | null;
  outcome: string | null;
  wagerAmount: number | null;
  payout: number | null;
  profit: number | null;
  raw: Record<string, any>;
}

const COLUMN_MAP: Record<string, string> = {
  date: "date",
  game_date: "date",
  gamedate: "date",
  sport: "sport",
  league: "sport",
  home: "homeTeam",
  home_team: "homeTeam",
  hometeam: "homeTeam",
  away: "awayTeam",
  away_team: "awayTeam",
  awayteam: "awayTeam",
  bet_type: "betType",
  bettype: "betType",
  type: "betType",
  team: "teamSelected",
  team_selected: "teamSelected",
  pick: "teamSelected",
  selection: "teamSelected",
  line: "lineValue",
  spread: "lineValue",
  line_value: "lineValue",
  odds: "odds",
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
  "w_win_loss": "outcome",
  "w_winloss": "outcome",
  "w_win/loss": "outcome",
  "win/loss": "outcome",

  // Additional team/wager variations
  "team_wagered": "teamSelected",
  "team_wager": "teamSelected",
  "team_w_agbr": "teamSelected",
  "team_w_agr": "teamSelected",
  "teamwagered": "teamSelected",
  "wagered_team": "teamSelected",

  // Additional odds variations
  "o_dds": "odds",
  "odd": "odds",
  "odss": "odds",
  "ods": "odds",

  // Additional wager amount variations
  "w_agbr": "wagerAmount",
  "w_agr": "wagerAmount",
  "wagr": "wagerAmount",
  "wgr": "wagerAmount",
  "w": "wagerAmount",
};

function normalizeHeader(header: string): string {
  const key = header.toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMN_MAP[key] || key;
}

/**
 * Parse dates from various formats:
 * - Excel serial numbers (e.g. 45312)
 * - ISO strings (2024-01-15)
 * - US format (01/15/2024, 1/15/24)
 * - Dashed format (01-15-2024)
 */
function parseDate(value: any): string | null {
  if (value == null || value === "") return null;

  // Handle Excel serial dates (numbers like 45312)
  if (typeof value === "number" && value > 30000 && value < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + value * msPerDay);
    return date.toISOString().split("T")[0];
  }

  const str = String(value).trim();

  // Try MM/DD/YYYY or MM-DD-YYYY patterns first
  const mdyMatch = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/
  );
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    const dateObj = new Date(
      `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`
    );
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString().split("T")[0];
  }

  // Try YYYY-MM-DD (ISO)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const dateObj = new Date(`${isoMatch[0]}T00:00:00Z`);
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString().split("T")[0];
  }

  // Last resort: try native Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return str; // Return raw — validation will flag it
}

/**
 * Clean a value into a number, handling:
 * - Currency symbols ($, €)
 * - Commas as thousands separators
 * - "PK" / "pick'em" → 0
 * - Parenthetical negatives (100) → -100
 * - Returns null instead of NaN
 */
function cleanNumber(value: any): number | null {
  if (value == null || value === "") return null;

  // Already a number
  if (typeof value === "number") return isNaN(value) ? null : value;

  const str = String(value).trim();

  // Handle "PK" / "pk" / "Pick" / "pick'em" → spread of 0
  if (/^(pk|pick|pick'?em|even)$/i.test(str)) return 0;

  // Strip currency symbols, commas, whitespace
  let cleaned = str.replace(/[$€£,\s]/g, "");

  // Handle parenthetical negatives: (100) → -100
  const parenMatch = cleaned.match(/^\((.+)\)$/);
  if (parenMatch) cleaned = `-${parenMatch[1]}`;

  // Handle explicit + prefix
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export function parseExcel(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  return rawRows.map((row, index) => {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }

    const wagerAmount = cleanNumber(normalized.wagerAmount);
    const rawPayout = cleanNumber(normalized.payout);
    const rawProfit = cleanNumber(normalized.profit);

    // If we have profit but no payout, derive: payout = profit + wager
    let payout = rawPayout;
    if (payout === null && rawProfit !== null && wagerAmount !== null) {
      payout = rawProfit + wagerAmount;
    }

    return {
      rowNumber: index + 2, // Row 1 is headers
      date: parseDate(normalized.date),
      sport: normalized.sport ? String(normalized.sport).trim() : null,
      homeTeam: normalized.homeTeam ? String(normalized.homeTeam).trim() : null,
      awayTeam: normalized.awayTeam ? String(normalized.awayTeam).trim() : null,
      betType: normalized.betType ? String(normalized.betType).trim() : null,
      teamSelected: normalized.teamSelected
        ? String(normalized.teamSelected).trim()
        : null,
      lineValue: cleanNumber(normalized.lineValue),
      odds: cleanNumber(normalized.odds),
      outcome: normalized.outcome
        ? String(normalized.outcome).trim().toUpperCase()
        : null,
      wagerAmount,
      payout,
      profit: rawProfit,
      raw: row,
    };
  });
}

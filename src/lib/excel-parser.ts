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
  wager: "wagerAmount",
  wager_amount: "wagerAmount",
  amount: "wagerAmount",
  stake: "wagerAmount",
  payout: "payout",
  profit: "payout",
  return: "payout",
};

function normalizeHeader(header: string): string {
  const key = header.toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMN_MAP[key] || key;
}

export function parseExcel(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  return rawRows.map((row, index) => {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }

    return {
      rowNumber: index + 2,
      date: normalized.date ? String(normalized.date) : null,
      sport: normalized.sport ? String(normalized.sport) : null,
      homeTeam: normalized.homeTeam ? String(normalized.homeTeam) : null,
      awayTeam: normalized.awayTeam ? String(normalized.awayTeam) : null,
      betType: normalized.betType ? String(normalized.betType) : null,
      teamSelected: normalized.teamSelected
        ? String(normalized.teamSelected)
        : null,
      lineValue: normalized.lineValue ? Number(normalized.lineValue) : null,
      odds: normalized.odds ? Number(normalized.odds) : null,
      outcome: normalized.outcome
        ? String(normalized.outcome).toUpperCase()
        : null,
      wagerAmount: normalized.wagerAmount
        ? Number(normalized.wagerAmount)
        : null,
      payout: normalized.payout ? Number(normalized.payout) : null,
      raw: row,
    };
  });
}

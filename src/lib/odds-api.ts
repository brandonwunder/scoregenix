import { prisma } from "@/lib/prisma";

const ODDS_BASE = "https://api.the-odds-api.com/v4";

interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

export interface NormalizedOdds {
  homeTeam: string;
  awayTeam: string;
  moneyLineHome: number | null;
  moneyLineAway: number | null;
  spreadHome: number | null;
  spreadAway: number | null;
  spreadPointHome: number | null;
  spreadPointAway: number | null;
}

const ODDS_SPORT_MAP: Record<string, string> = {
  nfl: "americanfootball_nfl",
  nba: "basketball_nba",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  mls: "soccer_usa_mls",
  ncaaf: "americanfootball_ncaaf",
  ncaab: "basketball_ncaab",
};

function extractOdds(bookmakers: OddsBookmaker[]): {
  moneyLine: OddsMarket | undefined;
  spreads: OddsMarket | undefined;
} {
  const bm = bookmakers[0];
  if (!bm) return { moneyLine: undefined, spreads: undefined };

  return {
    moneyLine: bm.markets.find((m) => m.key === "h2h"),
    spreads: bm.markets.find((m) => m.key === "spreads"),
  };
}

export async function fetchOdds(
  sportSlug: string
): Promise<NormalizedOdds[]> {
  const sportKey = ODDS_SPORT_MAP[sportSlug];
  if (!sportKey) return [];

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.warn("ODDS_API_KEY not set, skipping odds fetch");
    return [];
  }

  const url = `${ODDS_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    console.error(`Odds API error: ${res.status}`);
    return [];
  }

  const events: OddsEvent[] = await res.json();

  return events.map((event) => {
    const { moneyLine, spreads } = extractOdds(event.bookmakers);

    const mlHome = moneyLine?.outcomes.find((o) => o.name === event.home_team);
    const mlAway = moneyLine?.outcomes.find((o) => o.name === event.away_team);
    const spHome = spreads?.outcomes.find((o) => o.name === event.home_team);
    const spAway = spreads?.outcomes.find((o) => o.name === event.away_team);

    return {
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      moneyLineHome: mlHome?.price ?? null,
      moneyLineAway: mlAway?.price ?? null,
      spreadHome: spHome?.price ?? null,
      spreadAway: spAway?.price ?? null,
      spreadPointHome: spHome?.point ?? null,
      spreadPointAway: spAway?.point ?? null,
    };
  });
}

/**
 * Normalize team names for better matching between APIs
 * Examples:
 * - "Los Angeles Lakers" -> "lakers"
 * - "LA Lakers" -> "lakers"
 * - "L.A. Lakers" -> "lakers"
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(los angeles|la|l\.a\.)\s+/i, "") // Remove LA prefix
    .replace(/^(new york|ny|n\.y\.)\s+/i, "") // Remove NY prefix
    .replace(/^(san francisco|sf|s\.f\.)\s+/i, "") // Remove SF prefix
    .replace(/^(golden state)\s+/i, "") // Remove Golden State
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/[^a-z0-9]/g, ""); // Remove special chars
}

/**
 * Find best matching game for odds data
 * Uses exact match first, falls back to normalized exact match
 */
async function findMatchingGame(
  odds: NormalizedOdds,
  sportId: string,
  candidates: any[]
): Promise<any | null> {
  const normalizedHome = normalizeTeamName(odds.homeTeam);
  const normalizedAway = normalizeTeamName(odds.awayTeam);

  // Try exact match first (most common case)
  let game = await prisma.game.findFirst({
    where: {
      sportId,
      oddsLockedAt: null,
      homeTeam: odds.homeTeam,
      awayTeam: odds.awayTeam,
    },
  });

  if (game) return game;

  // Find best match by comparing normalized names (exact match only)
  game = candidates.find((g) => {
    const gameHome = normalizeTeamName(g.homeTeam);
    const gameAway = normalizeTeamName(g.awayTeam);
    return gameHome === normalizedHome && gameAway === normalizedAway;
  }) ?? null;

  return game;
}

export async function fetchAndStoreOddsForGames(
  sportSlug: string,
  sportId: string
): Promise<number> {
  const oddsData = await fetchOdds(sportSlug);
  if (oddsData.length === 0) {
    console.warn(`No odds data fetched for ${sportSlug}`);
    return 0;
  }

  // Load candidates once before the loop for performance
  const candidates = await prisma.game.findMany({
    where: {
      sportId,
      oddsLockedAt: null,
    },
  });

  let updated = 0;
  const errors: string[] = [];

  for (const odds of oddsData) {
    try {
      const game = await findMatchingGame(odds, sportId, candidates);

      if (game) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            homeMoneyLine: odds.moneyLineHome,
            awayMoneyLine: odds.moneyLineAway,
            spreadValue: odds.spreadPointHome,
            homeSpreadOdds: odds.spreadHome,
            awaySpreadOdds: odds.spreadAway,
            oddsLockedAt: new Date(),
          },
        });
        updated++;
        console.log(
          `✓ Updated odds for ${game.homeTeam} vs ${game.awayTeam}`
        );
      } else {
        errors.push(
          `No match found for ${odds.homeTeam} vs ${odds.awayTeam}`
        );
      }
    } catch (error) {
      errors.push(
        `Error updating odds for ${odds.homeTeam} vs ${odds.awayTeam}: ${error}`
      );
    }
  }

  if (errors.length > 0) {
    console.error(
      `Odds fetch errors for ${sportSlug}:`,
      errors.join("\n")
    );
  }

  console.log(
    `Odds update complete for ${sportSlug}: ${updated}/${oddsData.length} games updated`
  );

  return updated;
}

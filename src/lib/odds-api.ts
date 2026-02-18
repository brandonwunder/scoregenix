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

export async function fetchAndStoreOddsForGames(
  sportSlug: string,
  sportId: string
): Promise<number> {
  const oddsData = await fetchOdds(sportSlug);
  if (oddsData.length === 0) return 0;

  let updated = 0;

  for (const odds of oddsData) {
    // Match by home team name against games that don't have odds locked yet
    const game = await prisma.game.findFirst({
      where: {
        sportId,
        oddsLockedAt: null,
        homeTeam: odds.homeTeam,
      },
    });

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
    }
  }

  return updated;
}

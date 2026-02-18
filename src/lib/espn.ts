import { GameStatus } from "@prisma/client";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

interface ESPNCompetitor {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  score: string;
  homeAway: "home" | "away";
  winner?: boolean;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: {
      state: "pre" | "in" | "post";
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
  }>;
}

export interface NormalizedGame {
  externalApiId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  gameDate: Date;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
}

function mapStatus(state: string, completed: boolean): GameStatus {
  if (completed) return "FINAL";
  if (state === "in") return "IN_PROGRESS";
  return "SCHEDULED";
}

function normalizeEvent(event: ESPNEvent): NormalizedGame {
  const comp = event.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;

  return {
    externalApiId: event.id,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeTeamAbbr: home.team.abbreviation,
    awayTeamAbbr: away.team.abbreviation,
    homeTeamLogo: home.team.logo,
    awayTeamLogo: away.team.logo,
    gameDate: new Date(event.date),
    status: mapStatus(event.status.type.state, event.status.type.completed),
    homeScore: home.score ? parseInt(home.score) : null,
    awayScore: away.score ? parseInt(away.score) : null,
  };
}

export async function fetchGames(
  sportApiKey: string,
  dates?: string
): Promise<NormalizedGame[]> {
  const params = new URLSearchParams();
  if (dates) params.set("dates", dates);

  const url = `${ESPN_BASE}/${sportApiKey}/scoreboard?${params}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`ESPN API error: ${res.status} for ${url}`);
    return [];
  }

  const data = await res.json();
  const events: ESPNEvent[] = data.events || [];

  return events.map(normalizeEvent);
}

export async function fetchGamesByDate(
  sportApiKey: string,
  date: Date
): Promise<NormalizedGame[]> {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  return fetchGames(sportApiKey, dateStr);
}

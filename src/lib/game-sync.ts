import { prisma } from "@/lib/prisma";
import { fetchGamesByDate } from "@/lib/espn";

export async function syncGamesForSport(
  sportId: string,
  sportApiKey: string,
  date: Date
): Promise<number> {
  const games = await fetchGamesByDate(sportApiKey, date);
  let synced = 0;

  for (const game of games) {
    await prisma.game.upsert({
      where: {
        externalApiId_sportId: {
          externalApiId: game.externalApiId,
          sportId: sportId,
        },
      },
      update: {
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        lastSyncedAt: new Date(),
      },
      create: {
        sportId: sportId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameDate: game.gameDate,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        externalApiId: game.externalApiId,
        lastSyncedAt: new Date(),
      },
    });
    synced++;
  }

  return synced;
}

export async function syncAllSportsForDate(date: Date): Promise<{
  total: number;
  bySport: Record<string, number>;
}> {
  const sports = await prisma.sport.findMany({ where: { active: true } });
  const bySport: Record<string, number> = {};
  let total = 0;

  for (const sport of sports) {
    if (!sport.apiKey) continue;
    const count = await syncGamesForSport(sport.id, sport.apiKey, date);
    bySport[sport.name] = count;
    total += count;
  }

  return { total, bySport };
}

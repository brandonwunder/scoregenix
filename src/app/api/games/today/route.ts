import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const games = await prisma.game.findMany({
    where: {
      gameDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      sport: true,
    },
    orderBy: { gameDate: "asc" },
  });

  const formatted = games.map((g) => ({
    id: g.id,
    externalApiId: g.externalApiId,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    homeTeamAbbr: g.homeTeamAbbr || "",
    awayTeamAbbr: g.awayTeamAbbr || "",
    homeTeamLogo: g.homeTeamLogo || "",
    awayTeamLogo: g.awayTeamLogo || "",
    gameDate: g.gameDate.toISOString(),
    status: g.status,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    sportName: g.sport.name,
    sportSlug: g.sport.slug,
    sportCategory: g.sport.category,
    homeMoneyLine: g.homeMoneyLine,
    awayMoneyLine: g.awayMoneyLine,
    spreadValue: g.spreadValue ? Number(g.spreadValue) : null,
    homeSpreadOdds: g.homeSpreadOdds,
    awaySpreadOdds: g.awaySpreadOdds,
    oddsLockedAt: g.oddsLockedAt?.toISOString() || null,
  }));

  return NextResponse.json({ games: formatted });
}

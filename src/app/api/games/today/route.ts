import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGames } from "@/lib/espn";

export async function GET() {
  const sports = await prisma.sport.findMany({ where: { active: true } });
  const allGames: any[] = [];

  for (const sport of sports) {
    if (!sport.apiKey) continue;

    try {
      const games = await fetchGames(sport.apiKey);
      allGames.push(
        ...games.map((g) => ({
          ...g,
          sportName: sport.name,
          sportSlug: sport.slug,
          sportCategory: sport.category,
        }))
      );
    } catch (e) {
      console.error(`Failed to fetch ${sport.name}:`, e);
    }
  }

  allGames.sort(
    (a, b) =>
      new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
  );

  return NextResponse.json({ games: allGames });
}

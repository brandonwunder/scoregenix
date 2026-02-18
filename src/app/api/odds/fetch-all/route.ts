import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAndStoreOddsForGames } from "@/lib/odds-api";

/**
 * Fetch odds for ALL active sports with games missing odds
 * Admin-only endpoint for bulk odds updates
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sports = await prisma.sport.findMany({
      where: { active: true },
    });

    const results: Record<string, number> = {};
    let totalUpdated = 0;

    for (const sport of sports) {
      try {
        const updated = await fetchAndStoreOddsForGames(sport.slug, sport.id);
        results[sport.name] = updated;
        totalUpdated += updated;
      } catch (error) {
        console.error(`Error fetching odds for ${sport.name}:`, error);
        results[sport.name] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      totalUpdated,
      bySport: results,
      message: `Updated odds for ${totalUpdated} games across ${Object.keys(results).length} sports`,
    });
  } catch (error) {
    console.error("Error in bulk odds fetch:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}

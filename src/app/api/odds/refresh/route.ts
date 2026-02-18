import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { fetchAndStoreOddsForGames } from "@/lib/odds-api";

// Simple in-memory cache for rate limiting
// Maps sportId to last refresh timestamp
const oddsRefreshCache = new Map<string, number>();

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function canRefreshSport(sportId: string): boolean {
  const lastRefresh = oddsRefreshCache.get(sportId);
  if (!lastRefresh) return true;
  return Date.now() - lastRefresh > COOLDOWN_MS;
}

function setCooldown(sportId: string): void {
  oddsRefreshCache.set(sportId, Date.now());
}

export async function POST(req: Request) {
  try {
    // Verify authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameId } = body;

    if (!gameId || typeof gameId !== "string") {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    // Fetch game to get sport information
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { sport: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if odds are already locked
    if (game.oddsLockedAt) {
      return NextResponse.json({
        success: true,
        game: {
          id: game.id,
          oddsLockedAt: game.oddsLockedAt.toISOString(),
          homeMoneyLine: game.homeMoneyLine,
          awayMoneyLine: game.awayMoneyLine,
          spreadValue: game.spreadValue,
          homeSpreadOdds: game.homeSpreadOdds,
          awaySpreadOdds: game.awaySpreadOdds,
        },
        message: "Odds already available for this game",
      });
    }

    // Check rate limiting for this sport
    if (!canRefreshSport(game.sportId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please wait a few minutes before refreshing odds again",
        },
        { status: 429 }
      );
    }

    // Fetch and store odds for all games in this sport
    const updated = await fetchAndStoreOddsForGames(
      game.sport.slug,
      game.sportId
    );

    // Set cooldown for this sport
    setCooldown(game.sportId);

    // Fetch updated game data
    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!updatedGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      game: {
        id: updatedGame.id,
        oddsLockedAt: updatedGame.oddsLockedAt?.toISOString() || null,
        homeMoneyLine: updatedGame.homeMoneyLine,
        awayMoneyLine: updatedGame.awayMoneyLine,
        spreadValue: updatedGame.spreadValue,
        homeSpreadOdds: updatedGame.homeSpreadOdds,
        awaySpreadOdds: updatedGame.awaySpreadOdds,
      },
      updated,
      message: updatedGame.oddsLockedAt
        ? "Odds updated successfully"
        : "Odds still not available from providers",
    });
  } catch (error) {
    console.error("Error refreshing odds:", error);
    return NextResponse.json(
      { error: "Failed to refresh odds" },
      { status: 500 }
    );
  }
}

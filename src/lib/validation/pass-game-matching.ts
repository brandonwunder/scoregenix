import { prisma } from "@/lib/prisma";
import { resolveTeamName } from "@/lib/team-matching";
import { fetchGamesByDate } from "@/lib/espn";
import type {
  GameMatchResult,
  GameRecord,
  FieldConfidence,
  UncertainReasonCode,
  ESPNSnapshot,
  ValidationReceiptStep,
} from "./types";

interface RowData {
  date?: string | null;
  sport?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  teamSelected?: string | null;
}

export async function matchGame(row: RowData): Promise<GameMatchResult> {
  const uncertainReasons: UncertainReasonCode[] = [];
  const fieldConfidences: FieldConfidence[] = [];
  const startTime = new Date().toISOString();

  // Check required fields
  if (!row.date) {
    uncertainReasons.push("MISSING_REQUIRED_FIELD");
    return {
      game: null,
      receiptStep: makeReceipt(startTime, "skip", "Missing date field"),
      fieldConfidences,
      uncertainReasons,
      espnSnapshot: null,
    };
  }

  if (!row.homeTeam && !row.awayTeam) {
    uncertainReasons.push("MISSING_REQUIRED_FIELD");
    return {
      game: null,
      receiptStep: makeReceipt(startTime, "skip", "Missing both team fields"),
      fieldConfidences,
      uncertainReasons,
      espnSnapshot: null,
    };
  }

  // Resolve team names
  let homeResolved: { canonical: string; confidence: number } | null = null;
  let awayResolved: { canonical: string; confidence: number } | null = null;

  if (row.homeTeam) {
    homeResolved = await resolveTeamName(row.homeTeam);
    fieldConfidences.push({
      field: "homeTeam",
      confidence: homeResolved.confidence,
      source: homeResolved.confidence === 1 ? "exact_alias" : "fuzzy_match",
      details: `"${row.homeTeam}" → "${homeResolved.canonical}"`,
    });
    if (homeResolved.confidence === 0) homeResolved = null;
  }

  if (row.awayTeam) {
    awayResolved = await resolveTeamName(row.awayTeam);
    fieldConfidences.push({
      field: "awayTeam",
      confidence: awayResolved.confidence,
      source: awayResolved.confidence === 1 ? "exact_alias" : "fuzzy_match",
      details: `"${row.awayTeam}" → "${awayResolved.canonical}"`,
    });
    if (awayResolved.confidence === 0) awayResolved = null;
  }

  const homeAboveThreshold = homeResolved && homeResolved.confidence > 0.7;
  const awayAboveThreshold = awayResolved && awayResolved.confidence > 0.7;

  if (!homeAboveThreshold && !awayAboveThreshold) {
    uncertainReasons.push("LOW_CONFIDENCE_TEAM");
    return {
      game: null,
      receiptStep: makeReceipt(
        startTime,
        "fail",
        `Both teams below confidence threshold (home: ${homeResolved?.confidence ?? "N/A"}, away: ${awayResolved?.confidence ?? "N/A"})`
      ),
      fieldConfidences,
      uncertainReasons,
      espnSnapshot: null,
    };
  }

  // Build UTC date range
  const dateStr =
    typeof row.date === "string" && row.date.includes("-")
      ? row.date
      : new Date(row.date).toISOString().split("T")[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  if (isNaN(startOfDay.getTime())) {
    uncertainReasons.push("MISSING_REQUIRED_FIELD");
    return {
      game: null,
      receiptStep: makeReceipt(startTime, "fail", `Invalid date: "${row.date}"`),
      fieldConfidences,
      uncertainReasons,
      espnSnapshot: null,
    };
  }

  // Query DB
  const where: any = {
    gameDate: { gte: startOfDay, lte: endOfDay },
  };
  if (homeAboveThreshold) where.homeTeam = homeResolved!.canonical;
  if (awayAboveThreshold) where.awayTeam = awayResolved!.canonical;

  let games = await prisma.game.findMany({ where });

  // If no DB match, try ESPN sync
  if (games.length === 0) {
    const synced = await trySyncFromESPN(row.sport, startOfDay);
    if (synced === "failed") {
      uncertainReasons.push("ESPN_FETCH_FAILED");
    } else if (synced === "no_sport") {
      uncertainReasons.push("AMBIGUOUS_SPORT");
    }
    // Re-query after sync
    games = await prisma.game.findMany({ where });
  }

  if (games.length === 0) {
    if (!uncertainReasons.length) {
      uncertainReasons.push("NO_GAME_MATCH");
    }
    return {
      game: null,
      receiptStep: makeReceipt(startTime, "fail", "No matching game found in DB or ESPN"),
      fieldConfidences,
      uncertainReasons,
      espnSnapshot: null,
    };
  }

  if (games.length > 1) {
    uncertainReasons.push("MULTIPLE_GAME_MATCHES");
  }

  const game = games[0] as GameRecord;

  // Verify teamSelected is actually in the game
  if (row.teamSelected) {
    const selectedResolved = await resolveTeamName(row.teamSelected);
    fieldConfidences.push({
      field: "teamSelected",
      confidence: selectedResolved.confidence,
      source: selectedResolved.confidence === 1 ? "exact_alias" : "fuzzy_match",
      details: `"${row.teamSelected}" → "${selectedResolved.canonical}"`,
    });

    if (
      selectedResolved.confidence > 0 &&
      selectedResolved.canonical !== game.homeTeam &&
      selectedResolved.canonical !== game.awayTeam
    ) {
      uncertainReasons.push("TEAM_NOT_IN_GAME");
    }
  }

  const snapshot: ESPNSnapshot = {
    gameId: game.id,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    status: game.status,
    homeMoneyLine: game.homeMoneyLine,
    awayMoneyLine: game.awayMoneyLine,
    spreadValue: game.spreadValue ? String(game.spreadValue) : null,
    capturedAt: new Date().toISOString(),
  };

  return {
    game,
    receiptStep: makeReceipt(
      startTime,
      "pass",
      `Matched game: ${game.homeTeam} vs ${game.awayTeam} (${game.status})`,
      {
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameDate: game.gameDate.toISOString(),
        matchCount: games.length,
      }
    ),
    fieldConfidences,
    uncertainReasons,
    espnSnapshot: snapshot,
  };
}

/* ───── ESPN Sync Helper ───── */

async function trySyncFromESPN(
  sportInput: string | null | undefined,
  date: Date
): Promise<"synced" | "failed" | "no_sport"> {
  let sport = null;

  if (sportInput) {
    const slug = sportInput.toLowerCase().trim();
    sport = await prisma.sport.findUnique({ where: { slug } });
    if (!sport) {
      sport = await prisma.sport.findFirst({
        where: { name: { equals: sportInput, mode: "insensitive" } },
      });
    }
  }

  if (!sport) {
    // Try all active sports with API keys
    const activeSports = await prisma.sport.findMany({
      where: { active: true, apiKey: { not: null } },
    });

    if (activeSports.length === 0) return "no_sport";

    let anySuccess = false;
    for (const s of activeSports) {
      try {
        const espnGames = await fetchGamesByDate(s.apiKey!, date);
        for (const g of espnGames) {
          await prisma.game.upsert({
            where: {
              externalApiId_sportId: {
                externalApiId: g.externalApiId,
                sportId: s.id,
              },
            },
            update: {
              homeScore: g.homeScore,
              awayScore: g.awayScore,
              status: g.status,
              homeTeamAbbr: g.homeTeamAbbr,
              awayTeamAbbr: g.awayTeamAbbr,
              homeTeamLogo: g.homeTeamLogo,
              awayTeamLogo: g.awayTeamLogo,
              lastSyncedAt: new Date(),
            },
            create: {
              sportId: s.id,
              homeTeam: g.homeTeam,
              awayTeam: g.awayTeam,
              homeTeamAbbr: g.homeTeamAbbr,
              awayTeamAbbr: g.awayTeamAbbr,
              homeTeamLogo: g.homeTeamLogo,
              awayTeamLogo: g.awayTeamLogo,
              gameDate: g.gameDate,
              status: g.status,
              homeScore: g.homeScore,
              awayScore: g.awayScore,
              externalApiId: g.externalApiId,
              lastSyncedAt: new Date(),
            },
          });
        }
        anySuccess = true;
      } catch {
        // Continue to next sport
      }
    }
    return anySuccess ? "synced" : "failed";
  }

  if (!sport.apiKey) return "no_sport";

  try {
    const espnGames = await fetchGamesByDate(sport.apiKey, date);
    for (const g of espnGames) {
      await prisma.game.upsert({
        where: {
          externalApiId_sportId: {
            externalApiId: g.externalApiId,
            sportId: sport.id,
          },
        },
        update: {
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          status: g.status,
          homeTeamAbbr: g.homeTeamAbbr,
          awayTeamAbbr: g.awayTeamAbbr,
          homeTeamLogo: g.homeTeamLogo,
          awayTeamLogo: g.awayTeamLogo,
          lastSyncedAt: new Date(),
        },
        create: {
          sportId: sport.id,
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          homeTeamAbbr: g.homeTeamAbbr,
          awayTeamAbbr: g.awayTeamAbbr,
          homeTeamLogo: g.homeTeamLogo,
          awayTeamLogo: g.awayTeamLogo,
          gameDate: g.gameDate,
          status: g.status,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          externalApiId: g.externalApiId,
          lastSyncedAt: new Date(),
        },
      });
    }
    return "synced";
  } catch {
    return "failed";
  }
}

/* ───── Receipt Helper ───── */

function makeReceipt(
  startTime: string,
  result: "pass" | "fail" | "skip" | "warning",
  details: string,
  data?: Record<string, any>
): ValidationReceiptStep {
  return {
    pass: "game_matching",
    timestamp: startTime,
    result,
    details,
    data,
  };
}

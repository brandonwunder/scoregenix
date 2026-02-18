import { prisma } from "@/lib/prisma";
import { resolveTeamName } from "@/lib/team-matching";
import { fetchGamesByDate } from "@/lib/espn";
import { ValidationStatus } from "@prisma/client";
import {
  determineMoneyLineOutcome,
  determineSpreadOutcome,
} from "@/lib/bet-settlement";

export async function validateUpload(uploadId: string): Promise<{
  correct: number;
  flagged: number;
  uncertain: number;
}> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  let correct = 0;
  let flagged = 0;
  let uncertain = 0;

  for (const row of upload.rows) {
    // Skip re-validation of corrected rows
    if (row.validationStatus === "CORRECTED" && row.correctedValue) {
      correct++;
      continue;
    }

    const normalized = row.normalizedData as any;
    const original = normalized || (row.originalValue as any);
    if (!original) {
      uncertain++;
      await prisma.uploadRow.update({
        where: { id: row.id },
        data: {
          validationStatus: "UNCERTAIN",
          uncertainReasons: ["MISSING_REQUIRED_FIELD"],
        },
      });
      continue;
    }

    const uncertainReasons: string[] = [];

    let homeTeamResult = null;
    let awayTeamResult = null;

    if (original.homeTeam) {
      homeTeamResult = await resolveTeamName(original.homeTeam);
      // Reject confidence 0 (Bug #7)
      if (homeTeamResult.confidence === 0) homeTeamResult = null;
    }
    if (original.awayTeam) {
      awayTeamResult = await resolveTeamName(original.awayTeam);
      if (awayTeamResult.confidence === 0) awayTeamResult = null;
    }

    let matchedGame = null;

    // Bug #6: Don't proceed with date-only query when both teams below threshold
    const homeAboveThreshold = homeTeamResult && homeTeamResult.confidence > 0.7;
    const awayAboveThreshold = awayTeamResult && awayTeamResult.confidence > 0.7;

    if (!homeAboveThreshold && !awayAboveThreshold) {
      if (original.homeTeam || original.awayTeam) {
        uncertainReasons.push("LOW_CONFIDENCE_TEAM");
      }
    }

    if (original.date && (homeAboveThreshold || awayAboveThreshold)) {
      // Bug #4: Use UTC boundaries instead of server-local timezone
      const dateStr =
        typeof original.date === "string" && original.date.includes("-")
          ? original.date
          : new Date(original.date).toISOString().split("T")[0];
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      if (isNaN(startOfDay.getTime())) {
        uncertainReasons.push("MISSING_REQUIRED_FIELD");
      } else {
        const where: any = {
          gameDate: { gte: startOfDay, lte: endOfDay },
        };

        if (homeAboveThreshold) {
          where.homeTeam = homeTeamResult!.canonical;
        }
        if (awayAboveThreshold) {
          where.awayTeam = awayTeamResult!.canonical;
        }

        matchedGame = await prisma.game.findFirst({ where });

        if (!matchedGame) {
          // Bug #5: Use exact sport slug match instead of contains
          let sport = null;
          if (original.sport) {
            const sportSlug = original.sport.toLowerCase().trim();
            sport = await prisma.sport.findUnique({
              where: { slug: sportSlug },
            });
            // Fallback: try by exact name
            if (!sport) {
              sport = await prisma.sport.findFirst({
                where: { name: { equals: original.sport, mode: "insensitive" } },
              });
            }
            if (!sport) {
              uncertainReasons.push("AMBIGUOUS_SPORT");
            }
          } else {
            // No sport info — try to find by active sports
            sport = await prisma.sport.findFirst({
              where: { active: true, apiKey: { not: null } },
            });
          }

          if (sport?.apiKey) {
            try {
              const espnGames = await fetchGamesByDate(
                sport.apiKey,
                startOfDay
              );

              if (espnGames.length === 0) {
                uncertainReasons.push("ESPN_FETCH_FAILED");
              } else {
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
                matchedGame = await prisma.game.findFirst({ where });
              }
            } catch {
              uncertainReasons.push("ESPN_FETCH_FAILED");
            }
          }
        }
      }
    } else if (!original.date) {
      uncertainReasons.push("MISSING_REQUIRED_FIELD");
    }

    let validationStatus: ValidationStatus = "UNCERTAIN";
    let actualValue: any = null;
    const espnSnapshot = matchedGame
      ? {
          gameId: matchedGame.id,
          homeTeam: matchedGame.homeTeam,
          awayTeam: matchedGame.awayTeam,
          homeScore: matchedGame.homeScore,
          awayScore: matchedGame.awayScore,
          status: matchedGame.status,
          capturedAt: new Date().toISOString(),
        }
      : null;

    if (matchedGame && matchedGame.status === "FINAL") {
      actualValue = {
        homeTeam: matchedGame.homeTeam,
        awayTeam: matchedGame.awayTeam,
        homeScore: matchedGame.homeScore,
        awayScore: matchedGame.awayScore,
        date: matchedGame.gameDate.toISOString(),
      };

      if (
        matchedGame.homeScore !== null &&
        matchedGame.awayScore !== null &&
        original.outcome &&
        original.teamSelected
      ) {
        const selectedTeam = await resolveTeamName(original.teamSelected);

        // Bug #3: Verify teamSelected is one of the teams in the game
        if (
          selectedTeam.confidence > 0 &&
          selectedTeam.canonical !== matchedGame.homeTeam &&
          selectedTeam.canonical !== matchedGame.awayTeam
        ) {
          uncertainReasons.push("TEAM_NOT_IN_GAME");
        }

        // Bug #1 + #2: Use bet-settlement functions for correct outcome logic
        const betType =
          original.betType === "POINT_SPREAD" || original.betType === "spread"
            ? "POINT_SPREAD"
            : "MONEY_LINE";

        let computedOutcome: string;
        if (betType === "POINT_SPREAD" && original.lineValue != null) {
          computedOutcome = determineSpreadOutcome(
            selectedTeam.canonical,
            matchedGame.homeTeam,
            matchedGame.homeScore,
            matchedGame.awayScore,
            Number(original.lineValue)
          );
        } else {
          // MONEY_LINE: handles ties correctly (returns PUSH)
          computedOutcome = determineMoneyLineOutcome(
            selectedTeam.canonical,
            matchedGame.homeTeam,
            matchedGame.awayTeam,
            matchedGame.homeScore,
            matchedGame.awayScore
          );
        }

        // Normalize user's outcome for comparison
        const outcomeUpper = String(original.outcome).toUpperCase();
        const userSaidWin = ["WIN", "W", "WON", "WINNER"].includes(outcomeUpper);
        const userSaidLoss = ["LOSS", "L", "LOST", "LOSER"].includes(outcomeUpper);
        const userSaidPush = ["PUSH", "TIE", "DRAW", "D", "T", "PK"].includes(outcomeUpper);

        let userOutcome: string;
        if (userSaidWin) userOutcome = "WON";
        else if (userSaidLoss) userOutcome = "LOST";
        else if (userSaidPush) userOutcome = "PUSH";
        else userOutcome = outcomeUpper;

        actualValue.correctOutcome = computedOutcome;
        actualValue.recordedOutcome = original.outcome;
        actualValue.betType = betType;

        if (userOutcome === computedOutcome) {
          validationStatus = "CORRECT";
          correct++;
        } else {
          validationStatus = "FLAGGED";
          flagged++;
        }
      } else {
        if (!original.outcome) uncertainReasons.push("MISSING_REQUIRED_FIELD");
        if (!original.teamSelected) uncertainReasons.push("MISSING_REQUIRED_FIELD");
        uncertain++;
      }
    } else if (matchedGame && matchedGame.status !== "FINAL") {
      uncertainReasons.push("GAME_NOT_FINAL");
      uncertain++;
    } else {
      if (!uncertainReasons.includes("LOW_CONFIDENCE_TEAM") &&
          !uncertainReasons.includes("ESPN_FETCH_FAILED") &&
          !uncertainReasons.includes("AMBIGUOUS_SPORT") &&
          !uncertainReasons.includes("MISSING_REQUIRED_FIELD")) {
        uncertainReasons.push("NO_GAME_MATCH");
      }
      uncertain++;
    }

    await prisma.uploadRow.update({
      where: { id: row.id },
      data: {
        matchedGameId: matchedGame?.id || null,
        validationStatus,
        actualValue,
        uncertainReasons: uncertainReasons.length > 0 ? uncertainReasons : undefined,
        espnSnapshot: espnSnapshot ?? undefined,
      },
    });
  }

  await prisma.excelUpload.update({
    where: { id: uploadId },
    data: {
      status: "VALIDATED",
      correctCount: correct,
      flaggedCount: flagged,
      uncertainCount: uncertain,
    },
  });

  return { correct, flagged, uncertain };
}

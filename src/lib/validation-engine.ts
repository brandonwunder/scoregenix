import { prisma } from "@/lib/prisma";
import { resolveTeamName } from "@/lib/team-matching";
import { fetchGamesByDate } from "@/lib/espn";
import { ValidationStatus } from "@prisma/client";

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
    const original = row.originalValue as any;
    if (!original) {
      uncertain++;
      continue;
    }

    let homeTeamResult = null;
    let awayTeamResult = null;

    if (original.homeTeam) {
      homeTeamResult = await resolveTeamName(original.homeTeam);
    }
    if (original.awayTeam) {
      awayTeamResult = await resolveTeamName(original.awayTeam);
    }

    let matchedGame = null;

    if (original.date && (homeTeamResult || awayTeamResult)) {
      const gameDate = new Date(original.date);
      const startOfDay = new Date(gameDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(gameDate);
      endOfDay.setHours(23, 59, 59, 999);

      const where: any = {
        gameDate: { gte: startOfDay, lte: endOfDay },
      };

      if (homeTeamResult && homeTeamResult.confidence > 0.7) {
        where.homeTeam = homeTeamResult.canonical;
      }
      if (awayTeamResult && awayTeamResult.confidence > 0.7) {
        where.awayTeam = awayTeamResult.canonical;
      }

      matchedGame = await prisma.game.findFirst({ where });

      if (!matchedGame) {
        const sport = await prisma.sport.findFirst({
          where: original.sport
            ? {
                OR: [
                  { name: { contains: original.sport, mode: "insensitive" } },
                  { slug: { contains: original.sport.toLowerCase() } },
                ],
              }
            : undefined,
        });

        if (sport?.apiKey) {
          const espnGames = await fetchGamesByDate(sport.apiKey, gameDate);
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
                lastSyncedAt: new Date(),
              },
              create: {
                sportId: sport.id,
                homeTeam: g.homeTeam,
                awayTeam: g.awayTeam,
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
      }
    }

    let validationStatus: ValidationStatus = "UNCERTAIN";
    let actualValue: any = null;

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
        const actualWinner =
          matchedGame.homeScore > matchedGame.awayScore
            ? matchedGame.homeTeam
            : matchedGame.awayTeam;

        const userSaidWin = ["WIN", "W", "WON"].includes(
          original.outcome.toUpperCase()
        );
        const userSaidLoss = ["LOSS", "L", "LOST"].includes(
          original.outcome.toUpperCase()
        );

        const actuallyWon = selectedTeam.canonical === actualWinner;

        if (
          (userSaidWin && actuallyWon) ||
          (userSaidLoss && !actuallyWon)
        ) {
          validationStatus = "CORRECT";
          correct++;
        } else {
          validationStatus = "FLAGGED";
          actualValue.correctOutcome = actuallyWon ? "WON" : "LOST";
          actualValue.recordedOutcome = original.outcome;
          flagged++;
        }
      } else {
        uncertain++;
      }
    } else {
      uncertain++;
    }

    await prisma.uploadRow.update({
      where: { id: row.id },
      data: {
        matchedGameId: matchedGame?.id || null,
        validationStatus,
        actualValue,
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

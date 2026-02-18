import { prisma } from "@/lib/prisma";
import { BetStatus } from "@prisma/client";

function determineMoneyLineOutcome(
  teamSelected: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): BetStatus {
  if (homeScore === awayScore) return "PUSH";

  const winningTeam = homeScore > awayScore ? homeTeam : awayTeam;

  if (teamSelected === winningTeam) return "WON";
  return "LOST";
}

function determineSpreadOutcome(
  teamSelected: string,
  homeTeam: string,
  homeScore: number,
  awayScore: number,
  lineValue: number
): BetStatus {
  const isHome = teamSelected === homeTeam;
  const adjustedScore = isHome
    ? homeScore + lineValue
    : awayScore + lineValue;
  const opponentScore = isHome ? awayScore : homeScore;

  if (adjustedScore === opponentScore) return "PUSH";
  if (adjustedScore > opponentScore) return "WON";
  return "LOST";
}

export async function settleBet(betId: string): Promise<BetStatus> {
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: { legs: { include: { game: true } } },
  });

  if (!bet || bet.status !== "PENDING") {
    throw new Error("Bet not found or already settled");
  }

  const allFinal = bet.legs.every((leg) => leg.game.status === "FINAL");
  if (!allFinal) {
    throw new Error("Not all games are final");
  }

  const legOutcomes: BetStatus[] = [];

  for (const leg of bet.legs) {
    const game = leg.game;
    let outcome: BetStatus;

    if (bet.betType === "POINT_SPREAD") {
      outcome = determineSpreadOutcome(
        leg.teamSelected,
        game.homeTeam,
        game.homeScore!,
        game.awayScore!,
        Number(leg.lineValue!)
      );
    } else {
      outcome = determineMoneyLineOutcome(
        leg.teamSelected,
        game.homeTeam,
        game.awayTeam,
        game.homeScore!,
        game.awayScore!
      );
    }

    await prisma.betLeg.update({
      where: { id: leg.id },
      data: { outcome },
    });

    legOutcomes.push(outcome);
  }

  let betOutcome: BetStatus;

  if (bet.betType === "PARLAY") {
    if (legOutcomes.every((o) => o === "WON")) {
      betOutcome = "WON";
    } else if (legOutcomes.some((o) => o === "LOST")) {
      betOutcome = "LOST";
    } else {
      betOutcome = "PUSH";
    }
  } else {
    betOutcome = legOutcomes[0];
  }

  await prisma.bet.update({
    where: { id: betId },
    data: {
      status: betOutcome,
      settledAt: new Date(),
    },
  });

  return betOutcome;
}

export async function settleAllPendingBets(): Promise<number> {
  const pendingBets = await prisma.bet.findMany({
    where: { status: "PENDING" },
    include: { legs: { include: { game: true } } },
  });

  let settled = 0;

  for (const bet of pendingBets) {
    const allFinal = bet.legs.every((l) => l.game.status === "FINAL");
    if (!allFinal) continue;

    try {
      await settleBet(bet.id);
      settled++;
    } catch (e) {
      console.error(`Failed to settle bet ${bet.id}:`, e);
    }
  }

  return settled;
}

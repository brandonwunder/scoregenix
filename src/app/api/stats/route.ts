import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const userFilter = isAdmin
    ? { user: { role: "ADMIN" as const } }
    : { userId: (session.user as any).id };

  const bets = await prisma.bet.findMany({
    where: { ...userFilter, status: { not: "PENDING" } },
    include: { legs: { include: { game: { include: { sport: true } } } } },
  });

  const totalBets = bets.length;
  const wins = bets.filter((b) => b.status === "WON").length;
  const losses = bets.filter((b) => b.status === "LOST").length;
  const pushes = bets.filter((b) => b.status === "PUSH").length;
  const pending = await prisma.bet.count({
    where: { ...userFilter, status: "PENDING" },
  });

  const totalWagered = bets.reduce(
    (sum, b) => sum + Number(b.wagerAmount),
    0
  );
  const totalWon = bets
    .filter((b) => b.status === "WON")
    .reduce((sum, b) => sum + Number(b.potentialPayout || 0), 0);
  const totalLost = bets
    .filter((b) => b.status === "LOST")
    .reduce((sum, b) => sum + Number(b.wagerAmount), 0);
  const netProfitLoss = totalWon - totalLost;
  const roi = totalWagered > 0 ? (netProfitLoss / totalWagered) * 100 : 0;

  // Stats by bet type
  const byBetType: Record<string, any> = {};
  for (const type of ["MONEY_LINE", "POINT_SPREAD", "PARLAY"]) {
    const typeBets = bets.filter((b) => b.betType === type);
    const typeWins = typeBets.filter((b) => b.status === "WON").length;
    byBetType[type] = {
      total: typeBets.length,
      wins: typeWins,
      losses: typeBets.filter((b) => b.status === "LOST").length,
      winRate: typeBets.length > 0 ? (typeWins / typeBets.length) * 100 : 0,
    };
  }

  // Stats by sport
  const bySport: Record<string, any> = {};
  for (const bet of bets) {
    for (const leg of bet.legs) {
      const sportName = leg.game.sport.name;
      if (!bySport[sportName]) {
        bySport[sportName] = { total: 0, wins: 0, losses: 0 };
      }
      bySport[sportName].total++;
      if (bet.status === "WON") bySport[sportName].wins++;
      if (bet.status === "LOST") bySport[sportName].losses++;
    }
  }

  for (const sport of Object.keys(bySport)) {
    bySport[sport].winRate =
      bySport[sport].total > 0
        ? (bySport[sport].wins / bySport[sport].total) * 100
        : 0;
  }

  // Monthly trend (last 12 months)
  const monthlyTrend: Array<{
    month: string;
    bets: number;
    wins: number;
    profit: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toISOString().slice(0, 7);

    const monthBets = bets.filter(
      (b) => b.placedAt.toISOString().slice(0, 7) === monthStr
    );
    const monthWins = monthBets.filter((b) => b.status === "WON");
    const monthProfit =
      monthWins.reduce((s, b) => s + Number(b.potentialPayout || 0), 0) -
      monthBets
        .filter((b) => b.status === "LOST")
        .reduce((s, b) => s + Number(b.wagerAmount), 0);

    monthlyTrend.push({
      month: monthStr,
      bets: monthBets.length,
      wins: monthWins.length,
      profit: monthProfit,
    });
  }

  return NextResponse.json({
    overview: {
      totalBets,
      wins,
      losses,
      pushes,
      pending,
      winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
      totalWagered,
      totalWon,
      totalLost,
      netProfitLoss,
      roi,
    },
    byBetType,
    bySport,
    monthlyTrend,
  });
}

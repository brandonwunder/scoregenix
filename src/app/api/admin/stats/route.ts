import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaysBets, activeSubscribers, pendingBets] = await Promise.all([
    prisma.bet.findMany({
      where: {
        user: { role: "ADMIN" },
        placedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.bet.count({
      where: { user: { role: "ADMIN" }, status: "PENDING" },
    }),
  ]);

  const todaysPL = todaysBets.reduce((sum, bet) => {
    if (bet.status === "WON") return sum + Number(bet.potentialPayout || 0);
    if (bet.status === "LOST") return sum - Number(bet.wagerAmount);
    return sum;
  }, 0);

  return NextResponse.json({
    todaysBets: todaysBets.length,
    todaysPL,
    activeSubscribers,
    pendingBets,
  });
}

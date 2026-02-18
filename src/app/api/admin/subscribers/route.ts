import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });

  const active = subscribers.filter(
    (s) => s.subscription?.status === "ACTIVE"
  ).length;
  const total = subscribers.length;
  const mrr = subscribers
    .filter((s) => s.subscription?.status === "ACTIVE")
    .reduce((sum, s) => {
      const amount = Number(s.subscription?.amount || 0);
      const plan = s.subscription?.planType;
      switch (plan) {
        case "MONTHLY":
          return sum + amount;
        case "QUARTERLY":
          return sum + amount / 3;
        case "SEMIANNUAL":
          return sum + amount / 6;
        case "ANNUAL":
          return sum + amount / 12;
        default:
          return sum;
      }
    }, 0);

  return NextResponse.json({
    subscribers: subscribers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      createdAt: s.createdAt,
      plan: s.subscription?.planType || null,
      status: s.subscription?.status || "NONE",
      startDate: s.subscription?.startDate || null,
      endDate: s.subscription?.endDate || null,
      amount: s.subscription?.amount || null,
    })),
    summary: { total, active, mrr },
  });
}

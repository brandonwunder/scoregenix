import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const betLegSchema = z.object({
  gameId: z.string(),
  teamSelected: z.string(),
  lineValue: z.number().optional(),
  odds: z.number().optional(),
});

const placeBetSchema = z.object({
  betType: z.enum(["MONEY_LINE", "POINT_SPREAD", "PARLAY"]),
  wagerAmount: z.number().positive(),
  potentialPayout: z.number().positive().optional(),
  legs: z.array(betLegSchema).min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = placeBetSchema.parse(body);

    if (data.betType === "PARLAY" && data.legs.length < 2) {
      return NextResponse.json(
        { error: "Parlays require at least 2 selections" },
        { status: 400 }
      );
    }

    if (data.betType !== "PARLAY" && data.legs.length !== 1) {
      return NextResponse.json(
        { error: "Money line and point spread bets require exactly 1 selection" },
        { status: 400 }
      );
    }

    const bet = await prisma.bet.create({
      data: {
        userId: (session.user as any).id,
        betType: data.betType,
        wagerAmount: data.wagerAmount,
        potentialPayout: data.potentialPayout,
        notes: data.notes,
        legs: {
          create: data.legs.map((leg) => ({
            gameId: leg.gameId,
            teamSelected: leg.teamSelected,
            lineValue: leg.lineValue,
            odds: leg.odds,
          })),
        },
      },
      include: { legs: { include: { game: true } } },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const betType = searchParams.get("betType");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const isAdmin = (session.user as any).role === "ADMIN";

  const where: any = {};

  if (isAdmin) {
    where.user = { role: "ADMIN" };
  } else {
    where.userId = (session.user as any).id;
  }

  if (betType) where.betType = betType;
  if (status) where.status = status;
  if (from || to) {
    where.placedAt = {};
    if (from) where.placedAt.gte = new Date(from);
    if (to) where.placedAt.lte = new Date(to);
  }

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where,
      include: {
        legs: { include: { game: { include: { sport: true } } } },
      },
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bet.count({ where }),
  ]);

  return NextResponse.json({
    bets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

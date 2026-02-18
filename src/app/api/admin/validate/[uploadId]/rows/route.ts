import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = { uploadId: params.uploadId };
  if (status) where.validationStatus = status;

  const [rows, total] = await Promise.all([
    prisma.uploadRow.findMany({
      where,
      include: { matchedGame: true },
      orderBy: { rowNumber: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.uploadRow.count({ where }),
  ]);

  return NextResponse.json({
    rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcel } from "@/lib/excel-parser";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseExcel(buffer);

  const upload = await prisma.excelUpload.create({
    data: {
      adminUserId: (session.user as any).id,
      fileName: file.name,
      totalRows: rows.length,
      rows: {
        create: rows.map((row) => ({
          rowNumber: row.rowNumber,
          rawData: row.raw,
          originalValue: {
            date: row.date,
            sport: row.sport,
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            betType: row.betType,
            teamSelected: row.teamSelected,
            lineValue: row.lineValue,
            odds: row.odds,
            outcome: row.outcome,
            wagerAmount: row.wagerAmount,
            payout: row.payout,
          },
        })),
      },
    },
  });

  return NextResponse.json({ uploadId: upload.id, totalRows: rows.length });
}

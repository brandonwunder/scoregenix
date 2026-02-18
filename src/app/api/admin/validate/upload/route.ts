import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcel } from "@/lib/excel-parser";
import { normalizeRows } from "@/lib/normalizer";
import { detectColumns } from "@/lib/column-detector";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 5000;

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

  // File size limit
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows;
  try {
    rows = parseExcel(buffer);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse file. Ensure it is a valid .xlsx or .csv file." },
      { status: 400 }
    );
  }

  // Row count limits
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in the file." },
      { status: 400 }
    );
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `Too many rows (${rows.length}). Maximum is ${MAX_ROWS} rows per upload.`,
      },
      { status: 400 }
    );
  }

  // Normalize the parsed data
  const normalizedRows = normalizeRows(rows);

  // Detect column mapping for auditing
  const headers = rows[0]?.raw ? Object.keys(rows[0].raw) : [];
  const rawRows = rows.map((r) => r.raw);
  const columnDetection = detectColumns(headers, rawRows);

  // Aggregate normalization warnings for the log
  const allWarnings = normalizedRows.flatMap((r) => r.warnings);

  const upload = await prisma.excelUpload.create({
    data: {
      adminUserId: (session.user as any).id,
      fileName: file.name,
      totalRows: rows.length,
      columnMapping: columnDetection.mapping,
      normalizationLog:
        allWarnings.length > 0
          ? ({
              totalWarnings: allWarnings.length,
              missingRequired: columnDetection.missingRequired,
              unmappedColumns: columnDetection.unmappedColumns,
              sampleWarnings: allWarnings.slice(0, 50),
            } as any)
          : undefined,
      rows: {
        create: rows.map((row, i) => ({
          rowNumber: row.rowNumber,
          rawData: row.raw,
          normalizedData: normalizedRows[i] as any,
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

  return NextResponse.json({
    uploadId: upload.id,
    totalRows: rows.length,
    normalization: {
      warnings: allWarnings.length,
      missingRequired: columnDetection.missingRequired,
      unmappedColumns: columnDetection.unmappedColumns,
      overallConfidence: columnDetection.overallConfidence,
    },
  });
}

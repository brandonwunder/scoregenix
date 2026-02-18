import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseExcel } from "@/lib/excel-parser";
import { normalizeRows } from "@/lib/normalizer";
import { detectColumns } from "@/lib/column-detector";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcel(buffer);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in the file." },
        { status: 400 }
      );
    }

    const normalized = normalizeRows(parsed);

    // Column detection
    const headers = parsed[0]?.raw ? Object.keys(parsed[0].raw) : [];
    const rawRows = parsed.map((r) => r.raw);
    const columnDetection = detectColumns(headers, rawRows);

    // Aggregate warnings by field
    const allWarnings = normalized.flatMap((r) => r.warnings);
    const warningsByField: Record<string, number> = {};
    for (const w of allWarnings) {
      warningsByField[w.field] = (warningsByField[w.field] || 0) + 1;
    }

    // Summary counts
    const withDate = normalized.filter((r) => r.date !== null).length;
    const withTeams = normalized.filter(
      (r) => r.homeTeam !== null || r.awayTeam !== null
    ).length;
    const withOutcome = normalized.filter((r) => r.outcome !== null).length;
    const withBetType = normalized.filter((r) => r.betType !== null).length;
    const withOdds = normalized.filter((r) => r.odds !== null).length;
    const withWager = normalized.filter((r) => r.wagerAmount !== null).length;

    return NextResponse.json({
      totalRows: parsed.length,
      columns: {
        detected: columnDetection.mapping,
        unmapped: columnDetection.unmappedColumns,
        ambiguous: columnDetection.ambiguousColumns,
        missingRequired: columnDetection.missingRequired,
        overallConfidence: columnDetection.overallConfidence,
      },
      sampleRows: normalized.slice(0, 20),
      coverage: {
        date: withDate,
        teams: withTeams,
        outcome: withOutcome,
        betType: withBetType,
        odds: withOdds,
        wager: withWager,
      },
      warnings: {
        total: allWarnings.length,
        byField: warningsByField,
        samples: allWarnings.slice(0, 30),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse file. Ensure it is a valid .xlsx or .csv file." },
      { status: 400 }
    );
  }
}

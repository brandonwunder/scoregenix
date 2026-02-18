import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const correctRowSchema = z.object({
  rowId: z.string(),
  action: z.enum(["use_actual", "manual", "skip"]),
  manualValue: z
    .object({
      date: z.string().optional(),
      sport: z.string().optional(),
      homeTeam: z.string().optional(),
      awayTeam: z.string().optional(),
      betType: z.string().optional(),
      teamSelected: z.string().optional(),
      lineValue: z.number().optional(),
      odds: z.number().optional(),
      outcome: z.string().optional(),
      wagerAmount: z.number().optional(),
      payout: z.number().optional(),
    })
    .optional(),
});

const bulkCorrectSchema = z.object({
  corrections: z.array(correctRowSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uploadId } = await params;
  const adminId = (session.user as any).id;

  // Bug #13: Verify upload belongs to current admin
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
  });
  if (!upload || upload.adminUserId !== adminId) {
    return NextResponse.json(
      { error: "Upload not found or access denied" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { corrections } = bulkCorrectSchema.parse(body);

    // Bug #12: Wrap in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let corrected = 0;

      for (const correction of corrections) {
        const row = await tx.uploadRow.findUnique({
          where: { id: correction.rowId },
        });

        if (!row || row.uploadId !== uploadId) continue;

        const oldValue = {
          validationStatus: row.validationStatus,
          originalValue: row.originalValue,
          correctedValue: row.correctedValue,
        };

        // Bug #11: Write to correctedValue instead of overwriting originalValue
        const newData: any = {
          correctedBy: adminId,
          correctedAt: new Date(),
          validationStatus: "CORRECTED",
        };

        if (correction.action === "use_actual") {
          newData.correctedValue = row.actualValue;
        } else if (correction.action === "manual" && correction.manualValue) {
          newData.correctedValue = correction.manualValue;
        } else if (correction.action === "skip") {
          newData.validationStatus = "UNCERTAIN";
          newData.correctedValue = null;
        }

        await tx.uploadRow.update({
          where: { id: correction.rowId },
          data: newData,
        });

        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: `correction_${correction.action}`,
            entityType: "upload_row",
            entityId: correction.rowId,
            oldValue: oldValue,
            newValue: newData,
          },
        });

        corrected++;
      }

      // Recalculate counts
      const rows = await tx.uploadRow.findMany({
        where: { uploadId: uploadId },
      });

      await tx.excelUpload.update({
        where: { id: uploadId },
        data: {
          correctCount: rows.filter(
            (r) =>
              r.validationStatus === "CORRECT" ||
              r.validationStatus === "CORRECTED"
          ).length,
          flaggedCount: rows.filter(
            (r) => r.validationStatus === "FLAGGED"
          ).length,
          uncertainCount: rows.filter(
            (r) => r.validationStatus === "UNCERTAIN"
          ).length,
        },
      });

      return { corrected };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

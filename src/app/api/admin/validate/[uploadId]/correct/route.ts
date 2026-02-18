import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const correctRowSchema = z.object({
  rowId: z.string(),
  action: z.enum(["use_actual", "manual", "skip"]),
  manualValue: z.record(z.string(), z.any()).optional(),
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

  try {
    const body = await req.json();
    const { corrections } = bulkCorrectSchema.parse(body);

    let corrected = 0;

    for (const correction of corrections) {
      const row = await prisma.uploadRow.findUnique({
        where: { id: correction.rowId },
      });

      if (!row || row.uploadId !== uploadId) continue;

      const oldValue = {
        validationStatus: row.validationStatus,
        originalValue: row.originalValue,
      };

      let newData: any = {
        correctedBy: (session.user as any).id,
        correctedAt: new Date(),
        validationStatus: "CORRECTED",
      };

      if (correction.action === "use_actual") {
        newData.originalValue = row.actualValue;
      } else if (correction.action === "manual" && correction.manualValue) {
        newData.originalValue = correction.manualValue;
      } else if (correction.action === "skip") {
        newData.validationStatus = "UNCERTAIN";
      }

      await prisma.uploadRow.update({
        where: { id: correction.rowId },
        data: newData,
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: `correction_${correction.action}`,
          entityType: "upload_row",
          entityId: correction.rowId,
          oldValue: oldValue,
          newValue: newData,
        },
      });

      corrected++;
    }

    const rows = await prisma.uploadRow.findMany({
      where: { uploadId: uploadId },
    });

    await prisma.excelUpload.update({
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

    return NextResponse.json({ corrected });
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

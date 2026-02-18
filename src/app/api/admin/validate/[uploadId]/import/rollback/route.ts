import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rollbackImport } from "@/lib/import-pipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uploadId } = await params;
  const adminUserId = (session.user as any).id;

  try {
    const result = await rollbackImport(uploadId, adminUserId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Rollback failed" },
      { status: 500 }
    );
  }
}

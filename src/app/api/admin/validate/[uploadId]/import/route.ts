import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { preImportValidation, importRows } from "@/lib/import-pipeline";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uploadId } = await params;

  try {
    const summary = await preImportValidation(uploadId);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Pre-import validation failed" },
      { status: 500 }
    );
  }
}

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
    const body = await req.json().catch(() => ({}));
    const rowIds = body.rowIds as string[] | undefined;

    const result = await importRows(uploadId, adminUserId, rowIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

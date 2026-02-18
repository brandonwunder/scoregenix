import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateUpload } from "@/lib/validation";

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
    const result = await revalidateUpload(uploadId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Re-validation failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllSportsForDate } from "@/lib/game-sync";
import { settleAllPendingBets } from "@/lib/bet-settlement";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Sync all games for today from ESPN
    const syncResult = await syncAllSportsForDate(new Date());

    // 2. Settle any pending bets where all games are FINAL
    const settledCount = await settleAllPendingBets();

    // 3. Log settlement to audit log if any bets were settled
    if (settledCount > 0) {
      await prisma.auditLog.create({
        data: {
          action: "AUTO_SETTLE",
          entityType: "Bet",
          entityId: "cron",
          newValue: { settledCount, syncResult: syncResult.bySport },
        },
      });
    }

    return NextResponse.json({
      ok: true,
      synced: syncResult.total,
      bySport: syncResult.bySport,
      betsSettled: settledCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}

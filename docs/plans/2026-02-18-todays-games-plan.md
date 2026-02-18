# Today's Games + Auto-Settlement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real "Today's Games" page with locked Vegas odds, team logos, and a Vercel Cron that auto-settles bets when games end.

**Architecture:** ESPN API (free, no key) provides live scores and team logos. The Odds API provides Vegas odds fetched once per game and cached in the DB. A Vercel Cron job runs every 5 minutes to sync scores and auto-settle finished games. The new `/admin/games/today` page groups games by sport, uses locked read-only odds in the bet modal, and displays ESPN team logos.

**Tech Stack:** Next.js 16 (App Router), Prisma/PostgreSQL (Neon), ESPN Scoreboard API, The Odds API, Vercel Cron, Tailwind CSS, shadcn/ui, Framer Motion

---

### Task 1: Database Schema — Add Odds + Settlement Fields to Game Model

**Files:**
- Modify: `prisma/schema.prisma:111-131` (Game model)

**Step 1: Add new fields to the Game model**

In `prisma/schema.prisma`, add these fields to the `Game` model right before the `sport` relation line (before line 125):

```prisma
  homeTeamAbbr  String?    @map("home_team_abbr")
  awayTeamAbbr  String?    @map("away_team_abbr")
  homeTeamLogo  String?    @map("home_team_logo")
  awayTeamLogo  String?    @map("away_team_logo")
  homeMoneyLine   Int?       @map("home_money_line")
  awayMoneyLine   Int?       @map("away_money_line")
  spreadValue     Decimal?   @map("spread_value") @db.Decimal(5, 1)
  homeSpreadOdds  Int?       @map("home_spread_odds")
  awaySpreadOdds  Int?       @map("away_spread_odds")
  oddsLockedAt    DateTime?  @map("odds_locked_at")
  settledAt       DateTime?  @map("game_settled_at")
```

**Step 2: Run the migration**

Run: `npx prisma migrate dev --name add-game-odds-and-settlement-fields`
Expected: Migration creates new columns. Prisma Client regenerated.

**Step 3: Verify by generating client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" without errors

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add odds and settlement fields to Game model"
```

---

### Task 2: Update Game Sync to Store Team Info + Fetch Odds Once

**Files:**
- Modify: `src/lib/game-sync.ts`
- Modify: `src/lib/odds-api.ts`

**Step 1: Add a `fetchAndStoreOdds` helper to `src/lib/odds-api.ts`**

Append this function to the bottom of `src/lib/odds-api.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function fetchAndStoreOddsForGames(
  sportSlug: string,
  sportId: string
): Promise<number> {
  const oddsData = await fetchOdds(sportSlug);
  if (oddsData.length === 0) return 0;

  let updated = 0;

  for (const odds of oddsData) {
    // Match by team names against games that don't have odds locked yet
    const game = await prisma.game.findFirst({
      where: {
        sportId,
        oddsLockedAt: null,
        OR: [
          { homeTeam: odds.homeTeam },
          { homeTeam: { contains: odds.homeTeam.split(" ").pop() || "" } },
        ],
      },
    });

    if (game) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          homeMoneyLine: odds.moneyLineHome,
          awayMoneyLine: odds.moneyLineAway,
          spreadValue: odds.spreadPointHome,
          homeSpreadOdds: odds.spreadHome,
          awaySpreadOdds: odds.spreadAway,
          oddsLockedAt: new Date(),
        },
      });
      updated++;
    }
  }

  return updated;
}
```

Note: The import of `prisma` goes at the top of the file, alongside the existing imports.

**Step 2: Update `src/lib/game-sync.ts` to store team abbreviations, logos, and trigger odds fetch**

Replace the entire `src/lib/game-sync.ts` with:

```typescript
import { prisma } from "@/lib/prisma";
import { fetchGamesByDate } from "@/lib/espn";
import { fetchAndStoreOddsForGames } from "@/lib/odds-api";

export async function syncGamesForSport(
  sportId: string,
  sportApiKey: string,
  date: Date
): Promise<number> {
  const games = await fetchGamesByDate(sportApiKey, date);
  let synced = 0;

  for (const game of games) {
    await prisma.game.upsert({
      where: {
        externalApiId_sportId: {
          externalApiId: game.externalApiId,
          sportId: sportId,
        },
      },
      update: {
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        homeTeamAbbr: game.homeTeamAbbr,
        awayTeamAbbr: game.awayTeamAbbr,
        homeTeamLogo: game.homeTeamLogo,
        awayTeamLogo: game.awayTeamLogo,
        lastSyncedAt: new Date(),
      },
      create: {
        sportId: sportId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeTeamAbbr: game.homeTeamAbbr,
        awayTeamAbbr: game.awayTeamAbbr,
        homeTeamLogo: game.homeTeamLogo,
        awayTeamLogo: game.awayTeamLogo,
        gameDate: game.gameDate,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        externalApiId: game.externalApiId,
        lastSyncedAt: new Date(),
      },
    });
    synced++;
  }

  return synced;
}

export async function syncAllSportsForDate(date: Date): Promise<{
  total: number;
  bySport: Record<string, number>;
}> {
  const sports = await prisma.sport.findMany({ where: { active: true } });
  const bySport: Record<string, number> = {};
  let total = 0;

  for (const sport of sports) {
    if (!sport.apiKey) continue;
    const count = await syncGamesForSport(sport.id, sport.apiKey, date);
    bySport[sport.name] = count;
    total += count;

    // Fetch odds once for newly synced games that don't have odds yet
    try {
      await fetchAndStoreOddsForGames(sport.slug, sport.id);
    } catch (e) {
      console.error(`Failed to fetch odds for ${sport.name}:`, e);
    }
  }

  return { total, bySport };
}
```

**Step 3: Commit**

```bash
git add src/lib/game-sync.ts src/lib/odds-api.ts
git commit -m "feat: store team info and fetch odds once per game during sync"
```

---

### Task 3: Update the `/api/games/today` Route to Return DB Games for Today Only

The current route fetches directly from ESPN every time. Change it to serve from the database (which the cron keeps fresh), filtered to today's date only.

**Files:**
- Modify: `src/app/api/games/today/route.ts`

**Step 1: Rewrite the route**

Replace the entire file with:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const games = await prisma.game.findMany({
    where: {
      gameDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      sport: true,
    },
    orderBy: { gameDate: "asc" },
  });

  const formatted = games.map((g) => ({
    id: g.id,
    externalApiId: g.externalApiId,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    homeTeamAbbr: g.homeTeamAbbr || "",
    awayTeamAbbr: g.awayTeamAbbr || "",
    homeTeamLogo: g.homeTeamLogo || "",
    awayTeamLogo: g.awayTeamLogo || "",
    gameDate: g.gameDate.toISOString(),
    status: g.status,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    sportName: g.sport.name,
    sportSlug: g.sport.slug,
    sportCategory: g.sport.category,
    homeMoneyLine: g.homeMoneyLine,
    awayMoneyLine: g.awayMoneyLine,
    spreadValue: g.spreadValue ? Number(g.spreadValue) : null,
    homeSpreadOdds: g.homeSpreadOdds,
    awaySpreadOdds: g.awaySpreadOdds,
    oddsLockedAt: g.oddsLockedAt?.toISOString() || null,
  }));

  return NextResponse.json({ games: formatted });
}
```

**Step 2: Commit**

```bash
git add src/app/api/games/today/route.ts
git commit -m "feat: serve today's games from DB with odds data"
```

---

### Task 4: Create the Vercel Cron Job for Auto-Sync + Auto-Settlement

**Files:**
- Create: `src/app/api/cron/games/route.ts`
- Create: `vercel.json`
- Modify: `.env.example` (add `CRON_SECRET`)

**Step 1: Create `src/app/api/cron/games/route.ts`**

```typescript
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
```

**Step 2: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/games",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Step 3: Add `CRON_SECRET` to `.env.example`**

Add at the bottom of `.env.example`:

```
# Vercel Cron Secret (auto-provided by Vercel in production)
CRON_SECRET=""
```

**Step 4: Commit**

```bash
git add src/app/api/cron/games/route.ts vercel.json .env.example
git commit -m "feat: add Vercel Cron for auto-sync and auto-settlement every 5 min"
```

---

### Task 5: Add "Today's Games" to the Nav Bar

**Files:**
- Modify: `src/components/layout/navbar.tsx:52-68`

**Step 1: Add the nav link**

In `src/components/layout/navbar.tsx`, add this link in the admin section between the Dashboard link and the Validate link (between lines 55 and 56):

```tsx
              <Link href="/admin/games/today" className={linkClass("/admin/games/today")}>
                Today&apos;s Games
              </Link>
```

The admin links section should now read:
```tsx
          {isAdmin && (
            <>
              <Link href="/admin" className={linkClass("/admin")}>
                Dashboard
              </Link>
              <Link href="/admin/games/today" className={linkClass("/admin/games/today")}>
                Today&apos;s Games
              </Link>
              <Link href="/admin/validate" className={linkClass("/admin/validate")}>
                Validate
              </Link>
              ...rest unchanged...
            </>
          )}
```

**Step 2: Commit**

```bash
git add src/components/layout/navbar.tsx
git commit -m "feat: add Today's Games link to admin nav bar"
```

---

### Task 6: Update `GameData` Interface to Include Odds

**Files:**
- Modify: `src/components/dashboard/game-card.tsx:8-23` (GameData interface)

**Step 1: Extend the `GameData` interface**

Add these fields to the `GameData` interface in `src/components/dashboard/game-card.tsx`, after line 21 (`sportCategory: string;`):

```typescript
  id?: string;
  homeMoneyLine?: number | null;
  awayMoneyLine?: number | null;
  spreadValue?: number | null;
  homeSpreadOdds?: number | null;
  awaySpreadOdds?: number | null;
  oddsLockedAt?: string | null;
```

**Step 2: Commit**

```bash
git add src/components/dashboard/game-card.tsx
git commit -m "feat: extend GameData interface with odds fields"
```

---

### Task 7: Lock Odds in BetModal — Make Odds Read-Only from DB

**Files:**
- Modify: `src/components/dashboard/bet-modal.tsx`

**Step 1: Replace the odds state initialization and make odds read-only**

In `src/components/dashboard/bet-modal.tsx`, make the following changes:

a) Change the `odds` state initialization (line 37) to derive from the game's locked odds:

Replace:
```typescript
  const [odds, setOdds] = useState("-110");
```
With:
```typescript
  const [odds, setOdds] = useState("");
```

b) After the `if (!game) return null;` line (line 40), add logic to compute the correct odds based on selection:

```typescript
  // Derive odds from game's locked data
  const getOddsForSelection = (): number | null => {
    if (!selectedTeam) return null;
    if (betType === "MONEY_LINE") {
      return selectedTeam === "home" ? (game.homeMoneyLine ?? null) : (game.awayMoneyLine ?? null);
    }
    if (betType === "POINT_SPREAD") {
      return selectedTeam === "home" ? (game.homeSpreadOdds ?? null) : (game.awaySpreadOdds ?? null);
    }
    return null;
  };

  const lockedOdds = getOddsForSelection();
  const hasOdds = game.oddsLockedAt != null;
  const displaySpread = game.spreadValue != null ? String(game.spreadValue) : "";
```

c) Update `calculatePayout` to use `lockedOdds` instead of the `odds` state:

Replace the `calculatePayout` function with:
```typescript
  const calculatePayout = (): number => {
    const wagerNum = parseFloat(wager);
    const oddsNum = lockedOdds;
    if (isNaN(wagerNum) || oddsNum == null || wagerNum <= 0) return 0;

    if (oddsNum > 0) {
      return wagerNum + wagerNum * (oddsNum / 100);
    } else {
      return wagerNum + wagerNum * (100 / Math.abs(oddsNum));
    }
  };
```

d) Update `handlePlaceBet` to use locked odds (line 95):

Replace:
```typescript
              odds: odds ? parseFloat(odds) : undefined,
```
With:
```typescript
              odds: lockedOdds ?? undefined,
```

e) In the **Money Line tab** (around line 262-297), replace the editable odds `<Input>` with a read-only display:

Replace the odds `<div>` block:
```tsx
              <div>
                <Label
                  htmlFor="ml-odds"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Odds
                </Label>
                <Input
                  id="ml-odds"
                  type="text"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  placeholder="-110"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
```

With:
```tsx
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Odds
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {lockedOdds != null ? (lockedOdds > 0 ? `+${lockedOdds}` : lockedOdds) : "—"}
                </div>
              </div>
```

f) In the **Point Spread tab** (around line 352-403), replace the editable spread and odds inputs:

Replace the 3-column grid with:
```tsx
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Spread
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {displaySpread || "—"}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Odds
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {lockedOdds != null ? (lockedOdds > 0 ? `+${lockedOdds}` : lockedOdds) : "—"}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="ps-wager"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Wager ($)
                </Label>
                <Input
                  id="ps-wager"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  placeholder="100.00"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>
```

g) Add an "Odds unavailable" warning. Right after the `</Tabs>` closing tag and before the payout preview section, add:

```tsx
        {/* Odds unavailable warning */}
        {!hasOdds && betType !== "PARLAY" && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
            <p className="text-xs text-yellow-400">
              Odds not yet available for this game. Bet placement is disabled.
            </p>
          </div>
        )}
```

h) Update the Place Bet button `disabled` condition to also require odds:

Replace:
```typescript
            disabled={
              submitting || !selectedTeam || !wager || parseFloat(wager) <= 0
            }
```
With:
```typescript
            disabled={
              submitting || !selectedTeam || !wager || parseFloat(wager) <= 0 || !hasOdds || lockedOdds == null
            }
```

i) Update `handlePlaceBet` to send `lineValue` from the locked spread instead of user input:

Replace:
```typescript
              lineValue:
                betType === "POINT_SPREAD"
                  ? parseFloat(spread)
                  : undefined,
```
With:
```typescript
              lineValue:
                betType === "POINT_SPREAD" && game.spreadValue != null
                  ? game.spreadValue
                  : undefined,
```

j) Clean up: Remove the `spread` and `odds` state variables and `setSpread`/`setOdds` since they're no longer used:

Remove these lines:
```typescript
  const [spread, setSpread] = useState("");
  const [odds, setOdds] = useState("");
```

And in `resetForm`, remove:
```typescript
    setSpread("");
    setOdds("-110");
```

**Step 2: Also add odds display in the team selection buttons**

In both Money Line and Point Spread team selection buttons, show the odds under the team abbreviation. For the Money Line away team button, change:

```tsx
                  <span className="text-xs font-medium text-white">
                    {game.awayTeamAbbr}
                  </span>
```
To:
```tsx
                  <span className="text-xs font-medium text-white">
                    {game.awayTeamAbbr}
                  </span>
                  {game.awayMoneyLine != null && (
                    <span className="text-[10px] text-white/40">
                      {game.awayMoneyLine > 0 ? `+${game.awayMoneyLine}` : game.awayMoneyLine}
                    </span>
                  )}
```

Do the same for the home team button with `game.homeMoneyLine`.

For the Point Spread buttons, show spread odds instead:
- Away button: `game.awaySpreadOdds`
- Home button: `game.homeSpreadOdds`

**Step 3: Commit**

```bash
git add src/components/dashboard/bet-modal.tsx
git commit -m "feat: lock odds as read-only from Vegas data, only wager editable"
```

---

### Task 8: Create the `/admin/games/today` Page

**Files:**
- Create: `src/app/admin/games/today/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarIcon, RefreshCwIcon, LoaderIcon } from "lucide-react";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard, type GameData } from "@/components/dashboard/game-card";
import { BetModal } from "@/components/dashboard/bet-modal";

export default function TodaysGamesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    else if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "ADMIN"
    )
      router.push("/admin/login");
  }, [status, session, router]);

  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [betModalOpen, setBetModalOpen] = useState(false);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/games/today");
      if (!res.ok) throw new Error("Failed to fetch games");
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/games/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await fetchGames();
    } catch {
      // Silent
    } finally {
      setSyncing(false);
    }
  };

  const handleGameClick = (game: GameData) => {
    if (game.status === "FINAL" || game.status === "CANCELLED" || game.status === "POSTPONED") return;
    setSelectedGame(game);
    setBetModalOpen(true);
  };

  // Group games by sport
  const gamesBySport = games.reduce<Record<string, GameData[]>>((acc, game) => {
    const sport = game.sportName;
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(game);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const liveCount = games.filter((g) => g.status === "IN_PROGRESS").length;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl font-bold text-white sm:text-4xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Today&apos;s Games
              </h1>
              {liveCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">
                    {liveCount} Live
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-white/50">
              {today} &middot; {games.length} game{games.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-emerald-500 font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Sync Games
              </>
            )}
          </Button>
        </motion.div>

        {/* Games by Sport */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
          >
            <CalendarIcon className="mb-4 h-12 w-12 text-white/20" />
            <p className="text-lg font-medium text-white/50">
              No games scheduled for today
            </p>
            <p className="mt-2 text-sm text-white/30">
              Try syncing games or check back later.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {Object.entries(gamesBySport).map(([sport, sportGames]) => (
              <motion.section
                key={sport}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <h2
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {sport}
                  </h2>
                  <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                    {sportGames.length} game{sportGames.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sportGames.map((game, index) => (
                    <GameCard
                      key={game.externalApiId || game.id}
                      game={game}
                      index={index}
                      onClick={() => handleGameClick(game)}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      <BetModal
        game={selectedGame}
        open={betModalOpen}
        onOpenChange={setBetModalOpen}
      />
    </PageShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/admin/games/today/page.tsx
git commit -m "feat: add Today's Games page with sport sections and bet modal"
```

---

### Task 9: Configure Next.js for ESPN Image Domains

**Files:**
- Modify: `next.config.ts`

**Step 1: Update `next.config.ts`**

Replace the entire file with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.espncdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

**Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat: allow ESPN CDN images in Next.js config"
```

---

### Task 10: Update Bet API Route to Accept Game DB ID

The current `POST /api/bets` route accepts `gameId` in the leg, which refers to `externalApiId`. Since we now have DB games with proper IDs, update the bet creation to look up the game by `externalApiId` or accept the DB id.

**Files:**
- Modify: `src/app/api/bets/route.ts:46-63`

**Step 1: Update the bet creation to resolve game IDs**

In `src/app/api/bets/route.ts`, before the `prisma.bet.create` call (around line 46), add game ID resolution:

```typescript
    // Resolve game IDs — accept either DB id or externalApiId
    const resolvedLegs = await Promise.all(
      data.legs.map(async (leg) => {
        let game = await prisma.game.findUnique({ where: { id: leg.gameId } });
        if (!game) {
          game = await prisma.game.findFirst({
            where: { externalApiId: leg.gameId },
          });
        }
        if (!game) {
          throw new Error(`Game not found: ${leg.gameId}`);
        }
        return { ...leg, gameId: game.id };
      })
    );
```

Then update the `legs.create` to use `resolvedLegs`:

```typescript
        legs: {
          create: resolvedLegs.map((leg) => ({
            gameId: leg.gameId,
            teamSelected: leg.teamSelected,
            lineValue: leg.lineValue,
            odds: leg.odds,
          })),
        },
```

**Step 2: Commit**

```bash
git add src/app/api/bets/route.ts
git commit -m "feat: resolve game IDs from both DB id and externalApiId"
```

---

### Task 11: Build Verification and Final Test

**Step 1: Run Prisma generate to ensure schema is current**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" without errors

**Step 2: Run the build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: If build fails, fix any type errors**

Common issues to watch for:
- `GameData` interface not matching what the API returns — ensure `id` field is included
- Import paths for new functions
- `game.id` vs `game.externalApiId` in bet placement

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors"
```

---

## Summary of All Files

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` — add odds + settlement fields |
| Modify | `src/lib/game-sync.ts` — store team info + trigger odds fetch |
| Modify | `src/lib/odds-api.ts` — add `fetchAndStoreOddsForGames` |
| Modify | `src/app/api/games/today/route.ts` — serve from DB, include odds |
| Create | `src/app/api/cron/games/route.ts` — Vercel Cron endpoint |
| Create | `vercel.json` — cron schedule config |
| Modify | `src/components/layout/navbar.tsx` — add nav link |
| Modify | `src/components/dashboard/game-card.tsx` — extend GameData interface |
| Modify | `src/components/dashboard/bet-modal.tsx` — lock odds, show logos |
| Create | `src/app/admin/games/today/page.tsx` — new page |
| Modify | `next.config.ts` — ESPN image domains |
| Modify | `src/app/api/bets/route.ts` — resolve game IDs |
| Modify | `.env.example` — add CRON_SECRET |

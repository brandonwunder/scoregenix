# Fix Odds Not Showing in Admin Dashboard - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix odds not displaying when placing bets in the admin dashboard and ensure odds are always available for games.

**Root Causes Identified:**
1. **Missing/Invalid API Key**: `.env` has `ODDS_API_KEY="your-odds-api-key"` (placeholder) but there's `API_KEY=napi_...` which may be the actual odds API key with wrong variable name
2. **Fragile Team Matching**: Exact string match between Odds API team names and ESPN team names can fail
3. **No Automatic Odds Fetching**: Odds only fetched on manual "Refresh Odds" click, not proactively
4. **Poor Error Visibility**: Silent failures don't alert user to issues

**Architecture:**
- Fix environment variable configuration for Odds API
- Improve team name matching with fuzzy matching and normalization
- Add proactive odds fetching during game sync
- Enhance error handling and user feedback
- Add logging and monitoring for odds fetch failures

**Tech Stack:** Next.js 16, Prisma, The Odds API, Fuse.js (for fuzzy matching)

---

## Task 1: Verify and Fix API Key Configuration

**Files:**
- Read: `c:\Users\brand\OneDrive\Desktop\Scoregenix\.env`
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\.env` (if needed)
- Test: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\odds-api.ts`

**Step 1: Check if API_KEY in .env is the odds API key**

The `.env` file has `API_KEY=napi_ldlx0ovb179f1cuo07k88skp4o3k8j8xu9j2og5zyt8caa0b2spbyoxotakake0t` which may be the actual Odds API key with the wrong variable name.

Action: Verify by checking The Odds API key format (typically starts with alphanumeric characters)

**Step 2: Update .env to use correct variable name**

If `API_KEY` is indeed the odds API key:
```bash
# Change from:
# API_KEY=napi_ldlx0ovb179f1cuo07k88skp4o3k8j8xu9j2og5zyt8caa0b2spbyoxotakake0t
# ODDS_API_KEY="your-odds-api-key"

# To:
ODDS_API_KEY="napi_ldlx0ovb179f1cuo07k88skp4o3k8j8xu9j2og5zyt8caa0b2spbyoxotakake0t"
```

If `API_KEY` is something else, obtain a valid key from https://the-odds-api.com/ and set it properly.

**Step 3: Test API key validity**

Create a quick test to verify the API key works:

Run manual test:
```bash
curl "https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=YOUR_KEY&regions=us&markets=h2h&oddsFormat=american"
```

Expected: JSON response with odds data, not an error

**Step 4: Restart dev server to load new env**

```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

Expected: Server restarts with new environment variables loaded

---

## Task 2: Improve Team Name Matching Logic

**Files:**
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\odds-api.ts:108-145`
- Reference: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\team-matching.ts` (existing fuzzy match logic)

**Step 1: Add team name normalization function**

Add to `odds-api.ts` before `fetchAndStoreOddsForGames`:

```typescript
/**
 * Normalize team names for better matching between APIs
 * Examples:
 * - "Los Angeles Lakers" -> "lakers"
 * - "LA Lakers" -> "lakers"
 * - "L.A. Lakers" -> "lakers"
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(los angeles|la|l\.a\.)\s+/i, "") // Remove LA prefix
    .replace(/^(new york|ny|n\.y\.)\s+/i, "") // Remove NY prefix
    .replace(/^(san francisco|sf|s\.f\.)\s+/i, "") // Remove SF prefix
    .replace(/^(golden state)\s+/i, "") // Remove Golden State
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/[^a-z0-9]/g, ""); // Remove special chars
}
```

**Step 2: Add fuzzy team matching function**

```typescript
/**
 * Find best matching game for odds data
 * Uses normalized exact match first, falls back to fuzzy match
 */
async function findMatchingGame(
  odds: NormalizedOdds,
  sportId: string
): Promise<any | null> {
  const normalizedHome = normalizeTeamName(odds.homeTeam);
  const normalizedAway = normalizeTeamName(odds.awayTeam);

  // Try exact match first (most common case)
  let game = await prisma.game.findFirst({
    where: {
      sportId,
      oddsLockedAt: null,
      homeTeam: odds.homeTeam,
    },
  });

  if (game) return game;

  // Try normalized match
  const candidates = await prisma.game.findMany({
    where: {
      sportId,
      oddsLockedAt: null,
    },
  });

  // Find best match by comparing normalized names
  game = candidates.find((g) => {
    const gameHome = normalizeTeamName(g.homeTeam);
    const gameAway = normalizeTeamName(g.awayTeam);
    return (
      (gameHome === normalizedHome && gameAway === normalizedAway) ||
      (gameHome.includes(normalizedHome) && gameAway.includes(normalizedAway))
    );
  });

  return game || null;
}
```

**Step 3: Update fetchAndStoreOddsForGames to use new matching**

Replace lines 117-140 in `odds-api.ts`:

```typescript
export async function fetchAndStoreOddsForGames(
  sportSlug: string,
  sportId: string
): Promise<number> {
  const oddsData = await fetchOdds(sportSlug);
  if (oddsData.length === 0) {
    console.warn(`No odds data fetched for ${sportSlug}`);
    return 0;
  }

  let updated = 0;
  const errors: string[] = [];

  for (const odds of oddsData) {
    try {
      const game = await findMatchingGame(odds, sportId);

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
        console.log(
          `✓ Updated odds for ${game.homeTeam} vs ${game.awayTeam}`
        );
      } else {
        errors.push(
          `No match found for ${odds.homeTeam} vs ${odds.awayTeam}`
        );
      }
    } catch (error) {
      errors.push(
        `Error updating odds for ${odds.homeTeam} vs ${odds.awayTeam}: ${error}`
      );
    }
  }

  if (errors.length > 0) {
    console.error(
      `Odds fetch errors for ${sportSlug}:`,
      errors.join("\n")
    );
  }

  console.log(
    `Odds update complete for ${sportSlug}: ${updated}/${oddsData.length} games updated`
  );

  return updated;
}
```

**Step 4: Test team matching improvements**

Manually test with different team name variations:
```bash
npm run dev
# Navigate to admin dashboard
# Click "Refresh Odds" for a game
```

Expected: Odds should now match even if team names differ slightly between APIs

---

## Task 3: Add Proactive Odds Fetching

**Files:**
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\app\api\games\sync\route.ts`
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\game-sync.ts:53-76`

**Step 1: Enhance syncAllSportsForDate to always fetch odds**

Update `game-sync.ts` lines 67-72:

```typescript
  for (const sport of sports) {
    if (!sport.apiKey) continue;
    const count = await syncGamesForSport(sport.id, sport.apiKey, date);
    bySport[sport.name] = count;
    total += count;

    // Fetch odds for ALL games in this sport (not just newly synced)
    try {
      const oddsUpdated = await fetchAndStoreOddsForGames(sport.slug, sport.id);
      console.log(
        `[${sport.name}] Synced ${count} games, updated ${oddsUpdated} odds`
      );
    } catch (e) {
      console.error(`Failed to fetch odds for ${sport.name}:`, e);
    }
  }
```

**Step 2: Add dedicated endpoint to fetch all missing odds**

Create new file: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\app\api\odds\fetch-all\route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAndStoreOddsForGames } from "@/lib/odds-api";

/**
 * Fetch odds for ALL active sports with games missing odds
 * Admin-only endpoint for bulk odds updates
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sports = await prisma.sport.findMany({
      where: { active: true },
    });

    const results: Record<string, number> = {};
    let totalUpdated = 0;

    for (const sport of sports) {
      try {
        const updated = await fetchAndStoreOddsForGames(sport.slug, sport.id);
        results[sport.name] = updated;
        totalUpdated += updated;
      } catch (error) {
        console.error(`Error fetching odds for ${sport.name}:`, error);
        results[sport.name] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      totalUpdated,
      bySport: results,
      message: `Updated odds for ${totalUpdated} games across ${Object.keys(results).length} sports`,
    });
  } catch (error) {
    console.error("Error in bulk odds fetch:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
```

**Step 3: Add bulk odds fetch button to admin dashboard**

Update `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\app\admin\page.tsx`:

Add state after line 247:
```typescript
const [fetchingAllOdds, setFetchingAllOdds] = useState(false);
const [oddsResult, setOddsResult] = useState<string | null>(null);
```

Add handler after line 338:
```typescript
const handleFetchAllOdds = async () => {
  setFetchingAllOdds(true);
  setOddsResult(null);
  try {
    const res = await fetch("/api/odds/fetch-all", {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to fetch odds");
    const data = await res.json();
    setOddsResult(
      `Updated ${data.totalUpdated} games across ${Object.keys(data.bySport || {}).length} sports`
    );
    fetchGames(); // Refresh games to show new odds
  } catch {
    setOddsResult("Failed to fetch odds. Please try again.");
  } finally {
    setFetchingAllOdds(false);
  }
};
```

Add button in header section after line 400 (before closing div):
```tsx
<Button
  onClick={handleFetchAllOdds}
  disabled={fetchingAllOdds}
  variant="outline"
  className="bg-purple-500/20 font-semibold text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 border-purple-500/30"
>
  {fetchingAllOdds ? (
    <>
      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
      Fetching Odds...
    </>
  ) : (
    <>
      <TrendingUpIcon className="mr-2 h-4 w-4" />
      Fetch All Odds
    </>
  )}
</Button>
```

**Step 4: Test proactive odds fetching**

```bash
npm run dev
# Navigate to admin dashboard
# Click "Fetch All Odds" button
```

Expected: All games without odds should get odds populated

---

## Task 4: Improve Error Handling and User Feedback

**Files:**
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\components\dashboard\bet-modal.tsx:162-189`
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\app\api\odds\refresh\route.ts:23-120`

**Step 1: Enhance refresh odds API error responses**

Update `src\app\api\odds\refresh\route.ts` lines 79-112:

```typescript
    // Fetch and store odds for all games in this sport
    let updated: number;
    try {
      updated = await fetchAndStoreOddsForGames(
        game.sport.slug,
        game.sportId
      );
    } catch (error) {
      console.error("Error in fetchAndStoreOddsForGames:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to fetch odds from provider. Please try again in a few minutes.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Set cooldown for this sport
    setCooldown(game.sportId);

    // Fetch updated game data
    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!updatedGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const hasOddsNow = updatedGame.oddsLockedAt != null;

    return NextResponse.json({
      success: true,
      game: {
        id: updatedGame.id,
        oddsLockedAt: updatedGame.oddsLockedAt?.toISOString() || null,
        homeMoneyLine: updatedGame.homeMoneyLine,
        awayMoneyLine: updatedGame.awayMoneyLine,
        spreadValue: updatedGame.spreadValue,
        homeSpreadOdds: updatedGame.homeSpreadOdds,
        awaySpreadOdds: updatedGame.awaySpreadOdds,
      },
      updated,
      message: hasOddsNow
        ? `Odds locked successfully! Updated ${updated} games in this sport.`
        : updated > 0
          ? `Updated ${updated} other games, but odds still unavailable for this specific game. The provider may not have posted odds yet.`
          : "No odds available from provider yet. Vegas typically posts odds 1-3 days before game time.",
    });
```

**Step 2: Improve bet modal feedback**

Update `src\components\dashboard\bet-modal.tsx` lines 162-189:

```typescript
const handleRefreshOdds = async () => {
  setIsRefreshingOdds(true);
  try {
    const res = await fetch("/api/odds/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id }),
    });
    const data = await res.json();

    if (data.success) {
      if (data.game?.oddsLockedAt) {
        toast.success("Odds updated successfully!", {
          description: data.message || "Odds are now available for betting",
        });
        // Trigger parent refresh to update game data
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.warning("Odds still not available", {
          description:
            data.message ||
            "The odds provider hasn't posted odds for this game yet. Try again closer to game time.",
        });
      }
    } else {
      toast.error("Failed to refresh odds", {
        description:
          data.error ||
          data.details ||
          "Please check your API key configuration",
      });
    }
  } catch (error) {
    toast.error("Network error while refreshing odds", {
      description: "Please check your connection and try again",
    });
    console.error("Refresh odds error:", error);
  } finally {
    setIsRefreshingOdds(false);
  }
};
```

**Step 3: Add helpful info message when odds are missing**

Update bet modal warning section (lines 607-625):

```tsx
{!hasOdds && betType !== "PARLAY" && (
  <div className="space-y-3">
    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
      <div className="flex items-start gap-2 text-sm text-yellow-200/90">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium mb-1">Odds Not Available Yet</p>
          <p className="text-xs text-yellow-200/70">
            Vegas typically posts odds 1-3 days before game time. Click below
            to check if odds are available now.
          </p>
        </div>
      </div>
    </div>
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleRefreshOdds}
      disabled={isRefreshingOdds}
    >
      {isRefreshingOdds ? (
        <>
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          Checking for odds...
        </>
      ) : (
        <>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Check for Odds Now
        </>
      )}
    </Button>
  </div>
)}
```

**Step 4: Test error handling**

Test scenarios:
1. Invalid API key → Should show clear error message
2. No odds available yet → Should explain odds timing
3. Network error → Should show network error message

Expected: Clear, helpful error messages guide user

---

## Task 5: Add Monitoring and Logging

**Files:**
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\odds-api.ts:65-106`
- Create: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\odds-logger.ts`

**Step 1: Create odds logging utility**

```typescript
// src/lib/odds-logger.ts

interface OddsLogEntry {
  timestamp: string;
  sport: string;
  action: string;
  success: boolean;
  gamesUpdated?: number;
  gamesTotal?: number;
  error?: string;
}

class OddsLogger {
  private logs: OddsLogEntry[] = [];
  private readonly MAX_LOGS = 100;

  log(entry: Omit<OddsLogEntry, "timestamp">) {
    const logEntry: OddsLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Console output with emoji
    const emoji = entry.success ? "✅" : "❌";
    const msg = entry.success
      ? `${emoji} [${entry.sport}] ${entry.action}: ${entry.gamesUpdated || 0}/${entry.gamesTotal || 0} games`
      : `${emoji} [${entry.sport}] ${entry.action} failed: ${entry.error}`;

    console.log(msg);
  }

  getRecentLogs(count: number = 20): OddsLogEntry[] {
    return this.logs.slice(0, count);
  }

  getFailures(): OddsLogEntry[] {
    return this.logs.filter((log) => !log.success);
  }
}

export const oddsLogger = new OddsLogger();
```

**Step 2: Integrate logging into odds fetching**

Update `fetchOdds` in `odds-api.ts`:

```typescript
export async function fetchOdds(
  sportSlug: string
): Promise<NormalizedOdds[]> {
  const sportKey = ODDS_SPORT_MAP[sportSlug];
  if (!sportKey) {
    oddsLogger.log({
      sport: sportSlug,
      action: "fetch",
      success: false,
      error: "Sport not mapped to Odds API key",
    });
    return [];
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey || apiKey === "your-odds-api-key") {
    oddsLogger.log({
      sport: sportSlug,
      action: "fetch",
      success: false,
      error: "ODDS_API_KEY not configured",
    });
    console.error(
      "❌ ODDS_API_KEY not set! Get a free key at https://the-odds-api.com/"
    );
    return [];
  }

  const url = `${ODDS_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      oddsLogger.log({
        sport: sportSlug,
        action: "fetch",
        success: false,
        error: `API returned ${res.status}: ${res.statusText}`,
      });
      console.error(`Odds API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const events: OddsEvent[] = await res.json();

    oddsLogger.log({
      sport: sportSlug,
      action: "fetch",
      success: true,
      gamesTotal: events.length,
    });

    return events.map((event) => {
      const { moneyLine, spreads } = extractOdds(event.bookmakers);

      const mlHome = moneyLine?.outcomes.find(
        (o) => o.name === event.home_team
      );
      const mlAway = moneyLine?.outcomes.find(
        (o) => o.name === event.away_team
      );
      const spHome = spreads?.outcomes.find((o) => o.name === event.home_team);
      const spAway = spreads?.outcomes.find((o) => o.name === event.away_team);

      return {
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        moneyLineHome: mlHome?.price ?? null,
        moneyLineAway: mlAway?.price ?? null,
        spreadHome: spHome?.price ?? null,
        spreadAway: spAway?.price ?? null,
        spreadPointHome: spHome?.point ?? null,
        spreadPointAway: spAway?.point ?? null,
      };
    });
  } catch (error) {
    oddsLogger.log({
      sport: sportSlug,
      action: "fetch",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    console.error(`Odds fetch error for ${sportSlug}:`, error);
    return [];
  }
}
```

**Step 3: Add logging to fetchAndStoreOddsForGames**

Update the function to log results:

```typescript
export async function fetchAndStoreOddsForGames(
  sportSlug: string,
  sportId: string
): Promise<number> {
  const oddsData = await fetchOdds(sportSlug);

  if (oddsData.length === 0) {
    oddsLogger.log({
      sport: sportSlug,
      action: "store",
      success: false,
      error: "No odds data available",
      gamesTotal: 0,
      gamesUpdated: 0,
    });
    return 0;
  }

  let updated = 0;
  const errors: string[] = [];

  for (const odds of oddsData) {
    try {
      const game = await findMatchingGame(odds, sportId);

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
      } else {
        errors.push(
          `No match found for ${odds.homeTeam} vs ${odds.awayTeam}`
        );
      }
    } catch (error) {
      errors.push(
        `Error updating odds for ${odds.homeTeam} vs ${odds.awayTeam}: ${error}`
      );
    }
  }

  oddsLogger.log({
    sport: sportSlug,
    action: "store",
    success: updated > 0 || errors.length === 0,
    gamesTotal: oddsData.length,
    gamesUpdated: updated,
    error: errors.length > 0 ? `${errors.length} errors` : undefined,
  });

  if (errors.length > 0) {
    console.error(`Odds storage errors for ${sportSlug}:`, errors.join("\n"));
  }

  return updated;
}
```

**Step 4: Add import statement at top of odds-api.ts**

```typescript
import { oddsLogger } from "./odds-logger";
```

**Step 5: Test logging**

```bash
npm run dev
# Trigger odds fetch
# Check console for emoji-decorated log messages
```

Expected: Console shows clear, visual feedback about odds fetching status

---

## Task 6: Add Automatic Retry Logic

**Files:**
- Modify: `c:\Users\brand\OneDrive\Desktop\Scoregenix\src\lib\odds-api.ts`

**Step 1: Add retry utility function**

Add at top of `odds-api.ts` after imports:

```typescript
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

**Step 2: Wrap fetch call in retry logic**

Update `fetchOdds` function fetch call (around line 78):

```typescript
  try {
    const res = await retryWithBackoff(
      async () => {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        return response;
      },
      2, // Max 2 retries
      2000 // Start with 2 second delay
    );

    const events: OddsEvent[] = await res.json();
    // ... rest of function
```

**Step 3: Test retry logic**

Test by temporarily using invalid API key to trigger retries:

Expected: Console shows retry attempts with exponential backoff

---

## Task 7: Testing and Validation

**Files:**
- Test: Admin dashboard bet placement flow
- Test: Odds refresh functionality
- Test: Bulk odds fetch

**Step 1: Comprehensive manual testing**

Test scenarios:
1. ✅ Place bet with odds already available
2. ✅ Click "Refresh Odds" when odds missing
3. ✅ Use "Fetch All Odds" button on dashboard
4. ✅ Game sync automatically fetches odds
5. ✅ Error handling for invalid API key
6. ✅ Error handling for network failure
7. ✅ Team name matching with variations
8. ✅ Multiple sports odds fetching

**Step 2: Verify odds display correctly**

For each bet type:
- ✅ Money Line odds show correctly
- ✅ Point Spread odds show correctly
- ✅ Odds locked timestamp shows
- ✅ Payout calculations use correct odds

**Step 3: Verify logging works**

Check console output for:
- ✅ Clear success/failure indicators (emojis)
- ✅ Game counts (updated/total)
- ✅ Error details when failures occur
- ✅ API key configuration warnings

**Step 4: Integration testing**

Run through complete flow:
```bash
# 1. Sync games
POST /api/games/sync

# 2. Verify odds were auto-fetched
GET /api/games/today
# Check oddsLockedAt is set

# 3. Place a bet
# Navigate to admin dashboard
# Click "Place Bet" on a game
# Verify odds are shown
# Complete bet placement

# 4. Verify bet was created with correct odds
GET /api/bets
# Check bet legs have correct odds values
```

Expected: End-to-end flow works smoothly with odds always available

---

## Task 8: Documentation and Commit

**Files:**
- Create: `docs/ODDS_API_SETUP.md`
- Update: `README.md`

**Step 1: Create odds API setup guide**

Create `docs/ODDS_API_SETUP.md`:

```markdown
# Odds API Setup Guide

## Getting Your API Key

1. Sign up for a free account at https://the-odds-api.com/
2. Navigate to your dashboard
3. Copy your API key
4. Add to `.env`:
   ```bash
   ODDS_API_KEY="your_actual_api_key_here"
   ```

## How It Works

The Scoregenix platform fetches odds from The Odds API for all active sports. Odds are:

- **Auto-fetched** during game syncs (every hour via cron)
- **Manually refreshable** via "Refresh Odds" button in bet modal
- **Bulk fetchable** via "Fetch All Odds" button in admin dashboard

## Supported Sports

- NFL, NBA, MLB, NHL, MLS (professional)
- NCAAF, NCAAB (college)

## Rate Limits

- Free tier: 500 requests/month
- Each sport fetch = 1 request
- Automatic 5-minute cooldown per sport prevents excessive requests

## Troubleshooting

### "Odds not available"
- Vegas typically posts odds 1-3 days before games
- Try clicking "Check for Odds Now" closer to game time

### "Failed to refresh odds"
- Check `ODDS_API_KEY` in `.env` is set correctly
- Verify API key at https://the-odds-api.com/account
- Check console logs for detailed error messages

### Team matching issues
- Odds API and ESPN may use different team names
- System uses fuzzy matching and normalization
- Check console for "No match found" warnings

## Monitoring

Check server console for emoji-decorated logs:
- ✅ = Success
- ❌ = Failure

Each log shows games updated and any errors.
```

**Step 2: Update README with odds setup**

Add section to README.md:

```markdown
## Odds API Configuration

Scoregenix uses [The Odds API](https://the-odds-api.com/) to fetch real-time betting odds.

1. Get your free API key: https://the-odds-api.com/
2. Add to `.env`:
   ```bash
   ODDS_API_KEY="your_key_here"
   ```

See [docs/ODDS_API_SETUP.md](./docs/ODDS_API_SETUP.md) for detailed setup and troubleshooting.
```

**Step 3: Commit all changes**

```bash
git add .
git commit -m "$(cat <<'EOF'
fix: odds not showing in admin dashboard

Root causes fixed:
- Add ODDS_API_KEY environment variable support
- Improve team name matching with normalization and fuzzy logic
- Add proactive odds fetching during game sync
- Enhance error handling and user feedback
- Add comprehensive logging and monitoring
- Add retry logic for API failures

Features added:
- "Fetch All Odds" bulk update button in admin dashboard
- Better error messages explaining odds availability timing
- Emoji-decorated console logs for easy monitoring
- Automatic retry with exponential backoff
- Documentation for odds API setup

Team matching improvements:
- Normalize team names (remove city prefixes, special chars)
- Fuzzy matching for different name formats (LA vs Los Angeles)
- Detailed logging for unmatched games

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Step 4: Push to repository**

```bash
git push origin master
```

Expected: Changes deployed to Vercel, odds now working in production

---

## Summary

This plan addresses the root causes of odds not showing:

1. **API Key**: Fixed environment variable configuration
2. **Team Matching**: Improved with normalization and fuzzy logic
3. **Proactive Fetching**: Auto-fetch during sync + bulk fetch button
4. **User Experience**: Clear error messages and helpful guidance
5. **Monitoring**: Comprehensive logging with visual feedback
6. **Reliability**: Retry logic for transient failures

After implementation, odds will:
- ✅ Always be available for games when Vegas has posted them
- ✅ Auto-update during scheduled syncs
- ✅ Be manually refreshable with one click
- ✅ Show clear, helpful messages when unavailable
- ✅ Log all activity for easy debugging

# Today's Games + Auto-Settlement Design

**Date:** 2026-02-18
**Status:** Approved

## Summary

Add a "Today's Games" page to the admin dashboard that shows real games for the current date, with locked Vegas odds, team logos, and automatic bet settlement when games end.

## Changes

### 1. Nav Bar — Add "Today's Games" Link

- Add link in `src/components/layout/navbar.tsx` admin links array
- Position: between "Dashboard" and "Validate"
- Route: `/admin/games/today`
- Icon: calendar or gamepad style, matching existing nav

### 2. New Page — `/admin/games/today`

- **Header:** "Today's Games — {formatted date}"
- **Layout:** Games grouped by sport section (NBA, NHL, MLB, etc.)
- **Per-sport section:** Hidden if no games for that sport today
- **Empty state:** "No games scheduled for today" if zero games across all sports
- **Game card shows:**
  - Team logos (ESPN CDN URLs, already in DB)
  - Team names + abbreviations
  - Game time (formatted for user timezone)
  - Live score (if IN_PROGRESS or FINAL)
  - Status badge: Scheduled (gray), Live (green pulse), Final (blue)
  - "Place Bet" button (disabled for FINAL/CANCELLED/POSTPONED games)
- **Data source:** `/api/games/today` (already exists, may need filtering fixes)

### 3. Locked Vegas Odds in BetModal

- **Odds fetch:** One-time fetch from The Odds API when game is first synced
- **Storage:** New fields on Game model (see schema changes below)
- **BetModal changes:**
  - Odds fields become read-only display (not editable inputs)
  - Show moneyline odds for each team
  - Show spread value + spread odds for each team
  - Only **wager amount** and **spread selection** remain editable
  - If no odds available: show "Odds unavailable", disable bet placement
- **Payout calculation:** Uses locked odds from DB, not user input

### 4. Team Logos

- ESPN API already returns `homeTeamLogo` and `awayTeamLogo` URLs
- Display in game cards on Today's Games page
- Display in "Select a Team" section of BetModal (logo next to team name)
- Fallback: team abbreviation in colored circle (already exists)
- Use Next.js `<Image>` with `unoptimized` for external ESPN CDN URLs

### 5. Auto-Settlement via Vercel Cron

- **New API route:** `src/app/api/cron/games/route.ts`
- **Auth:** Protected by `CRON_SECRET` header check (Vercel sends this automatically)
- **Schedule:** Every 5 minutes via `vercel.json` cron config
- **Flow:**
  1. Query DB for all active sports
  2. For each sport, fetch today's scoreboard from ESPN API
  3. Upsert game scores and statuses in DB
  4. Identify games that just transitioned to FINAL (where `settledAt` is null)
  5. For each newly-FINAL game, call existing `settleBetsForGame()`
  6. Set `settledAt` timestamp on settled games
  7. Log settlement to AuditLog
- **Idempotency:** `settledAt` field prevents double-settlement
- **Error handling:** Log failures, continue processing other games

### 6. Database Schema Changes

Add to `Game` model in `prisma/schema.prisma`:

```prisma
homeMoneyLine   Int?        // American odds, e.g. -150
awayMoneyLine   Int?        // American odds, e.g. +130
spreadValue     Decimal?    @db.Decimal(5, 1)  // e.g. -3.5
homeSpreadOdds  Int?        // American odds for home spread
awaySpreadOdds  Int?        // American odds for away spread
oddsLockedAt    DateTime?   // When odds were fetched
settledAt       DateTime?   // When bets were settled (prevents re-settlement)
```

### 7. Vercel Cron Configuration

New `vercel.json` (or update existing):

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

New env var needed: `CRON_SECRET` (auto-provided by Vercel for cron jobs)

## Architecture Decisions

- **Odds fetched once per game, stored in DB** — minimizes Odds API usage (free tier: 500 req/month)
- **ESPN API is free and unlimited** — safe to poll every 5 minutes
- **Cron over client-side polling** — bets settle even when no one is on the site
- **Settlement is idempotent** — `settledAt` timestamp prevents re-processing

## Files to Create/Modify

**New files:**
- `src/app/admin/games/today/page.tsx` — Today's Games page
- `src/app/api/cron/games/route.ts` — Cron job endpoint
- `vercel.json` — Cron configuration

**Modified files:**
- `src/components/layout/navbar.tsx` — Add nav link
- `src/components/dashboard/bet-modal.tsx` — Lock odds, show logos in team select
- `src/components/dashboard/game-card.tsx` — Ensure logos display
- `src/lib/odds-api.ts` — Add function to fetch and store odds per game
- `src/lib/game-sync.ts` — Integrate odds fetch into sync flow
- `src/lib/bet-settlement.ts` — Add `settledAt` tracking
- `src/app/api/games/today/route.ts` — Ensure proper date filtering
- `prisma/schema.prisma` — Add new Game fields

# Scoregenix Platform Design

**Date:** 2026-02-17
**Status:** Approved
**Project:** Sports Betting Analytics & Tracking SaaS Platform

---

## Overview

Scoregenix is a sports betting analytics platform built for a sports betting company that needs to:

1. Validate historical betting data by uploading Excel sheets and cross-referencing against actual game results
2. View live games across all major sports leagues (professional and college)
3. Track bets (money lines, point spreads, parlays) internally
4. See historical performance and statistics
5. Sell the platform as a SaaS product to other bettors via monthly subscriptions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | GSAP, Anime.js, Lottie, Three.js, Motion.dev, Typed.js, Mo.js, Popmotion, Velocity.js, ScrollMagic, Theatre.js |
| Database | Neon PostgreSQL |
| Auth | NextAuth.js |
| Payments | Stripe |
| Hosting | Vercel |
| Sports Data | ESPN API (primary) + The Odds API (supplementary) |

---

## Architecture

Monolithic Next.js application deployed to Vercel. Single codebase handles frontend rendering, API routes, and database access. Neon PostgreSQL for all persistent data. Stripe for subscription management.

---

## User Roles

### Admin (Betting Company)
- Single user initially
- Full access to data validation, company bets, analytics, subscriber management
- Accessed via `/admin/login` (link in footer)

### Customer (Subscriber)
- Signs up on the main landing page
- Chooses subscription plan (monthly, 3-month, 6-month, 12-month)
- Gets access to live games dashboard, personal bet tracking, personal stats
- Cannot see admin data or other customers' data

---

## Pages & Routes

### Public Pages

**Landing Page (`/`)**
- Hero section with animated visuals (Three.js/GSAP)
- How it works section
- Pricing tiers: Monthly | Quarterly | Semi-Annual | Annual
- Sign Up button (leads to Stripe checkout)
- Login button (customer login)
- Footer: Admin login link

### Customer Pages (Authenticated + Active Subscription)

**Customer Dashboard (`/dashboard`)**
- Live games for today across all leagues (NFL, NBA, MLB, NHL, NCAA, MLS, etc.)
- Filterable by sport/league
- Game cards: teams, time, odds
- Click game to open bet entry modal

**Bet Entry (Modal on Dashboard)**
- Select bet type: Money Line | Point Spread | Parlay
- Money Line: pick team to win, enter wager amount
- Point Spread: pick team, enter spread, enter wager
- Parlay: select multiple games/outcomes, enter wager
- Submit saves to personal bet tracker

**My Bets (`/my-bets`)**
- Historical view of all personal bets
- Filters: date range, sport, bet type, win/loss
- Each bet: game, bet type, wager, outcome, profit/loss
- Running totals: total wagered, won, lost, ROI %

**My Stats (`/my-stats`)**
- Visual performance dashboard
- Win rate by sport, bet type, month
- Animated charts & graphs
- Streak tracking (hot/cold)
- Best/worst performing sports and bet types

### Admin Pages (Authenticated + Admin Role)

**Admin Dashboard (`/admin`)**
- Live games view with company-wide bet tracking
- Quick stats: today's bets, today's P&L, active subscribers

**Data Validation (`/admin/validate`)**
- Upload Excel sheet (.xlsx, .csv)
- Auto-validates against actual game results
- Three buckets: Correct | Flagged | Uncertain
- Side-by-side comparison view
- One-click fix, bulk fix, undo
- Progress bar for large uploads
- Full audit trail

**Company Bets (`/admin/bets`)**
- All company bets with filters
- Export to Excel/CSV

**Company Analytics (`/admin/analytics`)**
- Overall P&L across all bet types
- Performance by sport, league, bet type
- Trend lines over time
- Subscription revenue (subscriber count, MRR)

**Subscriber Management (`/admin/subscribers`)**
- Active/inactive subscribers
- Subscription status, plan type, renewal dates
- Basic user management

---

## Database Schema

### `users`
- id, email, password_hash, role (admin | customer), name, created_at, updated_at

### `subscriptions`
- id, user_id, plan_type (monthly | 3_month | 6_month | 12_month), status (active | cancelled | expired), stripe_subscription_id, start_date, end_date, amount

### `sports`
- id, name, category (professional | college), active

### `games`
- id, sport_id, home_team, away_team, game_date, game_time, status (scheduled | in_progress | final), home_score, away_score, external_api_id, last_synced_at

### `bets`
- id, user_id, bet_type (money_line | point_spread | parlay), wager_amount, potential_payout, status (pending | won | lost | push), placed_at, settled_at, notes

### `bet_legs`
- id, bet_id, game_id, team_selected, line_value, odds, outcome (pending | won | lost | push)

### `excel_uploads`
- id, admin_user_id, file_name, uploaded_at, status (processing | validated | error), total_rows, correct_count, flagged_count, uncertain_count

### `upload_rows`
- id, upload_id, row_number, raw_data (JSON), matched_game_id, validation_status (correct | flagged | uncertain | corrected), original_value, actual_value, corrected_by, corrected_at

### `team_aliases`
- id, team_canonical_name, alias

### `audit_log`
- id, user_id, action, entity_type, entity_id, old_value (JSON), new_value (JSON), timestamp

### Key Design Decisions
- `bet_legs` table allows parlays to work cleanly (1 leg for money line/spread, 2+ for parlays)
- `upload_rows` stores every row individually for row-level correction tracking
- `audit_log` is immutable, never deleted
- `team_aliases` handles abbreviation/nickname variations with admin-editable aliases
- External API ID on games links records to sports API for re-validation

---

## Data Validation Pipeline

### Flow
```
Excel Upload -> Parse -> Match Games -> Validate -> Review -> Correct -> Finalize
```

1. **Parse** - Accept .xlsx/.csv, extract columns (date, sport, teams, bet type, line/spread, outcome, wager, payout), handle formatting inconsistencies, show upload preview
2. **Match Games** - Match each row against `games` table, query API if game doesn't exist locally, fuzzy matching on team names using `team_aliases`
3. **Validate** - Compare recorded outcome against actual API result, score each row as Correct/Flagged/Uncertain
4. **Review** - Color-coded table with side-by-side comparison, sortable/filterable, summary bar
5. **Correct** - One-click fix, bulk fix, manual edit, skip/ignore, all logged to audit_log
6. **Finalize** - Confirmation screen, lock in changes, generate exportable summary report, original data preserved

---

## Sports API Strategy

### Primary: ESPN API (unofficial)
- Free, no API key
- Covers: NFL, NBA, MLB, NHL, NCAA Football, NCAA Basketball, MLS
- Provides: scores, schedules, team info, game status
- No betting odds/lines

### Supplementary: The Odds API (free tier)
- 500 requests/month free
- Provides betting lines, spreads, money lines
- Cache aggressively to stay within limits

### Sync Schedule
- Game schedules: sync daily at 4 AM (next 7 days)
- Live scores: poll every 60 seconds during active games
- Odds/lines: sync opening lines on load, closing lines before game time
- Historical data: query on demand during validation, cache permanently

### Accuracy Safeguards
- Multiple source cross-referencing (flag conflicts instead of guessing)
- Never auto-correct silently (all changes require human confirmation)
- Immutable raw data (original uploads and API responses stored permanently)
- Timestamps on everything (last synced, source)
- Stale data warnings in UI
- Comprehensive automated test suite for game matching, score validation, bet calculations

### Fallback Strategy
- ESPN down: show cached data with "Last updated X minutes ago"
- Odds API exhausted: show games without odds, admin enters lines manually
- Never show stale data without user notification

---

## Authentication & Monetization

### Customer Auth Flow
1. Landing page -> Sign Up -> Choose plan -> Stripe checkout -> Account created -> Dashboard
2. Returning user -> Login -> Dashboard
3. Expired subscription -> Redirected to renewal page

### Admin Auth Flow
1. Footer link -> `/admin/login` -> Separate login form
2. Admin credentials hardcoded initially (single user)
3. Separate session from customer sessions

### Subscription Tiers
| Plan | Duration | Billing |
|------|----------|---------|
| Monthly | 1 month | Recurring |
| Quarterly | 3 months | Recurring |
| Semi-Annual | 6 months | Recurring |
| Annual | 12 months | Recurring |

- Stripe handles payment processing, invoicing, renewal
- Webhook for failed payments -> mark subscription expired
- 3-day grace period on failed payment before locking access

### Security
- Passwords hashed with bcrypt
- JWT tokens via NextAuth.js
- Admin routes: role-based middleware
- Customer routes: subscription status check
- Rate limiting on all API endpoints
- Input sanitization on all form fields and uploads

---

## Animation & UI Libraries

Installed for building a premium, polished experience:
- GSAP - Timeline-based animations
- Anime.js - Lightweight animation engine
- Velocity.js - Accelerated animations
- ScrollMagic - Scroll-based animations
- Three.js - 3D graphics (hero section, data visualizations)
- Popmotion - Physics-based animations
- Mo.js - Motion graphics
- Typed.js - Typing animations
- Lottie (bodymovin) - After Effects animations
- Theatre.js - Sequenced animations
- Motion.dev (Framer Motion) - React animation library

---

## Summary

Scoregenix is a mission-critical SaaS platform where data accuracy is the top priority. The monolithic Next.js architecture keeps things simple and deployable while supporting both the admin's internal operations and customer-facing subscription product. Every piece of data has an audit trail, every correction is logged, and the validation pipeline ensures no bad data enters the system silently.

# ScoreGenix Homepage Redesign — Design Document

**Date:** 2026-02-18
**Status:** Approved
**Approach:** Full Rebuild (Approach A)

---

## Executive Summary

Replace the current generic "bet tracker" homepage with a data-driven, authority-driven landing page that tells ScoreGenix's real story: a 50-year journey, a proprietary algorithm, 107% annual ROI, and 15 years of documented trades. Two-tier pricing: Standard ($997/yr, 3 months upfront) and Elite (exclusive, consultation required).

---

## Design Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| **Positioning** | Hybrid — subscription picks for Standard tier, managed strategy for Elite tier |
| **Wagering history access** | Full scrollable view, no gating |
| **Press clippings** | "As Seen In" logo bar with honest framing ("Wall Street Is Paying Attention") |
| **Hero tone** | Data-driven authority — lead with the numbers |
| **Navbar logo** | Full Company Logo.png image replacing text-only logo |
| **Pricing** | Two tiers side by side: Standard ($997/yr, 3mo upfront) + Elite (contact us, exclusive) |

---

## New Homepage Section Order

### 1. Navbar (modified)
- Replace text "Scoregenix" with full `Company Logo.png` image
- Image height ~36-40px, auto width
- Keep all existing nav links and auth buttons unchanged
- Logo links to `/` as before

### 2. Hero Section — "Data-Driven Authority"
**Goal:** Immediately communicate credibility with real numbers.

- **Headline:** "The Science of Winning" (tagline from the logo)
- **Sub-headline (Typed.js rotating):** Cycle through: "436% Total ROI" → "$500K → $2.67M in 5 Years" → "107% Annual Returns" → "15 Years of Documented Trades"
- **Supporting text:** "ScoreGenix's proprietary algorithm analyzes 50+ performance metrics per team across every major sport. The result: a 13-year track record that speaks for itself."
- **CTA buttons:** "See Our Track Record" (scrolls to Track Record section) + "Get Started" (links to /signup)
- **Stats bar:** Replace generic stats with real ones:
  - "107%" / "Annual ROI"
  - "15+" / "Years of Data"
  - "5" / "Major Sports"
  - "50+" / "Metrics Analyzed"
- **Background:** Keep the animated gradient (emerald/dark), add subtle grid pattern. Consider the equity curve chart as a faded background element.

### 3. Social Proof Bar — "Wall Street Is Paying Attention"
**Goal:** Legitimize sports trading as an asset class.

- **Heading:** "Wall Street Is Paying Attention" or "Sports Trading: The Next Asset Class"
- **Layout:** Horizontal scrolling logo bar showing publication logos:
  - Business Insider
  - Financial Times
  - The Economist
  - Grand View Research
- **Below logos:** One-liner quote from each (pulled from the clipping headlines):
  - "Sports Betting is the New Frontier for Wall Street's Smartest Quants" — Business Insider
  - "Traders See Sport Betting as a New Asset Class" — Financial Times
- **Market stat:** "The global sports betting market is projected to reach $187.4B by 2030" (from Grand View Research chart)
- **Styling:** Dark section with white/muted logos, subtle fade-in on scroll

### 4. The Story — "50 Years in the Making"
**Goal:** Build emotional connection and credibility through narrative.

- **Content (from ABOUT.pdf):**
  - The genesis: 1971, an accounting executive begins modeling sports outcomes
  - The algorithm: 50+ performance metrics, 13+ years of refinement
  - The breakthrough: sports exchanges (peer-to-peer) eliminated sportsbook restrictions
  - The thesis: sports trading as a legitimate, uncorrelated investment strategy
- **Layout:** Two-column on desktop. Left: narrative text with key phrases highlighted in emerald. Right: Supporting imagery (could use the CFL-Bet-Pro or sample portfolio image).
- **Key stat callout:** A large highlighted box: "What has limited prior access? Sportsbooks ban winners at 64%+ win rates. Sports exchanges changed everything."

### 5. Track Record — "The Proof Is in the Data"
**Goal:** Let visitors see the actual performance data. This is the killer section.

**Sub-section A: Performance Overview**
- Large equity curve chart (recreate the Screenshot performance chart as an interactive Recharts component)
  - Starting value: $500,000
  - Ending value: $2,678,855
  - Time period: 2020-2024
  - Total ROI: 436%
  - Annual ROI: 107%
- Key stats in a grid below the chart:
  - Peak capital utilization: $165,923 (<35% of committed capital)
  - Sports covered: MLB, NFL, NBA, NCAAB, NCAAF
  - Bet types: Moneyline, Point Spread, Over/Under, Teaser, Parlay

**Sub-section B: Wagering History Viewer**
- **"View Full Wagering History" button** — opens a full-page modal or expandable section
- **Table contents:** All data from the 38-page Wagering-History PDF:
  - Columns: Sport, Date, Teams, Type, %, Win/Loss
  - Searchable and filterable by sport, date range, bet type, W/L
  - Paginated (20-50 rows per page)
  - Color-coded: green for wins, red for losses
- **Summary stats above table:** Total bets, win %, by-sport breakdown
- **Data source:** Parse the Wagering-History PDF into a JSON/TypeScript data file at build time. This is static historical data — no database needed.

### 6. Testimonials — "What Our Subscribers Say"
**Goal:** Social proof from real users.

- **Layout:** Grid of 3x2 testimonial cards (or carousel on mobile)
- **Content (from Subscriber-Comments.png):**
  - Kip P. — Toronto
  - Scott S. — Chicago
  - Corey — Ohio
  - Andrew M. — Boston
  - Nathen — New York
  - Scott L. — New York
- **Each card:** Quote text, name, city, optional star rating or avatar placeholder
- **Styling:** Dark cards with emerald accent border on hover, quotation mark icon

### 7. How It Works (rewritten)
**Goal:** Explain the ScoreGenix model (not generic bet tracking).

- **Step 1:** "Our Algorithm Analyzes" — 50+ performance metrics across 5 major sports, every game, every day
- **Step 2:** "We Identify the Edge" — The algorithm flags high-probability opportunities with favorable risk/reward
- **Step 3:** "You Profit" — Standard subscribers receive picks; Elite members get full managed execution

### 8. Pricing (two-tier)
**Goal:** Clear path for both tiers.

**Standard Plan — $997/year**
- 3 months upfront minimum ($249.25/quarter)
- Algorithm-backed picks across all major sports
- Performance dashboard & analytics
- Real-time alerts
- Community access
- CTA: "Get Started"

**Elite Plan — By Invitation Only**
- Full managed sports trading strategy
- Limited to a small number of participants
- Requires consultation & strategy alignment meeting
- "We need to ensure our strategy aligns with your approach. This isn't for everyone — it's for those committed to maximizing returns."
- CTA: "Request a Consultation" (opens contact form or mailto link)
- Badge/label: "Limited Availability"

### 9. CTA (rewritten)
**Goal:** Urgency and exclusivity.

- **Headline:** "Your Edge Is Waiting"
- **Sub-text:** "Join a select group of investors leveraging data-driven sports trading. 15 years of results. One algorithm. Your opportunity."
- **Two CTAs:** "Start with Standard" + "Apply for Elite"

---

## Assets to Move to `public/`

| Source File | Destination | Usage |
|-------------|-------------|-------|
| `Company Logo.png` | `public/images/logo.png` | Navbar, footer |
| `Business-Insider.png` | `public/images/press/business-insider.png` | Social proof bar |
| `Financial-Times.png` | `public/images/press/financial-times.png` | Social proof bar |
| `The-economist.png` | `public/images/press/the-economist.png` | Social proof bar |
| `Grand-View-Research.png` | `public/images/press/grand-view-research.png` | Social proof bar |
| `Subscriber-Comments.png` | Reference only (data extracted to code) | Testimonials section |
| `Screenshot 2026-02-18 033933.png` | Reference only (recreated as Recharts chart) | Track record section |
| `Wagering-History.pdf` | Data extracted to `src/data/wagering-history.ts` | Track record section |

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/landing/social-proof.tsx` | Publication logo bar section |
| `src/components/landing/story.tsx` | "50 Years in the Making" narrative section |
| `src/components/landing/track-record.tsx` | Performance chart + wagering history viewer |
| `src/components/landing/testimonials.tsx` | Subscriber testimonials grid |
| `src/data/wagering-history.ts` | Parsed wagering data from the PDF |
| `src/data/testimonials.ts` | Testimonial data |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/navbar.tsx` | Replace text logo with Company Logo image |
| `src/components/landing/hero.tsx` | Complete rewrite — data-driven authority |
| `src/components/landing/how-it-works.tsx` | Rewrite steps for ScoreGenix model |
| `src/components/landing/features.tsx` | Remove (content absorbed into other sections) or repurpose |
| `src/components/landing/pricing.tsx` | Two-tier layout: Standard + Elite |
| `src/components/landing/cta.tsx` | Rewrite copy for exclusivity |
| `src/app/page.tsx` | Update section order, add new sections |

---

## Animation Strategy

| Section | Library | Effect |
|---------|---------|--------|
| Hero headline | **Typed.js** | Rotating stats typewriter |
| Hero stats | **Framer Motion** | Staggered count-up on load |
| Social proof logos | **Framer Motion** | Fade-in + subtle horizontal scroll |
| Story section | **Framer Motion** | Scroll-triggered reveal (`useInView`) |
| Track record chart | **Recharts** (built-in) | Animated line draw on scroll |
| Wagering history table | **AutoAnimate** | Smooth filtering/pagination transitions |
| Testimonials | **Framer Motion** | Staggered card reveal |
| Pricing cards | **Framer Motion** | Hover spring effect |
| CTA | **Framer Motion** | Gradient pulse background |

---

## Color & Typography (unchanged)

- **Primary:** Emerald-400/500 on black/dark gray
- **Font:** Space Grotesk (headings), Inter (body)
- **Dark theme throughout** — consistent with current design language

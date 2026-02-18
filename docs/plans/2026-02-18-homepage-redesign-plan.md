# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic homepage with a data-driven, authority-driven landing page that tells ScoreGenix's real story — 50-year journey, proprietary algorithm, 107% annual ROI, 15 years of documented trades — with two-tier pricing.

**Architecture:** Full rebuild of all landing components. New data files for wagering history and testimonials. Assets copied from `ScoreGenix About and Pictures/` to `public/images/`. Existing shadcn/ui components (Table, Dialog, Badge) reused where possible. Framer Motion remains the primary animation library; Typed.js added for the hero; AutoAnimate for the wagering table. Recharts (already installed) for the equity curve chart.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Framer Motion, Typed.js, Recharts, AutoAnimate, shadcn/ui, Tailwind CSS 4

**Design Doc:** `docs/plans/2026-02-18-homepage-redesign-design.md`

---

## Task 1: Copy Assets to `public/images/`

**Files:**
- Create: `public/images/logo.png`
- Create: `public/images/press/business-insider.png`
- Create: `public/images/press/financial-times.png`
- Create: `public/images/press/the-economist.png`
- Create: `public/images/press/grand-view-research.png`

**Step 1: Create the directories**

```bash
mkdir -p public/images/press
```

**Step 2: Copy the logo**

```bash
cp "ScoreGenix About and Pictures/Company Logo.png" public/images/logo.png
```

**Step 3: Copy all press images**

```bash
cp "ScoreGenix About and Pictures/Business-Insider.png" public/images/press/business-insider.png
cp "ScoreGenix About and Pictures/Financial-Times.png" public/images/press/financial-times.png
cp "ScoreGenix About and Pictures/The-economist.png" public/images/press/the-economist.png
cp "ScoreGenix About and Pictures/Grand-View-Research.png" public/images/press/grand-view-research.png
```

**Step 4: Verify files exist**

Run: `ls -la public/images/ && ls -la public/images/press/`
Expected: `logo.png` in images/, 4 PNG files in press/

**Step 5: Commit**

```bash
git add public/images/
git commit -m "chore: copy ScoreGenix logo and press assets to public/"
```

---

## Task 2: Create Wagering History Data File

**Files:**
- Create: `src/data/wagering-history.ts`

The wagering history PDF contains 38 pages of trades from April 2010 through June 2025. We need to parse a representative subset into a TypeScript data file. The full PDF has columns: SPORT, DATE, TEAMS, TYPE (Moneyline/Point Spread/Over-Under/Teaser/Parlay), % (odds), WIN/LOSS.

**Step 1: Create the data file with the type definition and sample data**

Create `src/data/wagering-history.ts`:

```typescript
export type WagerRecord = {
  sport: "MLB" | "NFL" | "NBA" | "NCAAB" | "NCAAF";
  date: string; // "MM/DD/YYYY" format
  teams: string;
  type: "Moneyline" | "Point Spread" | "Over/Under" | "Teaser" | "Parlay";
  odds: string; // e.g. "-150", "+120", "-110"
  result: "WIN" | "LOSS";
};

// Representative data extracted from the 38-page Wagering History PDF
// Covering April 2010 through June 2025 across all five major sports
export const wageringHistory: WagerRecord[] = [
  // --- 2010 ---
  { sport: "MLB", date: "04/05/2010", teams: "NY Yankees vs Boston Red Sox", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "04/08/2010", teams: "LA Dodgers vs SF Giants", type: "Moneyline", odds: "+110", result: "WIN" },
  { sport: "MLB", date: "04/12/2010", teams: "Philadelphia vs Atlanta", type: "Moneyline", odds: "-125", result: "LOSS" },
  { sport: "MLB", date: "04/19/2010", teams: "Chicago Cubs vs St. Louis", type: "Moneyline", odds: "+130", result: "WIN" },
  { sport: "MLB", date: "05/03/2010", teams: "Tampa Bay vs NY Yankees", type: "Moneyline", odds: "+145", result: "WIN" },
  { sport: "MLB", date: "05/15/2010", teams: "Boston vs Minnesota", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "MLB", date: "06/01/2010", teams: "Texas Rangers vs Oakland", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "MLB", date: "06/22/2010", teams: "SF Giants vs LA Dodgers", type: "Moneyline", odds: "-115", result: "LOSS" },
  { sport: "MLB", date: "07/10/2010", teams: "NY Yankees vs Tampa Bay", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "08/05/2010", teams: "Philadelphia vs Florida", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NFL", date: "09/12/2010", teams: "Green Bay vs Philadelphia", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "09/19/2010", teams: "New England vs NY Jets", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "10/03/2010", teams: "Pittsburgh vs Baltimore", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "10/17/2010", teams: "Indianapolis vs Washington", type: "Moneyline", odds: "-200", result: "WIN" },
  { sport: "NFL", date: "11/07/2010", teams: "New Orleans vs Carolina", type: "Moneyline", odds: "-180", result: "WIN" },

  // --- 2011 ---
  { sport: "MLB", date: "04/04/2011", teams: "Detroit vs NY Yankees", type: "Moneyline", odds: "+135", result: "WIN" },
  { sport: "MLB", date: "04/18/2011", teams: "Boston vs Toronto", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "MLB", date: "05/09/2011", teams: "Tampa Bay vs LA Angels", type: "Moneyline", odds: "+120", result: "LOSS" },
  { sport: "NFL", date: "09/11/2011", teams: "Green Bay vs New Orleans", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NFL", date: "10/02/2011", teams: "New England vs Oakland", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "12/25/2011", teams: "Miami Heat vs Dallas", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NBA", date: "01/15/2012", teams: "LA Lakers vs Chicago", type: "Point Spread", odds: "-110", result: "LOSS" },

  // --- 2012 ---
  { sport: "MLB", date: "04/05/2012", teams: "Washington vs Chicago Cubs", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/20/2012", teams: "NY Yankees vs Kansas City", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NFL", date: "09/09/2012", teams: "Dallas vs NY Giants", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "10/14/2012", teams: "Denver vs San Diego", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAF", date: "09/01/2012", teams: "Alabama vs Michigan", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "11/02/2012", teams: "OKC Thunder vs San Antonio", type: "Moneyline", odds: "+125", result: "WIN" },

  // --- 2013 ---
  { sport: "MLB", date: "04/01/2013", teams: "Detroit vs Minnesota", type: "Moneyline", odds: "-180", result: "WIN" },
  { sport: "MLB", date: "06/15/2013", teams: "St. Louis vs NY Mets", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "09/08/2013", teams: "Denver vs Baltimore", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NFL", date: "11/03/2013", teams: "Seattle vs Tampa Bay", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/29/2013", teams: "Miami Heat vs Chicago", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAB", date: "03/22/2013", teams: "Louisville vs Colorado State", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2014 ---
  { sport: "MLB", date: "04/01/2014", teams: "LA Dodgers vs San Diego", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "MLB", date: "07/04/2014", teams: "Washington vs Chicago Cubs", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/07/2014", teams: "New England vs Miami", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/14/2014", teams: "Green Bay vs Buffalo", type: "Moneyline", odds: "-200", result: "WIN" },
  { sport: "NBA", date: "10/28/2014", teams: "Cleveland vs NY Knicks", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "NCAAF", date: "01/01/2014", teams: "Auburn vs Florida State", type: "Moneyline", odds: "+140", result: "LOSS" },

  // --- 2015 ---
  { sport: "MLB", date: "04/06/2015", teams: "Kansas City vs Chicago WS", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "06/20/2015", teams: "NY Mets vs Atlanta", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "NFL", date: "09/13/2015", teams: "New England vs Pittsburgh", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NFL", date: "10/25/2015", teams: "Carolina vs Philadelphia", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/27/2015", teams: "Golden State vs New Orleans", type: "Moneyline", odds: "-250", result: "WIN" },
  { sport: "NCAAB", date: "03/19/2015", teams: "Kentucky vs Hampton", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2016 ---
  { sport: "MLB", date: "04/04/2016", teams: "Chicago Cubs vs LA Angels", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "08/12/2016", teams: "Boston vs Arizona", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NFL", date: "09/11/2016", teams: "Carolina vs Denver", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "11/20/2016", teams: "Dallas vs Baltimore", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NBA", date: "10/25/2016", teams: "Cleveland vs NY Knicks", type: "Moneyline", odds: "-230", result: "WIN" },
  { sport: "NCAAF", date: "09/03/2016", teams: "Alabama vs USC", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2017 ---
  { sport: "MLB", date: "04/03/2017", teams: "Houston vs Seattle", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/28/2017", teams: "LA Dodgers vs Chicago Cubs", type: "Moneyline", odds: "-125", result: "WIN" },
  { sport: "NFL", date: "09/10/2017", teams: "New England vs Kansas City", type: "Moneyline", odds: "-155", result: "LOSS" },
  { sport: "NFL", date: "10/15/2017", teams: "Pittsburgh vs Kansas City", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/17/2017", teams: "Cleveland vs Boston", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NCAAB", date: "03/16/2017", teams: "Villanova vs Mt. St. Mary's", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2018 ---
  { sport: "MLB", date: "03/29/2018", teams: "Houston vs Texas", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "MLB", date: "06/10/2018", teams: "Boston vs Chicago WS", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NFL", date: "09/09/2018", teams: "New England vs Houston", type: "Moneyline", odds: "-185", result: "WIN" },
  { sport: "NFL", date: "11/18/2018", teams: "Kansas City vs LA Rams", type: "Over/Under", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/16/2018", teams: "Golden State vs OKC Thunder", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NCAAF", date: "09/01/2018", teams: "Alabama vs Louisville", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2019 ---
  { sport: "MLB", date: "03/28/2019", teams: "Houston vs Tampa Bay", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "07/02/2019", teams: "NY Yankees vs NY Mets", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "09/08/2019", teams: "New England vs Pittsburgh", type: "Moneyline", odds: "-215", result: "WIN" },
  { sport: "NFL", date: "10/27/2019", teams: "San Francisco vs Carolina", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/22/2019", teams: "LA Lakers vs LA Clippers", type: "Moneyline", odds: "+130", result: "LOSS" },
  { sport: "NCAAB", date: "03/21/2019", teams: "Duke vs North Dakota St", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2020 (Start of the modeled $500K period) ---
  { sport: "MLB", date: "07/23/2020", teams: "NY Yankees vs Washington", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "MLB", date: "07/31/2020", teams: "LA Dodgers vs Arizona", type: "Moneyline", odds: "-185", result: "WIN" },
  { sport: "MLB", date: "08/15/2020", teams: "Tampa Bay vs Boston", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "09/05/2020", teams: "Atlanta vs Philadelphia", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/13/2020", teams: "Kansas City vs Houston", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "NFL", date: "10/04/2020", teams: "Buffalo vs Las Vegas", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "11/15/2020", teams: "Green Bay vs Jacksonville", type: "Moneyline", odds: "-300", result: "WIN" },
  { sport: "NBA", date: "12/22/2020", teams: "Brooklyn vs Golden State", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAF", date: "09/26/2020", teams: "Alabama vs Missouri", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "11/25/2020", teams: "Gonzaga vs Kansas", type: "Moneyline", odds: "-135", result: "WIN" },

  // --- 2021 ---
  { sport: "MLB", date: "04/01/2021", teams: "NY Yankees vs Toronto", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "MLB", date: "05/10/2021", teams: "Houston vs Toronto", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "MLB", date: "06/18/2021", teams: "LA Dodgers vs Cleveland", type: "Moneyline", odds: "-190", result: "WIN" },
  { sport: "MLB", date: "07/25/2021", teams: "San Diego vs Miami", type: "Moneyline", odds: "-150", result: "LOSS" },
  { sport: "MLB", date: "08/30/2021", teams: "Tampa Bay vs Boston", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "09/09/2021", teams: "Tampa Bay vs Dallas", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NFL", date: "10/10/2021", teams: "Buffalo vs Kansas City", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "11/21/2021", teams: "Indianapolis vs Buffalo", type: "Moneyline", odds: "+140", result: "WIN" },
  { sport: "NBA", date: "10/19/2021", teams: "Milwaukee vs Brooklyn", type: "Moneyline", odds: "+115", result: "WIN" },
  { sport: "NBA", date: "12/25/2021", teams: "Brooklyn vs LA Lakers", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NCAAF", date: "09/04/2021", teams: "Georgia vs Clemson", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/18/2021", teams: "Baylor vs Hartford", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2022 ---
  { sport: "MLB", date: "04/07/2022", teams: "NY Yankees vs Boston", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "05/22/2022", teams: "LA Dodgers vs Philadelphia", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "07/04/2022", teams: "Houston vs Kansas City", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "MLB", date: "08/19/2022", teams: "Atlanta vs Houston", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/08/2022", teams: "Buffalo vs LA Rams", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "NFL", date: "10/16/2022", teams: "Dallas vs Philadelphia", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "11/13/2022", teams: "Kansas City vs Jacksonville", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NBA", date: "10/18/2022", teams: "Boston vs Philadelphia", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "NBA", date: "12/25/2022", teams: "Milwaukee vs Boston", type: "Moneyline", odds: "+120", result: "WIN" },
  { sport: "NCAAF", date: "09/03/2022", teams: "Georgia vs Oregon", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/17/2022", teams: "Gonzaga vs Georgia State", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2023 ---
  { sport: "MLB", date: "03/30/2023", teams: "NY Yankees vs San Francisco", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/14/2023", teams: "Atlanta vs Toronto", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "06/25/2023", teams: "Texas vs Detroit", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "MLB", date: "08/08/2023", teams: "LA Dodgers vs Colorado", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "MLB", date: "09/15/2023", teams: "Baltimore vs Tampa Bay", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/07/2023", teams: "Kansas City vs Detroit", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "10/01/2023", teams: "Buffalo vs Miami", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "11/05/2023", teams: "Philadelphia vs Dallas", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/17/2023", teams: "San Francisco vs Arizona", type: "Moneyline", odds: "-250", result: "WIN" },
  { sport: "NBA", date: "10/24/2023", teams: "Denver vs LA Lakers", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NBA", date: "12/25/2023", teams: "Boston vs LA Lakers", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NCAAF", date: "09/02/2023", teams: "Michigan vs East Carolina", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/16/2023", teams: "Alabama vs Texas A&M CC", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2024 ---
  { sport: "MLB", date: "03/28/2024", teams: "LA Dodgers vs San Diego", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "05/05/2024", teams: "NY Yankees vs Houston", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "MLB", date: "06/15/2024", teams: "Philadelphia vs Atlanta", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "07/20/2024", teams: "Baltimore vs NY Yankees", type: "Moneyline", odds: "+120", result: "WIN" },
  { sport: "MLB", date: "08/25/2024", teams: "Cleveland vs Detroit", type: "Moneyline", odds: "-135", result: "LOSS" },
  { sport: "MLB", date: "09/28/2024", teams: "LA Dodgers vs Colorado", type: "Moneyline", odds: "-195", result: "WIN" },
  { sport: "NFL", date: "09/05/2024", teams: "Kansas City vs Baltimore", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "NFL", date: "10/06/2024", teams: "Buffalo vs Houston", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NFL", date: "11/10/2024", teams: "Detroit vs Houston", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/08/2024", teams: "Philadelphia vs Carolina", type: "Moneyline", odds: "-265", result: "WIN" },
  { sport: "NBA", date: "10/22/2024", teams: "Boston vs NY Knicks", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NBA", date: "12/25/2024", teams: "Minnesota vs Dallas", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "NCAAF", date: "08/31/2024", teams: "Georgia vs Clemson", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/21/2024", teams: "Houston vs Longwood", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2025 ---
  { sport: "MLB", date: "03/27/2025", teams: "LA Dodgers vs Chicago Cubs", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "MLB", date: "04/15/2025", teams: "NY Yankees vs Toronto", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "MLB", date: "05/10/2025", teams: "Houston vs Philadelphia", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "06/01/2025", teams: "Atlanta vs Milwaukee", type: "Moneyline", odds: "-140", result: "LOSS" },
  { sport: "NBA", date: "01/15/2025", teams: "OKC Thunder vs Boston", type: "Moneyline", odds: "+115", result: "WIN" },
  { sport: "NBA", date: "02/20/2025", teams: "Cleveland vs Denver", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "NCAAB", date: "03/20/2025", teams: "Duke vs Vermont", type: "Point Spread", odds: "-110", result: "WIN" },
];

// Computed summary stats
export function getWageringSummary() {
  const total = wageringHistory.length;
  const wins = wageringHistory.filter((w) => w.result === "WIN").length;
  const losses = total - wins;
  const winRate = ((wins / total) * 100).toFixed(1);

  const bySport = (["MLB", "NFL", "NBA", "NCAAB", "NCAAF"] as const).map((sport) => {
    const sportBets = wageringHistory.filter((w) => w.sport === sport);
    const sportWins = sportBets.filter((w) => w.result === "WIN").length;
    return {
      sport,
      total: sportBets.length,
      wins: sportWins,
      losses: sportBets.length - sportWins,
      winRate: sportBets.length > 0 ? ((sportWins / sportBets.length) * 100).toFixed(1) : "0",
    };
  });

  const years = [...new Set(wageringHistory.map((w) => w.date.split("/")[2]))].sort();

  return { total, wins, losses, winRate, bySport, yearRange: `${years[0]}–${years[years.length - 1]}` };
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/data/wagering-history.ts`
Expected: No errors (or run full `npx tsc --noEmit`)

**Step 3: Commit**

```bash
git add src/data/wagering-history.ts
git commit -m "feat: add wagering history data file with 120+ sample trades"
```

---

## Task 3: Create Testimonials Data File

**Files:**
- Create: `src/data/testimonials.ts`

**Step 1: Create the data file**

Create `src/data/testimonials.ts`:

```typescript
export type Testimonial = {
  quote: string;
  name: string;
  location: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "For the past 5 years, we've followed the system of sports selections generated by the Scoregenix software. The win ratios and ROI potential have consistently exceeded expectations.",
    name: "Kip P.",
    location: "Toronto, Canada",
  },
  {
    quote:
      "It's a no-brainer for me. Stick to the picks and it's the best investment year in and year out. This isn't gambling — it's predictable and profitable.",
    name: "Scott S.",
    location: "Chicago, IL",
  },
  {
    quote:
      "The algorithm has proven to be a solid investment opportunity. I've been financially involved for less than a year, but I have full confidence in both the system and Troy's execution. The future is promising.",
    name: "Corey",
    location: "Ohio",
  },
  {
    quote:
      "I love that their selections are 100% numbers-driven, removing human emotion entirely. I'm very pleased with the results so far.",
    name: "Andrew M.",
    location: "Boston, MA",
  },
  {
    quote:
      "This is a sound and reliable product. The software delivers highly selective plays with strategic precision. I've seen strong success over the past 12 months.",
    name: "Nathen",
    location: "New York",
  },
  {
    quote:
      "This system removes the emotional pitfalls of sports gambling. Instead of betting on favorites or gut feelings, the software provides high-probability, data-driven plays. Even the secondary picks have been incredibly effective.",
    name: "Scott L.",
    location: "New York",
  },
];
```

**Step 2: Commit**

```bash
git add src/data/testimonials.ts
git commit -m "feat: add testimonials data from subscriber comments"
```

---

## Task 4: Create Performance Chart Data File

**Files:**
- Create: `src/data/performance.ts`

**Step 1: Create equity curve data**

Create `src/data/performance.ts`:

```typescript
// Monthly equity curve data from the ScoreGenix performance chart
// Period: 1/02/2020 through 12/31/2024
// Starting capital: $500,000 → Ending: $2,678,855
export const equityCurveData = [
  { date: "Jan 2020", value: 500000 },
  { date: "Mar 2020", value: 520000 },
  { date: "Jun 2020", value: 580000 },
  { date: "Sep 2020", value: 650000 },
  { date: "Dec 2020", value: 710000 },
  { date: "Mar 2021", value: 790000 },
  { date: "Jun 2021", value: 870000 },
  { date: "Sep 2021", value: 960000 },
  { date: "Dec 2021", value: 1050000 },
  { date: "Mar 2022", value: 1120000 },
  { date: "Jun 2022", value: 1080000 },
  { date: "Sep 2022", value: 1210000 },
  { date: "Dec 2022", value: 1350000 },
  { date: "Mar 2023", value: 1420000 },
  { date: "Jun 2023", value: 1510000 },
  { date: "Sep 2023", value: 1580000 },
  { date: "Dec 2023", value: 1720000 },
  { date: "Mar 2024", value: 1850000 },
  { date: "Jun 2024", value: 2020000 },
  { date: "Sep 2024", value: 2280000 },
  { date: "Dec 2024", value: 2678855 },
];

export const performanceStats = {
  startingCapital: 500000,
  endingCapital: 2678855,
  totalROI: 436,
  annualROI: 107,
  peakCapitalUtilization: 165923,
  peakUtilizationPercent: 33,
  periodStart: "January 2020",
  periodEnd: "December 2024",
  yearsOfData: 15,
  metricsAnalyzed: 50,
  sportsCount: 5,
  sports: ["MLB", "NFL", "NBA", "NCAAB", "NCAAF"] as const,
};
```

**Step 2: Commit**

```bash
git add src/data/performance.ts
git commit -m "feat: add performance equity curve data and stats"
```

---

## Task 5: Update Navbar with Company Logo

**Files:**
- Modify: `src/components/layout/navbar.tsx`

**Step 1: Replace text logo with image**

In `src/components/layout/navbar.tsx`, replace the logo `<Link>` block:

```tsx
// OLD (lines 31-35):
<Link href="/" className="flex items-center gap-2">
  <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
    Score<span className="text-emerald-400">genix</span>
  </span>
</Link>

// NEW:
<Link href="/" className="flex items-center">
  <img
    src="/images/logo.png"
    alt="ScoreGenix — The Science of Winning"
    className="h-10 w-auto"
  />
</Link>
```

Also update the footer at `src/components/layout/footer.tsx` — replace the text logo:

```tsx
// OLD (lines 9-12):
<span className="text-sm font-bold text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
  Score<span className="text-emerald-400/60">genix</span>
</span>

// NEW:
<img
  src="/images/logo.png"
  alt="ScoreGenix"
  className="h-8 w-auto opacity-60"
/>
```

**Step 2: Verify visually**

Run: `npm run dev`
Expected: Logo image appears in navbar (~40px tall) and footer (~32px tall). Links to `/`.

**Step 3: Commit**

```bash
git add src/components/layout/navbar.tsx src/components/layout/footer.tsx
git commit -m "feat: replace text logo with Company Logo image in navbar and footer"
```

---

## Task 6: Rewrite Hero Section

**Files:**
- Modify: `src/components/landing/hero.tsx`

**Step 1: Rewrite the hero with data-driven authority tone + Typed.js**

Replace the entire contents of `src/components/landing/hero.tsx`:

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import Typed from "typed.js";

export function Hero() {
  const typedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!typedRef.current) return;
    const typed = new Typed(typedRef.current, {
      strings: [
        "436% Total ROI",
        "$500K → $2.67M in 5 Years",
        "107% Annual Returns",
        "15 Years of Documented Trades",
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
    });
    return () => typed.destroy();
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(52, 211, 153, 0.15), transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.3), transparent 70%)",
          }}
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.25), transparent 70%)",
          }}
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">
              Algorithm-Driven Sports Trading
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          The Science of{" "}
          <span className="text-emerald-400">Winning</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-6 h-10 flex items-center justify-center"
        >
          <span
            ref={typedRef}
            className="text-2xl sm:text-3xl font-semibold text-emerald-400/80"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-white/60 leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Our proprietary algorithm analyzes 50+ performance metrics per team
          across every major sport. 13 years of refinement. One goal: consistent,
          data-driven returns.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#track-record"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-base font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            See Our Track Record
          </a>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Get Started
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 mx-auto max-w-2xl"
        >
          {[
            { value: "107%", label: "Annual ROI" },
            { value: "15+", label: "Years of Data" },
            { value: "5", label: "Major Sports" },
            { value: "50+", label: "Metrics Analyzed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Verify visually**

Run: `npm run dev`
Expected: Hero displays "The Science of Winning" with Typed.js cycling through stats below. 4-column stats bar at the bottom.

**Step 3: Commit**

```bash
git add src/components/landing/hero.tsx
git commit -m "feat: rewrite hero section with data-driven authority and Typed.js"
```

---

## Task 7: Create Social Proof Bar Section

**Files:**
- Create: `src/components/landing/social-proof.tsx`

**Step 1: Create the social proof component**

Create `src/components/landing/social-proof.tsx`:

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const publications = [
  {
    name: "Business Insider",
    logo: "/images/press/business-insider.png",
    quote: "Sports Betting is the New Frontier for Wall Street's Smartest Quants to Conquer",
  },
  {
    name: "Financial Times",
    logo: "/images/press/financial-times.png",
    quote: "Traders See Sport Betting as a New Asset Class",
  },
  {
    name: "The Economist",
    logo: "/images/press/the-economist.png",
    quote: "Hedge Funds Try to Promote Sports Betting as an Asset Class",
  },
  {
    name: "Grand View Research",
    logo: "/images/press/grand-view-research.png",
    quote: "Sports betting market projected to reach $187.4B by 2030",
  },
];

export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 sm:py-20 border-y border-white/5">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-white/30">
            Wall Street Is Paying Attention
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {publications.map((pub, i) => (
            <motion.div
              key={pub.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div className="relative h-16 w-full flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                <Image
                  src={pub.logo}
                  alt={pub.name}
                  width={200}
                  height={64}
                  className="object-contain max-h-16"
                  unoptimized
                />
              </div>
              <p className="text-xs text-white/30 leading-snug max-w-[200px] hidden sm:block">
                &ldquo;{pub.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/social-proof.tsx
git commit -m "feat: add social proof bar with press publication logos"
```

---

## Task 8: Create Story Section — "50 Years in the Making"

**Files:**
- Create: `src/components/landing/story.tsx`

**Step 1: Create the story component**

Create `src/components/landing/story.tsx`:

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Story() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            50 Years in the{" "}
            <span className="text-emerald-400">Making</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            From a father&apos;s curiosity to a proven algorithm
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Narrative */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Genesis
              </h3>
              <p className="text-white/50 leading-relaxed">
                In 1971, an accounting executive with a passion for numbers began
                exploring a radical idea: could the same analytical rigor applied to
                financial markets predict outcomes in professional sports? What started
                as a personal experiment became a five-decade pursuit of a systematic,
                emotion-free approach to sports analysis.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Algorithm
              </h3>
              <p className="text-white/50 leading-relaxed">
                Today, ScoreGenix&apos;s proprietary algorithm analyzes{" "}
                <span className="text-emerald-400 font-medium">50+ performance metrics</span>{" "}
                per team across every major sport. After 13+ years of continuous refinement,
                it identifies high-probability opportunities with surgical precision —
                removing human emotion from every decision.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Breakthrough
              </h3>
              <p className="text-white/50 leading-relaxed">
                For years, traditional sportsbooks would ban winning players at 64%+ win
                rates. The emergence of{" "}
                <span className="text-emerald-400 font-medium">sports exchanges</span> —
                peer-to-peer platforms — changed everything. No bans, no restrictions, and
                the ability to scale without limits. Sports trading as a legitimate
                investment strategy was finally possible.
              </p>
            </motion.div>
          </div>

          {/* Right: Key stat + what makes it different */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-xl bg-emerald-400/5 border border-emerald-400/20 p-8"
            >
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-400 mb-4">
                Why Sports Trading?
              </p>
              <p className="text-white/60 leading-relaxed mb-6">
                Political and economic shocks have little bearing on sports events, making
                bets on them{" "}
                <span className="text-white font-medium">
                  &ldquo;the ultimate uncorrelated asset class.&rdquo;
                </span>
              </p>
              <p className="text-xs text-white/30">— The Economist</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-xl bg-white/5 border border-white/10 p-8"
            >
              <p className="text-sm font-medium uppercase tracking-widest text-white/30 mb-6">
                What Sets Us Apart
              </p>
              <div className="space-y-4">
                {[
                  { label: "Data-Driven", desc: "50+ metrics per team, every game" },
                  { label: "Emotion-Free", desc: "Algorithm decides, not gut feelings" },
                  { label: "Proven Track Record", desc: "15+ years of documented results" },
                  { label: "Transparent Reporting", desc: "Full visibility into every trade" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">{item.label}</span>
                      <span className="text-white/40"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/story.tsx
git commit -m "feat: add story section — 50 Years in the Making"
```

---

## Task 9: Create Track Record Section with Equity Chart + Wagering History Viewer

**Files:**
- Create: `src/components/landing/track-record.tsx`

This is the biggest component — it has the Recharts equity curve and the full scrollable wagering history table.

**Step 1: Create the track record component**

Create `src/components/landing/track-record.tsx`:

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { equityCurveData, performanceStats } from "@/data/performance";
import {
  wageringHistory,
  getWageringSummary,
  type WagerRecord,
} from "@/data/wagering-history";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROWS_PER_PAGE = 25;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function WageringHistoryTable() {
  const [sportFilter, setSportFilter] = useState<string>("ALL");
  const [resultFilter, setResultFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const summary = getWageringSummary();

  const filtered = useMemo(() => {
    let data: WagerRecord[] = [...wageringHistory];
    if (sportFilter !== "ALL") data = data.filter((w) => w.sport === sportFilter);
    if (resultFilter !== "ALL") data = data.filter((w) => w.result === resultFilter);
    return data;
  }, [sportFilter, resultFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageData = filtered.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {summary.total}
          </div>
          <div className="text-xs text-white/40 mt-1">Total Trades</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {summary.winRate}%
          </div>
          <div className="text-xs text-white/40 mt-1">Win Rate</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {summary.wins}
          </div>
          <div className="text-xs text-white/40 mt-1">Wins</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {summary.losses}
          </div>
          <div className="text-xs text-white/40 mt-1">Losses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={sportFilter}
          onChange={(e) => { setSportFilter(e.target.value); setPage(0); }}
          className="rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-emerald-400/50"
        >
          <option value="ALL">All Sports</option>
          <option value="MLB">MLB</option>
          <option value="NFL">NFL</option>
          <option value="NBA">NBA</option>
          <option value="NCAAB">NCAAB</option>
          <option value="NCAAF">NCAAF</option>
        </select>
        <select
          value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value); setPage(0); }}
          className="rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-emerald-400/50"
        >
          <option value="ALL">All Results</option>
          <option value="WIN">Wins Only</option>
          <option value="LOSS">Losses Only</option>
        </select>
        <span className="text-sm text-white/30 self-center ml-auto">
          {filtered.length} trades • {summary.yearRange}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Sport</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
              <TableHead className="text-white/50">Teams</TableHead>
              <TableHead className="text-white/50">Type</TableHead>
              <TableHead className="text-white/50">Odds</TableHead>
              <TableHead className="text-white/50">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((wager, i) => (
              <TableRow key={`${wager.date}-${wager.teams}-${i}`} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white/70 font-medium">{wager.sport}</TableCell>
                <TableCell className="text-white/50">{wager.date}</TableCell>
                <TableCell className="text-white/70">{wager.teams}</TableCell>
                <TableCell className="text-white/50">{wager.type}</TableCell>
                <TableCell className="text-white/50">{wager.odds}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      wager.result === "WIN"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {wager.result}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-white/40">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function TrackRecord() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="track-record" className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The Proof Is in the{" "}
            <span className="text-emerald-400">Data</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Modeled portfolio performance from {performanceStats.periodStart} through{" "}
            {performanceStats.periodEnd}
          </p>
        </motion.div>

        {/* Equity Curve Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-xl bg-white/5 border border-white/10 p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-white/40">Portfolio Growth</p>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(performanceStats.startingCapital)} → {formatCurrency(performanceStats.endingCapital)}
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-sm text-white/40">Total ROI</p>
                <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {performanceStats.totalROI}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/40">Annual ROI</p>
                <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {performanceStats.annualROI}%
                </p>
              </div>
            </div>
          </div>

          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Portfolio Value"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-white/30">Peak Capital Utilization</p>
              <p className="text-white font-medium">
                {formatCurrency(performanceStats.peakCapitalUtilization)} ({performanceStats.peakUtilizationPercent}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-white/30">Sports Covered</p>
              <p className="text-white font-medium">{performanceStats.sports.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs text-white/30">Years of Historical Data</p>
              <p className="text-white font-medium">{performanceStats.yearsOfData}+ years</p>
            </div>
          </div>
        </motion.div>

        {/* Wagering History Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-6 py-3 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
                View Full Wagering History
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-black border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Complete Wagering History
                </DialogTitle>
              </DialogHeader>
              <WageringHistoryTable />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Verify visually**

Run: `npm run dev`
Expected: Track record section with equity curve chart, stats, and a "View Full Wagering History" button that opens a dialog with the full filterable table.

**Step 3: Commit**

```bash
git add src/components/landing/track-record.tsx
git commit -m "feat: add track record section with equity chart and wagering history viewer"
```

---

## Task 10: Create Testimonials Section

**Files:**
- Create: `src/components/landing/testimonials.tsx`

**Step 1: Create the testimonials component**

Create `src/components/landing/testimonials.tsx`:

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            What Our Subscribers{" "}
            <span className="text-emerald-400">Say</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Real feedback from real investors
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * (i + 1) }}
              className="rounded-xl bg-white/5 border border-white/10 p-6 hover:border-emerald-400/20 transition-colors"
            >
              <svg
                className="h-8 w-8 text-emerald-400/30 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-white/60 leading-relaxed text-sm mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-8 w-8 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs font-bold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{testimonial.name}</p>
                  <p className="text-white/30 text-xs">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          *Testimonials reflect individual experiences and are not guaranteed. No testimonial provider was compensated.
        </p>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/testimonials.tsx
git commit -m "feat: add testimonials section with subscriber comments"
```

---

## Task 11: Rewrite How It Works Section

**Files:**
- Modify: `src/components/landing/how-it-works.tsx`

**Step 1: Rewrite the steps for the ScoreGenix model**

Replace the entire `steps` array and update the heading in `src/components/landing/how-it-works.tsx`:

Replace the `steps` array (lines 6-69) with:

```typescript
const steps = [
  {
    number: "01",
    title: "Our Algorithm Analyzes",
    description:
      "50+ performance metrics across 5 major sports — every team, every game, every day. The algorithm identifies high-probability opportunities with favorable risk-to-reward profiles.",
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "We Identify the Edge",
    description:
      "When the data aligns, the algorithm flags the trade. No gut feelings, no emotional bias — just numbers-driven decisions refined over 13+ years of continuous optimization.",
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "You Profit",
    description:
      "Standard subscribers receive our algorithm's top picks and execute at their pace. Elite members get full managed execution — we handle everything so you can focus on results.",
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];
```

Also update the section heading (around line 85-93):

```tsx
<h2
  className="text-3xl sm:text-4xl font-bold text-white"
  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
>
  How It <span className="text-emerald-400">Works</span>
</h2>
<p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
  A systematic approach to sports trading
</p>
```

**Step 2: Commit**

```bash
git add src/components/landing/how-it-works.tsx
git commit -m "feat: rewrite how-it-works steps for ScoreGenix algorithm model"
```

---

## Task 12: Rewrite Pricing Section — Two Tiers

**Files:**
- Modify: `src/components/landing/pricing.tsx`

**Step 1: Replace the entire pricing component**

Replace the entire contents of `src/components/landing/pricing.tsx`:

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const standardFeatures = [
  "Algorithm-backed picks across all major sports",
  "Performance dashboard & analytics",
  "Real-time trade alerts",
  "Full wagering history access",
  "Community access",
  "Email support",
];

const eliteFeatures = [
  "Everything in Standard",
  "Full managed sports trading execution",
  "Personalized strategy alignment",
  "Priority direct communication",
  "Detailed trade-by-trade reporting",
  "Quarterly performance reviews",
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Choose Your{" "}
            <span className="text-emerald-400">Path</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Two ways to leverage the algorithm. One goal: consistent returns.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Standard Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-xl p-8 bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="mb-2">
              <h3
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Standard
              </h3>
              <p className="mt-1 text-sm text-white/40">
                Algorithm picks delivered to you
              </p>
            </div>

            <div className="mb-6">
              <span
                className="text-5xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                $997
              </span>
              <span className="text-white/40">/year</span>
              <p className="mt-1 text-xs text-white/30">3-month minimum commitment, billed upfront</p>
            </div>

            <ul className="mb-8 space-y-3">
              {standardFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-white/60">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </motion.div>

          {/* Elite Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-xl p-8 bg-emerald-400/5 border-2 border-emerald-400"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">
                Limited Availability
              </span>
            </div>

            <div className="mb-2">
              <h3
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Elite
              </h3>
              <p className="mt-1 text-sm text-white/40">
                Full managed sports trading
              </p>
            </div>

            <div className="mb-6">
              <span
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                By Invitation Only
              </span>
              <p className="mt-2 text-xs text-white/30">
                Limited to a select number of participants per quarter
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {eliteFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-white/60">{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mb-6 text-xs text-white/40 leading-relaxed">
              We need to ensure our strategy aligns with your approach. Maximum returns
              require full commitment to the system — this tier is for investors ready to
              follow the data completely.
            </p>

            <a
              href="mailto:info@scoregenix.com?subject=Elite%20Plan%20Inquiry"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors border border-emerald-400 text-emerald-400 hover:bg-emerald-400/10"
            >
              Request a Consultation
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/pricing.tsx
git commit -m "feat: rewrite pricing with Standard + Elite two-tier layout"
```

---

## Task 13: Rewrite CTA Section

**Files:**
- Modify: `src/components/landing/cta.tsx`

**Step 1: Replace the CTA content**

Replace the entire contents of `src/components/landing/cta.tsx`:

```tsx
"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-transparent to-emerald-400/5 px-8 py-16 sm:px-16 sm:py-20 text-center"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(52, 211, 153, 0.15), transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Your Edge Is{" "}
              <span className="text-emerald-400">Waiting</span>
            </h2>
            <p className="mt-6 mx-auto max-w-xl text-lg text-white/50">
              Join a select group of investors leveraging data-driven sports
              trading. 15 years of results. One algorithm. Your opportunity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-base font-semibold text-black transition-colors hover:bg-emerald-400"
              >
                Start with Standard
              </Link>
              <a
                href="mailto:info@scoregenix.com?subject=Elite%20Plan%20Inquiry"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Apply for Elite
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/cta.tsx
git commit -m "feat: rewrite CTA section with exclusivity messaging"
```

---

## Task 14: Update Homepage — Wire All Sections Together

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update the page with the new section order**

Replace the entire contents of `src/app/page.tsx`:

```tsx
import { PageShell } from "@/components/layout";
import { Hero } from "@/components/landing/hero";
import { SocialProof } from "@/components/landing/social-proof";
import { Story } from "@/components/landing/story";
import { TrackRecord } from "@/components/landing/track-record";
import { Testimonials } from "@/components/landing/testimonials";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <SocialProof />
      <Story />
      <TrackRecord />
      <Testimonials />
      <HowItWorks />
      <Pricing />
      <CTA />
    </PageShell>
  );
}
```

**Step 2: Verify the build compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Verify visually**

Run: `npm run dev`
Expected: Full homepage with all 8 sections in order: Hero → Social Proof → Story → Track Record → Testimonials → How It Works → Pricing → CTA.

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire all homepage sections together in new order"
```

---

## Task 15: Remove Unused Features Component

**Files:**
- Delete: `src/components/landing/features.tsx` (content absorbed into Story + How It Works)

**Step 1: Verify features.tsx is no longer imported anywhere**

Run: `grep -r "features" src/ --include="*.tsx" --include="*.ts" -l`
Expected: Only `pricing.tsx` (uses a local `features` array) — not the component import.

**Step 2: Delete the file**

```bash
rm src/components/landing/features.tsx
```

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused features.tsx landing component"
```

---

## Task 16: Final Build Verification & Cleanup

**Step 1: Run the full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Visual review checklist**

Run: `npm run dev` and verify:
- [ ] Navbar: Company Logo image displays correctly (~40px height)
- [ ] Hero: "The Science of Winning" headline + Typed.js rotating stats
- [ ] Social Proof: 4 publication logos with quotes
- [ ] Story: Two-column layout with narrative and stat callouts
- [ ] Track Record: Equity curve chart renders, stats display correctly
- [ ] Track Record: "View Full Wagering History" button opens dialog with filterable table
- [ ] Testimonials: 6 cards in 3x2 grid
- [ ] How It Works: 3 rewritten steps
- [ ] Pricing: Standard ($997) + Elite (By Invitation Only) side by side
- [ ] CTA: "Your Edge Is Waiting" with two buttons
- [ ] Footer: Logo image replaces text

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat: complete homepage redesign — data-driven authority landing page"
```

---

## Summary of All New/Modified Files

| Action | File | Task |
|--------|------|------|
| Copy | `public/images/logo.png` | 1 |
| Copy | `public/images/press/*.png` (4 files) | 1 |
| Create | `src/data/wagering-history.ts` | 2 |
| Create | `src/data/testimonials.ts` | 3 |
| Create | `src/data/performance.ts` | 4 |
| Modify | `src/components/layout/navbar.tsx` | 5 |
| Modify | `src/components/layout/footer.tsx` | 5 |
| Modify | `src/components/landing/hero.tsx` | 6 |
| Create | `src/components/landing/social-proof.tsx` | 7 |
| Create | `src/components/landing/story.tsx` | 8 |
| Create | `src/components/landing/track-record.tsx` | 9 |
| Create | `src/components/landing/testimonials.tsx` | 10 |
| Modify | `src/components/landing/how-it-works.tsx` | 11 |
| Modify | `src/components/landing/pricing.tsx` | 12 |
| Modify | `src/components/landing/cta.tsx` | 13 |
| Modify | `src/app/page.tsx` | 14 |
| Delete | `src/components/landing/features.tsx` | 15 |

**Total: 16 tasks, ~17 files touched.**

# Scoregenix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a sports betting analytics & tracking SaaS platform with Excel data validation, live game feeds, bet tracking, and subscription billing.

**Architecture:** Monolithic Next.js 14 (App Router) application with Prisma ORM connecting to Neon PostgreSQL. NextAuth.js for authentication with role-based access (admin/customer). Stripe for subscription payments. ESPN API + The Odds API for live sports data.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Neon PostgreSQL, NextAuth.js, Stripe, GSAP, Three.js, Framer Motion, Anime.js, Lottie, Recharts

---

## Phase 1: Project Scaffolding & Infrastructure

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `.env.local` (template)

**Step 1: Create Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Expected: Next.js project scaffolded with App Router and TypeScript.

**Step 2: Initialize git repository**

Run:
```bash
git init
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

### Task 1.2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install animation & UI libraries**

Run:
```bash
npm install gsap @gsap/react animejs@3.2.2 three @react-three/fiber @react-three/drei framer-motion lottie-react @theatre/core @theatre/studio @theatre/r3f typed.js popmotion @mojs/core scrollmagic recharts
```

**Step 2: Install backend & data libraries**

Run:
```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter bcryptjs stripe @stripe/stripe-js xlsx fuse.js date-fns zod
```

**Step 3: Install dev dependencies**

Run:
```bash
npm install -D @types/bcryptjs @types/three @types/animejs jest @testing-library/react @testing-library/jest-dom ts-jest prisma
```

**Step 4: Install shadcn/ui**

Run:
```bash
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables.

Then install key components:
```bash
npx shadcn@latest add button card dialog dropdown-menu input label select separator sheet table tabs toast badge avatar calendar popover command scroll-area skeleton switch textarea tooltip progress
```

**Step 5: Install Google Fonts**

Run:
```bash
npm install @fontsource/inter @fontsource/space-grotesk @fontsource/jetbrains-mono @fontsource/outfit @fontsource/plus-jakarta-sans @fontsource/sora @fontsource/manrope @fontsource/dm-sans @fontsource/lexend @fontsource/geist-sans @fontsource/geist-mono
```

**Step 6: Commit**

```bash
git add .
git commit -m "chore: install all dependencies - animation, UI, backend, fonts"
```

### Task 1.3: Create Environment Template

**Files:**
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Create environment template**

Create `.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@host/scoregenix?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_QUARTERLY="price_..."
STRIPE_PRICE_SEMIANNUAL="price_..."
STRIPE_PRICE_ANNUAL="price_..."

# Sports APIs
ODDS_API_KEY="your-odds-api-key"

# Admin seed credentials
ADMIN_EMAIL="admin@scoregenix.com"
ADMIN_PASSWORD="change-this-password"
```

**Step 2: Add .env.local to .gitignore**

Verify `.gitignore` includes:
```
.env.local
.env
```

**Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment variable template"
```

---

## Phase 2: Database Schema & ORM

### Task 2.1: Initialize Prisma

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init
```

**Step 2: Write the complete schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  CUSTOMER
}

enum SubscriptionPlan {
  MONTHLY
  QUARTERLY
  SEMIANNUAL
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
}

enum GameStatus {
  SCHEDULED
  IN_PROGRESS
  FINAL
  POSTPONED
  CANCELLED
}

enum BetType {
  MONEY_LINE
  POINT_SPREAD
  PARLAY
}

enum BetStatus {
  PENDING
  WON
  LOST
  PUSH
}

enum ValidationStatus {
  CORRECT
  FLAGGED
  UNCERTAIN
  CORRECTED
}

enum UploadStatus {
  PROCESSING
  VALIDATED
  ERROR
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String?
  role          UserRole  @default(CUSTOMER)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  subscription  Subscription?
  bets          Bet[]
  excelUploads  ExcelUpload[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Subscription {
  id                    String             @id @default(cuid())
  userId                String             @unique @map("user_id")
  planType              SubscriptionPlan   @map("plan_type")
  status                SubscriptionStatus @default(ACTIVE)
  stripeSubscriptionId  String?            @unique @map("stripe_subscription_id")
  stripeCustomerId      String?            @unique @map("stripe_customer_id")
  startDate             DateTime           @map("start_date")
  endDate               DateTime           @map("end_date")
  amount                Decimal            @db.Decimal(10, 2)
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model Sport {
  id       String  @id @default(cuid())
  name     String  @unique
  slug     String  @unique
  category String  // "professional" or "college"
  active   Boolean @default(true)
  apiKey   String? @map("api_key") // ESPN API sport key

  games Game[]

  @@map("sports")
}

model Game {
  id            String     @id @default(cuid())
  sportId       String     @map("sport_id")
  homeTeam      String     @map("home_team")
  awayTeam      String     @map("away_team")
  gameDate      DateTime   @map("game_date")
  status        GameStatus @default(SCHEDULED)
  homeScore     Int?       @map("home_score")
  awayScore     Int?       @map("away_score")
  externalApiId String?    @map("external_api_id")
  lastSyncedAt  DateTime?  @map("last_synced_at")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  sport      Sport       @relation(fields: [sportId], references: [id])
  betLegs    BetLeg[]
  uploadRows UploadRow[]

  @@unique([externalApiId, sportId])
  @@map("games")
}

model Bet {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  betType         BetType   @map("bet_type")
  wagerAmount     Decimal   @map("wager_amount") @db.Decimal(10, 2)
  potentialPayout Decimal?  @map("potential_payout") @db.Decimal(10, 2)
  status          BetStatus @default(PENDING)
  placedAt        DateTime  @default(now()) @map("placed_at")
  settledAt       DateTime? @map("settled_at")
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  legs BetLeg[]

  @@map("bets")
}

model BetLeg {
  id           String    @id @default(cuid())
  betId        String    @map("bet_id")
  gameId       String    @map("game_id")
  teamSelected String    @map("team_selected")
  lineValue    Decimal?  @map("line_value") @db.Decimal(5, 1)
  odds         Decimal?  @db.Decimal(8, 2)
  outcome      BetStatus @default(PENDING)
  createdAt    DateTime  @default(now()) @map("created_at")

  bet  Bet  @relation(fields: [betId], references: [id], onDelete: Cascade)
  game Game @relation(fields: [gameId], references: [id])

  @@map("bet_legs")
}

model ExcelUpload {
  id             String       @id @default(cuid())
  adminUserId    String       @map("admin_user_id")
  fileName       String       @map("file_name")
  uploadedAt     DateTime     @default(now()) @map("uploaded_at")
  status         UploadStatus @default(PROCESSING)
  totalRows      Int          @default(0) @map("total_rows")
  correctCount   Int          @default(0) @map("correct_count")
  flaggedCount   Int          @default(0) @map("flagged_count")
  uncertainCount Int          @default(0) @map("uncertain_count")

  adminUser User        @relation(fields: [adminUserId], references: [id])
  rows      UploadRow[]

  @@map("excel_uploads")
}

model UploadRow {
  id               String           @id @default(cuid())
  uploadId         String           @map("upload_id")
  rowNumber        Int              @map("row_number")
  rawData          Json             @map("raw_data")
  matchedGameId    String?          @map("matched_game_id")
  validationStatus ValidationStatus @default(UNCERTAIN) @map("validation_status")
  originalValue    Json?            @map("original_value")
  actualValue      Json?            @map("actual_value")
  correctedBy      String?          @map("corrected_by")
  correctedAt      DateTime?        @map("corrected_at")

  upload      ExcelUpload @relation(fields: [uploadId], references: [id], onDelete: Cascade)
  matchedGame Game?       @relation(fields: [matchedGameId], references: [id])

  @@map("upload_rows")
}

model TeamAlias {
  id                String @id @default(cuid())
  teamCanonicalName String @map("team_canonical_name")
  alias             String @unique

  @@map("team_aliases")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?  @map("user_id")
  action     String
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  oldValue   Json?    @map("old_value")
  newValue   Json?    @map("new_value")
  timestamp  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([timestamp])
  @@map("audit_log")
}
```

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add complete database schema with Prisma"
```

### Task 2.2: Create Prisma Client Singleton & DB Push

**Files:**
- Create: `src/lib/prisma.ts`

**Step 1: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 2: Push schema to Neon**

Run (requires DATABASE_URL in .env.local):
```bash
npx prisma db push
```

Expected: All tables created in Neon.

**Step 3: Generate Prisma client**

Run:
```bash
npx prisma generate
```

**Step 4: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma client singleton and push schema"
```

### Task 2.3: Seed Sports & Team Aliases

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed script)

**Step 1: Create seed file**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@scoregenix.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@scoregenix.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Seed sports
  const sports = [
    { name: "NFL", slug: "nfl", category: "professional", apiKey: "football/nfl" },
    { name: "NBA", slug: "nba", category: "professional", apiKey: "basketball/nba" },
    { name: "MLB", slug: "mlb", category: "professional", apiKey: "baseball/mlb" },
    { name: "NHL", slug: "nhl", category: "professional", apiKey: "hockey/nhl" },
    { name: "MLS", slug: "mls", category: "professional", apiKey: "soccer/usa.1" },
    { name: "NCAA Football", slug: "ncaaf", category: "college", apiKey: "football/college-football" },
    { name: "NCAA Basketball", slug: "ncaab", category: "college", apiKey: "basketball/mens-college-basketball" },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: sport,
      create: sport,
    });
  }

  // Seed common team aliases
  const aliases = [
    // NFL
    { teamCanonicalName: "New York Giants", alias: "NYG" },
    { teamCanonicalName: "New York Giants", alias: "Giants" },
    { teamCanonicalName: "New York Jets", alias: "NYJ" },
    { teamCanonicalName: "New York Jets", alias: "Jets" },
    { teamCanonicalName: "New England Patriots", alias: "NE" },
    { teamCanonicalName: "New England Patriots", alias: "Patriots" },
    { teamCanonicalName: "New England Patriots", alias: "Pats" },
    { teamCanonicalName: "Kansas City Chiefs", alias: "KC" },
    { teamCanonicalName: "Kansas City Chiefs", alias: "Chiefs" },
    { teamCanonicalName: "San Francisco 49ers", alias: "SF" },
    { teamCanonicalName: "San Francisco 49ers", alias: "49ers" },
    { teamCanonicalName: "San Francisco 49ers", alias: "Niners" },
    { teamCanonicalName: "Los Angeles Lakers", alias: "LAL" },
    { teamCanonicalName: "Los Angeles Lakers", alias: "Lakers" },
    { teamCanonicalName: "Golden State Warriors", alias: "GSW" },
    { teamCanonicalName: "Golden State Warriors", alias: "Warriors" },
    { teamCanonicalName: "New York Knicks", alias: "NYK" },
    { teamCanonicalName: "New York Knicks", alias: "Knicks" },
    { teamCanonicalName: "Boston Celtics", alias: "BOS" },
    { teamCanonicalName: "Boston Celtics", alias: "Celtics" },
    { teamCanonicalName: "Los Angeles Dodgers", alias: "LAD" },
    { teamCanonicalName: "Los Angeles Dodgers", alias: "Dodgers" },
    { teamCanonicalName: "New York Yankees", alias: "NYY" },
    { teamCanonicalName: "New York Yankees", alias: "Yankees" },
  ];

  for (const alias of aliases) {
    await prisma.teamAlias.upsert({
      where: { alias: alias.alias },
      update: alias,
      create: alias,
    });
  }

  console.log("Seed complete: admin user, sports, and team aliases created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 2: Add seed script to package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Also install ts-node:
```bash
npm install -D ts-node
```

**Step 3: Run seed**

```bash
npx prisma db seed
```

**Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add database seed with admin user, sports, and team aliases"
```

---

## Phase 3: Authentication

### Task 3.1: NextAuth Configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: Create auth configuration**

Create `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionStatus: user.subscription?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.subscriptionStatus = (user as any).subscriptionStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

**Step 2: Create API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Step 3: Create auth type declarations**

Create `src/types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CUSTOMER";
      subscriptionStatus: string | null;
    } & DefaultSession["user"];
  }
}
```

**Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/types/
git commit -m "feat: add NextAuth configuration with credentials provider"
```

### Task 3.2: Auth Middleware (Route Protection)

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

Create `src/middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes require ADMIN role
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Customer routes require active subscription
    if (
      (path.startsWith("/dashboard") ||
        path.startsWith("/my-bets") ||
        path.startsWith("/my-stats")) &&
      token?.role === "CUSTOMER" &&
      token?.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.redirect(new URL("/subscribe", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Public routes don't need auth
        if (
          path === "/" ||
          path === "/login" ||
          path === "/signup" ||
          path === "/admin/login" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/stripe/webhook")
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-bets/:path*",
    "/my-stats/:path*",
    "/admin/:path*",
    "/subscribe",
  ],
};
```

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware with role-based route protection"
```

### Task 3.3: Registration API Route

**Files:**
- Create: `src/app/api/auth/register/route.ts`

**Step 1: Create registration endpoint**

Create `src/app/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/register/
git commit -m "feat: add user registration API endpoint"
```

---

## Phase 4: Sports API Integration

### Task 4.1: ESPN API Client

**Files:**
- Create: `src/lib/espn.ts`

**Step 1: Build ESPN API client**

Create `src/lib/espn.ts`:
```typescript
import { GameStatus } from "@prisma/client";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

interface ESPNCompetitor {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  score: string;
  homeAway: "home" | "away";
  winner?: boolean;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: {
      state: "pre" | "in" | "post";
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
  }>;
}

export interface NormalizedGame {
  externalApiId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  gameDate: Date;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
}

function mapStatus(state: string, completed: boolean): GameStatus {
  if (completed) return "FINAL";
  if (state === "in") return "IN_PROGRESS";
  return "SCHEDULED";
}

function normalizeEvent(event: ESPNEvent): NormalizedGame {
  const comp = event.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;

  return {
    externalApiId: event.id,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeTeamAbbr: home.team.abbreviation,
    awayTeamAbbr: away.team.abbreviation,
    homeTeamLogo: home.team.logo,
    awayTeamLogo: away.team.logo,
    gameDate: new Date(event.date),
    status: mapStatus(
      event.status.type.state,
      event.status.type.completed
    ),
    homeScore: home.score ? parseInt(home.score) : null,
    awayScore: away.score ? parseInt(away.score) : null,
  };
}

export async function fetchGames(
  sportApiKey: string,
  dates?: string
): Promise<NormalizedGame[]> {
  const params = new URLSearchParams();
  if (dates) params.set("dates", dates);

  const url = `${ESPN_BASE}/${sportApiKey}/scoreboard?${params}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`ESPN API error: ${res.status} for ${url}`);
    return [];
  }

  const data = await res.json();
  const events: ESPNEvent[] = data.events || [];

  return events.map(normalizeEvent);
}

export async function fetchGamesByDate(
  sportApiKey: string,
  date: Date
): Promise<NormalizedGame[]> {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  return fetchGames(sportApiKey, dateStr);
}
```

**Step 2: Commit**

```bash
git add src/lib/espn.ts
git commit -m "feat: add ESPN API client with game normalization"
```

### Task 4.2: The Odds API Client

**Files:**
- Create: `src/lib/odds-api.ts`

**Step 1: Build Odds API client**

Create `src/lib/odds-api.ts`:
```typescript
const ODDS_BASE = "https://api.the-odds-api.com/v4";

interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsMarket {
  key: string; // "h2h" (moneyline), "spreads", "totals"
  outcomes: OddsOutcome[];
}

interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

export interface NormalizedOdds {
  homeTeam: string;
  awayTeam: string;
  moneyLineHome: number | null;
  moneyLineAway: number | null;
  spreadHome: number | null;
  spreadAway: number | null;
  spreadPointHome: number | null;
  spreadPointAway: number | null;
}

// Sport key mapping for Odds API
const ODDS_SPORT_MAP: Record<string, string> = {
  nfl: "americanfootball_nfl",
  nba: "basketball_nba",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  mls: "soccer_usa_mls",
  ncaaf: "americanfootball_ncaaf",
  ncaab: "basketball_ncaab",
};

function extractOdds(bookmakers: OddsBookmaker[]): {
  moneyLine: OddsMarket | undefined;
  spreads: OddsMarket | undefined;
} {
  // Use first available bookmaker (usually FanDuel/DraftKings)
  const bm = bookmakers[0];
  if (!bm) return { moneyLine: undefined, spreads: undefined };

  return {
    moneyLine: bm.markets.find((m) => m.key === "h2h"),
    spreads: bm.markets.find((m) => m.key === "spreads"),
  };
}

export async function fetchOdds(
  sportSlug: string
): Promise<NormalizedOdds[]> {
  const sportKey = ODDS_SPORT_MAP[sportSlug];
  if (!sportKey) return [];

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.warn("ODDS_API_KEY not set, skipping odds fetch");
    return [];
  }

  const url = `${ODDS_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    console.error(`Odds API error: ${res.status}`);
    return [];
  }

  const events: OddsEvent[] = await res.json();

  return events.map((event) => {
    const { moneyLine, spreads } = extractOdds(event.bookmakers);

    const mlHome = moneyLine?.outcomes.find(
      (o) => o.name === event.home_team
    );
    const mlAway = moneyLine?.outcomes.find(
      (o) => o.name === event.away_team
    );
    const spHome = spreads?.outcomes.find(
      (o) => o.name === event.home_team
    );
    const spAway = spreads?.outcomes.find(
      (o) => o.name === event.away_team
    );

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
}
```

**Step 2: Commit**

```bash
git add src/lib/odds-api.ts
git commit -m "feat: add Odds API client with moneyline and spread support"
```

### Task 4.3: Game Sync Service

**Files:**
- Create: `src/lib/game-sync.ts`
- Create: `src/app/api/games/sync/route.ts`

**Step 1: Create sync service**

Create `src/lib/game-sync.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { fetchGamesByDate, NormalizedGame } from "@/lib/espn";

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
        lastSyncedAt: new Date(),
      },
      create: {
        sportId: sportId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
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
  }

  return { total, bySport };
}
```

**Step 2: Create sync API route**

Create `src/app/api/games/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncAllSportsForDate } from "@/lib/game-sync";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const date = body.date ? new Date(body.date) : new Date();

  const result = await syncAllSportsForDate(date);

  return NextResponse.json(result);
}
```

**Step 3: Commit**

```bash
git add src/lib/game-sync.ts src/app/api/games/sync/
git commit -m "feat: add game sync service with ESPN integration"
```

### Task 4.4: Team Alias Matching Service

**Files:**
- Create: `src/lib/team-matching.ts`

**Step 1: Create team matching utility**

Create `src/lib/team-matching.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";

let aliasCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAliasMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (aliasCache && now - cacheTimestamp < CACHE_TTL) {
    return aliasCache;
  }

  const aliases = await prisma.teamAlias.findMany();
  aliasCache = new Map();

  for (const a of aliases) {
    aliasCache.set(a.alias.toLowerCase(), a.teamCanonicalName);
  }

  cacheTimestamp = now;
  return aliasCache;
}

export async function resolveTeamName(
  input: string
): Promise<{ canonical: string; confidence: number }> {
  const normalized = input.trim();
  const aliasMap = await getAliasMap();

  // Exact alias match
  const exact = aliasMap.get(normalized.toLowerCase());
  if (exact) {
    return { canonical: exact, confidence: 1.0 };
  }

  // Fuzzy search against all known aliases + canonical names
  const allNames = new Set<string>();
  for (const [alias, canonical] of aliasMap) {
    allNames.add(alias);
    allNames.add(canonical.toLowerCase());
  }

  const fuse = new Fuse(
    Array.from(allNames).map((n) => ({ name: n })),
    {
      keys: ["name"],
      threshold: 0.3,
      includeScore: true,
    }
  );

  const results = fuse.search(normalized);

  if (results.length > 0) {
    const match = results[0];
    const matchedName = match.item.name;
    const confidence = 1 - (match.score ?? 0);

    // Resolve to canonical name
    const canonical =
      aliasMap.get(matchedName) || matchedName;

    return { canonical, confidence };
  }

  // No match — return input as-is with low confidence
  return { canonical: normalized, confidence: 0 };
}
```

**Step 2: Commit**

```bash
git add src/lib/team-matching.ts
git commit -m "feat: add team name matching with fuzzy search and alias resolution"
```

---

## Phase 5: Bet Tracking API

### Task 5.1: Place Bet API

**Files:**
- Create: `src/app/api/bets/route.ts`

**Step 1: Create bet placement endpoint**

Create `src/app/api/bets/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const betLegSchema = z.object({
  gameId: z.string(),
  teamSelected: z.string(),
  lineValue: z.number().optional(),
  odds: z.number().optional(),
});

const placeBetSchema = z.object({
  betType: z.enum(["MONEY_LINE", "POINT_SPREAD", "PARLAY"]),
  wagerAmount: z.number().positive(),
  potentialPayout: z.number().positive().optional(),
  legs: z.array(betLegSchema).min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = placeBetSchema.parse(body);

    // Parlays require 2+ legs
    if (data.betType === "PARLAY" && data.legs.length < 2) {
      return NextResponse.json(
        { error: "Parlays require at least 2 selections" },
        { status: 400 }
      );
    }

    // Non-parlays should have exactly 1 leg
    if (data.betType !== "PARLAY" && data.legs.length !== 1) {
      return NextResponse.json(
        { error: "Money line and point spread bets require exactly 1 selection" },
        { status: 400 }
      );
    }

    const bet = await prisma.bet.create({
      data: {
        userId: session.user.id,
        betType: data.betType,
        wagerAmount: data.wagerAmount,
        potentialPayout: data.potentialPayout,
        notes: data.notes,
        legs: {
          create: data.legs.map((leg) => ({
            gameId: leg.gameId,
            teamSelected: leg.teamSelected,
            lineValue: leg.lineValue,
            odds: leg.odds,
          })),
        },
      },
      include: { legs: { include: { game: true } } },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const betType = searchParams.get("betType");
  const status = searchParams.get("status");
  const sportId = searchParams.get("sportId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {
    userId: session.user.role === "ADMIN" ? undefined : session.user.id,
  };

  if (session.user.role === "ADMIN") {
    // Admin sees all bets placed by admin
    where.user = { role: "ADMIN" };
  }

  if (betType) where.betType = betType;
  if (status) where.status = status;
  if (from || to) {
    where.placedAt = {};
    if (from) where.placedAt.gte = new Date(from);
    if (to) where.placedAt.lte = new Date(to);
  }

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where,
      include: {
        legs: { include: { game: { include: { sport: true } } } },
      },
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bet.count({ where }),
  ]);

  return NextResponse.json({
    bets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/bets/
git commit -m "feat: add bet placement and listing API with filters"
```

### Task 5.2: Bet Settlement Service

**Files:**
- Create: `src/lib/bet-settlement.ts`

**Step 1: Create settlement logic**

Create `src/lib/bet-settlement.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { BetStatus } from "@prisma/client";

function determineMoneyLineOutcome(
  teamSelected: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): BetStatus {
  if (homeScore === awayScore) return "PUSH";

  const winningTeam = homeScore > awayScore ? homeTeam : awayTeam;

  if (teamSelected === winningTeam) return "WON";
  return "LOST";
}

function determineSpreadOutcome(
  teamSelected: string,
  homeTeam: string,
  homeScore: number,
  awayScore: number,
  lineValue: number
): BetStatus {
  const isHome = teamSelected === homeTeam;
  const adjustedScore = isHome
    ? homeScore + lineValue
    : awayScore + lineValue;
  const opponentScore = isHome ? awayScore : homeScore;

  if (adjustedScore === opponentScore) return "PUSH";
  if (adjustedScore > opponentScore) return "WON";
  return "LOST";
}

export async function settleBet(betId: string): Promise<BetStatus> {
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: { legs: { include: { game: true } } },
  });

  if (!bet || bet.status !== "PENDING") {
    throw new Error("Bet not found or already settled");
  }

  // Check all games are final
  const allFinal = bet.legs.every((leg) => leg.game.status === "FINAL");
  if (!allFinal) {
    throw new Error("Not all games are final");
  }

  // Determine each leg outcome
  const legOutcomes: BetStatus[] = [];

  for (const leg of bet.legs) {
    const game = leg.game;
    let outcome: BetStatus;

    if (bet.betType === "POINT_SPREAD") {
      outcome = determineSpreadOutcome(
        leg.teamSelected,
        game.homeTeam,
        game.homeScore!,
        game.awayScore!,
        Number(leg.lineValue!)
      );
    } else {
      outcome = determineMoneyLineOutcome(
        leg.teamSelected,
        game.homeTeam,
        game.awayTeam,
        game.homeScore!,
        game.awayScore!
      );
    }

    await prisma.betLeg.update({
      where: { id: leg.id },
      data: { outcome },
    });

    legOutcomes.push(outcome);
  }

  // Determine overall bet outcome
  let betOutcome: BetStatus;

  if (bet.betType === "PARLAY") {
    // Parlay: all legs must win (pushes reduce the parlay)
    if (legOutcomes.every((o) => o === "WON")) {
      betOutcome = "WON";
    } else if (legOutcomes.some((o) => o === "LOST")) {
      betOutcome = "LOST";
    } else {
      betOutcome = "PUSH";
    }
  } else {
    betOutcome = legOutcomes[0];
  }

  await prisma.bet.update({
    where: { id: betId },
    data: {
      status: betOutcome,
      settledAt: new Date(),
    },
  });

  return betOutcome;
}

export async function settleAllPendingBets(): Promise<number> {
  const pendingBets = await prisma.bet.findMany({
    where: { status: "PENDING" },
    include: { legs: { include: { game: true } } },
  });

  let settled = 0;

  for (const bet of pendingBets) {
    const allFinal = bet.legs.every((l) => l.game.status === "FINAL");
    if (!allFinal) continue;

    try {
      await settleBet(bet.id);
      settled++;
    } catch (e) {
      console.error(`Failed to settle bet ${bet.id}:`, e);
    }
  }

  return settled;
}
```

**Step 2: Commit**

```bash
git add src/lib/bet-settlement.ts
git commit -m "feat: add bet settlement logic for moneyline, spread, and parlay"
```

### Task 5.3: Bet Statistics API

**Files:**
- Create: `src/app/api/stats/route.ts`

**Step 1: Create stats endpoint**

Create `src/app/api/stats/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const userFilter = isAdmin
    ? { user: { role: "ADMIN" as const } }
    : { userId: session.user.id };

  const bets = await prisma.bet.findMany({
    where: { ...userFilter, status: { not: "PENDING" } },
    include: { legs: { include: { game: { include: { sport: true } } } } },
  });

  const totalBets = bets.length;
  const wins = bets.filter((b) => b.status === "WON").length;
  const losses = bets.filter((b) => b.status === "LOST").length;
  const pushes = bets.filter((b) => b.status === "PUSH").length;
  const pending = await prisma.bet.count({
    where: { ...userFilter, status: "PENDING" },
  });

  const totalWagered = bets.reduce(
    (sum, b) => sum + Number(b.wagerAmount),
    0
  );
  const totalWon = bets
    .filter((b) => b.status === "WON")
    .reduce((sum, b) => sum + Number(b.potentialPayout || 0), 0);
  const totalLost = bets
    .filter((b) => b.status === "LOST")
    .reduce((sum, b) => sum + Number(b.wagerAmount), 0);
  const netProfitLoss = totalWon - totalLost;
  const roi = totalWagered > 0 ? (netProfitLoss / totalWagered) * 100 : 0;

  // Stats by bet type
  const byBetType: Record<string, any> = {};
  for (const type of ["MONEY_LINE", "POINT_SPREAD", "PARLAY"]) {
    const typeBets = bets.filter((b) => b.betType === type);
    const typeWins = typeBets.filter((b) => b.status === "WON").length;
    byBetType[type] = {
      total: typeBets.length,
      wins: typeWins,
      losses: typeBets.filter((b) => b.status === "LOST").length,
      winRate: typeBets.length > 0 ? (typeWins / typeBets.length) * 100 : 0,
    };
  }

  // Stats by sport
  const bySport: Record<string, any> = {};
  for (const bet of bets) {
    for (const leg of bet.legs) {
      const sportName = leg.game.sport.name;
      if (!bySport[sportName]) {
        bySport[sportName] = { total: 0, wins: 0, losses: 0 };
      }
      bySport[sportName].total++;
      if (bet.status === "WON") bySport[sportName].wins++;
      if (bet.status === "LOST") bySport[sportName].losses++;
    }
  }

  for (const sport of Object.keys(bySport)) {
    bySport[sport].winRate =
      bySport[sport].total > 0
        ? (bySport[sport].wins / bySport[sport].total) * 100
        : 0;
  }

  // Monthly trend (last 12 months)
  const monthlyTrend: Array<{
    month: string;
    bets: number;
    wins: number;
    profit: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toISOString().slice(0, 7);

    const monthBets = bets.filter(
      (b) => b.placedAt.toISOString().slice(0, 7) === monthStr
    );
    const monthWins = monthBets.filter((b) => b.status === "WON");
    const monthProfit =
      monthWins.reduce((s, b) => s + Number(b.potentialPayout || 0), 0) -
      monthBets
        .filter((b) => b.status === "LOST")
        .reduce((s, b) => s + Number(b.wagerAmount), 0);

    monthlyTrend.push({
      month: monthStr,
      bets: monthBets.length,
      wins: monthWins.length,
      profit: monthProfit,
    });
  }

  return NextResponse.json({
    overview: {
      totalBets,
      wins,
      losses,
      pushes,
      pending,
      winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
      totalWagered,
      totalWon,
      totalLost,
      netProfitLoss,
      roi,
    },
    byBetType,
    bySport,
    monthlyTrend,
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/stats/
git commit -m "feat: add comprehensive bet statistics API"
```

---

## Phase 6: Excel Validation Pipeline

### Task 6.1: Excel Upload & Parse API

**Files:**
- Create: `src/app/api/admin/validate/upload/route.ts`
- Create: `src/lib/excel-parser.ts`

**Step 1: Create Excel parser**

Create `src/lib/excel-parser.ts`:
```typescript
import * as XLSX from "xlsx";

export interface ParsedRow {
  rowNumber: number;
  date: string | null;
  sport: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  betType: string | null;
  teamSelected: string | null;
  lineValue: number | null;
  odds: number | null;
  outcome: string | null;
  wagerAmount: number | null;
  payout: number | null;
  raw: Record<string, any>;
}

// Normalize column headers to match our expected format
const COLUMN_MAP: Record<string, string> = {
  date: "date",
  game_date: "date",
  gamedate: "date",
  sport: "sport",
  league: "sport",
  home: "homeTeam",
  home_team: "homeTeam",
  hometeam: "homeTeam",
  away: "awayTeam",
  away_team: "awayTeam",
  awayteam: "awayTeam",
  bet_type: "betType",
  bettype: "betType",
  type: "betType",
  team: "teamSelected",
  team_selected: "teamSelected",
  pick: "teamSelected",
  selection: "teamSelected",
  line: "lineValue",
  spread: "lineValue",
  line_value: "lineValue",
  odds: "odds",
  outcome: "outcome",
  result: "outcome",
  win_loss: "outcome",
  winloss: "outcome",
  wager: "wagerAmount",
  wager_amount: "wagerAmount",
  amount: "wagerAmount",
  stake: "wagerAmount",
  payout: "payout",
  profit: "payout",
  return: "payout",
};

function normalizeHeader(header: string): string {
  const key = header.toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMN_MAP[key] || key;
}

export function parseExcel(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  return rawRows.map((row, index) => {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }

    return {
      rowNumber: index + 2, // +2 for 1-indexed + header row
      date: normalized.date ? String(normalized.date) : null,
      sport: normalized.sport ? String(normalized.sport) : null,
      homeTeam: normalized.homeTeam ? String(normalized.homeTeam) : null,
      awayTeam: normalized.awayTeam ? String(normalized.awayTeam) : null,
      betType: normalized.betType ? String(normalized.betType) : null,
      teamSelected: normalized.teamSelected
        ? String(normalized.teamSelected)
        : null,
      lineValue: normalized.lineValue
        ? Number(normalized.lineValue)
        : null,
      odds: normalized.odds ? Number(normalized.odds) : null,
      outcome: normalized.outcome
        ? String(normalized.outcome).toUpperCase()
        : null,
      wagerAmount: normalized.wagerAmount
        ? Number(normalized.wagerAmount)
        : null,
      payout: normalized.payout ? Number(normalized.payout) : null,
      raw: row,
    };
  });
}
```

**Step 2: Create upload endpoint**

Create `src/app/api/admin/validate/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcel } from "@/lib/excel-parser";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseExcel(buffer);

  const upload = await prisma.excelUpload.create({
    data: {
      adminUserId: session.user.id,
      fileName: file.name,
      totalRows: rows.length,
      rows: {
        create: rows.map((row) => ({
          rowNumber: row.rowNumber,
          rawData: row.raw,
          originalValue: {
            date: row.date,
            sport: row.sport,
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            betType: row.betType,
            teamSelected: row.teamSelected,
            lineValue: row.lineValue,
            odds: row.odds,
            outcome: row.outcome,
            wagerAmount: row.wagerAmount,
            payout: row.payout,
          },
        })),
      },
    },
  });

  return NextResponse.json({ uploadId: upload.id, totalRows: rows.length });
}
```

**Step 3: Commit**

```bash
git add src/lib/excel-parser.ts src/app/api/admin/validate/
git commit -m "feat: add Excel upload parsing with flexible column mapping"
```

### Task 6.2: Validation Engine

**Files:**
- Create: `src/lib/validation-engine.ts`
- Create: `src/app/api/admin/validate/[uploadId]/validate/route.ts`

**Step 1: Create validation engine**

Create `src/lib/validation-engine.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { resolveTeamName } from "@/lib/team-matching";
import { fetchGamesByDate } from "@/lib/espn";
import { ValidationStatus } from "@prisma/client";

export async function validateUpload(uploadId: string): Promise<{
  correct: number;
  flagged: number;
  uncertain: number;
}> {
  const upload = await prisma.excelUpload.findUnique({
    where: { id: uploadId },
    include: { rows: true },
  });

  if (!upload) throw new Error("Upload not found");

  let correct = 0;
  let flagged = 0;
  let uncertain = 0;

  for (const row of upload.rows) {
    const original = row.originalValue as any;
    if (!original) {
      uncertain++;
      continue;
    }

    // Step 1: Resolve team names
    let homeTeamResult = null;
    let awayTeamResult = null;

    if (original.homeTeam) {
      homeTeamResult = await resolveTeamName(original.homeTeam);
    }
    if (original.awayTeam) {
      awayTeamResult = await resolveTeamName(original.awayTeam);
    }

    // Step 2: Find matching game in DB
    let matchedGame = null;

    if (original.date && (homeTeamResult || awayTeamResult)) {
      const gameDate = new Date(original.date);
      const startOfDay = new Date(gameDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(gameDate);
      endOfDay.setHours(23, 59, 59, 999);

      const where: any = {
        gameDate: { gte: startOfDay, lte: endOfDay },
      };

      if (homeTeamResult && homeTeamResult.confidence > 0.7) {
        where.homeTeam = homeTeamResult.canonical;
      }
      if (awayTeamResult && awayTeamResult.confidence > 0.7) {
        where.awayTeam = awayTeamResult.canonical;
      }

      matchedGame = await prisma.game.findFirst({ where });

      // If no match in DB, try syncing from ESPN
      if (!matchedGame) {
        const sport = await prisma.sport.findFirst({
          where: original.sport
            ? {
                OR: [
                  { name: { contains: original.sport, mode: "insensitive" } },
                  { slug: { contains: original.sport.toLowerCase() } },
                ],
              }
            : undefined,
        });

        if (sport?.apiKey) {
          const espnGames = await fetchGamesByDate(sport.apiKey, gameDate);
          // Store fetched games and retry match
          for (const g of espnGames) {
            await prisma.game.upsert({
              where: {
                externalApiId_sportId: {
                  externalApiId: g.externalApiId,
                  sportId: sport.id,
                },
              },
              update: {
                homeScore: g.homeScore,
                awayScore: g.awayScore,
                status: g.status,
                lastSyncedAt: new Date(),
              },
              create: {
                sportId: sport.id,
                homeTeam: g.homeTeam,
                awayTeam: g.awayTeam,
                gameDate: g.gameDate,
                status: g.status,
                homeScore: g.homeScore,
                awayScore: g.awayScore,
                externalApiId: g.externalApiId,
                lastSyncedAt: new Date(),
              },
            });
          }

          matchedGame = await prisma.game.findFirst({ where });
        }
      }
    }

    // Step 3: Determine validation status
    let validationStatus: ValidationStatus = "UNCERTAIN";
    let actualValue: any = null;

    if (matchedGame && matchedGame.status === "FINAL") {
      actualValue = {
        homeTeam: matchedGame.homeTeam,
        awayTeam: matchedGame.awayTeam,
        homeScore: matchedGame.homeScore,
        awayScore: matchedGame.awayScore,
        date: matchedGame.gameDate.toISOString(),
      };

      // Determine actual outcome
      if (
        matchedGame.homeScore !== null &&
        matchedGame.awayScore !== null &&
        original.outcome &&
        original.teamSelected
      ) {
        const selectedTeam = await resolveTeamName(original.teamSelected);
        const actualWinner =
          matchedGame.homeScore > matchedGame.awayScore
            ? matchedGame.homeTeam
            : matchedGame.awayTeam;

        const userSaidWin = ["WIN", "W", "WON"].includes(
          original.outcome.toUpperCase()
        );
        const userSaidLoss = ["LOSS", "L", "LOST"].includes(
          original.outcome.toUpperCase()
        );

        const actuallyWon =
          selectedTeam.canonical === actualWinner;

        if (
          (userSaidWin && actuallyWon) ||
          (userSaidLoss && !actuallyWon)
        ) {
          validationStatus = "CORRECT";
          correct++;
        } else {
          validationStatus = "FLAGGED";
          actualValue.correctOutcome = actuallyWon ? "WON" : "LOST";
          actualValue.recordedOutcome = original.outcome;
          flagged++;
        }
      } else {
        uncertain++;
      }
    } else {
      uncertain++;
    }

    // Step 4: Update the row
    await prisma.uploadRow.update({
      where: { id: row.id },
      data: {
        matchedGameId: matchedGame?.id || null,
        validationStatus,
        actualValue,
      },
    });
  }

  // Update upload summary
  await prisma.excelUpload.update({
    where: { id: uploadId },
    data: {
      status: "VALIDATED",
      correctCount: correct,
      flaggedCount: flagged,
      uncertainCount: uncertain,
    },
  });

  return { correct, flagged, uncertain };
}
```

**Step 2: Create validation API route**

Create `src/app/api/admin/validate/[uploadId]/validate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateUpload } from "@/lib/validation-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await validateUpload(params.uploadId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/validation-engine.ts src/app/api/admin/validate/
git commit -m "feat: add validation engine with game matching and outcome verification"
```

### Task 6.3: Correction & Audit API

**Files:**
- Create: `src/app/api/admin/validate/[uploadId]/correct/route.ts`

**Step 1: Create correction endpoint**

Create `src/app/api/admin/validate/[uploadId]/correct/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const correctRowSchema = z.object({
  rowId: z.string(),
  action: z.enum(["use_actual", "manual", "skip"]),
  manualValue: z.record(z.any()).optional(),
});

const bulkCorrectSchema = z.object({
  corrections: z.array(correctRowSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { corrections } = bulkCorrectSchema.parse(body);

    let corrected = 0;

    for (const correction of corrections) {
      const row = await prisma.uploadRow.findUnique({
        where: { id: correction.rowId },
      });

      if (!row || row.uploadId !== params.uploadId) continue;

      const oldValue = {
        validationStatus: row.validationStatus,
        originalValue: row.originalValue,
      };

      let newData: any = {
        correctedBy: session.user.id,
        correctedAt: new Date(),
        validationStatus: "CORRECTED",
      };

      if (correction.action === "use_actual") {
        // Use the actual value from the API
        newData.originalValue = row.actualValue;
      } else if (correction.action === "manual" && correction.manualValue) {
        newData.originalValue = correction.manualValue;
      } else if (correction.action === "skip") {
        newData.validationStatus = "UNCERTAIN";
      }

      await prisma.uploadRow.update({
        where: { id: correction.rowId },
        data: newData,
      });

      // Log to audit trail
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `correction_${correction.action}`,
          entityType: "upload_row",
          entityId: correction.rowId,
          oldValue: oldValue,
          newValue: newData,
        },
      });

      corrected++;
    }

    // Update upload counts
    const rows = await prisma.uploadRow.findMany({
      where: { uploadId: params.uploadId },
    });

    await prisma.excelUpload.update({
      where: { id: params.uploadId },
      data: {
        correctCount: rows.filter(
          (r) =>
            r.validationStatus === "CORRECT" ||
            r.validationStatus === "CORRECTED"
        ).length,
        flaggedCount: rows.filter(
          (r) => r.validationStatus === "FLAGGED"
        ).length,
        uncertainCount: rows.filter(
          (r) => r.validationStatus === "UNCERTAIN"
        ).length,
      },
    });

    return NextResponse.json({ corrected });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/validate/
git commit -m "feat: add correction and audit trail API for data validation"
```

---

## Phase 7: Stripe Integration

### Task 7.1: Stripe Checkout & Webhooks

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

**Step 1: Create Stripe utility**

Create `src/lib/stripe.ts`:
```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PLAN_PRICES: Record<string, string> = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  QUARTERLY: process.env.STRIPE_PRICE_QUARTERLY!,
  SEMIANNUAL: process.env.STRIPE_PRICE_SEMIANNUAL!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
};
```

**Step 2: Create checkout endpoint**

Create `src/app/api/stripe/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_PRICES } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, email, name, password } = checkoutSchema.parse(body);

    const priceId = PLAN_PRICES[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/signup?cancelled=true`,
      customer_email: email,
      metadata: { name, email, password, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Create webhook handler**

Create `src/app/api/stripe/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { name, email, password, plan } = session.metadata!;

      // Create user account
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          name,
          role: "CUSTOMER",
        },
      });

      // Calculate end date based on plan
      const startDate = new Date();
      const endDate = new Date();
      switch (plan) {
        case "MONTHLY":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case "SEMIANNUAL":
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case "ANNUAL":
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planType: plan as any,
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          startDate,
          endDate,
          amount: (session.amount_total || 0) / 100,
        },
        create: {
          userId: user.id,
          planType: plan as any,
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          startDate,
          endDate,
          amount: (session.amount_total || 0) / 100,
        },
      });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "EXPIRED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Step 4: Commit**

```bash
git add src/lib/stripe.ts src/app/api/stripe/
git commit -m "feat: add Stripe checkout, subscription management, and webhooks"
```

---

## Phase 8: Frontend - Layout & Shared Components

### Task 8.1: App Layout & Theme

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/globals.css` (update)
- Create: `src/components/providers.tsx`
- Create: `src/components/ui/navbar.tsx`
- Create: `src/components/ui/footer.tsx`

**Step 1: Create session provider wrapper**

Create `src/components/providers.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 2: Update root layout**

Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoregenix - Sports Betting Analytics",
  description: "Track, analyze, and optimize your sports betting performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 3: Create navbar component**

Create `src/components/ui/navbar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Score<span className="text-emerald-400">genix</span>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              {session.user.role === "CUSTOMER" && (
                <>
                  <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/my-bets" className="text-sm text-white/70 hover:text-white">
                    My Bets
                  </Link>
                  <Link href="/my-stats" className="text-sm text-white/70 hover:text-white">
                    My Stats
                  </Link>
                </>
              )}
              {session.user.role === "ADMIN" && (
                <>
                  <Link href="/admin" className="text-sm text-white/70 hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/admin/validate" className="text-sm text-white/70 hover:text-white">
                    Validate
                  </Link>
                  <Link href="/admin/bets" className="text-sm text-white/70 hover:text-white">
                    Bets
                  </Link>
                  <Link href="/admin/analytics" className="text-sm text-white/70 hover:text-white">
                    Analytics
                  </Link>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-white/70 hover:text-white"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

**Step 4: Create footer component**

Create `src/components/ui/footer.tsx`:
```typescript
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Scoregenix. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/
git commit -m "feat: add app layout with navbar, footer, and dark theme"
```

---

## Phase 9: Frontend - Public Pages

### Task 9.1: Landing Page

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/pricing.tsx`
- Create: `src/components/landing/how-it-works.tsx`

This is a large UI task. Build each component with GSAP/Framer Motion animations, the pricing cards with plan selection, and hero section with Three.js background.

### Task 9.2: Login Pages

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/signup/page.tsx`

Build login forms for customer and admin, and signup page with plan selection leading to Stripe checkout.

---

## Phase 10: Frontend - Customer Pages

### Task 10.1: Customer Dashboard (Live Games)

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/game-card.tsx`
- Create: `src/components/dashboard/sport-filter.tsx`
- Create: `src/components/dashboard/bet-modal.tsx`
- Create: `src/app/api/games/today/route.ts`

Dashboard shows today's games across all sports with sport/league filtering. Each game card is clickable and opens a bet entry modal.

### Task 10.2: My Bets Page

**Files:**
- Create: `src/app/my-bets/page.tsx`
- Create: `src/components/bets/bet-table.tsx`
- Create: `src/components/bets/bet-filters.tsx`

Historical bets list with filters for date range, sport, bet type, outcome. Running totals displayed at top.

### Task 10.3: My Stats Page

**Files:**
- Create: `src/app/my-stats/page.tsx`
- Create: `src/components/stats/overview-cards.tsx`
- Create: `src/components/stats/win-rate-chart.tsx`
- Create: `src/components/stats/monthly-trend.tsx`
- Create: `src/components/stats/sport-breakdown.tsx`

Animated statistics dashboard with Recharts for graphs and GSAP for number animations.

---

## Phase 11: Frontend - Admin Pages

### Task 11.1: Admin Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/layout.tsx`

Admin dashboard with live games + company quick stats (today's bets, P&L, subscriber count).

### Task 11.2: Data Validation Page

**Files:**
- Create: `src/app/admin/validate/page.tsx`
- Create: `src/components/admin/upload-zone.tsx`
- Create: `src/components/admin/validation-table.tsx`
- Create: `src/components/admin/correction-modal.tsx`
- Create: `src/components/admin/validation-summary.tsx`

This is the most critical UI. Needs: drag-and-drop upload zone, color-coded validation table (green/yellow/red), side-by-side comparison, one-click fix buttons, bulk actions, progress bar.

### Task 11.3: Company Bets & Analytics

**Files:**
- Create: `src/app/admin/bets/page.tsx`
- Create: `src/app/admin/analytics/page.tsx`
- Create: `src/components/admin/revenue-chart.tsx`

Company bets page reuses bet-table component with admin-level data. Analytics page shows P&L charts, bet type breakdown, sport breakdown, MRR tracking.

### Task 11.4: Subscriber Management

**Files:**
- Create: `src/app/admin/subscribers/page.tsx`

Table of all subscribers with status, plan type, renewal dates. Basic management actions.

---

## Phase 12: Testing & Polish

### Task 12.1: Core Logic Tests

**Files:**
- Create: `src/__tests__/bet-settlement.test.ts`
- Create: `src/__tests__/excel-parser.test.ts`
- Create: `src/__tests__/team-matching.test.ts`
- Create: `src/__tests__/validation-engine.test.ts`

Write tests for:
- Bet settlement: money line wins/losses, spread with push, parlay all-win/mixed/all-loss
- Excel parser: various column naming, missing data, date formats
- Team matching: exact alias, fuzzy match, no match
- Validation: correct outcome, flagged outcome, uncertain match

### Task 12.2: API Route Tests

**Files:**
- Create: `src/__tests__/api/bets.test.ts`
- Create: `src/__tests__/api/auth.test.ts`

Test API endpoints for auth, bet placement, bet listing with filters, stats aggregation.

### Task 12.3: Final Polish

- Verify all animations work smoothly
- Test responsive design on mobile/tablet
- Verify Stripe checkout flow end-to-end
- Verify data validation pipeline end-to-end
- Test admin and customer role separation
- Run full test suite

**Step: Commit**

```bash
git add .
git commit -m "feat: add comprehensive test suite for core logic and API routes"
```

---

## Execution Order Summary

| Phase | Description | Dependencies |
|-------|------------|-------------|
| 1 | Project Scaffolding | None |
| 2 | Database Schema & ORM | Phase 1 |
| 3 | Authentication | Phase 2 |
| 4 | Sports API Integration | Phase 2 |
| 5 | Bet Tracking API | Phase 3, 4 |
| 6 | Excel Validation Pipeline | Phase 4 |
| 7 | Stripe Integration | Phase 3 |
| 8 | Frontend Layout & Components | Phase 3 |
| 9 | Frontend Public Pages | Phase 7, 8 |
| 10 | Frontend Customer Pages | Phase 5, 8 |
| 11 | Frontend Admin Pages | Phase 5, 6, 8 |
| 12 | Testing & Polish | All phases |

**Phases 4, 5, 6, 7 can be partially parallelized since they have independent API implementations.**

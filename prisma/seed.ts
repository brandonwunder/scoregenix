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

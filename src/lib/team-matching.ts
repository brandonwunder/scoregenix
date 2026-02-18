import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";

let aliasCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

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

    const canonical = aliasMap.get(matchedName) || matchedName;

    return { canonical, confidence };
  }

  return { canonical: normalized, confidence: 0 };
}

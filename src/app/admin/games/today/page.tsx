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

    // Poll DB for game updates every 60 seconds (lightweight read)
    const readInterval = setInterval(fetchGames, 60_000);

    // Trigger full ESPN sync every 5 minutes (uses session cookie auth)
    const syncInterval = setInterval(async () => {
      try {
        await fetch("/api/games/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        await fetchGames();
      } catch {
        // Silent
      }
    }, 5 * 60_000);

    return () => {
      clearInterval(readInterval);
      clearInterval(syncInterval);
    };
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
    if (
      game.status === "FINAL" ||
      game.status === "CANCELLED" ||
      game.status === "POSTPONED"
    )
      return;
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
              {today} &middot; {games.length} game
              {games.length !== 1 ? "s" : ""}
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
                    {sportGames.length} game
                    {sportGames.length !== 1 ? "s" : ""}
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

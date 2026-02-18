"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageShell } from "@/components/layout";
import { GameCard, type GameData } from "@/components/dashboard/game-card";
import { BetModal } from "@/components/dashboard/bet-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SPORT_FILTERS = [
  { label: "All", value: "all" },
  { label: "NFL", value: "NFL" },
  { label: "NBA", value: "NBA" },
  { label: "MLB", value: "MLB" },
  { label: "NHL", value: "NHL" },
  { label: "MLS", value: "MLS" },
  { label: "NCAAF", value: "NCAAF" },
  { label: "NCAAB", value: "NCAAB" },
];

function GameCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-14 bg-white/10" />
        <Skeleton className="h-5 w-20 bg-white/10" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-3 w-10 bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <Skeleton className="h-3 w-6 bg-white/10" />
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-3 w-10 bg-white/10" />
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-white/5 pt-3">
        <Skeleton className="h-3 w-16 bg-white/10" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("all");
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [betModalOpen, setBetModalOpen] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/games/today");
        if (!res.ok) throw new Error("Failed to fetch games");
        const data = await res.json();
        setGames(data.games || []);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();

    // Refresh every 60 seconds for live scores
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredGames =
    sportFilter === "all"
      ? games
      : games.filter(
          (g) =>
            g.sportName.toUpperCase() === sportFilter ||
            g.sportSlug.toUpperCase() === sportFilter
        );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setBetModalOpen(true);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-bold text-white sm:text-4xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Today&apos;s Games
          </h1>
          <p className="mt-1 text-sm text-white/50">{today}</p>
        </motion.div>

        {/* Sport Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {SPORT_FILTERS.map((filter) => {
            const count =
              filter.value === "all"
                ? games.length
                : games.filter(
                    (g) =>
                      g.sportName.toUpperCase() === filter.value ||
                      g.sportSlug.toUpperCase() === filter.value
                  ).length;

            return (
              <button
                key={filter.value}
                onClick={() => setSportFilter(filter.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  sportFilter === filter.value
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                )}
              >
                {filter.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs text-white/30">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center"
          >
            <p className="text-lg font-medium text-red-400">
              Failed to load games
            </p>
            <p className="mt-1 text-sm text-white/40">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Games Grid */}
        {!loading && !error && filteredGames.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game, index) => (
              <GameCard
                key={game.externalApiId}
                game={game}
                index={index}
                onClick={() => handleGameClick(game)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
          >
            <div className="mb-3 text-4xl opacity-30">&#9917;</div>
            <p className="text-lg font-medium text-white/70">
              No games scheduled
            </p>
            <p className="mt-1 text-sm text-white/40">
              {sportFilter !== "all"
                ? `No ${sportFilter} games today. Try selecting a different sport.`
                : "There are no games scheduled for today. Check back later!"}
            </p>
          </motion.div>
        )}

        {/* Live Games Indicator */}
        {!loading &&
          games.some((g) => g.status === "IN_PROGRESS") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-2 text-xs text-white/40"
            >
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>
                Live games auto-refresh every 60 seconds
              </span>
            </motion.div>
          )}
      </div>

      {/* Bet Modal */}
      <BetModal
        game={selectedGame}
        open={betModalOpen}
        onOpenChange={setBetModalOpen}
      />
    </PageShell>
  );
}

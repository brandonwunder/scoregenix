"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  ActivityIcon,
  LoaderIcon,
  TrophyIcon,
  XCircleIcon,
  MinusCircleIcon,
  LayersIcon,
  MoveHorizontalIcon,
} from "lucide-react";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type GameData } from "@/components/dashboard/game-card";
import { SportLogo } from "@/components/ui/sport-logo";
import { TeamLogo } from "@/components/ui/team-logo";
import { GameTime } from "@/components/ui/game-time";
import { useNumberCounter, useCurrencyCounter } from "@/hooks/use-number-counter";
import { useAutoAnimate } from "@formkit/auto-animate/react";

/* ───── Types ───── */

interface AdminStats {
  todaysBets: number;
  todaysPL: number;
  activeSubscribers: number;
  pendingBets: number;
}

interface BetLeg {
  id: string;
  teamSelected: string;
  lineValue: string | null;
  odds: string | null;
  outcome: string;
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    sport: { name: string; slug: string };
  };
}

interface Bet {
  id: string;
  betType: string;
  wagerAmount: string;
  potentialPayout: string | null;
  status: string;
  placedAt: string;
  settledAt: string | null;
  notes: string | null;
  legs: BetLeg[];
}

/* ───── Constants ───── */

const STATUS_COLORS: Record<string, string> = {
  WON: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  LOST: "bg-red-500/15 text-red-400 border-red-500/30",
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  PUSH: "bg-white/10 text-white/50 border-white/20",
};

const GAME_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  SCHEDULED: { label: "Scheduled", className: "bg-white/10 text-white/70" },
  IN_PROGRESS: {
    label: "Live",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  FINAL: { label: "Final", className: "bg-white/5 text-white/50" },
  POSTPONED: {
    label: "Postponed",
    className: "bg-yellow-500/20 text-yellow-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/20 text-red-400",
  },
};

const BET_TYPE_LABELS: Record<string, string> = {
  MONEY_LINE: "Money Line",
  POINT_SPREAD: "Spread",
  PARLAY: "Parlay",
};

/* ───── Sub-components ───── */

function QuickStatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  index,
  isCurrency = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  index: number;
  isCurrency?: boolean;
}) {
  // Use number counter for animated count-up
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const countRef = isCurrency
    ? useCurrencyCounter(numericValue, { delay: index * 0.08 })
    : useNumberCounter(numericValue, { duration: 1.5, delay: index * 0.08 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {label}
          </p>
          <span
            ref={countRef}
            className={cn("mt-2 block text-3xl font-bold tracking-tight tabular-nums", colorClass)}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {typeof value === 'number' || isCurrency ? '0' : value}
          </span>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            colorClass.includes("emerald")
              ? "bg-emerald-500/10"
              : colorClass.includes("red")
                ? "bg-red-500/10"
                : colorClass.includes("yellow")
                  ? "bg-yellow-500/10"
                  : "bg-white/5"
          )}
        >
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </div>
    </motion.div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/5 p-5"
        >
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="mt-3 h-8 w-28 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 flex-1 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
          <Skeleton className="h-8 w-24 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

/* ───── Main Page ───── */

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") router.push("/admin/login");
  }, [status, session, router]);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingBets, setLoadingBets] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Auto-animate refs
  const [gamesTableRef] = useAutoAnimate();
  const [betsTableRef] = useAutoAnimate();

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch {
      // Silently handle — stats will be null
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      setLoadingGames(true);
      const res = await fetch("/api/games/today");
      if (!res.ok) throw new Error("Failed to fetch games");
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      // Silently handle
    } finally {
      setLoadingGames(false);
    }
  }, []);

  const fetchRecentBets = useCallback(async () => {
    try {
      setLoadingBets(true);
      const res = await fetch("/api/bets?limit=10");
      if (!res.ok) throw new Error("Failed to fetch bets");
      const data = await res.json();
      setRecentBets(data.bets || []);
    } catch {
      // Silently handle
    } finally {
      setLoadingBets(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchGames();
    fetchRecentBets();

    const interval = setInterval(() => {
      // Trigger background sync + settlement, then refresh games
      fetch("/api/cron/games").catch(() => {});
      fetchGames();
      fetchRecentBets();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchGames, fetchRecentBets]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/games/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      setSyncResult(
        `Synced ${data.synced ?? 0} games across ${data.sportsProcessed ?? 0} sports`
      );
      fetchGames();
    } catch {
      setSyncResult("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const liveGames = games.filter((g) => g.status === "IN_PROGRESS");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
            <h1
              className="text-3xl font-bold text-white sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-white/50">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            {syncResult && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-xs",
                  syncResult.includes("failed")
                    ? "text-red-400"
                    : "text-emerald-400"
                )}
              >
                {syncResult}
              </motion.span>
            )}
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
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        {loadingStats ? (
          <StatsSkeleton />
        ) : stats ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              label="Today's Bets"
              value={stats.todaysBets}
              icon={CalendarIcon}
              colorClass="text-white"
              index={0}
            />
            <QuickStatCard
              label="Today's P&L"
              value={stats.todaysPL}
              icon={stats.todaysPL >= 0 ? TrendingUpIcon : TrendingDownIcon}
              colorClass={
                stats.todaysPL >= 0 ? "text-emerald-400" : "text-red-400"
              }
              index={1}
              isCurrency
            />
            <QuickStatCard
              label="Active Subscribers"
              value={stats.activeSubscribers}
              icon={UsersIcon}
              colorClass="text-emerald-400"
              index={2}
            />
            <QuickStatCard
              label="Pending Bets"
              value={stats.pendingBets}
              icon={ClockIcon}
              colorClass="text-yellow-400"
              index={3}
            />
          </div>
        ) : null}

        {/* Two-Column Layout: Live Games + Recent Bets */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live / Today's Games */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-emerald-400" />
                <h3
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Today&apos;s Games
                </h3>
                <Badge className="bg-white/10 text-white/50 text-[10px]">
                  {games.length}
                </Badge>
              </div>
              {liveGames.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  {liveGames.length} Live
                </div>
              )}
            </div>

            {loadingGames ? (
              <div className="p-4">
                <TableSkeleton rows={4} />
              </div>
            ) : games.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-sm text-white/40">
                  No games scheduled for today
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs text-white/50">
                        Sport
                      </TableHead>
                      <TableHead className="text-xs text-white/50">
                        Matchup
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-center">
                        Score
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={gamesTableRef}>
                    {games.map((game) => {
                      const statusConfig =
                        GAME_STATUS_CONFIG[game.status] ||
                        GAME_STATUS_CONFIG.SCHEDULED;
                      const showScore =
                        game.status === "IN_PROGRESS" ||
                        game.status === "FINAL";
                      return (
                        <TableRow
                          key={game.externalApiId}
                          className="border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <TableCell>
                            <SportLogo
                              sportSlug={game.sportSlug}
                              size="sm"
                              showName
                            />
                          </TableCell>
                          <TableCell className="text-xs text-white/80">
                            <div className="flex items-center gap-2">
                              <TeamLogo
                                src={game.awayTeamLogo}
                                abbr={game.awayTeamAbbr}
                                alt={game.awayTeam}
                                size="xs"
                                league={game.sportSlug}
                                showTeamColor
                              />
                              <span className="font-medium">
                                {game.awayTeamAbbr}
                              </span>
                              <span className="text-white/30">@</span>
                              <TeamLogo
                                src={game.homeTeamLogo}
                                abbr={game.homeTeamAbbr}
                                alt={game.homeTeam}
                                size="xs"
                                league={game.sportSlug}
                                showTeamColor
                              />
                              <span className="font-medium">
                                {game.homeTeamAbbr}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-medium tabular-nums text-white/70">
                            {showScore ? (
                              `${game.awayScore ?? 0} - ${game.homeScore ?? 0}`
                            ) : (
                              <GameTime
                                date={game.gameDate}
                                variant="short"
                                status={game.status}
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={cn(
                                "text-[10px]",
                                statusConfig.className
                              )}
                            >
                              {game.status === "IN_PROGRESS" && (
                                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              )}
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>

          {/* Recent Bets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-white/10 p-4">
              <CalendarIcon className="h-4 w-4 text-emerald-400" />
              <h3
                className="text-base font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Recent Bets
              </h3>
              <Badge className="bg-white/10 text-white/50 text-[10px]">
                Last 10
              </Badge>
            </div>

            {loadingBets ? (
              <div className="p-4">
                <TableSkeleton rows={5} />
              </div>
            ) : recentBets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-sm text-white/40">No bets placed yet</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs text-white/50">
                        Date
                      </TableHead>
                      <TableHead className="text-xs text-white/50">
                        Game
                      </TableHead>
                      <TableHead className="text-xs text-white/50">
                        Type
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Wager
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={betsTableRef}>
                    {recentBets.map((bet) => {
                      const primaryLeg = bet.legs[0];
                      const game = primaryLeg?.game;

                      return (
                        <TableRow
                          key={bet.id}
                          className="border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <TableCell className="text-xs text-white/60">
                            {format(new Date(bet.placedAt), "MMM d")}
                          </TableCell>
                          <TableCell className="text-xs text-white/80">
                            {game ? (
                              <span>
                                {game.awayTeam}{" "}
                                <span className="text-white/30">@</span>{" "}
                                {game.homeTeam}
                              </span>
                            ) : bet.legs.length > 1 ? (
                              <span className="text-white/50">
                                {bet.legs.length}-leg parlay
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-[10px] flex items-center gap-1 w-fit",
                                bet.betType === "PARLAY"
                                  ? "bg-purple-500/15 text-purple-400"
                                  : bet.betType === "POINT_SPREAD"
                                    ? "bg-blue-500/15 text-blue-400"
                                    : "bg-emerald-500/15 text-emerald-400"
                              )}
                            >
                              {bet.betType === "PARLAY" ? (
                                <LayersIcon size={10} />
                              ) : bet.betType === "POINT_SPREAD" ? (
                                <MoveHorizontalIcon size={10} />
                              ) : (
                                <TrendingUpIcon size={10} />
                              )}
                              {BET_TYPE_LABELS[bet.betType] || bet.betType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-white/80">
                            ${parseFloat(bet.wagerAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-[10px] flex items-center gap-1 w-fit mx-auto",
                                STATUS_COLORS[bet.status] ||
                                  "bg-white/10 text-white/50"
                              )}
                            >
                              {bet.status === "WON" && <TrophyIcon size={10} />}
                              {bet.status === "LOST" && <XCircleIcon size={10} />}
                              {bet.status === "PENDING" && <ClockIcon size={10} className="animate-pulse" />}
                              {bet.status === "PUSH" && <MinusCircleIcon size={10} />}
                              {bet.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

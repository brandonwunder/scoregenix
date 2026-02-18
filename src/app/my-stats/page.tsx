"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageShell } from "@/components/layout";
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
import {
  TrendingUpIcon,
  TrendingDownIcon,
  TargetIcon,
  DollarSignIcon,
  PercentIcon,
  BarChart3Icon,
} from "lucide-react";

interface StatsData {
  overview: {
    totalBets: number;
    wins: number;
    losses: number;
    pushes: number;
    pending: number;
    winRate: number;
    totalWagered: number;
    totalWon: number;
    totalLost: number;
    netProfitLoss: number;
    roi: number;
  };
  byBetType: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number }
  >;
  bySport: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number }
  >;
  monthlyTrend: Array<{
    month: string;
    bets: number;
    wins: number;
    profit: number;
  }>;
}

const BET_TYPE_LABELS: Record<string, string> = {
  MONEY_LINE: "Money Line",
  POINT_SPREAD: "Point Spread",
  PARLAY: "Parlay",
};

function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  index,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {title}
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tracking-tight",
              colorClass
            )}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-white/30">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            colorClass.includes("emerald")
              ? "bg-emerald-500/10"
              : colorClass.includes("red")
                ? "bg-red-500/10"
                : "bg-white/5"
          )}
        >
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </div>
    </motion.div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <Skeleton className="mb-4 h-5 w-40 bg-white/10" />
      <Skeleton className="h-64 w-full bg-white/10" />
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
  valueSuffix = "",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-white/60">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold text-emerald-400">
          {valuePrefix}
          {typeof entry.value === "number"
            ? entry.value.toFixed(entry.value % 1 !== 0 ? 2 : 0)
            : entry.value}
          {valueSuffix}
        </p>
      ))}
    </div>
  );
}

export default function MyStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare chart data
  const monthlyData =
    stats?.monthlyTrend.map((m) => ({
      ...m,
      monthLabel: new Date(m.month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    })) || [];

  const betTypeData = stats
    ? Object.entries(stats.byBetType).map(([type, data]) => ({
        name: BET_TYPE_LABELS[type] || type,
        winRate: parseFloat(data.winRate.toFixed(1)),
        total: data.total,
      }))
    : [];

  const sportData = stats
    ? Object.entries(stats.bySport)
        .map(([sport, data]) => ({
          name: sport,
          winRate: parseFloat(data.winRate.toFixed(1)),
          total: data.total,
        }))
        .sort((a, b) => b.winRate - a.winRate)
    : [];

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
            My Stats
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Comprehensive performance analytics for your betting history
          </p>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center">
            <p className="text-lg font-medium text-red-400">
              Failed to load statistics
            </p>
            <p className="mt-1 text-sm text-white/40">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <Skeleton className="h-3 w-20 bg-white/10" />
                  <Skeleton className="mt-3 h-8 w-28 bg-white/10" />
                  <Skeleton className="mt-2 h-3 w-16 bg-white/10" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        )}

        {/* Stats Content */}
        {!loading && !error && stats && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewCard
                title="Total Bets"
                value={stats.overview.totalBets.toString()}
                subtitle={`${stats.overview.pending} pending`}
                icon={BarChart3Icon}
                colorClass="text-white"
                index={0}
              />
              <OverviewCard
                title="Win Rate"
                value={`${stats.overview.winRate.toFixed(1)}%`}
                subtitle={`${stats.overview.wins}W - ${stats.overview.losses}L`}
                icon={TargetIcon}
                colorClass={
                  stats.overview.winRate >= 55
                    ? "text-emerald-400"
                    : stats.overview.winRate >= 45
                      ? "text-yellow-400"
                      : "text-red-400"
                }
                index={1}
              />
              <OverviewCard
                title="Net P&L"
                value={`${stats.overview.netProfitLoss >= 0 ? "+" : ""}$${Math.abs(stats.overview.netProfitLoss).toFixed(2)}`}
                subtitle={`$${stats.overview.totalWagered.toFixed(2)} wagered`}
                icon={
                  stats.overview.netProfitLoss >= 0
                    ? TrendingUpIcon
                    : TrendingDownIcon
                }
                colorClass={
                  stats.overview.netProfitLoss >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
                index={2}
              />
              <OverviewCard
                title="ROI"
                value={`${stats.overview.roi >= 0 ? "+" : ""}${stats.overview.roi.toFixed(1)}%`}
                subtitle="Return on investment"
                icon={PercentIcon}
                colorClass={
                  stats.overview.roi >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
                index={3}
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Monthly Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <h3
                  className="mb-4 text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Monthly Profit Trend
                </h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient
                          id="profitGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#34d399"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#34d399"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 0 ? "" : "-"}${Math.abs(v)}`
                        }
                      />
                      <Tooltip
                        content={
                          <CustomTooltip valuePrefix="$" />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#34d399"
                        strokeWidth={2}
                        fill="url(#profitGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-white/30">
                    No data available yet
                  </div>
                )}
              </motion.div>

              {/* Win Rate by Bet Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <h3
                  className="mb-4 text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Win Rate by Bet Type
                </h3>
                {betTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={betTypeData} barCategoryGap="30%">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip valueSuffix="%" />
                        }
                      />
                      <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                        {betTypeData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0
                                ? "#34d399"
                                : index === 1
                                  ? "#10b981"
                                  : "#059669"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-white/30">
                    No data available yet
                  </div>
                )}
              </motion.div>

              {/* Performance by Sport */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 lg:col-span-2"
              >
                <h3
                  className="mb-4 text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Performance by Sport
                </h3>
                {sportData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(200, sportData.length * 50)}
                  >
                    <BarChart
                      data={sportData}
                      layout="vertical"
                      barCategoryGap="20%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                        width={90}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip valueSuffix="%" />
                        }
                      />
                      <Bar dataKey="winRate" radius={[0, 6, 6, 0]}>
                        {sportData.map((entry, index) => (
                          <Cell
                            key={`sport-cell-${index}`}
                            fill={
                              entry.winRate >= 55
                                ? "#34d399"
                                : entry.winRate >= 45
                                  ? "#fbbf24"
                                  : "#f87171"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-white/30">
                    No data available yet
                  </div>
                )}
              </motion.div>
            </div>

            {/* Detailed Stats Tables */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* By Bet Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <div className="border-b border-white/10 p-4">
                  <h3
                    className="text-base font-semibold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Stats by Bet Type
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs text-white/50">
                        Type
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Total
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Wins
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Losses
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Win Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.byBetType).map(([type, data]) => (
                      <TableRow
                        key={type}
                        className="border-white/5 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-sm font-medium text-white/80">
                          {BET_TYPE_LABELS[type] || type}
                        </TableCell>
                        <TableCell className="text-sm text-right text-white/60">
                          {data.total}
                        </TableCell>
                        <TableCell className="text-sm text-right text-emerald-400">
                          {data.wins}
                        </TableCell>
                        <TableCell className="text-sm text-right text-red-400">
                          {data.losses}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          <span
                            className={cn(
                              "font-medium",
                              data.winRate >= 55
                                ? "text-emerald-400"
                                : data.winRate >= 45
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            )}
                          >
                            {data.winRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>

              {/* By Sport */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <div className="border-b border-white/10 p-4">
                  <h3
                    className="text-base font-semibold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Stats by Sport
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs text-white/50">
                        Sport
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Total
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Wins
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Losses
                      </TableHead>
                      <TableHead className="text-xs text-white/50 text-right">
                        Win Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.bySport).length > 0 ? (
                      Object.entries(stats.bySport)
                        .sort(([, a], [, b]) => b.winRate - a.winRate)
                        .map(([sport, data]) => (
                          <TableRow
                            key={sport}
                            className="border-white/5 hover:bg-white/[0.03]"
                          >
                            <TableCell className="text-sm font-medium text-white/80">
                              {sport}
                            </TableCell>
                            <TableCell className="text-sm text-right text-white/60">
                              {data.total}
                            </TableCell>
                            <TableCell className="text-sm text-right text-emerald-400">
                              {data.wins}
                            </TableCell>
                            <TableCell className="text-sm text-right text-red-400">
                              {data.losses}
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span
                                className={cn(
                                  "font-medium",
                                  data.winRate >= 55
                                    ? "text-emerald-400"
                                    : data.winRate >= 45
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                )}
                              >
                                {data.winRate.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow className="border-white/5">
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-white/30"
                        >
                          No sport data available yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </motion.div>
            </div>
          </div>
        )}

        {/* Empty State (no stats at all) */}
        {!loading && !error && stats && stats.overview.totalBets === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
          >
            <div className="mb-3 text-4xl opacity-30">&#128200;</div>
            <p className="text-lg font-medium text-white/70">
              No stats to display
            </p>
            <p className="mt-1 text-sm text-white/40">
              Start placing bets to build your performance analytics dashboard.
            </p>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  DownloadIcon,
} from "lucide-react";
import { PageShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ───── Constants ───── */

const STATUS_COLORS: Record<string, string> = {
  WON: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  LOST: "bg-red-500/15 text-red-400 border-red-500/30",
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  PUSH: "bg-white/10 text-white/50 border-white/20",
};

const BET_TYPE_LABELS: Record<string, string> = {
  MONEY_LINE: "Money Line",
  POINT_SPREAD: "Point Spread",
  PARLAY: "Parlay",
};

/* ───── Sub-components ───── */

function StatCard({
  label,
  value,
  colorClass,
  index,
}: {
  label: string;
  value: string | number;
  colorClass?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p
        className={cn("mt-1 text-2xl font-bold", colorClass || "text-white")}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
    </motion.div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 flex-1 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
          <Skeleton className="h-8 w-32 bg-white/10" />
          <Skeleton className="h-8 w-24 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
          <Skeleton className="h-8 w-16 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

/* ───── Main Page ───── */

export default function AdminBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [betTypeFilter, setBetTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Summary stats
  const [summary, setSummary] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
    winRate: 0,
  });

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (betTypeFilter !== "all") params.set("betType", betTypeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate.toISOString());
      if (toDate) params.set("to", toDate.toISOString());

      const res = await fetch(`/api/bets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bets");

      const data = await res.json();
      setBets(data.bets || []);
      setPagination(data.pagination);

      // Fetch summary counts
      const summaryRes = await fetch("/api/bets?page=1&limit=1");
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        const totalBets = summaryData.pagination.total;

        const [wonRes, lostRes, pushRes, pendingRes] = await Promise.all([
          fetch("/api/bets?status=WON&page=1&limit=1"),
          fetch("/api/bets?status=LOST&page=1&limit=1"),
          fetch("/api/bets?status=PUSH&page=1&limit=1"),
          fetch("/api/bets?status=PENDING&page=1&limit=1"),
        ]);

        const [wonData, lostData, pushData, pendingData] = await Promise.all([
          wonRes.json(),
          lostRes.json(),
          pushRes.json(),
          pendingRes.json(),
        ]);

        const wins = wonData.pagination?.total || 0;
        const losses = lostData.pagination?.total || 0;
        const pushes = pushData.pagination?.total || 0;
        const pending = pendingData.pagination?.total || 0;
        const settled = wins + losses + pushes;

        setSummary({
          total: totalBets,
          wins,
          losses,
          pushes,
          pending,
          winRate: settled > 0 ? (wins / settled) * 100 : 0,
        });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, betTypeFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  useEffect(() => {
    setPage(1);
  }, [betTypeFilter, statusFilter, fromDate, toDate]);

  // CSV Export
  const handleExportCSV = async () => {
    try {
      // Fetch all bets (no pagination)
      const params = new URLSearchParams({ page: "1", limit: "10000" });
      if (betTypeFilter !== "all") params.set("betType", betTypeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate.toISOString());
      if (toDate) params.set("to", toDate.toISOString());

      const res = await fetch(`/api/bets?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const allBets: Bet[] = data.bets || [];

      const headers = [
        "Date",
        "Sport",
        "Away Team",
        "Home Team",
        "Bet Type",
        "Selection",
        "Line",
        "Wager",
        "Payout",
        "Status",
      ];

      const csvRows = allBets.map((bet) => {
        const leg = bet.legs[0];
        const game = leg?.game;
        return [
          format(new Date(bet.placedAt), "yyyy-MM-dd"),
          game?.sport?.name || "",
          game?.awayTeam || "",
          game?.homeTeam || "",
          BET_TYPE_LABELS[bet.betType] || bet.betType,
          leg?.teamSelected || "",
          leg?.lineValue || "",
          parseFloat(bet.wagerAmount).toFixed(2),
          bet.potentialPayout
            ? parseFloat(bet.potentialPayout).toFixed(2)
            : "",
          bet.status,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scoregenix-bets-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle
    }
  };

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
              Company Bets
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Track and manage all company bet history
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </motion.div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Bets" value={summary.total} index={0} />
          <StatCard
            label="Wins"
            value={summary.wins}
            colorClass="text-emerald-400"
            index={1}
          />
          <StatCard
            label="Losses"
            value={summary.losses}
            colorClass="text-red-400"
            index={2}
          />
          <StatCard
            label="Pushes"
            value={summary.pushes}
            colorClass="text-white/50"
            index={3}
          />
          <StatCard
            label="Pending"
            value={summary.pending}
            colorClass="text-yellow-400"
            index={4}
          />
          <StatCard
            label="Win Rate"
            value={`${summary.winRate.toFixed(1)}%`}
            colorClass={
              summary.winRate >= 55
                ? "text-emerald-400"
                : summary.winRate >= 45
                  ? "text-yellow-400"
                  : "text-red-400"
            }
            index={5}
          />
        </div>

        {/* Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <FilterIcon className="h-3.5 w-3.5" />
            Filters
          </div>

          {/* Bet Type Filter */}
          <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
            <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Bet Type" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MONEY_LINE">Money Line</SelectItem>
              <SelectItem value="POINT_SPREAD">Point Spread</SelectItem>
              <SelectItem value="PARLAY">Parlay</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="WON">Won</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
              <SelectItem value="PUSH">Push</SelectItem>
            </SelectContent>
          </Select>

          {/* From Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start border-white/10 bg-white/5 text-left text-xs font-normal text-white hover:bg-white/10",
                  !fromDate && "text-white/40"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {fromDate ? format(fromDate, "MMM d, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto border-white/10 bg-black p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                className="text-white"
              />
            </PopoverContent>
          </Popover>

          {/* To Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start border-white/10 bg-white/5 text-left text-xs font-normal text-white hover:bg-white/10",
                  !toDate && "text-white/40"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {toDate ? format(toDate, "MMM d, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto border-white/10 bg-black p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                className="text-white"
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {(betTypeFilter !== "all" ||
            statusFilter !== "all" ||
            fromDate ||
            toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBetTypeFilter("all");
                setStatusFilter("all");
                setFromDate(undefined);
                setToDate(undefined);
              }}
              className="text-xs text-white/40 hover:text-white"
            >
              Clear all
            </Button>
          )}
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center">
            <p className="text-lg font-medium text-red-400">
              Failed to load bets
            </p>
            <p className="mt-1 text-sm text-white/40">{error}</p>
            <button
              onClick={fetchBets}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && <TableSkeleton />}

        {/* Bets Table */}
        {!loading && !error && bets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 text-xs">Date</TableHead>
                  <TableHead className="text-white/50 text-xs">
                    Sport
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">Game</TableHead>
                  <TableHead className="text-white/50 text-xs">
                    Bet Type
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">
                    Selection
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-right">
                    Wager
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-right">
                    Payout
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets.map((bet, index) => {
                  const primaryLeg = bet.legs[0];
                  const game = primaryLeg?.game;
                  const sport = game?.sport;

                  return (
                    <motion.tr
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <TableCell className="text-xs text-white/60">
                        {format(new Date(bet.placedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-white/10 text-white/60 text-[10px]">
                          {sport?.name || "N/A"}
                        </Badge>
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
                            "text-[10px]",
                            bet.betType === "PARLAY"
                              ? "bg-purple-500/15 text-purple-400"
                              : bet.betType === "POINT_SPREAD"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-emerald-500/15 text-emerald-400"
                          )}
                        >
                          {BET_TYPE_LABELS[bet.betType] || bet.betType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {primaryLeg?.teamSelected || "N/A"}
                        {bet.betType === "POINT_SPREAD" &&
                          primaryLeg?.lineValue && (
                            <span className="ml-1 text-white/40">
                              ({parseFloat(primaryLeg.lineValue) > 0 ? "+" : ""}
                              {primaryLeg.lineValue})
                            </span>
                          )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-white/80">
                        ${parseFloat(bet.wagerAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-white/80">
                        {bet.potentialPayout
                          ? `$${parseFloat(bet.potentialPayout).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "text-[10px]",
                            STATUS_COLORS[bet.status] ||
                              "bg-white/10 text-white/50"
                          )}
                        >
                          {bet.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && bets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
          >
            <p className="text-lg font-medium text-white/70">No bets found</p>
            <p className="mt-1 text-sm text-white/40">
              {betTypeFilter !== "all" ||
              statusFilter !== "all" ||
              fromDate ||
              toDate
                ? "Try adjusting your filters to see more results."
                : "No company bets have been placed yet."}
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center justify-between"
          >
            <p className="text-xs text-white/40">
              Showing {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
              bets
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          pageNum === page
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pagination?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

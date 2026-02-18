"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  UsersIcon,
  UserCheckIcon,
  CreditCardIcon,
  SearchIcon,
} from "lucide-react";
import { PageShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

/* ───── Types ───── */

interface Subscriber {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  plan: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  amount: string | number | null;
}

interface Summary {
  total: number;
  active: number;
  mrr: number;
}

/* ───── Constants ───── */

const STATUS_BADGE_CONFIG: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  EXPIRED: "bg-red-500/15 text-red-400 border-red-500/30",
  PAST_DUE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  CANCELLED: "bg-white/10 text-white/40 border-white/15",
  NONE: "bg-white/5 text-white/30 border-white/10",
};

const PLAN_BADGE_CONFIG: Record<string, string> = {
  MONTHLY: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  QUARTERLY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  SEMIANNUAL: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  ANNUAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const PLAN_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMIANNUAL: "Semi-Annual",
  ANNUAL: "Annual",
};

/* ───── Sub-components ───── */

function SummaryCard({
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
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {title}
          </p>
          <p
            className={cn("mt-2 text-3xl font-bold tracking-tight", colorClass)}
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
              : colorClass.includes("blue")
                ? "bg-blue-500/10"
                : "bg-white/5"
          )}
        >
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </div>
    </motion.div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 flex-1 bg-white/10" />
          <Skeleton className="h-10 w-40 bg-white/10" />
          <Skeleton className="h-10 w-24 bg-white/10" />
          <Skeleton className="h-10 w-24 bg-white/10" />
          <Skeleton className="h-10 w-28 bg-white/10" />
          <Skeleton className="h-10 w-28 bg-white/10" />
          <Skeleton className="h-10 w-20 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

/* ───── Main Page ───── */

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/subscribers");
        if (!res.ok) throw new Error("Failed to fetch subscribers");
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setSummary(data.summary || null);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Filter subscribers
  const filtered = subscribers.filter((sub) => {
    const matchesSearch =
      search === "" ||
      (sub.name || "").toLowerCase().includes(search.toLowerCase()) ||
      sub.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            Subscribers
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Manage and monitor your subscriber base
          </p>
        </motion.div>

        {/* Summary Cards */}
        {loading ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <Skeleton className="h-3 w-24 bg-white/10" />
                <Skeleton className="mt-3 h-8 w-20 bg-white/10" />
                <Skeleton className="mt-2 h-3 w-16 bg-white/10" />
              </div>
            ))}
          </div>
        ) : summary ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Total Subscribers"
              value={summary.total.toString()}
              subtitle={`${summary.total - summary.active} inactive`}
              icon={UsersIcon}
              colorClass="text-white"
              index={0}
            />
            <SummaryCard
              title="Active"
              value={summary.active.toString()}
              subtitle={`${summary.total > 0 ? ((summary.active / summary.total) * 100).toFixed(0) : 0}% of total`}
              icon={UserCheckIcon}
              colorClass="text-emerald-400"
              index={1}
            />
            <SummaryCard
              title="MRR"
              value={`$${summary.mrr.toFixed(2)}`}
              subtitle="Monthly recurring revenue"
              icon={CreditCardIcon}
              colorClass="text-blue-400"
              index={2}
            />
          </div>
        ) : null}

        {/* Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="PAST_DUE">Past Due</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NONE">No Plan</SelectItem>
            </SelectContent>
          </Select>

          {/* Result count */}
          <span className="text-xs text-white/40">
            {filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center">
            <p className="text-lg font-medium text-red-400">
              Failed to load subscribers
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
        {loading && <TableSkeleton />}

        {/* Subscribers Table */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 text-xs">Name</TableHead>
                  <TableHead className="text-white/50 text-xs">
                    Email
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-center">
                    Plan
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">
                    Start Date
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">
                    End Date
                  </TableHead>
                  <TableHead className="text-white/50 text-xs text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub, index) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="text-sm font-medium text-white/80">
                      {sub.name || (
                        <span className="text-white/30 italic">No name</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-white/60">
                      {sub.email}
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.plan ? (
                        <Badge
                          className={cn(
                            "text-[10px]",
                            PLAN_BADGE_CONFIG[sub.plan] ||
                              "bg-white/10 text-white/50"
                          )}
                        >
                          {PLAN_LABELS[sub.plan] || sub.plan}
                        </Badge>
                      ) : (
                        <span className="text-xs text-white/20">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "text-[10px]",
                          STATUS_BADGE_CONFIG[sub.status] ||
                            "bg-white/5 text-white/30"
                        )}
                      >
                        {sub.status === "PAST_DUE"
                          ? "Past Due"
                          : sub.status === "NONE"
                            ? "No Plan"
                            : sub.status.charAt(0) +
                              sub.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-white/60">
                      {sub.startDate
                        ? format(new Date(sub.startDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-white/60">
                      {sub.endDate
                        ? format(new Date(sub.endDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-white/80">
                      {sub.amount
                        ? `$${Number(sub.amount).toFixed(2)}`
                        : "-"}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
          >
            <UsersIcon className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-lg font-medium text-white/70">
              No subscribers found
            </p>
            <p className="mt-1 text-sm text-white/40">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No customers have signed up yet."}
            </p>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

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
                  formatter={(value: any) => [formatCurrency(value), "Portfolio Value"]}
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

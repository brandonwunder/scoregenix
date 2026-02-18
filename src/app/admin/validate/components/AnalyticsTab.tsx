"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AreaChart, Area } from 'recharts';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

interface AnalyticsTabProps {
  stats: {
    correct: number;
    flagged: number;
    uncertain: number;
    corrected: number;
    total: number;
  };
  uncertainReasons: Array<{ reason: string; count: number }>;
}

const STATUS_COLORS = {
  correct: '#34d399',
  flagged: '#fbbf24',
  uncertain: '#94a3b8',
  corrected: '#60a5fa',
};

const UNCERTAIN_REASON_LABELS: Record<string, string> = {
  NO_GAME_MATCH: 'No Game Match',
  GAME_NOT_FINAL: 'Game Not Final',
  LOW_CONFIDENCE_TEAM: 'Low Confidence Team',
  ESPN_FETCH_FAILED: 'ESPN Fetch Failed',
  MISSING_REQUIRED_FIELD: 'Missing Field',
  AMBIGUOUS_SPORT: 'Ambiguous Sport',
  MULTIPLE_GAME_MATCHES: 'Multiple Matches',
  TEAM_NOT_IN_GAME: 'Team Not in Game',
  NO_BET_TYPE: 'No Bet Type',
  NO_ODDS_DATA: 'No Odds Data',
};

export function AnalyticsTab({ stats, uncertainReasons }: AnalyticsTabProps) {
  const donutData = [
    { name: 'Correct', value: stats.correct, color: STATUS_COLORS.correct },
    { name: 'Flagged', value: stats.flagged, color: STATUS_COLORS.flagged },
    { name: 'Uncertain', value: stats.uncertain, color: STATUS_COLORS.uncertain },
    { name: 'Corrected', value: stats.corrected, color: STATUS_COLORS.corrected },
  ].filter((d) => d.value > 0);

  const barData = uncertainReasons.slice(0, 5).map((r) => ({
    name: UNCERTAIN_REASON_LABELS[r.reason] || r.reason,
    count: r.count,
    percentage: ((r.count / stats.total) * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Validation Status Distribution</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatedCounter
                  value={stats.total}
                  className="text-2xl font-bold text-white"
                />
                <span className="text-xs text-white/40">Total Rows</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col justify-center space-y-3">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-white/70">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                  <span className="text-xs text-white/40">
                    ({((item.value / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Top Uncertain Reasons */}
      {barData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Top Uncertain Reasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{ left: 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#ffffff40" />
              <YAxis dataKey="name" type="category" width={120} stroke="#ffffff40" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

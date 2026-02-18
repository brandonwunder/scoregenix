"use client";

import { motion } from 'framer-motion';
import { TrendingUpIcon, CheckCircle2Icon, FileTextIcon, AlertCircleIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { ConfidenceGauge } from './ConfidenceGauge';
import { cn } from '@/lib/utils';

interface HeroStatsBarProps {
  totalUploads: number;
  successRate: number;
  rowsProcessedToday: number;
  pendingActions: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  delay: number;
  type?: 'counter' | 'gauge' | 'number';
  suffix?: string;
  alert?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  delay,
  type = 'counter',
  suffix = '',
  alert = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-white/10 to-white/5 p-6 transition-all hover:shadow-lg hover:shadow-white/5',
        alert
          ? 'border-amber-500/30 ring-2 ring-amber-500/20 shadow-amber-500/10'
          : 'border-white/10'
      )}
      whileHover={{ scale: 1.02, translateY: -2 }}
    >
      {/* Glow effect for alerts */}
      {alert && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
      )}

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="rounded-lg bg-white/10 p-2">
            <Icon className={cn('h-5 w-5', alert ? 'text-amber-400' : 'text-white/70')} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUpIcon className="h-3 w-3" />
              {trend}
            </div>
          )}
        </div>

        <div className="mb-1">
          {type === 'gauge' ? (
            <div className="flex items-center gap-3">
              <ConfidenceGauge value={value} size="md" />
              <AnimatedCounter
                value={value}
                decimals={1}
                suffix="%"
                className="text-3xl font-bold tracking-tight text-white"
              />
            </div>
          ) : (
            <AnimatedCounter
              value={value}
              suffix={suffix}
              className="text-3xl font-bold tracking-tight text-white"
            />
          )}
        </div>

        <p className="text-sm text-white/50" style={{ letterSpacing: '0.05em' }}>
          {title}
        </p>
      </div>
    </motion.div>
  );
}

export function HeroStatsBar({
  totalUploads,
  successRate,
  rowsProcessedToday,
  pendingActions,
}: HeroStatsBarProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="TOTAL UPLOADS"
        value={totalUploads}
        icon={FileTextIcon}
        delay={0}
      />
      <StatCard
        title="VALIDATION SUCCESS"
        value={successRate}
        icon={CheckCircle2Icon}
        type="gauge"
        delay={0.1}
      />
      <StatCard
        title="ROWS PROCESSED TODAY"
        value={rowsProcessedToday}
        icon={TrendingUpIcon}
        delay={0.2}
      />
      <StatCard
        title="PENDING ACTIONS"
        value={pendingActions}
        icon={AlertCircleIcon}
        delay={0.3}
        alert={pendingActions > 0}
      />
    </div>
  );
}

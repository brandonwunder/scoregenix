"use client";

import { motion } from 'framer-motion';
import {
  SearchIcon,
  TargetIcon,
  DollarSignIcon,
  NetworkIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PassState {
  passName: string;
  passKey: string;
  progress: number;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

interface ValidationPipelineVisualizerProps {
  passes: PassState[];
  onPassClick?: (passKey: string) => void;
}

const PASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  game_matching: SearchIcon,
  outcome_validation: TargetIcon,
  financial_validation: DollarSignIcon,
  cross_row_validation: NetworkIcon,
};

function PassNode({
  pass,
  index,
  onClick,
}: {
  pass: PassState;
  index: number;
  onClick?: () => void;
}) {
  const Icon = PASS_ICONS[pass.passKey] || CheckCircle2Icon;
  const isComplete = pass.progress >= 100;
  const hasFailed = pass.failed > 0;
  const hasWarnings = pass.warnings > 0;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg border p-3 text-left transition-all',
        'hover:border-white/30 hover:bg-white/[0.08] hover:shadow-lg',
        hasFailed
          ? 'border-red-500/30 bg-red-500/5'
          : hasWarnings
            ? 'border-amber-500/30 bg-amber-500/5'
            : isComplete
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-white/10 bg-white/5'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Status indicator dot */}
      <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white/20">
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'h-full w-full rounded-full',
              hasFailed
                ? 'bg-red-400'
                : hasWarnings
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
            )}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'rounded-md p-1.5',
              hasFailed
                ? 'bg-red-500/20 text-red-400'
                : hasWarnings
                  ? 'bg-amber-500/20 text-amber-400'
                  : isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-white/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80">{pass.passName}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
              <span>{Math.round(pass.progress)}%</span>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-1">
          {pass.passed > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
              <CheckCircle2Icon className="h-2.5 w-2.5" />
              {pass.passed}
            </div>
          )}
          {pass.warnings > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
              <AlertTriangleIcon className="h-2.5 w-2.5" />
              {pass.warnings}
            </div>
          )}
          {pass.failed > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
              <XCircleIcon className="h-2.5 w-2.5" />
              {pass.failed}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <Progress
          value={pass.progress}
          className={cn(
            'h-1 bg-white/10',
            hasFailed
              ? '[&>div]:bg-red-400'
              : hasWarnings
                ? '[&>div]:bg-amber-400'
                : '[&>div]:bg-emerald-400'
          )}
        />
      </div>
    </motion.button>
  );
}

export function ValidationPipelineVisualizer({
  passes,
  onPassClick,
}: ValidationPipelineVisualizerProps) {
  const allComplete = passes.every((p) => p.progress >= 100);

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-semibold text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Validation Pipeline
      </h3>

      <div className="relative space-y-3">
        {/* Connecting line */}
        <div className="absolute left-[5px] top-6 bottom-6 w-px bg-gradient-to-b from-white/20 via-white/10 to-white/20" />

        {passes.map((pass, index) => (
          <PassNode
            key={pass.passKey}
            pass={pass}
            index={index}
            onClick={() => onPassClick?.(pass.passKey)}
          />
        ))}
      </div>

      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center"
        >
          <CheckCircle2Icon className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
          <p className="text-xs font-medium text-emerald-400">Validation Complete</p>
        </motion.div>
      )}
    </div>
  );
}

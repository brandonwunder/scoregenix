"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { outer: 32, stroke: 3, fontSize: 'text-[10px]' },
  md: { outer: 48, stroke: 4, fontSize: 'text-xs' },
  lg: { outer: 64, stroke: 5, fontSize: 'text-sm' },
};

export function ConfidenceGauge({
  value,
  size = 'md',
  showLabel = true,
  className = '',
}: ConfidenceGaugeProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80
      ? 'stroke-emerald-400'
      : value >= 50
        ? 'stroke-amber-400'
        : 'stroke-red-400';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={config.outer} height={config.outer} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          className={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            'absolute font-semibold tabular-nums',
            config.fontSize,
            value >= 80
              ? 'text-emerald-400'
              : value >= 50
                ? 'text-amber-400'
                : 'text-red-400'
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

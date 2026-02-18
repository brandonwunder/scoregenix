"use client";

import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  decimals = 0,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const displayValue = useAnimatedCounter({
    target: value,
    duration,
    enabled: !prefersReducedMotion,
  });

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : displayValue.toString();

  return (
    <span className={className} style={{ fontFeatureSettings: "'tnum'" }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

import { useEffect, useState, useRef } from 'react';

interface UseAnimatedCounterOptions {
  target: number;
  duration?: number;
  enabled?: boolean;
}

export function useAnimatedCounter({
  target,
  duration = 1000,
  enabled = true,
}: UseAnimatedCounterOptions): number {
  const [count, setCount] = useState(enabled ? 0 : target);
  const rafRef = useRef<number | null>(null);
  const countRef = useRef(enabled ? 0 : target);

  useEffect(() => {
    // Cancel any ongoing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    if (!enabled) {
      setCount(target);
      countRef.current = target;
      return;
    }

    const startTime = Date.now();
    const startValue = countRef.current; // Use ref, not stale state
    const diff = target - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + diff * eased);

      setCount(current);
      countRef.current = current; // Update ref

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
        countRef.current = target; // Update ref to final value
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or dependency change
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration, enabled]);

  return count;
}

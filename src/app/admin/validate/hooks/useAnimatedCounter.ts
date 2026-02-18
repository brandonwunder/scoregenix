import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!enabled) {
      setCount(target);
      return;
    }

    const startTime = Date.now();
    const startValue = count;
    const diff = target - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + diff * eased);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return count;
}

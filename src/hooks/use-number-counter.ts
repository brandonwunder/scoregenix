'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface NumberCounterOptions {
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
}

export function useNumberCounter(
  value: number,
  options: NumberCounterOptions = {}
) {
  const {
    duration = 1.5,
    delay = 0,
    decimals = 0,
    prefix = '',
    suffix = '',
    separator = false,
  } = options;

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const obj = { value: 0 };

    gsap.to(obj, {
      value: value,
      duration: duration,
      delay: delay,
      ease: 'power2.out',
      onUpdate: function () {
        if (!element) return;
        let displayValue: string;
        if (decimals > 0) {
          displayValue = obj.value.toFixed(decimals);
        } else {
          displayValue = Math.floor(obj.value).toString();
        }
        if (separator) {
          const parts = displayValue.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          displayValue = parts.join('.');
        }
        element.textContent = `${prefix}${displayValue}${suffix}`;
      },
    });

    return () => {
      gsap.killTweensOf(obj);
    };
  }, [value, duration, delay, decimals, prefix, suffix, separator]);

  return ref;
}

export function useCurrencyCounter(
  amount: number,
  options: Omit<NumberCounterOptions, 'prefix' | 'decimals' | 'separator'> = {}
) {
  return useNumberCounter(Math.abs(amount), {
    ...options,
    prefix: amount < 0 ? '-$' : '$',
    decimals: 2,
    separator: true,
  });
}

export function usePercentageCounter(
  percentage: number,
  options: Omit<NumberCounterOptions, 'suffix' | 'decimals'> = {}
) {
  return useNumberCounter(percentage, {
    ...options,
    suffix: '%',
    decimals: 1,
  });
}

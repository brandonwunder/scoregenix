/**
 * Formatting utilities for numbers, currency, percentages
 */

export function formatCurrency(amount: number, showSign = false): string {
  const sign = showSign ? (amount >= 0 ? '+' : '') : '';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${sign}${amount < 0 ? '-' : ''}${formatted}`;
}

export function getCurrencyColorClass(amount: number): string {
  if (amount > 0) return 'text-emerald-400';
  if (amount < 0) return 'text-red-400';
  return 'text-white/70';
}

export function formatPercentage(value: number, decimals = 1, asDecimal = false): string {
  const percentValue = asDecimal ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
}

export function getPercentageColorClass(value: number, inverse = false): string {
  const threshold = inverse ? 50 : 50;
  const isGood = inverse ? value < threshold : value > threshold;
  if (isGood) return 'text-emerald-400';
  if (!isGood && Math.abs(value - threshold) < 10) return 'text-yellow-400';
  return 'text-red-400';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

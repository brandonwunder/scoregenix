'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { cn } from '@/lib/utils';

export interface GameTimeProps {
  date: string | Date;
  variant?: 'full' | 'short' | 'relative';
  className?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL';
}

export function GameTime({ date, variant = 'short', className, status }: GameTimeProps) {
  const gameDate = typeof date === 'string' ? new TZDate(date, 'America/New_York') : date;

  if (status === 'FINAL') {
    return <span className={cn('text-white/50', className)}>Final</span>;
  }

  if (status === 'IN_PROGRESS') {
    return <span className={cn('font-medium text-emerald-400', className)}>Live Now</span>;
  }

  let formatted: string;
  switch (variant) {
    case 'full':
      formatted = format(gameDate, "MMMM do 'at' h:mm a");
      break;
    case 'relative':
      if (isToday(gameDate)) {
        formatted = `Today at ${format(gameDate, 'h:mm a')}`;
      } else if (isTomorrow(gameDate)) {
        formatted = `Tomorrow at ${format(gameDate, 'h:mm a')}`;
      } else {
        formatted = format(gameDate, "MMM d 'at' h:mm a");
      }
      break;
    case 'short':
    default:
      formatted = format(gameDate, "MMM d 'at' h:mm a");
      break;
  }

  return <span className={cn('text-white/70', className)}>{formatted}</span>;
}

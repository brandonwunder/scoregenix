'use client';

import { cn } from '@/lib/utils';
import { getSportConfig } from '@/lib/sport-config';
import Image from 'next/image';
import { useState } from 'react';
import { FootballIcon, TrophyIcon, CircleIcon, DiscIcon, TargetIcon } from 'lucide-react';

export interface SportLogoProps {
  sportSlug: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  xs: { logo: 16, icon: 12, text: 'text-[10px]', container: 'h-4 w-4' },
  sm: { logo: 24, icon: 16, text: 'text-xs', container: 'h-6 w-6' },
  md: { logo: 40, icon: 24, text: 'text-sm', container: 'h-10 w-10' },
  lg: { logo: 56, icon: 32, text: 'text-base', container: 'h-14 w-14' },
};

export function SportLogo({ sportSlug, size = 'md', showName = false, className }: SportLogoProps) {
  const [imageError, setImageError] = useState(false);
  const config = getSportConfig(sportSlug);
  const sizeConfig = SIZE_CONFIG[size];
  if (!config) return null;

  const IconComponent = getFallbackIcon(sportSlug);
  const logoElement = !imageError ? (
    <div className={cn('relative overflow-hidden rounded', sizeConfig.container)}>
      <Image
        src={config.logoUrl}
        alt={`${config.displayName} logo`}
        width={sizeConfig.logo}
        height={sizeConfig.logo}
        className="object-contain"
        onError={() => setImageError(true)}
        priority={size === 'lg'}
      />
    </div>
  ) : (
    <div className={cn('flex items-center justify-center rounded', sizeConfig.container)} style={{ backgroundColor: `${config.color}20` }}>
      <IconComponent size={sizeConfig.icon} className="shrink-0" style={{ color: config.color }} />
    </div>
  );

  if (!showName) return <div className={className}>{logoElement}</div>;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {logoElement}
      <span className={cn('font-medium', sizeConfig.text)}>{config.displayName}</span>
    </div>
  );
}

function getFallbackIcon(sportSlug: string) {
  switch (sportSlug) {
    case 'nfl':
    case 'college-football':
      return FootballIcon;
    case 'nba':
    case 'mens-college-basketball':
      return TrophyIcon;
    case 'mlb':
      return TargetIcon;
    case 'nhl':
      return DiscIcon;
    case 'mls':
      return CircleIcon;
    default:
      return CircleIcon;
  }
}

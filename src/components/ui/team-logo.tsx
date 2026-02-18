'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getTeamColor, getTeamColorWithOpacity } from '@/lib/team-colors';
import { useState } from 'react';

export interface TeamLogoProps {
  src: string;
  abbr: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTeamColor?: boolean;
  league?: string;
  className?: string;
}

const SIZE_CONFIG = {
  xs: { dimension: 20, className: 'h-5 w-5', text: 'text-[8px]' },
  sm: { dimension: 24, className: 'h-6 w-6', text: 'text-[10px]' },
  md: { dimension: 40, className: 'h-10 w-10', text: 'text-xs' },
  lg: { dimension: 56, className: 'h-14 w-14', text: 'text-sm' },
};

export function TeamLogo({ src, abbr, alt, size = 'md', showTeamColor = false, league = 'nfl', className }: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];
  const teamColor = showTeamColor ? getTeamColor(abbr, league) : undefined;

  return (
    <div className={cn('relative shrink-0', sizeConfig.className, className)}>
      {!imageError ? (
        <Image
          src={src}
          alt={alt || `${abbr} logo`}
          width={sizeConfig.dimension}
          height={sizeConfig.dimension}
          className={cn('object-contain', sizeConfig.className)}
          onError={() => setImageError(true)}
          priority={size === 'lg'}
        />
      ) : (
        <div
          className={cn('flex items-center justify-center rounded-full font-bold text-white', sizeConfig.className, sizeConfig.text)}
          style={{
            backgroundColor: teamColor ? getTeamColorWithOpacity(teamColor, 0.2) : 'rgba(255, 255, 255, 0.1)',
            border: teamColor ? `1px solid ${getTeamColorWithOpacity(teamColor, 0.3)}` : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {abbr}
        </div>
      )}
    </div>
  );
}

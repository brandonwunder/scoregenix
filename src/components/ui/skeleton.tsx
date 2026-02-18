'use client';

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({
  className,
  shimmer = true,
  style,
  ...props
}: SkeletonProps) {
  if (shimmer) {
    return (
      <motion.div
        data-slot="skeleton"
        className={cn(
          "relative overflow-hidden rounded-md bg-white/10",
          className
        )}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200% 100%',
          ...style,
        }}
        {...(props as any)} // Type assertion to avoid conflict between React and framer-motion event handlers
      />
    );
  }

  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      style={style}
      {...props}
    />
  );
}

export { Skeleton }

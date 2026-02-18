'use client';

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.ComponentProps<"div"> & { shimmer?: boolean }) {
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
        }}
        {...props}
      />
    );
  }

  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton }

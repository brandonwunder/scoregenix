'use client';

import { motion } from 'framer-motion';

export interface SuccessCheckProps {
  size?: number;
  color?: string;
  className?: string;
}

export function SuccessCheck({ size = 52, color = '#34d399', className }: SuccessCheckProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" className={className}>
      <motion.circle
        cx="26" cy="26" r="25" fill="none" stroke={color} strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.path
        fill="none" stroke={color} strokeWidth="3" d="M14 27l8 8 16-16"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className}>
      <motion.circle
        cx="10" cy="10" r="9" fill="none" stroke="#34d399" strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        fill="none" stroke="#34d399" strokeWidth="2" d="M5 10l3 3 7-7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      />
    </svg>
  );
}

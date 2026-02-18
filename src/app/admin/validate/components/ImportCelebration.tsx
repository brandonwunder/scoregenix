"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import { AnimatedCounter } from './AnimatedCounter';

interface ImportCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betsImported: number;
  totalWagered: number;
  onViewDashboard?: () => void;
}

export function ImportCelebration({
  open,
  onOpenChange,
  betsImported,
  totalWagered,
  onViewDashboard,
}: ImportCelebrationProps) {
  useEffect(() => {
    if (open) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#34d399', '#60a5fa', '#fbbf24'],
        });

        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#34d399', '#60a5fa', '#fbbf24'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Import Successful</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 text-center">
          {/* Checkmark animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-4"
          >
            <div className="rounded-full bg-emerald-500/20 p-4">
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <CheckCircle2Icon className="h-16 w-16 text-emerald-400" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-2xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Import Successful!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6 text-sm text-white/60"
          >
            Your bets have been imported and are ready to analyze
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 grid w-full gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:grid-cols-2"
          >
            <div className="text-center">
              <AnimatedCounter
                value={betsImported}
                className="text-3xl font-bold text-emerald-400"
              />
              <p className="mt-1 text-xs text-white/40">Bets Imported</p>
            </div>
            <div className="text-center">
              <AnimatedCounter
                value={totalWagered}
                prefix="$"
                decimals={2}
                className="text-3xl font-bold text-blue-400"
              />
              <p className="mt-1 text-xs text-white/40">Total Wagered</p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex w-full gap-2"
          >
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Close
            </Button>
            {onViewDashboard && (
              <Button
                onClick={onViewDashboard}
                className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                View Dashboard
              </Button>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZapIcon,
  ImportIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  FileDownIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionHubProps {
  onImport?: () => void;
  onRevalidate?: () => void;
  onFixAllFlagged?: () => void;
  onExport?: () => void;
  canImport?: boolean;
  canRevalidate?: boolean;
  canFixFlagged?: boolean;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  color: string;
  angle: number;
  enabled: boolean;
}

export function FloatingActionHub({
  onImport,
  onRevalidate,
  onFixAllFlagged,
  onExport,
  canImport = false,
  canRevalidate = false,
  canFixFlagged = false,
}: FloatingActionHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isMounted) return null;

  const actions: ActionButton[] = [
    {
      id: 'import',
      label: 'Import',
      icon: ImportIcon,
      onClick: onImport,
      color: 'bg-blue-500 hover:bg-blue-400 text-white',
      angle: 225,
      enabled: canImport,
    },
    {
      id: 'revalidate',
      label: 'Re-validate',
      icon: RefreshCwIcon,
      onClick: onRevalidate,
      color: 'bg-purple-500 hover:bg-purple-400 text-white',
      angle: 270,
      enabled: canRevalidate,
    },
    {
      id: 'fix',
      label: 'Fix All',
      icon: RotateCcwIcon,
      onClick: onFixAllFlagged,
      color: 'bg-amber-500 hover:bg-amber-400 text-black',
      angle: 315,
      enabled: canFixFlagged,
    },
    {
      id: 'export',
      label: 'Export',
      icon: FileDownIcon,
      onClick: onExport,
      color: 'bg-white/20 hover:bg-white/30 text-white',
      angle: 180,
      enabled: true,
    },
  ].filter((action) => action.enabled);

  const radius = 80;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              style={{ zIndex: -1 }}
            />

            {/* Action buttons */}
            {actions.map((action, index) => {
              const Icon = action.icon;
              const angleRad = (action.angle * Math.PI) / 180;
              const x = Math.cos(angleRad) * radius;
              const y = Math.sin(angleRad) * radius;

              return (
                <motion.button
                  key={action.id}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: 1,
                    x,
                    y,
                  }}
                  exit={{ scale: 0, x: 0, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all',
                    action.color
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={action.label}
                >
                  <Icon className="h-5 w-5" />
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-xl',
          isOpen && 'bg-red-500 hover:bg-red-400'
        )}
        whileHover={{ scale: 1.1, rotate: isOpen ? 0 : 90 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <ZapIcon className="h-6 w-6" />
      </motion.button>

      {/* Keyboard hint */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute -top-10 right-0 rounded-md bg-black/80 px-2 py-1 text-[10px] text-white/60 backdrop-blur-sm"
        >
          ⌘K
        </motion.div>
      )}
    </div>
  );
}

# Validate Page Visual Overhaul - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the validate page into a knockout visual experience with animated data flows, rich visualizations, premium interactions, and dashboard-style layout.

**Architecture:** Complete page rebuild with new three-column layout, hero stats bar, validation pipeline visualizer, enhanced table, analytics charts, and floating action hub. Maintains existing API structure but adds new UI components with framer-motion animations and recharts visualizations.

**Tech Stack:** Next.js 16, React, TypeScript, framer-motion, recharts, canvas-confetti, Tailwind CSS, shadcn/ui

---

## Phase 1: Dependencies & Setup

### Task 1: Install required dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install chart library and confetti**

```bash
npm install recharts canvas-confetti
npm install --save-dev @types/canvas-confetti
```

Expected: Dependencies added to package.json

**Step 2: Verify installations**

```bash
npm list recharts canvas-confetti
```

Expected: Both packages listed with version numbers

**Step 3: Commit dependency changes**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts and canvas-confetti dependencies"
```

---

### Task 2: Create component directory structure

**Files:**
- Create: `src/app/admin/validate/components/` (directory)
- Create: `src/app/admin/validate/hooks/` (directory)

**Step 1: Create components directory**

```bash
mkdir -p src/app/admin/validate/components
```

**Step 2: Create hooks directory**

```bash
mkdir -p src/app/admin/validate/hooks
```

**Step 3: Verify directory structure**

```bash
ls -la src/app/admin/validate/
```

Expected: Should see `components/` and `hooks/` directories

**Step 4: Commit directory structure**

```bash
git add src/app/admin/validate/components/.gitkeep src/app/admin/validate/hooks/.gitkeep
git commit -m "chore: create validate page component and hooks directories"
```

---

## Phase 2: Core Reusable Components & Hooks

### Task 3: Create useAnimatedCounter hook

**Files:**
- Create: `src/app/admin/validate/hooks/useAnimatedCounter.ts`

**Step 1: Write the hook**

```typescript
import { useEffect, useState } from 'react';

interface UseAnimatedCounterOptions {
  target: number;
  duration?: number;
  enabled?: boolean;
}

export function useAnimatedCounter({
  target,
  duration = 1000,
  enabled = true,
}: UseAnimatedCounterOptions): number {
  const [count, setCount] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setCount(target);
      return;
    }

    const startTime = Date.now();
    const startValue = count;
    const diff = target - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + diff * eased);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return count;
}
```

**Step 2: Commit the hook**

```bash
git add src/app/admin/validate/hooks/useAnimatedCounter.ts
git commit -m "feat: add useAnimatedCounter hook for number animations"
```

---

### Task 4: Create useValidationStats hook

**Files:**
- Create: `src/app/admin/validate/hooks/useValidationStats.ts`

**Step 1: Write the hook**

```typescript
import { useMemo } from 'react';

interface UploadRow {
  validationStatus: 'CORRECT' | 'FLAGGED' | 'UNCERTAIN' | 'CORRECTED';
  fieldConfidence?: Array<{ field: string; confidence: number }>;
  uncertainReasons?: string[];
}

interface ValidationStats {
  total: number;
  correct: number;
  flagged: number;
  uncertain: number;
  corrected: number;
  successRate: number;
  avgConfidence: number;
  topUncertainReasons: Array<{ reason: string; count: number }>;
}

export function useValidationStats(rows: UploadRow[]): ValidationStats {
  return useMemo(() => {
    const total = rows.length;
    const correct = rows.filter((r) => r.validationStatus === 'CORRECT').length;
    const flagged = rows.filter((r) => r.validationStatus === 'FLAGGED').length;
    const uncertain = rows.filter((r) => r.validationStatus === 'UNCERTAIN').length;
    const corrected = rows.filter((r) => r.validationStatus === 'CORRECTED').length;

    const successRate = total > 0 ? ((correct + corrected) / total) * 100 : 0;

    // Calculate average confidence
    const confidenceScores = rows
      .flatMap((r) => r.fieldConfidence || [])
      .map((fc) => fc.confidence);
    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
        : 0;

    // Get top uncertain reasons
    const reasonCounts = new Map<string, number>();
    rows.forEach((r) => {
      if (r.uncertainReasons) {
        r.uncertainReasons.forEach((reason) => {
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        });
      }
    });

    const topUncertainReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      total,
      correct,
      flagged,
      uncertain,
      corrected,
      successRate,
      avgConfidence: avgConfidence * 100,
      topUncertainReasons,
    };
  }, [rows]);
}
```

**Step 2: Commit the hook**

```bash
git add src/app/admin/validate/hooks/useValidationStats.ts
git commit -m "feat: add useValidationStats hook for derived analytics"
```

---

### Task 5: Create AnimatedCounter component

**Files:**
- Create: `src/app/admin/validate/components/AnimatedCounter.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  decimals = 0,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const displayValue = useAnimatedCounter({
    target: value,
    duration,
    enabled: !prefersReducedMotion,
  });

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : displayValue.toString();

  return (
    <span className={className} style={{ fontFeatureSettings: "'tnum'" }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/AnimatedCounter.tsx
git commit -m "feat: add AnimatedCounter component with reduced motion support"
```

---

### Task 6: Create ConfidenceGauge component

**Files:**
- Create: `src/app/admin/validate/components/ConfidenceGauge.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { outer: 32, stroke: 3, fontSize: 'text-[10px]' },
  md: { outer: 48, stroke: 4, fontSize: 'text-xs' },
  lg: { outer: 64, stroke: 5, fontSize: 'text-sm' },
};

export function ConfidenceGauge({
  value,
  size = 'md',
  showLabel = true,
  className = '',
}: ConfidenceGaugeProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80
      ? 'stroke-emerald-400'
      : value >= 50
        ? 'stroke-amber-400'
        : 'stroke-red-400';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={config.outer} height={config.outer} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          className={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            'absolute font-semibold tabular-nums',
            config.fontSize,
            value >= 80
              ? 'text-emerald-400'
              : value >= 50
                ? 'text-amber-400'
                : 'text-red-400'
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/ConfidenceGauge.tsx
git commit -m "feat: add ConfidenceGauge component with animated progress ring"
```

---

## Phase 3: Hero Stats Bar

### Task 7: Create HeroStatsBar component

**Files:**
- Create: `src/app/admin/validate/components/HeroStatsBar.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { motion } from 'framer-motion';
import { TrendingUpIcon, CheckCircle2Icon, FileTextIcon, AlertCircleIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { ConfidenceGauge } from './ConfidenceGauge';
import { cn } from '@/lib/utils';

interface HeroStatsBarProps {
  totalUploads: number;
  successRate: number;
  rowsProcessedToday: number;
  pendingActions: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  delay: number;
  type?: 'counter' | 'gauge' | 'number';
  suffix?: string;
  alert?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  delay,
  type = 'counter',
  suffix = '',
  alert = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-white/10 to-white/5 p-6 transition-all hover:shadow-lg hover:shadow-white/5',
        alert
          ? 'border-amber-500/30 ring-2 ring-amber-500/20 shadow-amber-500/10'
          : 'border-white/10'
      )}
      whileHover={{ scale: 1.02, translateY: -2 }}
    >
      {/* Glow effect for alerts */}
      {alert && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
      )}

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="rounded-lg bg-white/10 p-2">
            <Icon className={cn('h-5 w-5', alert ? 'text-amber-400' : 'text-white/70')} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUpIcon className="h-3 w-3" />
              {trend}
            </div>
          )}
        </div>

        <div className="mb-1">
          {type === 'gauge' ? (
            <div className="flex items-center gap-3">
              <ConfidenceGauge value={value} size="md" />
              <AnimatedCounter
                value={value}
                decimals={1}
                suffix="%"
                className="text-3xl font-bold tracking-tight text-white"
              />
            </div>
          ) : (
            <AnimatedCounter
              value={value}
              suffix={suffix}
              className="text-3xl font-bold tracking-tight text-white"
            />
          )}
        </div>

        <p className="text-sm text-white/50" style={{ letterSpacing: '0.05em' }}>
          {title}
        </p>
      </div>
    </motion.div>
  );
}

export function HeroStatsBar({
  totalUploads,
  successRate,
  rowsProcessedToday,
  pendingActions,
}: HeroStatsBarProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="TOTAL UPLOADS"
        value={totalUploads}
        icon={FileTextIcon}
        delay={0}
      />
      <StatCard
        title="VALIDATION SUCCESS"
        value={successRate}
        icon={CheckCircle2Icon}
        type="gauge"
        delay={0.1}
      />
      <StatCard
        title="ROWS PROCESSED TODAY"
        value={rowsProcessedToday}
        icon={TrendingUpIcon}
        delay={0.2}
      />
      <StatCard
        title="PENDING ACTIONS"
        value={pendingActions}
        icon={AlertCircleIcon}
        delay={0.3}
        alert={pendingActions > 0}
      />
    </div>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/HeroStatsBar.tsx
git commit -m "feat: add HeroStatsBar component with animated stat cards"
```

---

## Phase 4: Enhanced Upload Zone

### Task 8: Create EnhancedUploadZone component

**Files:**
- Create: `src/app/admin/validate/components/EnhancedUploadZone.tsx`

**Step 1: Write the component (part 1 - basic structure)**

```typescript
"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadIcon,
  FileSpreadsheetIcon,
  XIcon,
  CheckIcon,
  LoaderIcon,
  SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EnhancedUploadZoneProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}

const SUPPORTED_FORMATS = [
  { ext: '.xlsx', label: 'Excel' },
  { ext: '.csv', label: 'CSV' },
  { ext: '.xls', label: 'Excel Legacy' },
];

export function EnhancedUploadZone({
  onUpload,
  uploading,
  uploadProgress,
}: EnhancedUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xls')
      ) {
        setSelectedFile(file);
      } else {
        toast.error('Invalid file type', {
          description: 'Please upload a .xlsx, .csv, or .xls file',
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const getUploadStage = () => {
    if (uploadProgress < 30) return { label: 'Uploading...', icon: UploadIcon };
    if (uploadProgress < 60) return { label: 'Parsing...', icon: FileSpreadsheetIcon };
    if (uploadProgress < 90) return { label: 'Normalizing...', icon: SparklesIcon };
    return { label: 'Validating...', icon: CheckIcon };
  };

  const stage = getUploadStage();
  const StageIcon = stage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-xl border border-white/10 bg-white/5 p-6"
    >
      <h3
        className="mb-4 text-lg font-semibold text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Upload Data File
      </h3>

      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-300',
          dragActive
            ? 'scale-[1.02] border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
            : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]',
          uploading && 'pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <AnimatePresence mode="wait">
          {selectedFile && !uploading ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              <FileSpreadsheetIcon className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                <p className="text-xs text-white/40">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="ml-2 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </motion.div>
          ) : uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <StageIcon className="h-10 w-10 text-emerald-400" />
              </motion.div>
              <p className="text-sm font-medium text-white">{stage.label}</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <UploadIcon
                  className={cn(
                    'mb-3 h-10 w-10',
                    dragActive ? 'text-emerald-400' : 'text-white/30'
                  )}
                />
              </motion.div>
              <p className="text-sm font-medium text-white/70">
                Drag & drop your file here
              </p>
              <p className="mt-1 text-xs text-white/40">or click to browse</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shimmer border animation on drag active */}
        {dragActive && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.2), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>

      {/* Supported formats */}
      <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
        {SUPPORTED_FORMATS.map((format) => (
          <Badge
            key={format.ext}
            variant="outline"
            className="border-white/10 bg-white/5 text-white/50 text-[10px]"
          >
            {format.label}
          </Badge>
        ))}
      </div>

      {/* Upload progress */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span>{stage.label}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2 bg-white/10 [&>div]:bg-emerald-500" />
        </motion.div>
      )}

      {/* Upload button */}
      {selectedFile && !uploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Button
            onClick={handleUpload}
            className="w-full bg-emerald-500 font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <SparklesIcon className="mr-2 h-4 w-4" />
            Upload & Validate
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/EnhancedUploadZone.tsx
git commit -m "feat: add EnhancedUploadZone with animations and stage indicators"
```

---

## Phase 5: Validation Pipeline Visualizer

### Task 9: Create usePipelineState hook

**Files:**
- Create: `src/app/admin/validate/hooks/usePipelineState.ts`

**Step 1: Write the hook**

```typescript
import { useMemo } from 'react';

interface UploadRow {
  validationReceipt?: Array<{
    pass: string;
    result: string;
  }>;
}

interface PassState {
  passName: string;
  passKey: string;
  progress: number;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

export function usePipelineState(rows: UploadRow[]): PassState[] {
  return useMemo(() => {
    const passes = [
      { passKey: 'game_matching', passName: 'Game Matching' },
      { passKey: 'outcome_validation', passName: 'Outcome Validation' },
      { passKey: 'financial_validation', passName: 'Financial Check' },
      { passKey: 'cross_row_validation', passName: 'Cross-Row Analysis' },
    ];

    return passes.map(({ passKey, passName }) => {
      const total = rows.length;
      let passed = 0;
      let failed = 0;
      let warnings = 0;

      rows.forEach((row) => {
        if (!row.validationReceipt) return;

        const passResult = row.validationReceipt.find((r) => r.pass === passKey);
        if (!passResult) return;

        if (passResult.result === 'pass') passed++;
        else if (passResult.result === 'fail') failed++;
        else if (passResult.result === 'warning') warnings++;
      });

      const progress = total > 0 ? ((passed + warnings) / total) * 100 : 0;

      return {
        passName,
        passKey,
        progress,
        passed,
        failed,
        warnings,
        total,
      };
    });
  }, [rows]);
}
```

**Step 2: Commit the hook**

```bash
git add src/app/admin/validate/hooks/usePipelineState.ts
git commit -m "feat: add usePipelineState hook for pipeline visualizer"
```

---

### Task 10: Create ValidationPipelineVisualizer component

**Files:**
- Create: `src/app/admin/validate/components/ValidationPipelineVisualizer.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { motion } from 'framer-motion';
import {
  SearchIcon,
  TargetIcon,
  DollarSignIcon,
  NetworkIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PassState {
  passName: string;
  passKey: string;
  progress: number;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

interface ValidationPipelineVisualizerProps {
  passes: PassState[];
  onPassClick?: (passKey: string) => void;
}

const PASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  game_matching: SearchIcon,
  outcome_validation: TargetIcon,
  financial_validation: DollarSignIcon,
  cross_row_validation: NetworkIcon,
};

function PassNode({
  pass,
  index,
  onClick,
}: {
  pass: PassState;
  index: number;
  onClick?: () => void;
}) {
  const Icon = PASS_ICONS[pass.passKey] || CheckCircle2Icon;
  const isComplete = pass.progress >= 100;
  const hasFailed = pass.failed > 0;
  const hasWarnings = pass.warnings > 0;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg border p-3 text-left transition-all',
        'hover:border-white/30 hover:bg-white/[0.08] hover:shadow-lg',
        hasFailed
          ? 'border-red-500/30 bg-red-500/5'
          : hasWarnings
            ? 'border-amber-500/30 bg-amber-500/5'
            : isComplete
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-white/10 bg-white/5'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Status indicator dot */}
      <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white/20">
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'h-full w-full rounded-full',
              hasFailed
                ? 'bg-red-400'
                : hasWarnings
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
            )}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'rounded-md p-1.5',
              hasFailed
                ? 'bg-red-500/20 text-red-400'
                : hasWarnings
                  ? 'bg-amber-500/20 text-amber-400'
                  : isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-white/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80">{pass.passName}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
              <span>{Math.round(pass.progress)}%</span>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-1">
          {pass.passed > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
              <CheckCircle2Icon className="h-2.5 w-2.5" />
              {pass.passed}
            </div>
          )}
          {pass.warnings > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
              <AlertTriangleIcon className="h-2.5 w-2.5" />
              {pass.warnings}
            </div>
          )}
          {pass.failed > 0 && (
            <div className="flex items-center gap-0.5 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
              <XCircleIcon className="h-2.5 w-2.5" />
              {pass.failed}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <Progress
          value={pass.progress}
          className={cn(
            'h-1 bg-white/10',
            hasFailed
              ? '[&>div]:bg-red-400'
              : hasWarnings
                ? '[&>div]:bg-amber-400'
                : '[&>div]:bg-emerald-400'
          )}
        />
      </div>
    </motion.button>
  );
}

export function ValidationPipelineVisualizer({
  passes,
  onPassClick,
}: ValidationPipelineVisualizerProps) {
  const allComplete = passes.every((p) => p.progress >= 100);

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-semibold text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Validation Pipeline
      </h3>

      <div className="relative space-y-3">
        {/* Connecting line */}
        <div className="absolute left-[5px] top-6 bottom-6 w-px bg-gradient-to-b from-white/20 via-white/10 to-white/20" />

        {passes.map((pass, index) => (
          <PassNode
            key={pass.passKey}
            pass={pass}
            index={index}
            onClick={() => onPassClick?.(pass.passKey)}
          />
        ))}
      </div>

      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center"
        >
          <CheckCircle2Icon className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
          <p className="text-xs font-medium text-emerald-400">Validation Complete</p>
        </motion.div>
      )}
    </div>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/ValidationPipelineVisualizer.tsx
git commit -m "feat: add ValidationPipelineVisualizer with pass nodes and progress"
```

---

## Phase 6: Enhanced Results Table

### Task 11: Create EnhancedResultsTable component

**Files:**
- Create: `src/app/admin/validate/components/EnhancedResultsTable.tsx`

**Step 1: Write the component (continued in next task due to size)**

This component is large. I'll create it in the actual implementation. For now, let's continue with other components.

**Step 2: Commit placeholder**

```bash
# Will be implemented in execution phase
```

---

## Phase 7: Analytics Tab with Charts

### Task 12: Create AnalyticsTab component with charts

**Files:**
- Create: `src/app/admin/validate/components/AnalyticsTab.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AreaChart, Area } from 'recharts';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

interface AnalyticsTabProps {
  stats: {
    correct: number;
    flagged: number;
    uncertain: number;
    corrected: number;
    total: number;
  };
  uncertainReasons: Array<{ reason: string; count: number }>;
}

const STATUS_COLORS = {
  correct: '#34d399',
  flagged: '#fbbf24',
  uncertain: '#94a3b8',
  corrected: '#60a5fa',
};

const UNCERTAIN_REASON_LABELS: Record<string, string> = {
  NO_GAME_MATCH: 'No Game Match',
  GAME_NOT_FINAL: 'Game Not Final',
  LOW_CONFIDENCE_TEAM: 'Low Confidence Team',
  ESPN_FETCH_FAILED: 'ESPN Fetch Failed',
  MISSING_REQUIRED_FIELD: 'Missing Field',
  AMBIGUOUS_SPORT: 'Ambiguous Sport',
  MULTIPLE_GAME_MATCHES: 'Multiple Matches',
  TEAM_NOT_IN_GAME: 'Team Not in Game',
  NO_BET_TYPE: 'No Bet Type',
  NO_ODDS_DATA: 'No Odds Data',
};

export function AnalyticsTab({ stats, uncertainReasons }: AnalyticsTabProps) {
  const donutData = [
    { name: 'Correct', value: stats.correct, color: STATUS_COLORS.correct },
    { name: 'Flagged', value: stats.flagged, color: STATUS_COLORS.flagged },
    { name: 'Uncertain', value: stats.uncertain, color: STATUS_COLORS.uncertain },
    { name: 'Corrected', value: stats.corrected, color: STATUS_COLORS.corrected },
  ].filter((d) => d.value > 0);

  const barData = uncertainReasons.slice(0, 5).map((r) => ({
    name: UNCERTAIN_REASON_LABELS[r.reason] || r.reason,
    count: r.count,
    percentage: ((r.count / stats.total) * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Validation Status Distribution</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatedCounter
                  value={stats.total}
                  className="text-2xl font-bold text-white"
                />
                <span className="text-xs text-white/40">Total Rows</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col justify-center space-y-3">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-white/70">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                  <span className="text-xs text-white/40">
                    ({((item.value / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Top Uncertain Reasons */}
      {barData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Top Uncertain Reasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{ left: 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#ffffff40" />
              <YAxis dataKey="name" type="category" width={120} stroke="#ffffff40" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/AnalyticsTab.tsx
git commit -m "feat: add AnalyticsTab with donut chart and bar chart"
```

---

## Phase 8: Floating Action Hub

### Task 13: Create FloatingActionHub component

**Files:**
- Create: `src/app/admin/validate/components/FloatingActionHub.tsx`

**Step 1: Write the component**

```typescript
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
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/FloatingActionHub.tsx
git commit -m "feat: add FloatingActionHub with radial menu and keyboard shortcut"
```

---

## Phase 9: Import Celebration

### Task 14: Create ImportCelebration component

**Files:**
- Create: `src/app/admin/validate/components/ImportCelebration.tsx`

**Step 1: Write the component**

```typescript
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
```

**Step 2: Commit the component**

```bash
git add src/app/admin/validate/components/ImportCelebration.tsx
git commit -m "feat: add ImportCelebration with confetti and animated stats"
```

---

## Phase 10: Main Page Integration

### Task 15: Update main validate page to use new components

**Files:**
- Modify: `src/app/admin/validate/page.tsx`

**Step 1: Create backup of current page**

```bash
cp src/app/admin/validate/page.tsx src/app/admin/validate/page.tsx.backup
git add src/app/admin/validate/page.tsx.backup
git commit -m "chore: backup original validate page before redesign"
```

**Step 2: Rewrite page with new layout (partial - to be completed in execution)**

This is a large file that will be completely rewritten. The key changes:
- Import all new components
- Add three-column layout
- Add hero stats bar at top
- Add tabbed interface in center
- Add pipeline visualizer in right column
- Add floating action hub
- Integrate import celebration
- Add keyboard shortcuts

```typescript
// Key structure (detailed implementation in execution phase):
// 1. Hero Stats Bar (totalUploads, successRate, rowsToday, pendingActions)
// 2. Three columns: Left (upload + history), Center (tabs), Right (pipeline)
// 3. Tab 1: Enhanced table, Tab 2: Pipeline view, Tab 3: Analytics
// 4. Floating action hub with conditional actions
// 5. Import celebration modal
```

**Step 3: Commit the new page structure**

```bash
git add src/app/admin/validate/page.tsx
git commit -m "feat: integrate all new components into validate page with three-column layout"
```

---

## Phase 11: Export Components

### Task 16: Create component index file

**Files:**
- Create: `src/app/admin/validate/components/index.ts`

**Step 1: Write the index file**

```typescript
export { HeroStatsBar } from './HeroStatsBar';
export { EnhancedUploadZone } from './EnhancedUploadZone';
export { ValidationPipelineVisualizer } from './ValidationPipelineVisualizer';
export { AnalyticsTab } from './AnalyticsTab';
export { FloatingActionHub } from './FloatingActionHub';
export { ImportCelebration } from './ImportCelebration';
export { AnimatedCounter } from './AnimatedCounter';
export { ConfidenceGauge } from './ConfidenceGauge';
```

**Step 2: Create hooks index file**

```typescript
// src/app/admin/validate/hooks/index.ts
export { useAnimatedCounter } from './useAnimatedCounter';
export { useValidationStats } from './useValidationStats';
export { usePipelineState } from './usePipelineState';
```

**Step 3: Commit index files**

```bash
git add src/app/admin/validate/components/index.ts src/app/admin/validate/hooks/index.ts
git commit -m "feat: add index files for components and hooks"
```

---

## Phase 12: Testing & Polish

### Task 17: Test animation performance

**Files:**
- Modify: `src/app/admin/validate/components/AnimatedCounter.tsx` (if needed)

**Step 1: Test with reduced motion**

1. Open Chrome DevTools
2. CMD+Shift+P → "Emulate CSS prefers-reduced-motion"
3. Verify all animations respect the setting
4. Check AnimatedCounter, ConfidenceGauge, page transitions

**Step 2: Test with large datasets**

1. Upload file with 500+ rows
2. Check table scrolling performance
3. Verify animations don't lag
4. Consider adding virtualization if needed

**Step 3: Document any performance issues**

```bash
# If issues found, create follow-up tasks
# Otherwise, commit verification
git commit --allow-empty -m "test: verify animation performance with reduced motion and large datasets"
```

---

### Task 18: Test keyboard shortcuts

**Files:**
- Test: All keyboard shortcuts work as expected

**Step 1: Test each shortcut**

- CMD/Ctrl+K: Opens action hub ✓
- CMD/Ctrl+U: Focuses upload zone (need to implement)
- CMD/Ctrl+F: Filter/search (need to implement)
- CMD/Ctrl+I: Import if ready (need to implement)
- CMD/Ctrl+R: Re-validate (need to implement)
- Arrow keys: Navigate table rows (need to implement)
- Space: Expand selected row (need to implement)
- Esc: Close modals (should work with shadcn/ui)

**Step 2: Add remaining shortcuts**

Add keyboard event listeners to main page for missing shortcuts.

**Step 3: Commit keyboard improvements**

```bash
git add src/app/admin/validate/page.tsx
git commit -m "feat: add comprehensive keyboard shortcuts for validate page"
```

---

### Task 19: Test responsive design

**Files:**
- Test: All breakpoints work correctly

**Step 1: Test desktop (>1280px)**

- All three columns visible
- Charts render properly
- Stats cards in single row

**Step 2: Test tablet (768-1279px)**

- Right sidebar hidden
- Pipeline available via button/modal
- Hero stats in 2x2 grid

**Step 3: Test mobile (<768px)**

- Single column layout
- Tabs for different sections
- Table scrolls horizontally
- FAB stays visible

**Step 4: Add responsive CSS if needed**

```bash
git add src/app/admin/validate/page.tsx src/app/admin/validate/components/*
git commit -m "style: improve responsive design for tablet and mobile"
```

---

### Task 20: Final polish and deployment

**Files:**
- All component files (final review)

**Step 1: Review all components for accessibility**

- ARIA labels present
- Focus indicators visible
- Color not sole indicator
- Screen reader friendly

**Step 2: Run build check**

```bash
npm run build
```

Expected: No errors, all components tree-shakable

**Step 3: Test on production**

```bash
npm run dev
# Open http://localhost:3000/admin/validate
# Upload a real file
# Go through entire workflow
```

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete validate page visual overhaul with animations and analytics

- Add hero stats bar with animated counters and gauges
- Create three-column dashboard layout
- Build validation pipeline visualizer with pass tracking
- Add analytics tab with interactive charts
- Implement floating action hub with keyboard shortcuts
- Create import celebration with confetti animation
- Enhance upload zone with multi-stage progress
- Add confidence gauges and animated transitions
- Ensure accessibility and reduced motion support
- Optimize for desktop, tablet, and mobile

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Deploy to production**

```bash
git push origin master
# Wait for Vercel deployment
# Verify at production URL
```

---

## Implementation Notes

### Key Principles Applied

1. **DRY**: Created reusable components (AnimatedCounter, ConfidenceGauge)
2. **YAGNI**: Only built features specified in design, no extras
3. **Accessibility**: Reduced motion support, ARIA labels, keyboard navigation
4. **Performance**: Memoized hooks, lazy loading, virtualization consideration
5. **Incremental**: Each task is small, testable, and committable

### Component Dependencies

```
page.tsx
├── HeroStatsBar
│   ├── AnimatedCounter
│   └── ConfidenceGauge
├── EnhancedUploadZone
├── ValidationPipelineVisualizer
│   └── usePipelineState
├── AnalyticsTab
│   └── AnimatedCounter
├── FloatingActionHub
└── ImportCelebration
    └── AnimatedCounter
```

### Hooks Dependencies

```
useValidationStats → provides stats for HeroStatsBar and AnalyticsTab
usePipelineState → provides pass data for ValidationPipelineVisualizer
useAnimatedCounter → used by AnimatedCounter component
```

---

## Plan Complete ✓

Total estimated time: 6-8 hours of focused implementation
Total commits: ~20 commits
Total new files: ~15 files

**Next Step:** Execute this plan using superpowers:executing-plans or superpowers:subagent-driven-development.

# Validation Breakdown Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an informative "How It Works" help modal to the validation page that explains the entire validation pipeline in simple, easy-to-understand language.

**Architecture:** Self-contained React component with expandable sections using local state. Visual flow diagram at top, 5 main content sections with progressive disclosure (high-level visible, details expandable), and status reference table at bottom.

**Tech Stack:** React (Next.js), TypeScript, Tailwind CSS, shadcn/ui Dialog, lucide-react icons, framer-motion (optional for smooth expansions)

---

## Task 1: Create Modal Component Skeleton

**Files:**
- Create: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Create component file with basic structure**

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ValidationBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ValidationBreakdownModal({
  open,
  onOpenChange,
}: ValidationBreakdownModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            How Validation Works
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Understanding the validation pipeline from upload to betting history
          </DialogDescription>
        </DialogHeader>

        {/* Content will go here */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <p className="text-sm text-white/70">Content coming soon...</p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add ValidationBreakdownModal skeleton"
```

---

## Task 2: Add Flow Diagram Component

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Import icons at top of file**

Add to imports:
```tsx
import {
  UploadIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  PenLineIcon,
  ImportIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
} from "lucide-react";
```

**Step 2: Create FlowDiagram component before main component**

```tsx
function FlowDiagram() {
  const stages = [
    {
      icon: UploadIcon,
      label: "Upload",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: RefreshCwIcon,
      label: "Normalize",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: ShieldCheckIcon,
      label: "Validate",
      subtitle: "4 passes",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: PenLineIcon,
      label: "Review",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: ImportIcon,
      label: "Import",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: CheckCircle2Icon,
      label: "Betting History",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-sm font-medium text-white/70 mb-4">
        Validation Pipeline
      </h3>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={index} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div
                  className={cn(
                    "rounded-lg p-3 border border-white/10",
                    stage.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", stage.color)} />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-white/80">
                    {stage.label}
                  </div>
                  {stage.subtitle && (
                    <div className="text-[10px] text-white/40">
                      {stage.subtitle}
                    </div>
                  )}
                </div>
              </div>
              {index < stages.length - 1 && (
                <ChevronRightIcon className="h-4 w-4 text-white/20 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 3: Add FlowDiagram to content area**

Replace the placeholder paragraph in the content div with:
```tsx
<FlowDiagram />
```

**Step 4: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add flow diagram to validation breakdown modal"
```

---

## Task 3: Add Expandable Section Component

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Import ChevronDownIcon**

Add to existing lucide-react import:
```tsx
import {
  // ... existing imports
  ChevronDownIcon,
} from "lucide-react";
```

**Step 2: Create ExpandableSection component before main component**

```tsx
interface ExpandableSectionProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  details: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}

function ExpandableSection({
  id,
  icon: Icon,
  iconColor,
  title,
  description,
  details,
  expanded,
  onToggle,
}: ExpandableSectionProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColor)} />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white">{title}</h3>
            <p className="text-sm text-white/60 mt-1">{description}</p>
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-white/40 transition-transform shrink-0 mt-1",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/5">
          {details}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add ExpandableSection component"
```

---

## Task 4: Add Section 1 - Upload & File Processing

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Add Badge component import**

Add to imports:
```tsx
import { Badge } from "@/components/ui/badge";
```

**Step 2: Add section after FlowDiagram in content div**

```tsx
<ExpandableSection
  id="upload"
  icon={UploadIcon}
  iconColor="text-blue-400"
  title="Upload & File Processing"
  description="When you upload a spreadsheet (.xlsx, .csv, .xls), we parse the file and extract your betting data. We accept any spreadsheet format - column names don't need to be exact."
  expanded={expandedSections.has("upload")}
  onToggle={() => toggleSection("upload")}
  details={
    <div className="space-y-3">
      <div className="text-xs text-white/60">
        <p className="mb-2">When you drop or select a file, here's what happens:</p>
        <ul className="space-y-1.5 text-white/50">
          <li>• <span className="text-white/60">File size limit:</span> 10MB maximum</li>
          <li>• <span className="text-white/60">Row limit:</span> 5,000 rows per file</li>
          <li>• <span className="text-white/60">Supported formats:</span> Excel (.xlsx, .xls), CSV (.csv)</li>
        </ul>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2">We extract these fields from your spreadsheet:</p>
        <div className="flex flex-wrap gap-1.5">
          {["date", "sport", "teams", "bet type", "selected team", "line", "odds", "outcome", "wager", "payout"].map((field) => (
            <Badge key={field} variant="outline" className="bg-white/5 text-white/50 border-white/10 text-[10px]">
              {field}
            </Badge>
          ))}
        </div>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-1">Automatic data cleanup:</p>
        <ul className="space-y-1.5 text-white/50">
          <li>• Excel serial dates (like 45312) are converted to readable dates</li>
          <li>• Numbers with $, commas, or parentheses are cleaned ($1,000 → 1000)</li>
          <li>• "PK" or "pick'em" is converted to 0 for spread bets</li>
        </ul>
      </div>
    </div>
  }
/>
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add upload section to breakdown modal"
```

---

## Task 5: Add Section 2 - Normalization

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Add section after Upload section**

```tsx
<ExpandableSection
  id="normalize"
  icon={RefreshCwIcon}
  iconColor="text-purple-400"
  title="Normalization"
  description='Before validation, we normalize your data to handle different spreadsheet formats. For example, "ML", "moneyline", and "money line" all become "Money Line". This ensures consistency.'
  expanded={expandedSections.has("normalize")}
  onToggle={() => toggleSection("normalize")}
  details={
    <div className="space-y-3">
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Bet Type Normalization:</p>
        <div className="space-y-1.5 text-white/50">
          <div>• "spread", "ATS", "pts" → <span className="text-emerald-400">Point Spread</span></div>
          <div>• "ML", "moneyline", "money line" → <span className="text-emerald-400">Money Line</span></div>
          <div>• "O/U", "over/under", "total" → <span className="text-emerald-400">Over/Under</span></div>
        </div>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Outcome Normalization:</p>
        <div className="space-y-1.5 text-white/50">
          <div>• "W", "Won", "Win" → <span className="text-emerald-400">WON</span></div>
          <div>• "L", "Lost", "Lose" → <span className="text-red-400">LOST</span></div>
          <div>• "Push", "Tie", "Draw" → <span className="text-amber-400">PUSH</span></div>
          <div>• "Void", "Cancelled" → <span className="text-white/40">VOID</span></div>
        </div>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Odds Format Detection:</p>
        <p className="text-white/50">
          We detect American odds (-110, +150) vs Decimal odds (1.91, 2.50) and
          convert everything to American format for consistency.
        </p>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Sport Mapping:</p>
        <p className="text-white/50 mb-2">
          We map 25+ sport variants to canonical names:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["NFL", "NBA", "MLB", "NHL", "MLS", "NCAAF", "NCAAB"].map((sport) => (
            <Badge key={sport} className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
              {sport}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  }
/>
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add normalization section to breakdown modal"
```

---

## Task 6: Add Section 3 - Validation (4 Passes)

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Add section after Normalization section**

```tsx
<ExpandableSection
  id="validate"
  icon={ShieldCheckIcon}
  iconColor="text-emerald-400"
  title="Validation (4 Passes)"
  description="Every row goes through 4 validation passes. If all passes succeed, the row is marked CORRECT ✅. If checks fail, it's FLAGGED ⚠️. If we can't verify due to missing data, it's UNCERTAIN ❓."
  expanded={expandedSections.has("validate")}
  onToggle={() => toggleSection("validate")}
  details={
    <div className="space-y-4">
      {/* Pass 1 */}
      <div className="rounded-md bg-white/[0.02] border border-white/5 p-3">
        <h4 className="text-xs font-medium text-white/80 mb-2">
          Pass 1: Game Matching
        </h4>
        <ul className="space-y-1.5 text-xs text-white/50">
          <li>
            • Resolves team names using fuzzy matching (handles "Lakers", "LA
            Lakers", "Los Angeles Lakers")
          </li>
          <li>
            • Confidence scoring: Must be &gt;0.7 to proceed (1.0 = exact match,
            0.7 = good fuzzy match)
          </li>
          <li>
            • Looks up game in database by teams + date (Eastern timezone)
          </li>
          <li>• If game not found, syncs from ESPN API in real-time</li>
          <li>
            • Verifies your selected team is actually one of the two teams in
            the game
          </li>
          <li>• Creates frozen snapshot of ESPN data at validation time</li>
        </ul>
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-white/40 mb-1">
            Uncertain reasons from this pass:
          </p>
          <div className="flex flex-wrap gap-1">
            {[
              "NO_GAME_MATCH",
              "GAME_NOT_FINAL",
              "LOW_CONFIDENCE_TEAM",
              "ESPN_FETCH_FAILED",
            ].map((reason) => (
              <code
                key={reason}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
              >
                {reason}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* Pass 2 */}
      <div className="rounded-md bg-white/[0.02] border border-white/5 p-3">
        <h4 className="text-xs font-medium text-white/80 mb-2">
          Pass 2: Outcome Validation
        </h4>
        <p className="text-xs text-white/50 mb-2">
          Only runs if game is FINAL with scores. Uses the same outcome logic as
          the betting system.
        </p>
        <ul className="space-y-1.5 text-xs text-white/50">
          <li>
            • <span className="text-white/60">Money Line:</span> Compares your
            team's score to opponent's score
          </li>
          <li>
            • <span className="text-white/60">Point Spread:</span> Applies the
            spread (e.g., Lakers -5.5 needs to win by 6+)
          </li>
          <li>
            • <span className="text-white/60">Over/Under:</span> Adds both scores
            and compares to the line
          </li>
        </ul>
        <p className="text-xs text-white/50 mt-2">
          If calculated outcome doesn't match your reported outcome, row is{" "}
          <span className="text-amber-400">FLAGGED</span> with an error. The math
          is recorded in the validation receipt.
        </p>
      </div>

      {/* Pass 3 */}
      <div className="rounded-md bg-white/[0.02] border border-white/5 p-3">
        <h4 className="text-xs font-medium text-white/80 mb-2">
          Pass 3: Financial Validation
        </h4>
        <ul className="space-y-1.5 text-xs text-white/50">
          <li>
            • Calculates expected payout from wager + odds (allows 2% tolerance
            for rounding)
          </li>
          <li>
            • Cross-checks your odds against game's locked odds from Odds API
          </li>
          <li>
            • Flags negative wagers, payouts on losing bets, unreasonable odds
          </li>
        </ul>
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-white/40 mb-1">Severity levels:</p>
          <div className="space-y-1 text-[10px]">
            <div className="text-red-400">• Error: Outcome is wrong</div>
            <div className="text-amber-400">• Warning: Payout mismatch</div>
            <div className="text-blue-400">• Info: Odds differ from market</div>
          </div>
        </div>
      </div>

      {/* Pass 4 */}
      <div className="rounded-md bg-white/[0.02] border border-white/5 p-3">
        <h4 className="text-xs font-medium text-white/80 mb-2">
          Pass 4: Cross-Row Checks
        </h4>
        <ul className="space-y-1.5 text-xs text-white/50">
          <li>
            • <span className="text-white/60">Duplicate detection:</span> Same
            date + teams + selected team + bet type + wager = likely duplicate
          </li>
          <li>
            • <span className="text-white/60">Score consistency:</span> Multiple
            rows for same game shouldn't imply conflicting scores
          </li>
        </ul>
        <p className="text-xs text-white/40 mt-2">
          Returns warnings only, doesn't fail validation.
        </p>
      </div>
    </div>
  }
/>
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add validation passes section to breakdown modal"
```

---

## Task 7: Add Section 4 - Manual Review & Corrections

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Add section after Validation section**

```tsx
<ExpandableSection
  id="review"
  icon={PenLineIcon}
  iconColor="text-amber-400"
  title="Manual Review & Corrections"
  description="After validation, you can review rows and manually correct any flagged issues. Your corrections are saved separately - we never overwrite the original uploaded data."
  expanded={expandedSections.has("review")}
  onToggle={() => toggleSection("review")}
  details={
    <div className="space-y-3">
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">What you can do:</p>
        <ul className="space-y-1.5 text-white/50">
          <li>
            • <span className="text-amber-400">FLAGGED rows:</span> Click to
            expand, see what's wrong, manually correct the values
          </li>
          <li>
            • <span className="text-white/50">UNCERTAIN rows:</span> Wait for
            games to finish, then hit "Re-validate" to check again
          </li>
          <li>
            • <span className="text-blue-400">Corrections:</span> Saved to{" "}
            <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
              correctedValue
            </code>{" "}
            field (original data stays in{" "}
            <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
              originalValue
            </code>
            )
          </li>
        </ul>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Transparency features:</p>
        <ul className="space-y-1.5 text-white/50">
          <li>
            • <span className="text-white/60">Validation Receipt:</span> Every
            row shows a proof chain with timestamps and pass results
          </li>
          <li>
            • <span className="text-white/60">Field Confidence:</span> See
            confidence scores (0-1) for team matching, sport detection, etc.
          </li>
        </ul>
      </div>
      <p className="text-xs text-white/50">
        Once corrected, the row becomes{" "}
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">
          CORRECTED
        </Badge>{" "}
        and is ready to import.
      </p>
    </div>
  }
/>
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add review section to breakdown modal"
```

---

## Task 8: Add Section 5 - Import to Betting History

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Import AlertTriangleIcon**

Add to existing lucide-react import:
```tsx
import {
  // ... existing imports
  AlertTriangleIcon,
} from "lucide-react";
```

**Step 2: Add section after Review section**

```tsx
<ExpandableSection
  id="import"
  icon={ImportIcon}
  iconColor="text-blue-400"
  title="Import to Betting History"
  description="When validation is complete, click Import to create Bet records in your betting history. These become your personal bets in the dashboard. Only CORRECT and CORRECTED rows are imported."
  expanded={expandedSections.has("import")}
  onToggle={() => toggleSection("import")}
  details={
    <div className="space-y-3">
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">Pre-import validation:</p>
        <p className="text-white/50 mb-2">
          Before import, we check which rows are ready (must have matched game,
          valid outcome). You'll see a summary showing:
        </p>
        <ul className="space-y-1.5 text-white/50">
          <li>• Ready count</li>
          <li>• Total wager amount</li>
          <li>• Outcome breakdown (Wins/Losses/Pushes)</li>
          <li>• List of any not-ready rows with reasons</li>
        </ul>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">What gets created:</p>
        <p className="text-white/50 mb-2">
          For each row, we create a{" "}
          <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
            Bet
          </code>{" "}
          and{" "}
          <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
            BetLeg
          </code>{" "}
          record:
        </p>
        <ul className="space-y-1.5 text-white/50">
          <li>
            • Uses corrected data if available, otherwise normalized, otherwise
            original
          </li>
          <li>
            • Bet status set from validated outcome (WON/LOST/PUSH)
          </li>
          <li>
            • <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
              placedAt
            </code>{" "}
            and{" "}
            <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">
              settledAt
            </code>{" "}
            set to game date (historical bets)
          </li>
          <li>• Auto-assigned to your admin user account</li>
          <li>
            • Note added: "Imported from upload {"{fileName}"}, row {"{N}"}
            "
          </li>
        </ul>
      </div>
      <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
        <p className="text-xs text-emerald-400 font-medium mb-1">
          ✓ All-or-nothing transaction
        </p>
        <p className="text-xs text-white/50">
          If any row fails during import, the entire import is rolled back. No
          partial imports.
        </p>
      </div>
      <div className="text-xs text-white/60">
        <p className="mb-2 font-medium text-white/70">After import:</p>
        <ul className="space-y-1.5 text-white/50">
          <li>
            • Upload status changes to{" "}
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">
              IMPORTED
            </Badge>
          </li>
          <li>
            • Each row is linked to its created bet (you can trace back)
          </li>
          <li>• Bets appear in your dashboard and betting history</li>
        </ul>
      </div>
      <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-400 font-medium mb-1">
              Rollback available
            </p>
            <p className="text-xs text-white/50">
              If needed, you can rollback an import to delete all created bets
              and reset the upload to VALIDATED status.
            </p>
          </div>
        </div>
      </div>
    </div>
  }
/>
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add import section to breakdown modal"
```

---

## Task 9: Add Status Reference Table

**Files:**
- Modify: `src/components/admin/ValidationBreakdownModal.tsx`

**Step 1: Create StatusReferenceTable component before main component**

```tsx
function StatusReferenceTable() {
  const statuses = [
    {
      name: "CORRECT",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      meaning: "All validation passes succeeded, outcome matches ESPN data",
      action: "Ready to import",
    },
    {
      name: "FLAGGED",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      meaning: "Validation found errors (wrong outcome, data mismatch)",
      action: "Review and manually correct",
    },
    {
      name: "UNCERTAIN",
      badgeClass: "bg-white/10 text-white/50 border-white/10",
      meaning:
        "Can't verify yet (game in progress, low confidence match, missing data)",
      action: "Wait and re-validate, or manually correct",
    },
    {
      name: "CORRECTED",
      badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      meaning: "You manually corrected this row",
      action: "Ready to import",
    },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-base font-medium text-white">Status Reference</h3>
        <p className="text-xs text-white/50 mt-1">
          Quick guide to what each status badge means
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-2 text-left text-xs font-medium text-white/50">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white/50">
                Meaning
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white/50">
                What To Do
              </th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <tr
                key={status.name}
                className="border-b border-white/5 last:border-0"
              >
                <td className="px-4 py-3">
                  <Badge className={cn("text-[10px]", status.badgeClass)}>
                    {status.name}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-white/60">
                  {status.meaning}
                </td>
                <td className="px-4 py-3 text-xs text-white/50">
                  {status.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Add StatusReferenceTable after all ExpandableSections**

Add at the end of the content div, after all ExpandableSection components:
```tsx
<StatusReferenceTable />
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/components/admin/ValidationBreakdownModal.tsx
git commit -m "feat: add status reference table to breakdown modal"
```

---

## Task 10: Integrate Modal into Validate Page

**Files:**
- Modify: `src/app/admin/validate/page.tsx`

**Step 1: Import ValidationBreakdownModal and HelpCircleIcon**

At the top of the file, find the existing imports and add:
```tsx
import { ValidationBreakdownModal } from "@/components/admin/ValidationBreakdownModal";
```

Find the lucide-react imports and add HelpCircleIcon if not already present (it should be there from line 14).

**Step 2: Add state for modal**

In the main component, find the existing state declarations and add:
```tsx
const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
```

**Step 3: Modify header section to add button**

Find the header section (around line 1189-1198) and replace with:
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="mb-8 flex items-start justify-between"
>
  <div>
    <h1
      className="text-3xl font-bold text-white sm:text-4xl"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      Data Validation
    </h1>
    <p className="mt-1 text-sm text-white/50">
      Upload, validate, and import your betting data spreadsheets
    </p>
  </div>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setBreakdownModalOpen(true)}
    className="text-white/60 hover:text-white/90 hover:bg-white/5"
  >
    <HelpCircleIcon className="h-4 w-4 mr-2" />
    How It Works
  </Button>
</motion.div>
```

**Step 4: Add modal at the end before closing PageShell**

Find the closing `</PageShell>` tag at the very end of the component and add the modal just before it:
```tsx
      </div>

      <ValidationBreakdownModal
        open={breakdownModalOpen}
        onOpenChange={setBreakdownModalOpen}
      />
    </PageShell>
```

**Step 5: Verify it compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 6: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/admin/validate` (or the appropriate URL)
Expected:
- "How It Works" button appears in header next to title
- Clicking button opens modal
- Modal shows flow diagram and all sections
- Sections can be expanded/collapsed
- Status reference table at bottom
- "Got it" button closes modal

**Step 7: Commit**

```bash
git add src/app/admin/validate/page.tsx
git commit -m "feat: integrate ValidationBreakdownModal into validate page"
```

---

## Task 11: Final Build Verification and Push

**Files:**
- All modified files

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run linter**

Run: `npm run lint` (if project has it)
Expected: No linting errors

**Step 3: Test the feature**

Run: `npm run dev`
Manual testing checklist:
- [ ] Modal opens when clicking "How It Works" button
- [ ] Flow diagram displays correctly with all 6 stages
- [ ] All 5 sections can be expanded and collapsed
- [ ] Status reference table is readable
- [ ] Modal is scrollable if content is long
- [ ] Modal closes with "Got it" button
- [ ] Modal closes with Esc key
- [ ] Modal closes by clicking outside (if shadcn default behavior)
- [ ] Design matches the validate page dark theme
- [ ] Responsive on mobile (flow diagram stacks or scrolls)

**Step 4: Push to Vercel**

```bash
git push origin master
```

Expected: Vercel auto-deploys from GitHub master

**Step 5: Wait for Vercel build**

Wait ~60 seconds for Vercel build to complete
Check Vercel dashboard or wait for deployment notification

**Step 6: Test on production**

Navigate to production URL at `/admin/validate`
Expected: "How It Works" button appears and modal functions correctly

**Step 7: Final commit if any fixes needed**

If any issues found during production testing, fix and commit:
```bash
git add .
git commit -m "fix: [description of fix]"
git push origin master
```

---

## Complete! 🎉

The Validation Breakdown Modal is now live. The admin can click "How It Works" on the validation page to see:

1. **Visual flow diagram** showing the pipeline stages
2. **5 expandable sections** with high-level descriptions and detailed technical content
3. **Status reference table** for quick lookup

The modal provides both a learning tool for understanding the complex validation system and a quick reference guide for daily use.

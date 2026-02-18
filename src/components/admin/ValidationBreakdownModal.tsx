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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UploadIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  PenLineIcon,
  ImportIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface ValidationBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
          <FlowDiagram />

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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

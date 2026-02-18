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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

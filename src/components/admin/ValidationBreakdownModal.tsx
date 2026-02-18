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
import {
  UploadIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  PenLineIcon,
  ImportIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
} from "lucide-react";

interface ValidationBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

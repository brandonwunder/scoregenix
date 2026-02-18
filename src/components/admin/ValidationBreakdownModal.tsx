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

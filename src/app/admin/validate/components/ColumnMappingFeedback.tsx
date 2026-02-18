"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ColumnMapping {
  originalHeader: string;
  mappedField: string;
  confidence: number;
  method: "header_match" | "value_heuristic" | "manual";
}

interface ColumnMappingFeedbackProps {
  detected: ColumnMapping[];
  ambiguous: { header: string; candidates: string[] }[];
  unmapped: string[];
  missing: string[];
}

const FIELD_LABELS: Record<string, string> = {
  date: "Date",
  sport: "Sport",
  homeTeam: "Home Team",
  awayTeam: "Away Team",
  betType: "Bet Type",
  teamSelected: "Team Selected",
  lineValue: "Line/Spread",
  odds: "Odds",
  outcome: "Outcome",
  wagerAmount: "Wager Amount",
  payout: "Payout",
  profit: "Profit",
};

const REQUIRED_FIELDS = ["date", "outcome"];

const CONFIDENCE_HIGH = 0.9;
const CONFIDENCE_MEDIUM = 0.7;

export function ColumnMappingFeedback({
  detected,
  ambiguous,
  unmapped,
  missing,
}: ColumnMappingFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasIssues = missing.length > 0 || ambiguous.length > 0 || unmapped.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {hasIssues ? (
            <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
          )}
          <span className="font-medium text-sm">
            Column Detection {hasIssues ? "(Issues Found)" : "(All Good)"}
          </span>
          <Badge variant={hasIssues ? "destructive" : "default"} className="text-xs">
            {detected.length} mapped
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-zinc-800"
          >
            <div className="p-4 space-y-4">
              {/* Missing Required Fields */}
              {missing.length > 0 && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className="h-4 w-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        Missing Required Fields
                      </p>
                      <p className="text-xs text-red-400/80 mt-1">
                        These fields are required but were not found:{" "}
                        <span className="font-mono">
                          {missing.map((f) => FIELD_LABELS[f] || f).join(", ")}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ambiguous Columns */}
              {ambiguous.length > 0 && (
                <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <HelpCircleIcon className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">
                        Ambiguous Columns
                      </p>
                      {ambiguous.map((amb) => (
                        <p key={amb.header} className="text-xs text-yellow-400/80 mt-1">
                          <span className="font-mono">{amb.header}</span> could be:{" "}
                          {amb.candidates.map((c) => FIELD_LABELS[c] || c).join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Unmapped Columns */}
              {unmapped.length > 0 && (
                <div className="p-3 rounded-md bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-start gap-2">
                    <HelpCircleIcon className="h-4 w-4 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-300">
                        Unmapped Columns
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        These columns were not recognized and will be ignored:{" "}
                        <span className="font-mono">{unmapped.join(", ")}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Successfully Mapped */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detected.map((mapping) => {
                  const isRequired = REQUIRED_FIELDS.includes(mapping.mappedField);
                  const confidenceColor =
                    mapping.confidence >= CONFIDENCE_HIGH
                      ? "text-emerald-400"
                      : mapping.confidence >= CONFIDENCE_MEDIUM
                      ? "text-yellow-400"
                      : "text-orange-400";

                  return (
                    <div
                      key={mapping.originalHeader}
                      className="flex items-center gap-2 p-2 rounded-md bg-zinc-800/30 border border-zinc-700/50"
                    >
                      <CheckCircle2Icon className={cn("h-3.5 w-3.5", confidenceColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-zinc-300 truncate">
                          {mapping.originalHeader}
                        </p>
                        <p className="text-xs text-zinc-500">
                          → {FIELD_LABELS[mapping.mappedField] || mapping.mappedField}
                          {isRequired && (
                            <span className="text-emerald-500 ml-1">*</span>
                          )}
                        </p>
                      </div>
                      {mapping.confidence < 1.0 && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {Math.round(mapping.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  UploadIcon,
  FileSpreadsheetIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  HelpCircleIcon,
  PenLineIcon,
  LoaderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ImportIcon,
  Undo2Icon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

interface Upload {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: "PROCESSING" | "VALIDATED" | "IMPORTED" | "ERROR";
  totalRows: number;
  correctCount: number;
  flaggedCount: number;
  uncertainCount: number;
  importedCount?: number;
}

interface UploadRow {
  id: string;
  uploadId: string;
  rowNumber: number;
  rawData: any;
  matchedGameId: string | null;
  validationStatus: "CORRECT" | "FLAGGED" | "UNCERTAIN" | "CORRECTED";
  originalValue: {
    date?: string;
    sport?: string;
    homeTeam?: string;
    awayTeam?: string;
    betType?: string;
    teamSelected?: string;
    lineValue?: number | string;
    odds?: number | string;
    outcome?: string;
    wagerAmount?: number | string;
    payout?: number | string;
  } | null;
  actualValue: {
    date?: string;
    sport?: string;
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    betType?: string;
    teamSelected?: string;
    lineValue?: number | string;
    odds?: number | string;
    outcome?: string;
    correctOutcome?: string;
    recordedOutcome?: string;
    wagerAmount?: number | string;
    payout?: number | string;
  } | null;
  normalizedData?: any;
  matchedGame: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  uncertainReasons?: string[] | null;
  validationReceipt?: Array<{
    pass: string;
    timestamp: string;
    result: string;
    details: string;
    data?: any;
  }> | null;
  fieldConfidence?: Array<{
    field: string;
    confidence: number;
    source: string;
    details?: string;
  }> | null;
  correctedBy: string | null;
  correctedAt: string | null;
  importedBetId?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PreImportSummary {
  readyRows: Array<{
    rowId: string;
    rowNumber: number;
    betType: string | null;
    outcome: string | null;
    wagerAmount: number | null;
  }>;
  notReadyRows: Array<{
    rowId: string;
    rowNumber: number;
    reason: string;
  }>;
  summary: {
    readyCount: number;
    notReadyCount: number;
    alreadyImported: number;
    totalWager: number;
    outcomes: { won: number; lost: number; push: number };
  };
}

/* ───── Constants ───── */

const STATUS_CONFIG = {
  CORRECT: {
    label: "Correct",
    icon: CheckCircle2Icon,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  FLAGGED: {
    label: "Flagged",
    icon: AlertTriangleIcon,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  UNCERTAIN: {
    label: "Uncertain",
    icon: HelpCircleIcon,
    className: "bg-white/10 text-white/50 border-white/20",
  },
  CORRECTED: {
    label: "Corrected",
    icon: PenLineIcon,
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Correct", value: "CORRECT" },
  { label: "Flagged", value: "FLAGGED" },
  { label: "Uncertain", value: "UNCERTAIN" },
  { label: "Corrected", value: "CORRECTED" },
];

const UNCERTAIN_REASON_LABELS: Record<string, string> = {
  NO_GAME_MATCH: "No matching game found",
  GAME_NOT_FINAL: "Game has not finished yet",
  LOW_CONFIDENCE_TEAM: "Could not confidently identify team names",
  ESPN_FETCH_FAILED: "Failed to fetch data from ESPN",
  MISSING_REQUIRED_FIELD: "Required field missing (date, outcome, etc.)",
  AMBIGUOUS_SPORT: "Could not determine the sport",
  MULTIPLE_GAME_MATCHES: "Multiple games matched",
  TEAM_NOT_IN_GAME: "Selected team is not in the matched game",
  NO_BET_TYPE: "No bet type specified",
  NO_ODDS_DATA: "No odds data available",
};

const RECEIPT_PASS_LABELS: Record<string, string> = {
  game_matching: "Game Match",
  outcome_validation: "Outcome",
  financial_validation: "Financial",
  cross_row_validation: "Cross-Row",
  pre_check: "Pre-Check",
};

const RECEIPT_COLORS: Record<string, string> = {
  pass: "bg-emerald-400",
  fail: "bg-red-400",
  warning: "bg-amber-400",
  skip: "bg-white/30",
};

/* ───── Sub-components ───── */

function UploadZone({
  onUpload,
  uploading,
  uploadProgress,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".xls")
      ) {
        setSelectedFile(file);
      } else {
        toast.error("Invalid file type", {
          description: "Please upload a .xlsx, .csv, or .xls file",
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
      if (inputRef.current) inputRef.current.value = "";
    }
  };

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

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all",
          dragActive
            ? "border-emerald-400 bg-emerald-500/5"
            : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <FileSpreadsheetIcon className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {selectedFile.name}
              </p>
              <p className="text-xs text-white/40">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="ml-2 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadIcon
              className={cn(
                "mb-3 h-10 w-10",
                dragActive ? "text-emerald-400" : "text-white/30"
              )}
            />
            <p className="text-sm font-medium text-white/70">
              Drag & drop your file here
            </p>
            <p className="mt-1 text-xs text-white/40">
              or click to browse (.xlsx, .csv)
            </p>
          </>
        )}
      </div>

      {uploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span>
              {uploadProgress < 50
                ? "Uploading..."
                : uploadProgress < 100
                  ? "Validating..."
                  : "Complete!"}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress
            value={uploadProgress}
            className="h-2 bg-white/10 [&>div]:bg-emerald-500"
          />
        </motion.div>
      )}

      {selectedFile && !uploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Button
            onClick={handleUpload}
            className="w-full bg-emerald-500 font-semibold text-black hover:bg-emerald-400 transition-colors"
          >
            <ShieldCheckIcon className="mr-2 h-4 w-4" />
            Upload & Validate
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

function UploadHistoryItem({
  upload,
  isSelected,
  onClick,
}: {
  upload: Upload;
  isSelected: boolean;
  onClick: () => void;
}) {
  const total = upload.totalRows;
  const correct = upload.correctCount;
  const flagged = upload.flaggedCount;
  const uncertain = upload.uncertainCount;
  const corrected = total - correct - flagged - uncertain;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-all",
        isSelected
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheetIcon
            className={cn(
              "h-4 w-4",
              isSelected ? "text-emerald-400" : "text-white/40"
            )}
          />
          <span className="text-sm font-medium text-white/80 truncate max-w-[160px]">
            {upload.fileName}
          </span>
        </div>
        <Badge
          className={cn(
            "text-[10px]",
            upload.status === "VALIDATED"
              ? "bg-emerald-500/15 text-emerald-400"
              : upload.status === "IMPORTED"
                ? "bg-blue-500/15 text-blue-400"
                : upload.status === "ERROR"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-yellow-500/15 text-yellow-400"
          )}
        >
          {upload.status}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40">
        <span>{format(new Date(upload.uploadedAt), "MMM d, h:mm a")}</span>
        <span>{total} rows</span>
      </div>
      {(upload.status === "VALIDATED" || upload.status === "IMPORTED") && (
        <div className="mt-2 flex gap-2">
          {correct > 0 && (
            <span className="text-[10px] text-emerald-400">{correct} ok</span>
          )}
          {flagged > 0 && (
            <span className="text-[10px] text-amber-400">
              {flagged} flagged
            </span>
          )}
          {uncertain > 0 && (
            <span className="text-[10px] text-white/40">
              {uncertain} uncertain
            </span>
          )}
          {corrected > 0 && (
            <span className="text-[10px] text-blue-400">
              {corrected} fixed
            </span>
          )}
          {upload.status === "IMPORTED" &&
            upload.importedCount != null &&
            upload.importedCount > 0 && (
              <span className="text-[10px] text-blue-400">
                {upload.importedCount} imported
              </span>
            )}
        </div>
      )}
    </button>
  );
}

function SummaryBar({ rows }: { rows: UploadRow[] }) {
  const correct = rows.filter(
    (r) => r.validationStatus === "CORRECT"
  ).length;
  const flagged = rows.filter(
    (r) => r.validationStatus === "FLAGGED"
  ).length;
  const uncertain = rows.filter(
    (r) => r.validationStatus === "UNCERTAIN"
  ).length;
  const corrected = rows.filter(
    (r) => r.validationStatus === "CORRECTED"
  ).length;
  const total = rows.length;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">
          {correct}
        </span>
        <span className="text-xs text-white/40">Correct</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="text-sm font-medium text-amber-400">{flagged}</span>
        <span className="text-xs text-white/40">Flagged</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
        <span className="text-sm font-medium text-white/50">
          {uncertain}
        </span>
        <span className="text-xs text-white/40">Uncertain</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
        <span className="text-sm font-medium text-blue-400">{corrected}</span>
        <span className="text-xs text-white/40">Corrected</span>
      </div>
      <div className="ml-auto text-xs text-white/30">{total} total rows</div>
    </div>
  );
}

function UncertainReasons({ reasons }: { reasons: string[] }) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reasons.map((code, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50 border border-white/10"
          title={UNCERTAIN_REASON_LABELS[code] || code}
        >
          {UNCERTAIN_REASON_LABELS[code] || code}
        </span>
      ))}
    </div>
  );
}

function ValidationReceipt({
  receipt,
}: {
  receipt: UploadRow["validationReceipt"];
}) {
  if (!receipt || receipt.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
        Validation Chain
      </div>
      {receipt.map((step, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-md bg-white/[0.02] border border-white/5 px-2 py-1.5"
        >
          <span
            className={cn(
              "mt-0.5 h-2 w-2 shrink-0 rounded-full",
              RECEIPT_COLORS[step.result] || "bg-white/20"
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-white/60">
                {RECEIPT_PASS_LABELS[step.pass] || step.pass}
              </span>
              <span className="text-[9px] text-white/25 uppercase">
                {step.result}
              </span>
            </div>
            <p className="text-[10px] text-white/40 break-words">
              {step.details}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlaggedComparison({
  row,
  onUseActual,
  correcting,
}: {
  row: UploadRow;
  onUseActual: (rowId: string) => void;
  correcting: boolean;
}) {
  const orig = row.originalValue;
  const actual = row.actualValue;

  if (!orig || !actual) return null;

  const fields = [
    { label: "Date", origVal: orig.date, actualVal: actual.date },
    { label: "Home Team", origVal: orig.homeTeam, actualVal: actual.homeTeam },
    { label: "Away Team", origVal: orig.awayTeam, actualVal: actual.awayTeam },
    {
      label: "Outcome",
      origVal: orig.outcome,
      actualVal: actual.correctOutcome || actual.outcome,
    },
    {
      label: "Wager",
      origVal: orig.wagerAmount?.toString(),
      actualVal: actual.wagerAmount?.toString(),
    },
    {
      label: "Payout",
      origVal: orig.payout?.toString(),
      actualVal: actual.payout?.toString(),
    },
  ];

  const differences = fields.filter(
    (f) => f.origVal && f.actualVal && f.origVal !== f.actualVal
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mx-4 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        {actual.homeScore != null && actual.awayScore != null && (
          <div className="mb-2 text-xs text-white/60">
            <span className="text-white/40">Score:</span>{" "}
            {actual.homeTeam} {actual.homeScore} — {actual.awayTeam}{" "}
            {actual.awayScore}
          </div>
        )}

        {differences.length > 0 ? (
          <>
            <div className="mb-2 text-xs font-medium text-amber-400">
              Differences Found
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                  Uploaded Data
                </div>
                {differences.map((d) => (
                  <div key={d.label} className="text-xs text-white/60">
                    <span className="text-white/40">{d.label}:</span>{" "}
                    <span className="text-red-400/80 line-through">
                      {d.origVal}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                  Actual Data
                </div>
                {differences.map((d) => (
                  <div key={d.label} className="text-xs text-white/60">
                    <span className="text-white/40">{d.label}:</span>{" "}
                    <span className="text-emerald-400">{d.actualVal}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-amber-400">
            Outcome mismatch: reported {actual.recordedOutcome || orig.outcome}{" "}
            but computed {actual.correctOutcome}
          </div>
        )}

        {row.validationReceipt && (
          <ValidationReceipt receipt={row.validationReceipt} />
        )}

        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={() => onUseActual(row.id)}
            disabled={correcting}
            className="h-7 bg-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
          >
            {correcting ? (
              <LoaderIcon className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <CheckIcon className="mr-1 h-3 w-3" />
            )}
            Use Actual
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ExpandedRowDetails({ row }: { row: UploadRow }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
        {row.uncertainReasons && row.uncertainReasons.length > 0 && (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">
              Why Uncertain
            </div>
            <UncertainReasons reasons={row.uncertainReasons} />
          </div>
        )}

        {row.fieldConfidence && row.fieldConfidence.length > 0 && (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">
              Field Confidence
            </div>
            <div className="flex flex-wrap gap-1.5">
              {row.fieldConfidence.map((fc, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] border",
                    fc.confidence >= 0.8
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : fc.confidence >= 0.5
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-red-400 bg-red-500/10 border-red-500/20"
                  )}
                  title={fc.details}
                >
                  {fc.field}: {Math.round(fc.confidence * 100)}%
                </span>
              ))}
            </div>
          </div>
        )}

        {row.validationReceipt && (
          <ValidationReceipt receipt={row.validationReceipt} />
        )}

        {row.matchedGame && (
          <div className="text-[10px] text-white/40">
            Matched: {row.matchedGame.homeTeam} vs {row.matchedGame.awayTeam}
            {row.matchedGame.homeScore != null &&
              ` (${row.matchedGame.homeScore}-${row.matchedGame.awayScore})`}
            {" — "}
            {row.matchedGame.status}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ───── Main Page ───── */

export default function ValidatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    else if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "ADMIN"
    )
      router.push("/admin/login");
  }, [status, session, router]);

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [allRows, setAllRows] = useState<UploadRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [bulkCorrecting, setBulkCorrecting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Dialog state
  const [fixAllDialogOpen, setFixAllDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<PreImportSummary | null>(
    null
  );
  const [importing, setImporting] = useState(false);
  const [revalidating, setRevalidating] = useState(false);

  // Fetch upload history
  const fetchUploads = useCallback(async () => {
    try {
      setLoadingUploads(true);
      const res = await fetch("/api/admin/validate");
      if (!res.ok) throw new Error("Failed to fetch uploads");
      const data = await res.json();
      setUploads(data.uploads || []);
    } catch (err: any) {
      toast.error("Failed to load uploads", {
        description: err.message,
      });
    } finally {
      setLoadingUploads(false);
    }
  }, []);

  // Fetch rows for selected upload
  const fetchRows = useCallback(
    async (uploadId: string, statusVal: string, pageVal: number) => {
      try {
        setLoadingRows(true);
        const params = new URLSearchParams({
          page: pageVal.toString(),
          limit: "50",
        });
        if (statusVal !== "all") params.set("status", statusVal);

        const res = await fetch(
          `/api/admin/validate/${uploadId}/rows?${params}`
        );
        if (!res.ok) throw new Error("Failed to fetch rows");
        const data = await res.json();
        setRows(data.rows || []);
        setPagination(data.pagination);
      } catch (err: any) {
        toast.error("Failed to load rows", {
          description: err.message,
        });
      } finally {
        setLoadingRows(false);
      }
    },
    []
  );

  // Fetch all rows (for the summary bar)
  const fetchAllRows = useCallback(async (uploadId: string) => {
    try {
      const res = await fetch(
        `/api/admin/validate/${uploadId}/rows?limit=9999`
      );
      if (!res.ok) return;
      const data = await res.json();
      setAllRows(data.rows || []);
    } catch {
      // Summary bar is non-critical
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  useEffect(() => {
    if (selectedUploadId) {
      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
    }
  }, [selectedUploadId, statusFilter, page, fetchRows, fetchAllRows]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/validate/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      const uploadData = await uploadRes.json();
      const uploadId = uploadData.uploadId;

      setUploadProgress(50);

      const validateRes = await fetch(
        `/api/admin/validate/${uploadId}/validate`,
        { method: "POST" }
      );

      if (!validateRes.ok) {
        const errData = await validateRes.json().catch(() => ({}));
        throw new Error(errData.error || "Validation failed");
      }

      setUploadProgress(100);
      toast.success("Upload complete", {
        description: `${uploadData.totalRows} rows uploaded and validated`,
      });

      await fetchUploads();
      setSelectedUploadId(uploadId);
      setStatusFilter("all");
      setPage(1);
    } catch (err: any) {
      toast.error("Upload failed", {
        description: err.message,
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  // Handle single row correction
  const handleUseActual = async (rowId: string) => {
    if (!selectedUploadId) return;
    setCorrectingId(rowId);

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/correct`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corrections: [{ rowId, action: "use_actual" }],
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Correction failed");
      }

      toast.success("Row corrected");
      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
      fetchUploads();
    } catch (err: any) {
      toast.error("Correction failed", {
        description: err.message,
      });
    } finally {
      setCorrectingId(null);
    }
  };

  // Handle bulk fix all flagged (with confirmation dialog)
  const handleFixAllFlagged = async () => {
    if (!selectedUploadId) return;
    setFixAllDialogOpen(false);
    setBulkCorrecting(true);

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/rows?status=FLAGGED&limit=9999`
      );
      if (!res.ok) throw new Error("Failed to fetch flagged rows");
      const data = await res.json();
      const flaggedRows: UploadRow[] = data.rows || [];

      if (flaggedRows.length === 0) {
        toast.info("No flagged rows to fix");
        return;
      }

      const corrections = flaggedRows.map((row) => ({
        rowId: row.id,
        action: "use_actual" as const,
      }));

      const correctRes = await fetch(
        `/api/admin/validate/${selectedUploadId}/correct`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corrections }),
        }
      );

      if (!correctRes.ok) {
        const errData = await correctRes.json().catch(() => ({}));
        throw new Error(errData.error || "Bulk correction failed");
      }

      toast.success(`Fixed ${flaggedRows.length} flagged rows`);
      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
      fetchUploads();
    } catch (err: any) {
      toast.error("Bulk fix failed", {
        description: err.message,
      });
    } finally {
      setBulkCorrecting(false);
    }
  };

  // Handle re-validation
  const handleRevalidate = async () => {
    if (!selectedUploadId) return;
    setRevalidating(true);

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/revalidate`,
        { method: "POST" }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Re-validation failed");
      }

      const result = await res.json();
      toast.success("Re-validation complete", {
        description: `${result.revalidated} uncertain rows re-checked`,
      });

      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
      fetchUploads();
    } catch (err: any) {
      toast.error("Re-validation failed", {
        description: err.message,
      });
    } finally {
      setRevalidating(false);
    }
  };

  // Handle import
  const openImportDialog = async () => {
    if (!selectedUploadId) return;
    setImportDialogOpen(true);
    setImportSummary(null);

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/import`
      );
      if (!res.ok) throw new Error("Failed to get import summary");
      const summary = await res.json();
      setImportSummary(summary);
    } catch (err: any) {
      toast.error("Failed to load import summary", {
        description: err.message,
      });
      setImportDialogOpen(false);
    }
  };

  const handleImport = async () => {
    if (!selectedUploadId) return;
    setImporting(true);

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Import failed");
      }

      const result = await res.json();
      toast.success(`Imported ${result.imported} bets`, {
        description:
          result.skipped > 0 ? `${result.skipped} rows skipped` : undefined,
      });

      setImportDialogOpen(false);
      fetchUploads();
      fetchAllRows(selectedUploadId);
    } catch (err: any) {
      toast.error("Import failed", {
        description: err.message,
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle rollback
  const handleRollback = async () => {
    if (!selectedUploadId) return;

    try {
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/import/rollback`,
        { method: "POST" }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Rollback failed");
      }

      const result = await res.json();
      toast.success(`Rolled back ${result.rolledBack} imported bets`);
      fetchUploads();
      fetchAllRows(selectedUploadId);
    } catch (err: any) {
      toast.error("Rollback failed", {
        description: err.message,
      });
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const flaggedCount = allRows.filter(
    (r) => r.validationStatus === "FLAGGED"
  ).length;
  const uncertainCount = allRows.filter(
    (r) => r.validationStatus === "UNCERTAIN"
  ).length;

  const selectedUpload = uploads.find((u) => u.id === selectedUploadId);
  const canImport =
    selectedUpload &&
    selectedUpload.status === "VALIDATED" &&
    allRows.some(
      (r) =>
        (r.validationStatus === "CORRECT" ||
          r.validationStatus === "CORRECTED") &&
        !r.importedBetId
    );
  const isImported = selectedUpload?.status === "IMPORTED";

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-bold text-white sm:text-4xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Data Validation
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Upload, validate, and import your betting data spreadsheets
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <UploadZone
              onUpload={handleUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <h3
                className="mb-3 text-sm font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Upload History
              </h3>
              {loadingUploads ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-16 bg-white/10 rounded-lg"
                    />
                  ))}
                </div>
              ) : uploads.length === 0 ? (
                <p className="py-6 text-center text-xs text-white/40">
                  No uploads yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {uploads.map((upload) => (
                    <UploadHistoryItem
                      key={upload.id}
                      upload={upload}
                      isSelected={selectedUploadId === upload.id}
                      onClick={() => {
                        setSelectedUploadId(upload.id);
                        setStatusFilter("all");
                        setPage(1);
                        setExpandedRows(new Set());
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Content */}
          <div className="space-y-4">
            {!selectedUploadId ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center"
              >
                <FileSpreadsheetIcon className="mb-4 h-12 w-12 text-white/20" />
                <p className="text-lg font-medium text-white/60">
                  Select an upload to review
                </p>
                <p className="mt-1 text-sm text-white/30">
                  Upload a file or select from history to view validation
                  results
                </p>
              </motion.div>
            ) : (
              <>
                {/* Summary Bar */}
                {allRows.length > 0 && <SummaryBar rows={allRows} />}

                {/* Filter Tabs + Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_TABS.map((tab) => {
                      const count =
                        tab.value === "all"
                          ? allRows.length
                          : allRows.filter(
                              (r) => r.validationStatus === tab.value
                            ).length;

                      return (
                        <button
                          key={tab.value}
                          onClick={() => setStatusFilter(tab.value)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                            statusFilter === tab.value
                              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                          )}
                        >
                          {tab.label}
                          {count > 0 && (
                            <span className="ml-1.5 text-[10px] text-white/30">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    {uncertainCount > 0 && (
                      <Button
                        size="sm"
                        onClick={handleRevalidate}
                        disabled={revalidating}
                        className="bg-white/10 text-white/70 hover:bg-white/15 border border-white/10 text-xs"
                      >
                        {revalidating ? (
                          <LoaderIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Re-validate ({uncertainCount})
                      </Button>
                    )}

                    {flaggedCount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setFixAllDialogOpen(true)}
                        disabled={bulkCorrecting}
                        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 text-xs"
                      >
                        {bulkCorrecting ? (
                          <LoaderIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Fix All Flagged ({flaggedCount})
                      </Button>
                    )}

                    {canImport && (
                      <Button
                        size="sm"
                        onClick={openImportDialog}
                        className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs"
                      >
                        <ImportIcon className="mr-1.5 h-3.5 w-3.5" />
                        Import as Bets
                      </Button>
                    )}

                    {isImported && (
                      <Button
                        size="sm"
                        onClick={handleRollback}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs"
                      >
                        <Undo2Icon className="mr-1.5 h-3.5 w-3.5" />
                        Rollback Import
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rows Table */}
                {loadingRows ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="space-y-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-10 bg-white/10 rounded"
                        />
                      ))}
                    </div>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                    <p className="text-sm text-white/40">
                      No rows match the current filter
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-xs text-white/50 w-12">
                            Row
                          </TableHead>
                          <TableHead className="text-xs text-white/50">
                            Date
                          </TableHead>
                          <TableHead className="text-xs text-white/50">
                            Teams
                          </TableHead>
                          <TableHead className="text-xs text-white/50">
                            Bet Type
                          </TableHead>
                          <TableHead className="text-xs text-white/50">
                            Their Outcome
                          </TableHead>
                          <TableHead className="text-xs text-white/50">
                            Actual Outcome
                          </TableHead>
                          <TableHead className="text-xs text-white/50 text-center">
                            Status
                          </TableHead>
                          <TableHead className="text-xs text-white/50 text-center w-20">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => {
                          const config = STATUS_CONFIG[row.validationStatus];
                          const StatusIcon = config.icon;
                          const orig = row.originalValue;
                          const actual = row.actualValue;
                          const isExpanded = expandedRows.has(row.id);
                          const isFlagged =
                            row.validationStatus === "FLAGGED";
                          const isUncertain =
                            row.validationStatus === "UNCERTAIN";
                          const hasDetails =
                            isFlagged ||
                            isUncertain ||
                            (row.validationReceipt &&
                              row.validationReceipt.length > 0);

                          return (
                            <AnimatePresence key={row.id}>
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                  "border-white/5 transition-colors",
                                  isFlagged
                                    ? "hover:bg-amber-500/[0.05] bg-amber-500/[0.02]"
                                    : "hover:bg-white/[0.03]",
                                  isExpanded && isFlagged
                                    ? "bg-amber-500/[0.04]"
                                    : ""
                                )}
                              >
                                <TableCell className="text-xs text-white/50 font-mono">
                                  {row.rowNumber}
                                </TableCell>
                                <TableCell className="text-xs text-white/60">
                                  {orig?.date || "-"}
                                </TableCell>
                                <TableCell className="text-xs text-white/80">
                                  {orig?.awayTeam && orig?.homeTeam ? (
                                    <span>
                                      {orig.awayTeam}{" "}
                                      <span className="text-white/30">@</span>{" "}
                                      {orig.homeTeam}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-white/60">
                                  {orig?.betType || "-"}
                                </TableCell>
                                <TableCell className="text-xs text-white/70">
                                  {orig?.outcome || "-"}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {actual?.correctOutcome || actual?.outcome ? (
                                    <span
                                      className={cn(
                                        isFlagged
                                          ? "text-emerald-400 font-medium"
                                          : "text-white/70"
                                      )}
                                    >
                                      {actual?.correctOutcome ||
                                        actual?.outcome}
                                    </span>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Badge
                                      className={cn(
                                        "text-[10px]",
                                        config.className
                                      )}
                                    >
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {config.label}
                                    </Badge>
                                    {row.validationReceipt &&
                                      row.validationReceipt.length > 0 && (
                                        <div className="flex gap-0.5">
                                          {row.validationReceipt.map(
                                            (step, i) => (
                                              <span
                                                key={i}
                                                className={cn(
                                                  "h-1.5 w-1.5 rounded-full",
                                                  RECEIPT_COLORS[
                                                    step.result
                                                  ] || "bg-white/20"
                                                )}
                                                title={`${RECEIPT_PASS_LABELS[step.pass] || step.pass}: ${step.result}`}
                                              />
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {hasDetails && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        toggleRowExpansion(row.id)
                                      }
                                      className={cn(
                                        "h-7 text-[10px]",
                                        isFlagged
                                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                          : "text-white/50 hover:text-white/70 hover:bg-white/10"
                                      )}
                                    >
                                      {isExpanded ? (
                                        <ChevronUpIcon className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronDownIcon className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  )}
                                </TableCell>
                              </motion.tr>
                              {isExpanded && isFlagged && (
                                <tr>
                                  <td colSpan={8} className="p-0">
                                    <FlaggedComparison
                                      row={row}
                                      onUseActual={handleUseActual}
                                      correcting={correctingId === row.id}
                                    />
                                  </td>
                                </tr>
                              )}
                              {isExpanded && !isFlagged && (
                                <tr>
                                  <td colSpan={8} className="p-0">
                                    <ExpandedRowDetails row={row} />
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40">
                      Page {pagination.page} of {pagination.totalPages} (
                      {pagination.total} rows)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fix All Flagged Confirmation Dialog */}
      <Dialog open={fixAllDialogOpen} onOpenChange={setFixAllDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Fix All Flagged Rows
            </DialogTitle>
            <DialogDescription className="text-white/50">
              This will replace the uploaded data with the actual verified data
              for all {flaggedCount} flagged rows. The original data is
              preserved and can be reviewed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFixAllDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFixAllFlagged}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              <RotateCcwIcon className="mr-2 h-4 w-4" />
              Confirm Fix All ({flaggedCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              Import Validated Bets
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Import validated rows as bet records into your system.
            </DialogDescription>
          </DialogHeader>

          {!importSummary ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon className="h-6 w-6 animate-spin text-white/30" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {importSummary.summary.readyCount}
                  </div>
                  <div className="text-[10px] text-white/40">Ready</div>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                  <div className="text-lg font-bold text-white/50">
                    {importSummary.summary.notReadyCount}
                  </div>
                  <div className="text-[10px] text-white/40">Not Ready</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {importSummary.summary.alreadyImported}
                  </div>
                  <div className="text-[10px] text-white/40">
                    Already Imported
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="text-xs font-medium text-white/60 mb-2">
                  Import Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/40">
                    Total Wager:{" "}
                    <span className="text-white/70">
                      ${importSummary.summary.totalWager.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-white/40">
                    Outcomes:{" "}
                    <span className="text-emerald-400">
                      {importSummary.summary.outcomes.won}W
                    </span>
                    {" / "}
                    <span className="text-red-400">
                      {importSummary.summary.outcomes.lost}L
                    </span>
                    {" / "}
                    <span className="text-white/50">
                      {importSummary.summary.outcomes.push}P
                    </span>
                  </div>
                </div>
              </div>

              {importSummary.notReadyRows.length > 0 && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-white/60 mb-1">
                    Not Ready ({importSummary.notReadyRows.length})
                  </div>
                  {importSummary.notReadyRows.slice(0, 10).map((r) => (
                    <div key={r.rowId} className="text-[10px] text-white/40">
                      Row {r.rowNumber}: {r.reason}
                    </div>
                  ))}
                  {importSummary.notReadyRows.length > 10 && (
                    <div className="text-[10px] text-white/30 mt-1">
                      ...and {importSummary.notReadyRows.length - 10} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                importing ||
                !importSummary ||
                importSummary.summary.readyCount === 0
              }
              className="bg-blue-500 text-white hover:bg-blue-400"
            >
              {importing ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImportIcon className="mr-2 h-4 w-4" />
              )}
              Import {importSummary?.summary.readyCount || 0} Bets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

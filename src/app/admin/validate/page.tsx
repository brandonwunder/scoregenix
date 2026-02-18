"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
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
} from "lucide-react";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  status: "PROCESSING" | "VALIDATED" | "ERROR";
  totalRows: number;
  correctCount: number;
  flaggedCount: number;
  uncertainCount: number;
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
    betType?: string;
    teamSelected?: string;
    lineValue?: number | string;
    odds?: number | string;
    outcome?: string;
    wagerAmount?: number | string;
    payout?: number | string;
  } | null;
  matchedGame: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  correctedBy: string | null;
  correctedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ───── Constants ───── */

const STATUS_CONFIG = {
  CORRECT: {
    label: "Correct",
    icon: CheckCircle2Icon,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ringClass: "ring-emerald-500/30",
    bgHighlight: "",
  },
  FLAGGED: {
    label: "Flagged",
    icon: AlertTriangleIcon,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    ringClass: "ring-amber-500/30",
    bgHighlight: "bg-amber-500/[0.03]",
  },
  UNCERTAIN: {
    label: "Uncertain",
    icon: HelpCircleIcon,
    className: "bg-white/10 text-white/50 border-white/20",
    ringClass: "ring-white/20",
    bgHighlight: "",
  },
  CORRECTED: {
    label: "Corrected",
    icon: PenLineIcon,
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    ringClass: "ring-blue-500/30",
    bgHighlight: "",
  },
};

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Correct", value: "CORRECT" },
  { label: "Flagged", value: "FLAGGED" },
  { label: "Uncertain", value: "UNCERTAIN" },
  { label: "Corrected", value: "CORRECTED" },
];

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

      {/* Drop Zone */}
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

      {/* Upload Progress */}
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

      {/* Upload Button */}
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
      {upload.status === "VALIDATED" && (
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
    { label: "Outcome", origVal: orig.outcome, actualVal: actual.outcome },
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

  if (differences.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mx-4 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
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

/* ───── Main Page ───── */

export default function ValidatePage() {
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

  // Fetch upload history
  const fetchUploads = useCallback(async () => {
    try {
      setLoadingUploads(true);
      const res = await fetch("/api/admin/validate");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUploads(data.uploads || []);
    } catch {
      // Handle silently
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
      } catch {
        // Handle silently
      } finally {
        setLoadingRows(false);
      }
    },
    []
  );

  // Fetch all rows (for the summary bar, no status filter)
  const fetchAllRows = useCallback(async (uploadId: string) => {
    try {
      const res = await fetch(
        `/api/admin/validate/${uploadId}/rows?limit=9999`
      );
      if (!res.ok) return;
      const data = await res.json();
      setAllRows(data.rows || []);
    } catch {
      // Handle silently
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

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload the file
      setUploadProgress(20);
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/validate/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const uploadId = uploadData.uploadId;

      setUploadProgress(50);

      // Step 2: Trigger validation
      const validateRes = await fetch(
        `/api/admin/validate/${uploadId}/validate`,
        {
          method: "POST",
        }
      );

      if (!validateRes.ok) throw new Error("Validation failed");

      setUploadProgress(100);

      // Refresh uploads and select the new one
      await fetchUploads();
      setSelectedUploadId(uploadId);
      setStatusFilter("all");
      setPage(1);
    } catch {
      // The upload zone will reset
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

      if (!res.ok) throw new Error("Correction failed");

      // Refresh data
      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
      fetchUploads();
    } catch {
      // Handle silently
    } finally {
      setCorrectingId(null);
    }
  };

  // Handle bulk fix all flagged
  const handleFixAllFlagged = async () => {
    if (!selectedUploadId) return;
    setBulkCorrecting(true);

    try {
      // Fetch all flagged rows
      const res = await fetch(
        `/api/admin/validate/${selectedUploadId}/rows?status=FLAGGED&limit=9999`
      );
      if (!res.ok) throw new Error("Failed to fetch flagged rows");
      const data = await res.json();
      const flaggedRows: UploadRow[] = data.rows || [];

      if (flaggedRows.length === 0) return;

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

      if (!correctRes.ok) throw new Error("Bulk correction failed");

      // Refresh data
      fetchRows(selectedUploadId, statusFilter, page);
      fetchAllRows(selectedUploadId);
      fetchUploads();
    } catch {
      // Handle silently
    } finally {
      setBulkCorrecting(false);
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
            Upload, validate, and correct your betting data spreadsheets
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar: Upload + History */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <UploadZone
              onUpload={handleUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />

            {/* Upload History */}
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
                    <Skeleton key={i} className="h-16 bg-white/10 rounded-lg" />
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

          {/* Right Content: Validation Results */}
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
                  Upload a file or select from history to view validation results
                </p>
              </motion.div>
            ) : (
              <>
                {/* Summary Bar */}
                {allRows.length > 0 && <SummaryBar rows={allRows} />}

                {/* Filter Tabs + Fix All Button */}
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

                  {flaggedCount > 0 && (
                    <Button
                      size="sm"
                      onClick={handleFixAllFlagged}
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
                                      <span className="text-white/30">
                                        @
                                      </span>{" "}
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
                                  {actual?.outcome ? (
                                    <span
                                      className={cn(
                                        isFlagged &&
                                          actual.outcome !== orig?.outcome
                                          ? "text-emerald-400 font-medium"
                                          : "text-white/70"
                                      )}
                                    >
                                      {actual.outcome}
                                    </span>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    className={cn(
                                      "text-[10px]",
                                      config.className
                                    )}
                                  >
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {config.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {isFlagged && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        toggleRowExpansion(row.id)
                                      }
                                      className="h-7 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                    >
                                      {isExpanded ? "Hide" : "Review"}
                                    </Button>
                                  )}
                                </TableCell>
                              </motion.tr>
                              {isFlagged && isExpanded && (
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
    </PageShell>
  );
}

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

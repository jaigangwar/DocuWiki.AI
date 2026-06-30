"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { validatePDFBatch, PDF_LIMITS } from "@/lib/pdf-extract";
import { useWorkspaceStore } from "@/store/workspace-store";
import { NeonButton } from "@/components/ui/NeonButton";
import { Tilt3D } from "@/components/ui/Tilt3D";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { uploadedPDFs, addPDFs, removePDF } = useWorkspaceStore();

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validation = validatePDFBatch(fileArray);

      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }

      setErrors([]);
      addPDFs(fileArray);
    },
    [addPDFs]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <Tilt3D maxTilt={3} scale={1} glare={false}>
        <motion.div
          className={`dropzone ${isDragging ? "dropzone-active" : ""} p-8 sm:p-12 cursor-pointer`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById("pdf-input")?.click()}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <input
            id="pdf-input"
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={onFileInput}
          />

          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDragging
                  ? "bg-neon-cyan/20 border border-neon-cyan/40"
                  : "bg-surface-600 border border-glass-border"
              } transition-all`}
              animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
            >
              <Upload
                className={`w-7 h-7 ${isDragging ? "text-neon-cyan" : "text-text-secondary"}`}
              />
            </motion.div>

            <div>
              <p className="text-text-primary font-medium mb-1">
                {isDragging ? "Drop PDFs here" : "Drag & drop PDF files"}
              </p>
              <p className="text-sm text-text-muted">
                or click to browse · Max {PDF_LIMITS.MAX_FILES} files ·{" "}
                {PDF_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB per file
              </p>
            </div>
          </div>
        </motion.div>
      </Tilt3D>

      {/* Error messages */}
      {errors.length > 0 && (
        <motion.div
          className="rounded-xl bg-error/10 border border-error/20 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-error">
                  {err}
                </p>
              ))}
            </div>
          </div>
          <button
            className="mt-2 text-xs text-error/70 hover:text-error"
            onClick={() => setErrors([])}
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Uploaded file list */}
      {uploadedPDFs.length > 0 && (
        <div className="space-y-2">
          {uploadedPDFs.map((pdf, i) => (
            <motion.div
              key={pdf.name}
              className="glass rounded-xl px-4 py-3 flex items-center justify-between group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {pdf.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatSize(pdf.size)}
                    {pdf.status === "extracted" && pdf.extractedDoc && (
                      <span className="text-success ml-2">
                        · {pdf.extractedDoc.totalPages} pages extracted
                      </span>
                    )}
                    {pdf.status === "extracting" && (
                      <span className="text-neon-cyan ml-2">
                        · Extracting...
                      </span>
                    )}
                    {pdf.status === "error" && (
                      <span className="text-error ml-2">
                        · {pdf.error || "Failed"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePDF(pdf.name);
                }}
                className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

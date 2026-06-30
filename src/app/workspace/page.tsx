"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Trash2,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { AnimatedGradient } from "@/components/ui/AnimatedGradient";
import { NeonButton } from "@/components/ui/NeonButton";
import { DropZone } from "@/components/workspace/DropZone";
import { ProcessingStepper } from "@/components/workspace/ProcessingStepper";
import { FileTree } from "@/components/workspace/FileTree";
import { MarkdownViewer } from "@/components/workspace/MarkdownViewer";
import { ExportButton } from "@/components/workspace/ExportButton";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Tilt3D } from "@/components/ui/Tilt3D";
import {
  writeFiles,
  buildFileTree,
  parseFrontmatter,
  clearAllFiles,
} from "@/lib/virtual-fs";

export default function WorkspacePage() {
  const {
    uploadedPDFs,
    processing,
    fileTree,
    isWorkspaceReady,
    setProcessingStep,
    resetProcessing,
    updatePDFStatus,
    setFileTree,
    setWorkspaceReady,
    clearPDFs,
    clearTabs,
  } = useWorkspaceStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [treePanelWidth] = useState(280);

  const hasFiles = uploadedPDFs.length > 0;
  const isProcessing =
    processing.step !== "idle" && processing.step !== "complete" && processing.step !== "error";

  // ---- Main Processing Pipeline ----
  const handleProcess = useCallback(async () => {
    if (uploadedPDFs.length === 0) return;

    try {
      // Dynamically import pdfjs-dist only when needed (large library)
      const { extractTextFromPDFs, truncateForLLM } = await import(
        "@/lib/pdf-extract"
      );

      // Step 1: Extract text from PDFs
      setProcessingStep("extracting", 0, "Starting text extraction...");

      const files = uploadedPDFs.map((p) => p.file);

      const extractedDocs = await extractTextFromPDFs(
        files,
        (fileIndex, totalFiles, progress) => {
          updatePDFStatus(
            progress.filename,
            progress.phase === "complete" ? "extracted" : "extracting"
          );
          setProcessingStep(
            "extracting",
            Math.round(((fileIndex + progress.percentage / 100) / totalFiles) * 100),
            `Extracting ${progress.filename} (page ${progress.currentPage}/${progress.totalPages})`,
            progress.filename
          );
        }
      );

      if (extractedDocs.length === 0) {
        setProcessingStep(
          "error",
          0,
          "No text could be extracted from any PDF."
        );
        return;
      }

      // Mark all as extracted
      extractedDocs.forEach((doc) => {
        updatePDFStatus(doc.filename, "extracted", doc);
      });

      // Step 2: Analyzing layout
      setProcessingStep("analyzing", 0, "Preparing documents for AI analysis...");
      const truncatedDocs = truncateForLLM(extractedDocs);

      await new Promise((r) => setTimeout(r, 800)); // Brief visual pause
      setProcessingStep("analyzing", 100, "Layout analysis complete");

      // Step 3: Structuring OKF Metadata via Groq API
      setProcessingStep("structuring", 0, "Sending to Groq AI for OKF structuring...");

      const response = await fetch("/api/process-okf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: truncatedDocs }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      const result = await response.json();
      setProcessingStep("structuring", 100, `Generated ${result.files.length} OKF files`);

      // Step 4: Weaving knowledge graph — store files in IndexedDB
      setProcessingStep("weaving", 0, "Storing files in knowledge base...");

      // Clear previous files
      await clearAllFiles();

      // Parse and store each file
      const filesToStore = result.files.map(
        (f: { filepath: string; content: string }) => {
          const { metadata } = parseFrontmatter(f.content);
          return {
            path: f.filepath,
            content: f.content,
            metadata,
          };
        }
      );

      await writeFiles(filesToStore);

      setProcessingStep(
        "weaving",
        100,
        `${filesToStore.length} files woven into knowledge graph`
      );

      // Build file tree
      const tree = await buildFileTree();
      setFileTree(tree);
      setWorkspaceReady(true);

      // Complete!
      setProcessingStep("complete", 100, "Knowledge base ready");
    } catch (error: any) {
      console.error("Processing failed:", error);
      setProcessingStep("error", 0, error.message || "Processing failed");
    }
  }, [
    uploadedPDFs,
    setProcessingStep,
    updatePDFStatus,
    setFileTree,
    setWorkspaceReady,
  ]);

  const handleReset = useCallback(async () => {
    clearPDFs();
    clearTabs();
    resetProcessing();
    setFileTree([]);
    setWorkspaceReady(false);
    await clearAllFiles();
  }, [clearPDFs, clearTabs, resetProcessing, setFileTree, setWorkspaceReady]);

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <AnimatedGradient intensity="subtle" />

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-glass-border glass">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-glass-white-hover transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Workspace
              </h1>
              <p className="text-xs text-text-muted">
                {isWorkspaceReady
                  ? `${fileTree.length > 0 ? "Knowledge base loaded" : "Ready"}`
                  : "Upload PDFs to begin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isWorkspaceReady && <ExportButton />}

            {hasFiles && !isProcessing && processing.step !== "complete" && (
              <NeonButton
                size="md"
                onClick={handleProcess}
                icon={<Play className="w-4 h-4" />}
              >
                Process PDFs
              </NeonButton>
            )}

            {(hasFiles || isWorkspaceReady) && !isProcessing && (
              <NeonButton
                variant="ghost"
                size="md"
                onClick={handleReset}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Reset
              </NeonButton>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="relative z-10 flex-1 flex min-h-0">
          {!isWorkspaceReady ? (
            /* Upload & Processing View */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <DropZone />
                <ProcessingStepper />

                {processing.step === "error" && (
                  <Tilt3D maxTilt={4} scale={1} glare>
                    <motion.div
                      className="rounded-xl bg-error/10 border border-error/20 p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-sm text-error font-medium mb-1">
                        Processing Error
                      </p>
                      <p className="text-xs text-error/80 whitespace-pre-wrap">
                        {processing.message}
                      </p>
                      {processing.message.includes("groq.com/settings/billing") && (
                        <a
                          href="https://console.groq.com/settings/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-neon-cyan underline hover:text-neon-cyan/80"
                        >
                          Upgrade Groq tier for higher limits →
                        </a>
                      )}
                      <NeonButton
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => resetProcessing()}
                      >
                        Try Again
                      </NeonButton>
                    </motion.div>
                  </Tilt3D>
                )}
              </div>
            </div>
          ) : (
            /* Dual-Pane Workspace View */
            <>
              {/* Left pane — File tree */}
              <motion.div
                className="border-r border-glass-border bg-surface-800/50 overflow-y-auto flex-shrink-0"
                style={{ width: treePanelWidth }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-3 border-b border-glass-border flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-neon-amber" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Knowledge Base
                  </span>
                </div>
                <FileTree />
              </motion.div>

              {/* Right pane — Markdown viewer */}
              <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <MarkdownViewer />
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

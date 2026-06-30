"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Code, Eye, Tag, Clock, FileType, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWorkspaceStore } from "@/store/workspace-store";
import { parseFrontmatter } from "@/lib/virtual-fs";

export function MarkdownViewer() {
  const { activeFile, openTabs, activeFilePath, setActiveFilePath, removeTab, setActiveFile } =
    useWorkspaceStore();
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

  const parsed = useMemo(() => {
    if (!activeFile) return null;
    return parseFrontmatter(activeFile.content);
  }, [activeFile]);

  if (openTabs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted text-sm">
            Select a file from the tree to view its content
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-glass-border overflow-x-auto">
        <div className="flex">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer border-r border-glass-border
                transition-colors group min-w-0
                ${
                  activeFilePath === tab.path
                    ? "bg-surface-700 text-text-primary border-b-2 border-b-neon-cyan"
                    : "text-text-secondary hover:text-text-primary hover:bg-glass-white"
                }
              `}
              onClick={async () => {
                setActiveFilePath(tab.path);
                const { readFile } = await import("@/lib/virtual-fs");
                const file = await readFile(tab.path);
                if (file) setActiveFile(file);
              }}
            >
              <FileType className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.path);
                }}
                className="p-0.5 rounded hover:bg-error/20 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 px-3">
          <button
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "preview"
                ? "bg-neon-cyan/10 text-neon-cyan"
                : "text-text-muted hover:text-text-primary"
            }`}
            onClick={() => setViewMode("preview")}
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "raw"
                ? "bg-neon-cyan/10 text-neon-cyan"
                : "text-text-muted hover:text-text-primary"
            }`}
            onClick={() => setViewMode("raw")}
            title="Raw Markdown"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeFile && parsed && (
            <motion.div
              key={activeFile.path + viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "preview" ? (
                <>
                  {/* YAML Frontmatter Block */}
                  <div className="yaml-block mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-3.5 h-3.5 text-neon-violet" />
                      <span className="text-xs font-semibold text-neon-violet uppercase tracking-wider">
                        OKF Metadata
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(parsed.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="yaml-key min-w-[100px]">
                            {key}:
                          </span>
                          <span className="yaml-value">
                            {Array.isArray(value)
                              ? `[${value.join(", ")}]`
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rendered Markdown Body */}
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {parsed.body}
                    </ReactMarkdown>
                  </div>
                </>
              ) : (
                /* Raw Markdown View */
                <pre className="text-sm font-mono text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                  {activeFile.content}
                </pre>
              )}

              {/* File metadata footer */}
              <div className="mt-8 pt-4 border-t border-glass-border flex items-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(activeFile.updatedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileType className="w-3 h-3" />
                  <span>{activeFile.path}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

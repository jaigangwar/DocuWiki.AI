"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Eye, Tag, Clock, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VFSFile } from "@/lib/virtual-fs";
import { parseFrontmatter } from "@/lib/virtual-fs";

interface SourceViewerProps {
  file: VFSFile | null;
  onClose: () => void;
}

export function SourceViewer({ file, onClose }: SourceViewerProps) {
  const parsed = useMemo(() => {
    if (!file) return null;
    return parseFrontmatter(file.content);
  }, [file]);

  if (!file || !parsed) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        <div className="text-center">
          <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Click a source citation to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-neon-cyan flex-shrink-0" />
          <span className="text-sm font-medium text-text-primary truncate">
            {parsed.metadata.title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-white-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Metadata pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neon-violet/10 text-neon-violet text-[11px] font-medium">
            <Tag className="w-3 h-3" />
            {parsed.metadata.type}
          </span>
          {parsed.metadata.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-surface-600 text-text-secondary text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* YAML block */}
        <div className="yaml-block mb-4 text-xs">
          <span className="yaml-key">resource</span>
          <span className="yaml-delimiter">: </span>
          <span className="yaml-value">{parsed.metadata.resource}</span>
        </div>

        {/* Markdown body */}
        <div className="markdown-body text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {parsed.body}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-glass-border flex items-center gap-2 text-[10px] text-text-muted">
          <Clock className="w-3 h-3" />
          <span>{file.path}</span>
        </div>
      </div>
    </motion.div>
  );
}

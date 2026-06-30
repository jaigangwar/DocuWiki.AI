"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";

interface SourceCitationsProps {
  citations: string[];
  onCitationClick?: (filepath: string) => void;
}

export function SourceCitations({
  citations,
  onCitationClick,
}: SourceCitationsProps) {
  if (!citations.length) return null;

  return (
    <motion.div
      className="mt-3 pt-3 border-t border-glass-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation, i) => {
          // Extract filename from path
          const filename = citation.split("/").pop() || citation;

          return (
            <button
              key={i}
              onClick={() => onCitationClick?.(citation)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                bg-neon-cyan/8 border border-neon-cyan/15 text-neon-cyan
                hover:bg-neon-cyan/15 hover:border-neon-cyan/25
                transition-all text-[11px] font-medium group"
            >
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[160px]">{filename}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

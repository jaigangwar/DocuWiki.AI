"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { VFSTreeNode } from "@/lib/virtual-fs";
import { readFile } from "@/lib/virtual-fs";

interface FileTreeNodeProps {
  node: VFSTreeNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { activeFilePath, setActiveFile, setActiveFilePath, addTab, highlightedFiles } =
    useWorkspaceStore();

  const isActive = activeFilePath === node.path;
  const isHighlighted = highlightedFiles.includes(node.path);

  const handleFileClick = async () => {
    if (node.type === "directory") {
      setIsOpen(!isOpen);
      return;
    }

    // Load file from IndexedDB and set as active
    setActiveFilePath(node.path);
    addTab(node.path, node.metadata?.title || node.name);

    try {
      const file = await readFile(node.path);
      if (file) {
        setActiveFile(file);
      }
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  return (
    <div>
      <div
        className={`
          file-tree-item flex items-center gap-2
          ${isActive ? "active" : ""}
          ${isHighlighted && !isActive ? "bg-neon-violet/8 text-neon-violet border-l-2 border-neon-violet" : ""}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleFileClick}
      >
        {/* Expand/collapse arrow for directories */}
        {node.type === "directory" ? (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          </motion.div>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Icon */}
        {node.type === "directory" ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-neon-amber flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-neon-amber/70 flex-shrink-0" />
          )
        ) : (
          <FileText className="w-4 h-4 text-neon-cyan/70 flex-shrink-0" />
        )}

        {/* Name */}
        <span className="text-sm truncate">{node.name}</span>

        {/* File type badge */}
        {node.type === "file" && node.metadata?.type && (
          <span className="ml-auto text-[10px] text-text-muted bg-surface-600 px-1.5 py-0.5 rounded">
            {node.metadata.type}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {node.type === "directory" && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTree() {
  const { fileTree } = useWorkspaceStore();

  if (fileTree.length === 0) {
    return (
      <div className="p-6 text-center">
        <Folder className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
        <p className="text-sm text-text-muted">
          No files yet. Upload and process PDFs to see your knowledge graph
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {fileTree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}

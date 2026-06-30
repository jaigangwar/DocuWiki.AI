// ================================================================
// Workspace Store — Zustand global state management
// Manages PDF uploads, processing pipeline, file tree, and chat
// ================================================================

import { create } from "zustand";
import type { ExtractedDocument } from "@/lib/pdf-extract";
import type { VFSTreeNode, VFSFile } from "@/lib/virtual-fs";

// ---- Processing Pipeline Types ----

export type ProcessingStep =
  | "idle"
  | "extracting"
  | "analyzing"
  | "structuring"
  | "weaving"
  | "complete"
  | "error";

export interface ProcessingState {
  step: ProcessingStep;
  progress: number; // 0-100
  currentFile: string;
  message: string;
}

// ---- Chat Types ----

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  highlightedFiles?: string[];
  timestamp: string;
}

// ---- Upload Types ----

export interface UploadedPDF {
  file: File;
  name: string;
  size: number;
  status: "pending" | "extracting" | "extracted" | "error";
  extractedDoc?: ExtractedDocument;
  error?: string;
}

// ---- Store Interface ----

export interface WorkspaceStore {
  // ---- Upload State ----
  uploadedPDFs: UploadedPDF[];
  addPDFs: (files: File[]) => void;
  removePDF: (name: string) => void;
  clearPDFs: () => void;
  updatePDFStatus: (
    name: string,
    status: UploadedPDF["status"],
    extractedDoc?: ExtractedDocument,
    error?: string
  ) => void;

  // ---- Processing Pipeline ----
  processing: ProcessingState;
  setProcessingStep: (
    step: ProcessingStep,
    progress?: number,
    message?: string,
    currentFile?: string
  ) => void;
  resetProcessing: () => void;

  // ---- File Tree ----
  fileTree: VFSTreeNode[];
  setFileTree: (tree: VFSTreeNode[]) => void;

  // ---- Active File ----
  activeFile: VFSFile | null;
  setActiveFile: (file: VFSFile | null) => void;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;

  // ---- Open Tabs ----
  openTabs: Array<{ path: string; title: string }>;
  addTab: (path: string, title: string) => void;
  removeTab: (path: string) => void;
  clearTabs: () => void;

  // ---- Chat ----
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string, citations?: string[]) => void;
  clearChat: () => void;
  isChatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
  highlightedFiles: string[];
  setHighlightedFiles: (files: string[]) => void;

  // ---- Workspace Meta ----
  isWorkspaceReady: boolean;
  setWorkspaceReady: (ready: boolean) => void;
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
}

// ---- Initial States ----

const initialProcessing: ProcessingState = {
  step: "idle",
  progress: 0,
  currentFile: "",
  message: "",
};

// ---- Store Creation ----

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  // ---- Upload State ----
  uploadedPDFs: [],

  addPDFs: (files: File[]) => {
    const newPDFs: UploadedPDF[] = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      status: "pending" as const,
    }));

    set((state) => ({
      uploadedPDFs: [
        ...state.uploadedPDFs,
        ...newPDFs.filter(
          (np) => !state.uploadedPDFs.some((ep) => ep.name === np.name)
        ),
      ],
    }));
  },

  removePDF: (name: string) => {
    set((state) => ({
      uploadedPDFs: state.uploadedPDFs.filter((p) => p.name !== name),
    }));
  },

  clearPDFs: () => set({ uploadedPDFs: [] }),

  updatePDFStatus: (name, status, extractedDoc, error) => {
    set((state) => ({
      uploadedPDFs: state.uploadedPDFs.map((p) =>
        p.name === name ? { ...p, status, extractedDoc, error } : p
      ),
    }));
  },

  // ---- Processing Pipeline ----
  processing: initialProcessing,

  setProcessingStep: (step, progress = 0, message = "", currentFile = "") => {
    set({
      processing: { step, progress, message, currentFile },
    });
  },

  resetProcessing: () => set({ processing: initialProcessing }),

  // ---- File Tree ----
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),

  // ---- Active File ----
  activeFile: null,
  setActiveFile: (file) => set({ activeFile: file }),
  activeFilePath: null,
  setActiveFilePath: (path) => set({ activeFilePath: path }),

  // ---- Open Tabs ----
  openTabs: [],

  addTab: (path, title) => {
    set((state) => {
      if (state.openTabs.some((t) => t.path === path)) {
        return { activeFilePath: path };
      }
      return {
        openTabs: [...state.openTabs, { path, title }],
        activeFilePath: path,
      };
    });
  },

  removeTab: (path) => {
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t.path !== path);
      const newActivePath =
        state.activeFilePath === path
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].path
            : null
          : state.activeFilePath;

      return {
        openTabs: newTabs,
        activeFilePath: newActivePath,
        activeFile: newActivePath === null ? null : state.activeFile,
      };
    });
  },

  clearTabs: () => set({ openTabs: [], activeFile: null, activeFilePath: null }),

  // ---- Chat ----
  chatMessages: [],

  addChatMessage: (message) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    }));
  },

  updateLastAssistantMessage: (content, citations) => {
    set((state) => {
      const messages = [...state.chatMessages];
      const lastIdx = messages.length - 1;

      if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
        messages[lastIdx] = {
          ...messages[lastIdx],
          content,
          citations: citations || messages[lastIdx].citations,
        };
      }

      return { chatMessages: messages };
    });
  },

  clearChat: () => set({ chatMessages: [], highlightedFiles: [] }),

  isChatLoading: false,
  setChatLoading: (loading) => set({ isChatLoading: loading }),

  highlightedFiles: [],
  setHighlightedFiles: (files) => set({ highlightedFiles: files }),

  // ---- Workspace Meta ----
  isWorkspaceReady: false,
  setWorkspaceReady: (ready) => set({ isWorkspaceReady: ready }),
  workspaceName: "DocuWiki Knowledge Base",
  setWorkspaceName: (name) => set({ workspaceName: name }),
}));

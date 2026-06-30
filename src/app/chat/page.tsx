"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Database, AlertTriangle, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { AnimatedGradient } from "@/components/ui/AnimatedGradient";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { SourceViewer } from "@/components/chat/SourceViewer";
import { useWorkspaceStore, type ChatMessage as ChatMessageType } from "@/store/workspace-store";
import {
  findRelevantFiles,
  getAllFiles,
  readFile,
  type VFSFile,
} from "@/lib/virtual-fs";
import { extractCitations } from "@/lib/okf-prompts";
import Link from "next/link";
import { Tilt3D } from "@/components/ui/Tilt3D";

export default function ChatPage() {
  const {
    chatMessages,
    addChatMessage,
    updateLastAssistantMessage,
    isChatLoading,
    setChatLoading,
    setHighlightedFiles,
  } = useWorkspaceStore();

  const [hasKnowledgeBase, setHasKnowledgeBase] = useState<boolean | null>(
    null
  );
  const [viewingSource, setViewingSource] = useState<VFSFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if knowledge base exists
  useEffect(() => {
    getAllFiles().then((files) => {
      setHasKnowledgeBase(files.length > 0);
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ---- Send Message Handler ----
  const handleSend = useCallback(
    async (query: string) => {
      // Add user message
      const userMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(userMessage);
      setChatLoading(true);

      // Add placeholder assistant message
      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);

      try {
        // 1. Find relevant files from the knowledge base
        const relevantFiles = await findRelevantFiles(query, 6);

        // Highlight files being consulted
        setHighlightedFiles(relevantFiles.map((f) => f.path));

        if (relevantFiles.length === 0) {
          updateLastAssistantMessage(
            "I couldn't find any relevant files in the knowledge base for your question. Try processing some PDFs in the Workspace first.",
            []
          );
          setChatLoading(false);
          return;
        }

        // 2. Build context and send to API
        const contextFiles = relevantFiles.map((f) => ({
          filepath: f.path,
          content: f.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, contextFiles }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed (${response.status})`);
        }

        // 3. Stream the response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.trim());

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();

                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    updateLastAssistantMessage(fullContent);
                  }
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (e) {
                  // Skip malformed chunks
                }
              }
            }
          }
        }

        // 4. Extract and attach citations
        const citations = extractCitations(fullContent);
        // Also add the context file paths as citations
        const allCitations = [
          ...new Set([
            ...citations,
            ...relevantFiles.map((f) => f.path),
          ]),
        ];
        updateLastAssistantMessage(fullContent, allCitations);
      } catch (error: any) {
        console.error("Chat error:", error);
        updateLastAssistantMessage(
          `Sorry, I encountered an error: ${error.message}. Please try again.`,
          []
        );
      } finally {
        setChatLoading(false);
        setHighlightedFiles([]);
      }
    },
    [addChatMessage, updateLastAssistantMessage, setChatLoading, setHighlightedFiles]
  );

  // ---- Citation Click Handler ----
  const handleCitationClick = useCallback(async (filepath: string) => {
    try {
      const file = await readFile(filepath);
      if (file) {
        setViewingSource(file);
      }
    } catch (err) {
      console.error("Failed to load source:", err);
    }
  }, []);

  // ---- Loading State ----
  if (hasKnowledgeBase === null) {
    return (
      <div className="flex h-screen bg-surface-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-text-muted text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // ---- No Knowledge Base State ----
  if (!hasKnowledgeBase) {
    return (
      <div className="flex h-screen bg-surface-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center relative">
          <AnimatedGradient intensity="subtle" />
          <Tilt3D maxTilt={5} scale={1} glare>
            <motion.div
              className="relative z-10 glass-card rounded-2xl p-10 text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Database className="w-12 h-12 text-neon-violet mx-auto mb-4 opacity-60" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                No Knowledge Base Found
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Upload and process PDFs in the Workspace first to create your OKF
                knowledge base. Then come back here to chat with your documents.
              </p>
              <Link
                href="/workspace"
                className="btn-neon text-sm px-6 py-2.5 inline-flex items-center gap-2"
              >
                Go to Workspace
              </Link>
            </motion.div>
          </Tilt3D>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex min-w-0">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <AnimatedGradient intensity="subtle" />

          {/* Header */}
          <header className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-glass-border glass">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Knowledge Agent
              </h1>
              <p className="text-xs text-text-muted">
                Ask questions · Powered by your OKF knowledge base
              </p>
            </div>
          </header>

          {/* Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4">
            {chatMessages.length === 0 ? (
              <motion.div
                className="h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center max-w-sm">
                  <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                  <h3 className="text-text-primary font-medium mb-2">
                    Start a Conversation
                  </h3>
                  <p className="text-sm text-text-muted">
                    Ask any question about your processed documents. The agent
                    will search your OKF knowledge base and provide cited answers.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                <AnimatePresence>
                  {chatMessages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onCitationClick={handleCitationClick}
                    />
                  ))}
                </AnimatePresence>

                {/* Streaming indicator */}
                {isChatLoading && (
                  <motion.div
                    className="flex items-center gap-2 text-xs text-neon-cyan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex gap-1">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                    </div>
                    <span>Analyzing knowledge base...</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="relative z-10">
            <ChatInput onSend={handleSend} />
          </div>
        </div>

        {/* Source Viewer Panel */}
        <AnimatePresence>
          {viewingSource && (
            <motion.div
              className="w-[380px] border-l border-glass-border bg-surface-800/80 flex-shrink-0"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <SourceViewer
                file={viewingSource}
                onClose={() => setViewingSource(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

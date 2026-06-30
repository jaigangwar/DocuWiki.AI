"use client";

import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/store/workspace-store";
import { SourceCitations } from "./SourceCitations";

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (filepath: string) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
          ${isUser ? "bg-neon-violet/20" : "bg-neon-cyan/20"}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-neon-violet" />
        ) : (
          <Bot className="w-4 h-4 text-neon-cyan" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}
        `}
      >
        {isUser ? (
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="markdown-body text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <SourceCitations
            citations={message.citations}
            onCitationClick={onCitationClick}
          />
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-text-muted mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isChatLoading } = useWorkspaceStore();

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isChatLoading) return;

      onSend(trimmed);
      setValue("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [value, onSend, isChatLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 p-4 border-t border-glass-border glass"
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask a question about your knowledge base..."
          disabled={disabled || isChatLoading}
          rows={1}
          className="w-full bg-surface-700 text-text-primary text-sm rounded-xl px-4 py-3 pr-12
            border border-glass-border focus:border-neon-cyan/40 focus:outline-none focus:ring-1 focus:ring-neon-cyan/20
            placeholder:text-text-muted resize-none transition-all disabled:opacity-50"
        />
      </div>

      <motion.button
        type="submit"
        disabled={!value.trim() || isChatLoading || disabled}
        className="p-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-violet text-white
          disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        whileHover={!isChatLoading ? { scale: 1.05 } : undefined}
        whileTap={!isChatLoading ? { scale: 0.95 } : undefined}
      >
        {isChatLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </motion.button>
    </form>
  );
}

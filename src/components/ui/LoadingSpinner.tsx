"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  label,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${sizeMap[size]} rounded-full border-2 border-surface-400`}
          style={{ borderTopColor: "var(--color-neon-cyan)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner glow dot */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neon-cyan"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: "0 0 8px var(--color-neon-cyan)",
          }}
        />
      </div>

      {label && (
        <motion.p
          className="text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Full-page loading overlay with spinner.
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary text-sm">{message}</p>
      </motion.div>
    </div>
  );
}

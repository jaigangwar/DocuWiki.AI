"use client";

import { motion } from "framer-motion";
import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
  glow?: boolean;
}

export function NeonButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  glow = true,
  className = "",
  disabled,
  ...props
}: NeonButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-neon-cyan to-neon-violet
      text-text-inverse font-semibold
      ${glow ? "shadow-[0_0_20px_var(--color-neon-cyan-glow)]" : ""}
      hover:shadow-[0_0_30px_rgba(6,214,160,0.4),0_0_60px_rgba(6,214,160,0.2)]
    `,
    secondary: `
      bg-surface-600 border border-glass-border
      text-text-primary font-medium
      hover:bg-surface-500 hover:border-glass-border-hover
    `,
    ghost: `
      bg-transparent border border-glass-border
      text-text-secondary font-medium
      hover:bg-glass-white-hover hover:text-text-primary hover:border-glass-border-hover
    `,
    danger: `
      bg-gradient-to-r from-error to-neon-pink
      text-white font-semibold
      ${glow ? "shadow-[0_0_20px_var(--color-neon-pink-glow)]" : ""}
    `,
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center
        rounded-full
        transition-all duration-300
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      whileHover={
        disabled
          ? undefined
          : { y: -2, transition: { duration: 0.15 } }
      }
      whileTap={
        disabled
          ? undefined
          : { scale: 0.97, transition: { duration: 0.1 } }
      }
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}

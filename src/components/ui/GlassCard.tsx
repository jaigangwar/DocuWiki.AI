"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { Tilt3D } from "./Tilt3D";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "default" | "strong" | "subtle";
  hover?: boolean;
  glow?: "cyan" | "violet" | "pink" | "none";
  tilt?: boolean;
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      variant = "default",
      hover = true,
      glow = "none",
      tilt = false,
      className = "",
      ...motionProps
    },
    ref
  ) {
    const variantClasses = {
      default: "glass-card",
      strong: "glass-strong",
      subtle: "glass",
    };

    const glowClasses = {
      cyan: "glow-cyan",
      violet: "glow-violet",
      pink: "glow-pink",
      none: "",
    };

    const card = (
      <motion.div
        ref={ref}
        className={`
          ${variantClasses[variant]}
          ${hover ? "glass-hover" : ""}
          ${glowClasses[glow]}
          rounded-[var(--radius-card)]
          transition-all duration-300
          ${className}
        `}
        whileHover={
          hover
            ? {
                y: -2,
                transition: { duration: 0.2, ease: "easeOut" },
              }
            : undefined
        }
        {...motionProps}
      >
        {children}
      </motion.div>
    );

    if (tilt) {
      return <Tilt3D maxTilt={5} scale={1.01} glare>{card}</Tilt3D>;
    }

    return card;
  }
);

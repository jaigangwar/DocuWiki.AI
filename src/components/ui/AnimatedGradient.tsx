"use client";

import { motion } from "framer-motion";

interface AnimatedGradientProps {
  className?: string;
  intensity?: "subtle" | "medium" | "intense";
}

/**
 * Animated mesh gradient background component.
 * Renders floating radial gradient orbs with gentle rotation.
 */
export function AnimatedGradient({
  className = "",
  intensity = "medium",
}: AnimatedGradientProps) {
  const opacityMap = {
    subtle: { primary: 0.08, secondary: 0.06, tertiary: 0.04 },
    medium: { primary: 0.15, secondary: 0.12, tertiary: 0.08 },
    intense: { primary: 0.25, secondary: 0.2, tertiary: 0.15 },
  };

  const o = opacityMap[intensity];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      {/* Primary orb — Violet */}
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "800px",
          maxHeight: "800px",
          background: `radial-gradient(circle, rgba(124, 58, 237, ${o.primary}), transparent 70%)`,
          top: "-20%",
          left: "-10%",
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary orb — Cyan */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "700px",
          maxHeight: "700px",
          background: `radial-gradient(circle, rgba(6, 214, 160, ${o.secondary}), transparent 70%)`,
          top: "20%",
          right: "-15%",
        }}
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Tertiary orb — Pink */}
      <motion.div
        className="absolute rounded-full blur-[80px]"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: "500px",
          maxHeight: "500px",
          background: `radial-gradient(circle, rgba(247, 37, 133, ${o.tertiary}), transparent 70%)`,
          bottom: "-10%",
          left: "30%",
        }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
    </div>
  );
}

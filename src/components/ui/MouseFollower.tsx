"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function MouseFollower() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [mounted, setMounted] = useState(false);
  const RAFRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      if (RAFRef.current !== null) cancelAnimationFrame(RAFRef.current);
      RAFRef.current = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (RAFRef.current !== null) cancelAnimationFrame(RAFRef.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999]"
      style={{ x: position.x, y: position.y, translateX: "-50%", translateY: "-50%" }}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.3 }}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(6,214,160,0.8)]" />
        <div className="absolute w-8 h-8 rounded-full border border-neon-cyan/30" />
      </div>
    </motion.div>
  );
}

export function MouseTrail() {
  const [mounted, setMounted] = useState(false);
  const [points, setPoints] = useState<Array<{ x: number; y: number; id: string }>>([]);
  const RAFRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      if (RAFRef.current !== null) cancelAnimationFrame(RAFRef.current);
      RAFRef.current = requestAnimationFrame(() => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setPoints((prev) => [...prev.slice(-8), { x: e.clientX, y: e.clientY, id }]);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (RAFRef.current !== null) cancelAnimationFrame(RAFRef.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {points.map((point, i) => (
        <motion.div
          key={point.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-neon-cyan/60"
          style={{
            left: point.x,
            top: point.y,
            transform: "translate(-50%, -50%)",
            opacity: ((i + 1) / points.length) * 0.5,
            boxShadow: "0 0 6px rgba(6,214,160,0.4)",
          }}
          initial={{ scale: 0.5, y: 0 }}
          animate={{ scale: 0, y: -4 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

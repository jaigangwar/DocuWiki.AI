"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

/**
 * Animated geometric mesh background using Canvas.
 * Renders floating interconnected nodes that subtly drift and
 * connect with lines, evoking a "processing data" feel.
 */
export function HeroMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Generate nodes on first call
    if (!(canvas as any).__nodes) {
      const nodeCount = Math.min(Math.floor((w * h) / 15000), 80);
      const nodes: Node[] = [];
      const colors = [
        "rgba(6, 214, 160, 0.6)",
        "rgba(124, 58, 237, 0.5)",
        "rgba(67, 97, 238, 0.4)",
        "rgba(247, 37, 133, 0.3)",
      ];

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      (canvas as any).__nodes = nodes;
    }

    const nodes: Node[] = (canvas as any).__nodes;
    const connectionDistance = 150;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Update positions
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > w) node.vx *= -1;
      if (node.y < 0 || node.y > h) node.vy *= -1;

      node.x = Math.max(0, Math.min(w, node.x));
      node.y = Math.max(0, Math.min(h, node.y));
    }

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const opacity = (1 - dist / connectionDistance) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6, 214, 160, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Glow effect for larger nodes
      if (node.radius > 1.5) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = node.color.replace(/[\d.]+\)$/, "0.08)");
        ctx.fill();
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}

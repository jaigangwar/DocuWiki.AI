"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

export function Tilt3D({
  children,
  className = "",
  maxTilt = 8,
  perspective = 1000,
  scale = 1.02,
  speed = 400,
  glare = true,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      el.style.setProperty("--glare-x", `${glareX}%`);
      el.style.setProperty("--glare-y", `${glareY}%`);
      el.style.setProperty("--glare-opacity", "1");
    }
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;

    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.setProperty("--glare-opacity", "0");
  };

  return (
    <div
      ref={ref}
      className={`relative transition-transform will-change-transform ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transition: `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.15) 0%, transparent 60%)",
            opacity: "var(--glare-opacity, 0)",
            transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
            borderRadius: "inherit",
          }}
        />
      )}
    </div>
  );
}

export function ParallaxTilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const layers = el.querySelectorAll("[data-depth]");
    layers.forEach((layer) => {
      const depth = parseFloat((layer as HTMLElement).dataset.depth || "0");
      const moveX = x * depth * 20;
      const moveY = y * depth * 20;
      (layer as HTMLElement).style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
    });
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;

    const layers = el.querySelectorAll("[data-depth]");
    layers.forEach((layer) => {
      (layer as HTMLElement).style.transform = "translateX(0) translateY(0)";
    });
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

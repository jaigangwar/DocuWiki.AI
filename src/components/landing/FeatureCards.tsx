"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  FileText,
  Network,
  Search,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Tilt3D } from "@/components/ui/Tilt3D";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  glowColor: string;
}

const features: Feature[] = [
  {
    icon: FileText,
    title: "Deterministic Structure",
    description:
      "Unlike vector RAG that loses context in embeddings, OKF preserves 100% of your document structure with human-readable Markdown files and strict YAML metadata.",
    accent: "from-neon-cyan to-neon-blue",
    glowColor: "var(--color-neon-cyan-glow)",
  },
  {
    icon: Network,
    title: "Knowledge Graph Links",
    description:
      "Every concept automatically cross-references related topics via relative Markdown links, creating a true knowledge graph — not a flat chunk store.",
    accent: "from-neon-violet to-neon-pink",
    glowColor: "var(--color-neon-violet-glow)",
  },
  {
    icon: Search,
    title: "Zero-Hallucination Chat",
    description:
      "The OKF Agent reads metadata to select exact source files before answering. Every response is grounded with clickable source citations — no guesswork.",
    accent: "from-neon-pink to-neon-amber",
    glowColor: "var(--color-neon-pink-glow)",
  },
  {
    icon: Download,
    title: "Export & Interoperate",
    description:
      "Download your entire knowledge base as standard Markdown files. Import into Obsidian, Notion, or any tool — zero vendor lock-in, 100% portability.",
    accent: "from-neon-blue to-neon-cyan",
    glowColor: "var(--color-neon-blue-dim)",
  },
];

export function FeatureCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
    >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Tilt3D key={feature.title} maxTilt={6} scale={1.02} glare>
              <motion.div
                className="glass-card rounded-2xl p-7 group relative overflow-hidden"
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.12,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${feature.glowColor}, transparent 70%)`,
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px]">
                  <div
                    className={`h-full bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-60 transition-opacity duration-500`}
                  />
                </div>
              </motion.div>
            </Tilt3D>
          );
        })}
    </div>
  );
}

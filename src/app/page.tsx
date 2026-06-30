"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Braces,
  FileStack,
  Layers,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroMesh } from "@/components/landing/HeroMesh";
import { StatsCounter } from "@/components/landing/StatsCounter";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { AnimatedGradient } from "@/components/ui/AnimatedGradient";
import { Tilt3D } from "@/components/ui/Tilt3D";

// Stagger animation variants
const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-text-primary overflow-hidden">
      <Navbar />

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background layers */}
        <AnimatedGradient intensity="intense" />
        <HeroMesh />

        {/* Hero content */}
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass border border-neon-cyan/20 text-neon-cyan">
              <Sparkles className="w-3.5 h-3.5" />
              Open Knowledge Format v0.1
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight"
          >
            <span className="text-text-primary">Deterministic PDF</span>
            <br />
            <span className="text-gradient-neon">Knowledge Management</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Convert PDFs into interconnected, structured knowledge graphs.
            <br className="hidden sm:block" />
            No chunk loss. No hallucinations. 100% interoperable Markdown.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/workspace"
              className="btn-neon text-base px-8 py-3.5 inline-flex items-center gap-2"
              id="hero-cta"
            >
              Try Now
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-text-secondary border border-glass-border hover:border-glass-border-hover hover:text-text-primary transition-all"
            >
              Learn How It Works
            </a>
          </motion.div>

          {/* Floating code preview snippet */}
          <motion.div
            variants={fadeUp}
            className="mt-16 max-w-xl mx-auto"
          >
            <Tilt3D maxTilt={5} scale={1} glare>
              <div className="glass-card rounded-xl p-5 text-left font-mono text-xs sm:text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-glass-border">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                  <span className="text-text-muted ml-2 text-[10px] font-sans">
                    knowledge_base/finance/budget-policy.md
                  </span>
                </div>
                <div className="yaml-block !p-3 !mb-3 !rounded-lg">
                  <span className="yaml-delimiter">---</span>
                  <br />
                  <span className="yaml-key">type</span>
                  <span className="yaml-delimiter">: </span>
                  <span className="yaml-value">policy</span>
                  <br />
                  <span className="yaml-key">title</span>
                  <span className="yaml-delimiter">: </span>
                  <span className="yaml-value">
                    Annual Budget Guidelines
                  </span>
                  <br />
                  <span className="yaml-key">tags</span>
                  <span className="yaml-delimiter">: </span>
                  <span className="yaml-value">[finance, budget, Q4]</span>
                  <br />
                  <span className="yaml-key">resource</span>
                  <span className="yaml-delimiter">: </span>
                  <span className="yaml-value">
                    report.pdf#page=12
                  </span>
                  <br />
                  <span className="yaml-delimiter">---</span>
                </div>
                <div className="text-text-secondary">
                  <span className="text-neon-cyan">##</span> Overview
                  <br />
                  <span className="text-text-muted">
                    The annual budget must align with...
                  </span>
                  <br />
                  <span className="text-neon-violet">[</span>
                  <span className="text-text-primary">Related: Revenue Policy</span>
                  <span className="text-neon-violet">]</span>
                  <span className="text-text-muted">
                    (/finance/revenue-policy.md)
                  </span>
                </div>
              </div>
            </Tilt3D>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border border-glass-border-hover flex justify-center pt-2">
            <div className="w-1 h-2 bg-neon-cyan rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ============================================
          STATS SECTION
          ============================================ */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <StatsCounter />
        </div>
      </section>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section id="features" className="relative py-24 px-4 sm:px-6">
        <AnimatedGradient intensity="subtle" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-neon-violet border border-neon-violet/20 mb-4">
              <Layers className="w-3.5 h-3.5" />
              Why OKF
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-text-primary">Beyond </span>
              <span className="text-gradient-neon">Vector RAG</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              OKF replaces lossy vector embeddings with a deterministic, human-readable knowledge structure you own and control.
            </p>
          </motion.div>

          <FeatureCards />
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS SECTION
          ============================================ */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-neon-pink border border-neon-pink/20 mb-4">
              <Braces className="w-3.5 h-3.5" />
              Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-text-primary">How </span>
              <span className="text-gradient-warm">It Works</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Upload PDFs",
                desc: "Drag & drop multiple PDF files. Text is extracted client-side — your documents never leave your browser until processing.",
                icon: FileStack,
              },
              {
                step: "02",
                title: "AI Structures into OKF",
                desc: "Groq's ultra-fast inference breaks documents into atomic concepts with YAML metadata and interlinked Markdown files.",
                icon: Braces,
              },
              {
                step: "03",
                title: "Explore & Query",
                desc: "Browse your knowledge graph in an IDE-like file explorer, or ask the AI agent questions with zero-hallucination, cited answers.",
                icon: Sparkles,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Tilt3D key={item.step} maxTilt={5} scale={1.01} glare>
                <motion.div
                  className="glass-card rounded-2xl p-6 sm:p-8 flex items-start gap-5"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center border border-glass-border">
                      <Icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neon-cyan font-mono mb-1">
                      STEP {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </Tilt3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="relative py-24 px-4 sm:px-6">
        <AnimatedGradient intensity="medium" />

        <Tilt3D maxTilt={4} scale={1} glare>
          <motion.div
            className="relative z-10 max-w-2xl mx-auto text-center glass-card rounded-2xl p-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-neon">
                Ready to transform your PDFs?
              </span>
            </h2>
            <p className="text-text-secondary mb-8">
              Start building your knowledge graph in seconds.
            </p>
            <Link
              href="/workspace"
              className="btn-neon text-base px-10 py-4 inline-flex items-center gap-2"
              id="bottom-cta"
            >
              Launch Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </Tilt3D>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t border-glass-border py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
            <span>DocuWiki.AI — Open Knowledge Format v0.1</span>
          </div>
          <div>
            Built with Next.js, Groq, and{" "}
            <span className="text-neon-cyan">deterministic AI</span>.
          </div>
        </div>
      </footer>
    </div>
  );
}

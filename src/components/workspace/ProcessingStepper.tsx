"use client";

import { motion } from "framer-motion";
import { Check, Loader2, FileSearch, Brain, Network, Sparkles } from "lucide-react";
import { useWorkspaceStore, type ProcessingStep } from "@/store/workspace-store";
import { Tilt3D } from "@/components/ui/Tilt3D";

const steps: Array<{
  key: ProcessingStep;
  label: string;
  icon: typeof FileSearch;
  description: string;
}> = [
  {
    key: "extracting",
    label: "Extracting Text",
    icon: FileSearch,
    description: "Reading PDF content page by page",
  },
  {
    key: "analyzing",
    label: "Analyzing Layout",
    icon: Brain,
    description: "Understanding document structure",
  },
  {
    key: "structuring",
    label: "Structuring OKF Metadata",
    icon: Sparkles,
    description: "Generating YAML frontmatter & Markdown",
  },
  {
    key: "weaving",
    label: "Weaving Knowledge Graph",
    icon: Network,
    description: "Creating cross-links between concepts",
  },
];

const stepOrder: ProcessingStep[] = [
  "extracting",
  "analyzing",
  "structuring",
  "weaving",
  "complete",
];

function getStepStatus(
  stepKey: ProcessingStep,
  currentStep: ProcessingStep
): "done" | "active" | "pending" {
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(stepKey);

  if (currentStep === "complete") return "done";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export function ProcessingStepper() {
  const { processing } = useWorkspaceStore();

  if (processing.step === "idle") return null;

  const progressPercentage = (() => {
    const idx = stepOrder.indexOf(processing.step);
    if (processing.step === "complete") return 100;
    if (idx < 0) return 0;
    return Math.round(((idx + processing.progress / 100) / 4) * 100);
  })();

  return (
    <Tilt3D maxTilt={4} scale={1} glare>
      <motion.div
        className="glass-card rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-text-primary">
            {processing.step === "complete"
              ? "Processing Complete"
              : "Processing Pipeline"}
          </h3>
          <span className="text-xs font-mono text-neon-cyan">
            {progressPercentage}%
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="h-1 bg-surface-600 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="stepper-line rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const status = getStepStatus(step.key, processing.step);
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Step indicator */}
                <div
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${status === "done" ? "bg-neon-cyan/20" : ""}
                    ${status === "active" ? "bg-neon-cyan/10 stepper-dot-active" : ""}
                    ${status === "pending" ? "bg-surface-600" : ""}
                  `}
                >
                  {status === "done" ? (
                    <Check className="w-4 h-4 text-neon-cyan" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-text-muted" />
                  )}
                </div>

                {/* Step text */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      status === "active"
                        ? "text-neon-cyan"
                        : status === "done"
                          ? "text-text-primary"
                          : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {status === "active" && processing.message
                      ? processing.message
                      : step.description}
                  </p>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[18px] mt-9 w-0.5 h-4" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current file indicator */}
        {processing.currentFile && processing.step !== "complete" && (
          <motion.div
            className="mt-6 pt-4 border-t border-glass-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs text-text-muted">
              Currently processing:{" "}
              <span className="text-neon-cyan font-mono">
                {processing.currentFile}
              </span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </Tilt3D>
  );
}

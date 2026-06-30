"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Zap, GitBranch } from "lucide-react";
import { Tilt3D } from "@/components/ui/Tilt3D";

interface StatItem {
  label: string;
  value: string;
  suffix: string;
  icon: typeof Shield;
  color: string;
}

const stats: StatItem[] = [
  {
    label: "Chunk Loss",
    value: "0",
    suffix: "%",
    icon: Shield,
    color: "text-neon-cyan",
  },
  {
    label: "Interoperable",
    value: "100",
    suffix: "%",
    icon: GitBranch,
    color: "text-neon-violet",
  },
  {
    label: "Faster Processing",
    value: "10",
    suffix: "x",
    icon: Zap,
    color: "text-neon-pink",
  },
];

function AnimatedNumber({
  target,
  suffix,
  duration = 2000,
}: {
  target: number;
  suffix: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            className="glass-card rounded-2xl p-6 text-center group"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: index * 0.15,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          >
            <Tilt3D maxTilt={5} scale={1} glare>
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${stat.color} bg-current/10`}
                data-depth="0.5"
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                <AnimatedNumber
                  target={parseInt(stat.value)}
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </Tilt3D>
          </motion.div>
        );
      })}
    </div>
  );
}

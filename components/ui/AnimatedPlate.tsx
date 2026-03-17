"use client";

import { AnimatePresence, motion, useAnimationControls, type Variants } from "framer-motion";
import { useEffect, useMemo } from "react";

export type PlateMode =
  | "welcomeHero"
  | "homeAmbient"
  | "captureFocused"
  | "analysisScanning"
  | "resultsCompact";

interface ModeConfig {
  scale: number;
  rotate: number;
  y: number;
  glowOpacity: number;
  glowColor: string;
  size: number;
}

const MODE_CONFIG: Record<PlateMode, ModeConfig> = {
  welcomeHero: {
    scale: 1,
    rotate: 0,
    y: 0,
    glowOpacity: 0.22,
    glowColor: "#9BD7FF",
    size: 380,
  },
  homeAmbient: {
    scale: 0.92,
    rotate: 0,
    y: 2,
    glowOpacity: 0.42,
    glowColor: "#A8D8FF",
    size: 360,
  },
  captureFocused: {
    scale: 0.96,
    rotate: -2.4,
    y: 18,
    glowOpacity: 0.18,
    glowColor: "#A8FFD8",
    size: 348,
  },
  analysisScanning: {
    scale: 0.98,
    rotate: 0,
    y: 8,
    glowOpacity: 0.78,
    glowColor: "#D8A8FF",
    size: 344,
  },
  resultsCompact: {
    scale: 0.74,
    rotate: 0,
    y: 0,
    glowOpacity: 0.24,
    glowColor: "#A8FFD8",
    size: 320,
  },
};

const SPRING = {
  type: "spring" as const,
  damping: 18,
  stiffness: 120,
  mass: 1.2,
};

export const plateTransitionVariants = {
  enterForward: {
    scale: 0.72,
    opacity: 0,
    filter: "blur(6px)",
    y: 20,
  },
  enterBackward: {
    scale: 1.18,
    opacity: 0,
    filter: "blur(4px)",
    y: -20,
  },
  active: {
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 20,
      stiffness: 130,
      mass: 1.1,
      restDelta: 0.001,
    },
  },
  exitForward: {
    scale: 0.72,
    opacity: 0,
    filter: "blur(6px)",
    y: -20,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
  exitBackward: {
    scale: 1.18,
    opacity: 0,
    filter: "blur(4px)",
    y: 20,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};

const ambientMotion: Record<PlateMode, Variants | null> = {
  welcomeHero: {
    animate: {
      scale: [1, 1.01, 1],
      y: [0, -6, 0, 3, 0],
      transition: {
        scale: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 6.8, repeat: Infinity, ease: "easeInOut" },
      },
    },
  },
  homeAmbient: {
    animate: {
      scale: [1, 1.012, 1],
      y: [0, -4, 0, 4, 0],
      transition: {
        scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      },
    },
  },
  captureFocused: null,
  analysisScanning: null,
  resultsCompact: null,
};

const glowMotion: Record<PlateMode, Variants | null> = {
  welcomeHero: {
    animate: {
      opacity: [0.8, 1, 0.8],
      scale: [0.98, 1.03, 0.98],
      transition: {
        duration: 4.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  homeAmbient: null,
  captureFocused: {
    animate: {
      opacity: [0.3, 0.5, 0.3],
      scale: [0.98, 1.015, 0.98],
      transition: {
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  analysisScanning: {
    animate: {
      opacity: [0.72, 0.94, 0.72],
      scale: [0.98, 1.04, 0.98],
      transition: {
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  resultsCompact: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AnimatedPlate({
  mode,
  weight = 0,
}: {
  mode: PlateMode;
  weight?: number;
}) {
  const controls = useAnimationControls();
  const config = MODE_CONFIG[mode];
  const motionVariant = ambientMotion[mode];

  const glowOpacity = useMemo(() => {
    if (mode !== "homeAmbient") {
      return config.glowOpacity;
    }

    return clamp(0.15 + (weight / 500) * 0.7, 0.15, 0.85);
  }, [config.glowOpacity, mode, weight]);

  useEffect(() => {
    void controls.start({
      scale: config.scale,
      rotate: config.rotate,
      y: config.y,
      transition: SPRING,
    });
  }, [config.rotate, config.scale, config.y, controls, mode]);

  return (
    <motion.div
      className="relative"
      style={{ width: config.size, height: config.size }}
      animate={controls}
    >
      <motion.div
        className="absolute left-1/2 top-[80%] h-6 w-[58%] -translate-x-1/2 rounded-full bg-slate-950/30 blur-[14px]"
        animate={{
          scaleX: mode === "captureFocused" ? 0.92 : 1,
          opacity: mode === "resultsCompact" ? 0.42 : 0.62,
        }}
        transition={SPRING}
      />

      <motion.div
        className="absolute inset-[6%] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 72%)`,
        }}
        variants={glowMotion[mode] ?? undefined}
        animate={
          glowMotion[mode]
            ? "animate"
            : {
                opacity: glowOpacity,
                scale: 1,
              }
        }
        transition={glowMotion[mode] ? undefined : SPRING}
      />

      <motion.div
        className="absolute inset-0"
        variants={motionVariant ?? undefined}
        animate={motionVariant ? "animate" : undefined}
      >
        <img
          src="/assets/scale/sbs3.png"
          alt="SmartBite Scale"
          width={config.size}
          height={config.size}
          className="h-full w-full object-contain select-none pointer-events-none"
          style={{
            filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.16)) drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
            maxWidth: "100%",
          }}
          draggable={false}
        />

        <AnimatePresence>
          {mode === "analysisScanning" ? (
            <motion.div
              key="scan"
              className="absolute inset-[20%] rounded-full"
              style={{
                background:
                  "linear-gradient(110deg, transparent 28%, rgba(216,168,255,0.08) 42%, rgba(216,168,255,0.34) 50%, rgba(216,168,255,0.08) 58%, transparent 72%)",
              }}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default AnimatedPlate;

//components/ui/PlateStage.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import AnimatedPlate, {
  plateTransitionVariants,
  type PlateMode,
} from "@/components/ui/AnimatedPlate";
import type { NavDirection } from "@/lib/types";

interface PlateStageProps {
  currentScreen: string;
  mode: PlateMode;
  navDirection: NavDirection;
  weight?: number;
  foodImage?: string;
  className?: string;
}

const STAGE_LAYOUT: Record<PlateMode, string> = {
  welcomeHero: "w-full px-0 py-0",
  homeAmbient: "w-full py-2",
  captureFocused: "w-full py-3",
  analysisScanning: "w-full py-3",
  resultsCompact: "w-full py-1",
};

const STAGE_SHELL: Record<PlateMode, string> = {
  welcomeHero:
    "min-h-[254px] rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.28),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-6",
  homeAmbient:
    "min-h-[216px] rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.2),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(235,244,255,0.5))] px-4 py-5 ring-1 ring-white/70 shadow-[0_18px_36px_rgba(30,64,175,0.08)]",
  captureFocused:
    "min-h-[258px] rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.24),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-6",
  analysisScanning:
    "min-h-[258px] rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-6",
  resultsCompact:
    "min-h-[182px] rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.64),rgba(239,246,255,0.36))] px-4 py-4 ring-1 ring-white/60",
};

export function PlateStage({
  currentScreen,
  mode,
  navDirection,
  weight,
  foodImage,
  className = "",
}: PlateStageProps) {
  console.log("PlateStage rendered with screen:", currentScreen, "direction:", navDirection);

  const initialVariant =
    navDirection === "forward"
      ? "enterForward"
      : navDirection === "backward"
        ? "enterBackward"
        : "active";
  const exitVariant = navDirection === "forward" ? "exitForward" : "exitBackward";

  return (
    <AnimatePresence mode="wait" custom={navDirection}>
      <motion.div
        key={currentScreen}
        className={`${STAGE_LAYOUT[mode]} ${className}`}
        custom={navDirection}
        initial={initialVariant}
        animate="active"
        exit={exitVariant}
        variants={plateTransitionVariants}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none relative overflow-hidden ${STAGE_SHELL[mode]}`}
        >
          <div className="absolute inset-x-[10%] top-3 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),transparent_72%)] blur-3xl" />
          <div className="relative flex h-full items-center justify-center">
            <AnimatedPlate mode={mode} weight={weight} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PlateStage;

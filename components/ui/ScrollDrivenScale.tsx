"use client";

import { useEffect, useState } from "react";
import { motion, type MotionValue } from "framer-motion";

const FRAMES = [
  "/assets/scale/scale_0.png",
  "/assets/scale/scale_1.png",
  "/assets/scale/scale_2.png",
  "/assets/scale/scale_3.png",
  "/assets/scale/scale_4.png",
  "/assets/scale/scale_5.png",
];

if (typeof window !== "undefined") {
  FRAMES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

interface ScrollDrivenScaleProps {
  scrollProgress: MotionValue<number>;
  size?: number;
}

export function ScrollDrivenScale({ scrollProgress, size = 320 }: ScrollDrivenScaleProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    return scrollProgress.on("change", (v) => {
      const raw = v * (FRAMES.length - 1);
      const index = Math.min(Math.round(raw), FRAMES.length - 1);
      setFrameIndex(Math.max(0, index));
    });
  }, [scrollProgress]);

  return (
    <motion.img
      key={frameIndex}
      src={FRAMES[frameIndex]}
      alt="SmartBite Scale"
      width={size}
      height={size}
      className="object-contain select-none pointer-events-none"
      initial={{ opacity: 0.75, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.16)) drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
        maxWidth: "100%",
      }}
      draggable={false}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion, type MotionValue } from "framer-motion";
import { Bluetooth, BrainCircuit, Camera, ChevronRight, Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ScrollDrivenScale } from "@/components/ui/ScrollDrivenScale";
import { useLanguage } from "@/hooks/useLanguage";

function SectionLabel({ color, children }: { color: string; children: string }) {
  return <p className={`text-sm font-semibold uppercase tracking-widest ${color}`}>{children}</p>;
}

function WeightCounter({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [weight, setWeight] = useState(0);
  const weightMotion = useTransform(scrollProgress, [0.2, 0.38], [0, 248]);
  useEffect(() => {
    return weightMotion.on("change", (v) => setWeight(Math.round(v)));
  }, [weightMotion]);
  return (
    <div className="tabular-nums">
      <span className="text-[4rem] font-semibold tracking-tight text-slate-950">{weight}</span>
      <span className="ml-2 text-2xl text-slate-400">g</span>
    </div>
  );
}

export function WelcomeLanding({ onConnect, onContinue }: { onConnect: () => void; onContinue: () => void }) {
  const { dir, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scaleSize = useTransform(scrollYProgress, [0, 0.1, 0.4, 0.5, 0.8, 1.0], [0.72, 1.0, 0.94, 1.06, 0.88, 0.52]);
  const scaleY = useTransform(scrollYProgress, [0, 0.12, 0.82, 1.0], [60, 0, 0, -80]);
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.18, 0.38, 0.42, 0.58, 0.62, 0.78, 0.82, 1.0],
    ["#f0f6ff", "#fdf6ee", "#fdf6ee", "#0f172a", "#0f172a", "#13052e", "#13052e", "#f0f6ff", "#f0f6ff"]
  );
  const glowOpacity = useTransform(scrollYProgress, [0.58, 0.65, 0.76, 0.82], [0, 1, 1, 0]);
  const weightOpacity = useTransform(scrollYProgress, [0.18, 0.24, 0.36, 0.42], [0, 1, 1, 0]);
  const resultsOpacity = useTransform(scrollYProgress, [0.82, 0.9], [0, 1]);

  return (
    <div ref={containerRef} dir={dir} className="relative h-[500vh]">

      {/* Sticky canvas */}
      <motion.div
        className="sticky top-0 h-screen overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        {/* Purple glow */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 340, height: 340,
            background: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)",
            filter: "blur(20px)",
            opacity: glowOpacity,
          }}
        />

        {/* Scale */}
        <motion.div style={{ scale: scaleSize, y: scaleY }}>
          <ScrollDrivenScale scrollProgress={scrollYProgress} size={320} />
        </motion.div>

        {/* Weight counter */}
        <motion.div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-center"
          style={{ opacity: weightOpacity }}
        >
          <WeightCounter scrollProgress={scrollYProgress} />
        </motion.div>

        {/* Results card */}
        <motion.div className="absolute bottom-[12%] right-6 w-48" style={{ opacity: resultsOpacity }}>
          <div className="rounded-[22px] bg-white/90 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">AI Estimate</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">580</p>
            <p className="text-sm text-slate-500">Calories</p>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Protein</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">42g</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Section 0 — Hero */}
      <section className="relative h-screen flex flex-col justify-end pb-16 px-7 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-600 shadow-sm backdrop-blur-md mb-4">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            {t("common.smartNutrition")}
          </div>
          <h1 className="text-[3rem] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
            SmartBite<br /><span className="text-slate-950/75">Scale.</span>
          </h1>
          <p className="mt-3 text-lg text-slate-600">{t("welcome.subtitle")}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button fullWidth onClick={onConnect} className="h-14 rounded-[26px] bg-[linear-gradient(135deg,#1d4ed8,#4338ca,#6366f1)] text-base font-semibold text-white shadow-[0_20px_40px_rgba(59,130,246,0.30)]">
              <Bluetooth className="mr-2.5 h-5 w-5" />{t("common.connectScale")}
            </Button>
            <Button variant="secondary" fullWidth onClick={onContinue} className="h-11 rounded-[22px] bg-white/60 text-slate-700 backdrop-blur-md">
              {t("common.tryDemoMode")}<ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 — Weigh */}
      <section className="relative h-screen flex flex-col justify-center px-7">
        <SectionLabel color="text-blue-500">{t("welcome.featureLiveTitle")}</SectionLabel>
        <h2 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">
          Place your food.<br />Get exact grams.
        </h2>
        <p className="mt-3 text-base text-slate-500 max-w-[260px]">{t("welcome.featureLiveBody")}</p>
      </section>

      {/* Section 2 — Capture */}
      <section className="relative h-screen flex flex-col justify-center px-7">
        <SectionLabel color="text-amber-400">{t("welcome.featurePhotoTitle")}</SectionLabel>
        <h2 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
          One photo.<br />Full meal context.
        </h2>
        <p className="mt-3 text-base text-slate-400 max-w-[260px]">{t("welcome.featurePhotoBody")}</p>
      </section>

      {/* Section 3 — Analyze */}
      <section className="relative h-screen flex flex-col justify-center px-7">
        <SectionLabel color="text-purple-400">{t("welcome.featureGuidanceTitle")}</SectionLabel>
        <h2 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
          AI reads your meal.<br />Instantly.
        </h2>
        <p className="mt-3 text-base text-slate-400 max-w-[260px]">{t("welcome.featureGuidanceBody")}</p>
      </section>

      {/* Section 4 — Results */}
      <section className="relative h-screen flex flex-col justify-center px-7">
        <SectionLabel color="text-emerald-600">Results</SectionLabel>
        <h2 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">
          Calories. Protein.<br />Everything.
        </h2>
        <p className="mt-3 text-base text-slate-500 max-w-[260px]">
          Real-time nutrition guidance grounded in weight, photo, and AI.
        </p>
      </section>

    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bluetooth, BrainCircuit, Camera, ChevronRight, Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[12px] font-semibold tracking-tight text-slate-900">{title}</div>
        <div className="text-[11px] leading-4 text-slate-500">{description}</div>
      </div>
    </div>
  );
}

export function WelcomeScreen({
  onConnect,
  onContinue,
}: {
  onConnect: () => void;
  onContinue: () => void;
}) {
  const { dir, t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const run = (action: () => void) => {
    if (busy) {
      return;
    }

    setBusy(true);
    timerRef.current = window.setTimeout(() => {
      action();
    }, 320);
  };

  return (
    <div
      dir={dir}
      className="relative mx-auto flex h-[100svh] max-h-[100svh] max-w-[430px] flex-col overflow-hidden bg-[linear-gradient(180deg,#f0f5ff_0%,#e8f0fe_100%)] px-5"
      style={{
        paddingTop: "calc(0.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="pointer-events-none absolute right-[-15%] top-[5%] h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute left-[-10%] top-[30%] h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="relative flex shrink-0 items-center justify-between pb-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-blue-600" />
          {t("common.smartNutrition")}
        </div>
        <LanguageSwitcher />
      </div>

      <div className="relative shrink-0 pt-0">
        <h1 className="text-[2.4rem] font-semibold leading-[1.0] tracking-[-0.05em] text-slate-950">
          SmartBite
          <br />
          <span className="text-slate-950/70">Scale.</span>
        </h1>
        <p className="mt-0.5 text-[0.88rem] text-slate-600">{t("welcome.subtitle")}</p>
      </div>

      <div className="relative mt-1.5 min-h-0 flex-1">
        <div className="h-full overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,247,255,0.82))] shadow-[0_20px_50px_rgba(30,64,175,0.12)] ring-1 ring-white/80 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2 px-4 pt-2.5">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("common.weightPhotoAi")}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold tracking-tight text-slate-950">
                {t("welcome.heroTitle")}
              </div>
            </div>
            <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {t("common.live")}
            </div>
          </div>

          <div className="mx-3 mt-1 rounded-[22px] bg-[linear-gradient(180deg,#111827,#172033)] px-3 pb-2 pt-2 shadow-[0_22px_44px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3 px-1">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  {t("welcome.scaleReading")}
                </div>
                <div className="mt-1 text-[1.55rem] font-semibold tracking-tight text-white">
                  186 {t("common.gramsShort")}
                </div>
              </div>
              <div className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {t("welcome.stableServing")}
              </div>
            </div>

            <div className="mt-2 overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] ring-1 ring-white/10">
              <img
                src="/assets/scale/sbs3.png"
                alt="Salmon & Avocado Bowl on SmartBite Scale"
                className="block h-[154px] w-full object-cover object-center select-none"
                style={{ filter: "brightness(0.96) saturate(1.03)" }}
                draggable={false}
              />
            </div>

            <div className="mt-2 flex items-start justify-between gap-2.5 px-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                  <Camera className="h-2.5 w-2.5" />
                  {t("welcome.mealImageMatched")}
                </div>
                <div className="mt-1 max-h-8 max-w-[19ch] overflow-hidden text-[12px] font-semibold leading-4 text-white text-balance">
                  Salmon &amp; Avocado Bowl
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  AI-powered nutritional analysis
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <div className="rounded-full bg-white/8 px-3 py-1 text-right">
                  <div className="flex items-center justify-end gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                    <BrainCircuit className="h-2.5 w-2.5 text-indigo-400" />
                    {t("welcome.aiEstimate")}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-white">580 kcal</div>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-right">
                  <div className="flex items-center justify-end gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                    <Scale className="h-2.5 w-2.5 text-blue-400" />
                    {t("welcome.macroFocus")}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-white">42g protein</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-4 mt-1 mb-2 grid gap-1">
            <FeatureItem
              icon={<Scale className="h-4 w-4 text-blue-600" />}
              title={t("welcome.featureLiveTitle")}
              description={t("welcome.featureLiveBody")}
            />
            <FeatureItem
              icon={<Camera className="h-4 w-4 text-amber-500" />}
              title={t("welcome.featurePhotoTitle")}
              description={t("welcome.featurePhotoBody")}
            />
            <FeatureItem
              icon={<BrainCircuit className="h-4 w-4 text-indigo-500" />}
              title={t("welcome.featureGuidanceTitle")}
              description={t("welcome.featureGuidanceBody")}
            />
          </div>
        </div>
      </div>

      <div className="relative shrink-0 pt-1.5">
        <Button
          fullWidth
          onClick={() => run(onConnect)}
          disabled={busy}
          className="h-12 rounded-[23px] bg-[linear-gradient(135deg,#1d4ed8,#4338ca,#6366f1)] text-[15px] font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
        >
          <Bluetooth className="mr-2 h-5 w-5" />
          {t("common.connectScale")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => run(onContinue)}
          disabled={busy}
          className="mt-1.5 h-10 rounded-[18px] bg-white/60 text-slate-700 backdrop-blur-md"
        >
          {t("common.tryDemoMode")}
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="mt-1.5 text-center text-[10px] tracking-wide text-slate-400">
          {t("common.productName")}
        </p>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import {
  Bluetooth,
  BrainCircuit,
  Camera,
  ChevronRight,
  Scale,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/78 text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-md">
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-semibold tracking-[-0.02em] text-slate-950">
          {title}
        </div>
        <div className="mt-0.5 text-[12px] leading-5 text-slate-500">{description}</div>
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
  return (
    <div className="relative mx-auto h-[100dvh] max-w-[430px] overflow-hidden px-5 pb-4 pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_48%,#eaf1ff_100%)]" />
      <div className="pointer-events-none absolute left-[-12%] top-[16%] h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-18%] top-[8%] h-56 w-56 rounded-full bg-indigo-200/25 blur-3xl" />

      <div className="relative flex h-full flex-col">
        <div className="shrink-0 pt-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Smart Nutrition
          </div>

          <div className="mt-4 max-w-[300px]">
            <h1 className="text-[2.85rem] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
              SmartBite
              <span className="block text-slate-950/92">Scale</span>
            </h1>
            <p className="mt-2.5 text-[1.08rem] font-medium tracking-[-0.03em] text-slate-800">
              Know what you&apos;re eating.
            </p>
            <p className="mt-1.5 max-w-[260px] text-[13px] leading-5 text-slate-500">
              Real-time nutrition guidance from weight, meal imagery, and AI.
            </p>
          </div>
        </div>

        <div className="relative mt-5 shrink overflow-hidden">
          <div className="absolute inset-x-5 top-4 h-40 rounded-[36px] bg-[linear-gradient(160deg,rgba(37,99,235,0.16),rgba(255,255,255,0.16),rgba(79,70,229,0.16))] blur-2xl" />

          <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(244,247,255,0.80))] p-4 shadow-[0_24px_60px_rgba(30,64,175,0.14)] ring-1 ring-white/80 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_72%)]" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Weight. Photo. AI.
                </div>
                <div className="mt-1.5 text-base font-semibold tracking-[-0.03em] text-slate-950">
                  One clear nutrition signal
                </div>
              </div>
              <div className="rounded-full bg-emerald-400/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Live
              </div>
            </div>

            <div className="mt-4 rounded-[26px] bg-[linear-gradient(180deg,#111827,#1f2937)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Scale reading
                  </div>
                  <div className="mt-1 text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
                    186 g
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Stable serving
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[56px_1fr] gap-3 rounded-[22px] bg-white/8 p-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(160deg,#fde68a,#fb923c)] text-slate-900">
                  <Utensils className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    <Camera className="h-3.5 w-3.5" />
                    Meal image matched
                  </div>
                  <div className="mt-1.5 text-[15px] font-semibold tracking-[-0.03em] text-white">
                    Salmon bowl
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-300">
                    Portion refined using scale data
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-[22px] bg-white/78 p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <BrainCircuit className="h-3.5 w-3.5 text-indigo-600" />
                  AI estimate
                </div>
                <div className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.05em] text-slate-950">
                  428
                </div>
                <div className="mt-0.5 text-[13px] text-slate-500">calories</div>
              </div>

              <div className="rounded-[22px] bg-white/78 p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <Scale className="h-3.5 w-3.5 text-blue-600" />
                  Macro focus
                </div>
                <div className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.05em] text-slate-950">
                  34g
                </div>
                <div className="mt-0.5 text-[13px] text-slate-500">protein</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid shrink-0 grid-cols-1 gap-3">
          <FeatureItem
            icon={<Scale className="h-5 w-5 text-blue-600" />}
            title="Live weight tracking"
            description="Stable serving detection built in."
          />
          <FeatureItem
            icon={<Camera className="h-5 w-5 text-amber-500" />}
            title="Photo-based meal analysis"
            description="Meal recognition from a single photo."
          />
          <FeatureItem
            icon={<BrainCircuit className="h-5 w-5 text-indigo-600" />}
            title="Smart calorie and macro guidance"
            description="Grounded daily targets and nutrition insight."
          />
        </div>

        <div className="mt-auto shrink-0 pt-5">
          <Button
            fullWidth
            onClick={onConnect}
            className="h-14 rounded-[26px] bg-[linear-gradient(135deg,#1d4ed8_0%,#4338ca_55%,#6366f1_100%)] px-6 text-base font-semibold text-white shadow-[0_22px_46px_rgba(59,130,246,0.30)] hover:bg-[linear-gradient(135deg,#1e40af_0%,#3730a3_55%,#4f46e5_100%)]"
          >
            <Bluetooth className="mr-2.5 h-5 w-5" />
            Connect your scale
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={onContinue}
            className="mt-3 h-12 rounded-[22px] bg-white/60 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-md"
          >
            Try demo mode
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="pt-3 text-center text-xs tracking-[0.08em] text-slate-400">
            SmartBite Nutrition
          </div>
        </div>
      </div>
    </div>
  );
}

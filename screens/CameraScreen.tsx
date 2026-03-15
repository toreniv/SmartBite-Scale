"use client";

import { ArrowLeft, Camera, Loader2, ScanLine, Scale } from "lucide-react";
import type { ComponentProps } from "react";
import type { MeasurementStatus } from "@/lib/types";

interface CameraScreenProps {
  analyzing: boolean;
  measurementStatus: MeasurementStatus;
  videoRef: ComponentProps<"video">["ref"];
  weight: number;
  onAnalyze: () => void;
  onBack: () => void;
}

export function CameraScreen({
  analyzing,
  measurementStatus,
  videoRef,
  weight,
  onAnalyze,
  onBack,
}: CameraScreenProps) {
  const measurementLabel =
    measurementStatus === "stable"
      ? "Stable weight ready"
      : measurementStatus === "measuring"
        ? "Measuring live"
        : weight > 0
          ? "Weight detected"
          : "Scale data optional";

  return (
    <div className="phone-frame flex min-h-screen flex-col bg-slate-950">
      <div className="relative flex-1">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 z-10 rounded-full bg-black/45 p-3 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/38 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
          <ScanLine className="h-4 w-4 text-sky-300" />
          Live capture
        </div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full min-h-[70vh] w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-6 bottom-32 top-24 rounded-[32px] border border-white/40 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]" />
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 w-[calc(100%-2rem)] -translate-x-1/2 rounded-[24px] bg-black/38 px-4 py-3 text-white backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Scale className="h-4 w-4 text-sky-300" />
              {measurementLabel}
            </div>
            <div className="text-sm font-semibold">
              {weight > 0 ? `${weight.toFixed(1)}g` : "No weight"}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-8 rounded-t-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] px-5 pb-8 pt-6 shadow-[0_-18px_50px_rgba(15,23,42,0.18)]">
        <div className="badge-chip">Live analysis</div>
        <h2 className="mt-4 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
          Frame the meal cleanly
        </h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
          {weight > 0
            ? `Current scale context: ${weight.toFixed(1)}g. Hold still, then analyze.`
            : "Center the plate in view. Scale data will join automatically when available."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[24px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Weight
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {weight > 0 ? `${weight.toFixed(1)}g` : "Optional"}
            </div>
          </div>
          <div className="rounded-[24px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tip
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Keep the full meal inside the guide for the best estimate.
            </div>
          </div>
        </div>

        <button onClick={onAnalyze} disabled={analyzing} className="primary-button mt-6">
          {analyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing meal
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              Analyze meal
            </>
          )}
        </button>
      </div>
    </div>
  );
}

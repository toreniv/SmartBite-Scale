"use client";

import { ArrowLeft, Camera, MoreHorizontal, Scale, Sparkles, Upload, Waves } from "lucide-react";
import { MenuButton } from "@/components/MenuButton";
import type { MeasurementStatus } from "@/lib/types";

interface MenuScreenProps {
  isBypassMode: boolean;
  connectionLabel: string;
  latestWeight: number;
  stableWeight: number;
  measurementStatus: MeasurementStatus;
  onScanFood: () => void;
  onUploadImage: () => void;
  onCalibrate: () => void;
  onMoreOptions: () => void;
  onBackToMainMenu: () => void;
}

export function MenuScreen({
  isBypassMode,
  connectionLabel,
  latestWeight,
  stableWeight,
  measurementStatus,
  onScanFood,
  onUploadImage,
  onCalibrate,
  onMoreOptions,
  onBackToMainMenu,
}: MenuScreenProps) {
  const displayWeight = stableWeight > 0 ? stableWeight : latestWeight;
  const measurementCopy: Record<
    MeasurementStatus,
    { label: string; body: string; tone: string }
  > = {
    disconnected: {
      label: "Scale offline",
      body: "Capture still works with image-only estimates.",
      tone: "bg-slate-100 text-slate-600",
    },
    idle: {
      label: "Ready to weigh",
      body: "Place your plate on the scale when you are ready.",
      tone: "bg-blue-50 text-blue-700",
    },
    measuring: {
      label: "Measuring",
      body: "Hold still for a stable serving weight.",
      tone: "bg-amber-50 text-amber-700",
    },
    stable: {
      label: "Stable reading",
      body: "Your current weight is ready to analyze.",
      tone: "bg-emerald-50 text-emerald-700",
    },
  };

  const status = isBypassMode ? measurementCopy.disconnected : measurementCopy[measurementStatus];
  const nextStep = isBypassMode
    ? "Start with a photo, then reconnect later for more precise serving guidance."
    : displayWeight > 0
      ? "Your scale is active. Capture the meal now to carry this context into analysis."
      : "Place a bowl or plate on the scale to prepare for a cleaner measurement.";

  return (
    <div className="phone-frame flex flex-col px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="badge-chip">Dashboard</div>
        <button onClick={onBackToMainMenu} className="ghost-button !w-auto px-4 py-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Exit
        </button>
      </div>

      <div className="mt-5 surface-card-strong rounded-[34px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500/80">
              SmartBite flow
            </div>
            <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">
              Your meal dashboard
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{nextStep}</p>
          </div>
          <div className="icon-surface bg-blue-100 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[28px] bg-white/78 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Connection
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">{connectionLabel}</div>
          </div>
          <div className="rounded-[28px] bg-white/78 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Current weight
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {displayWeight > 0 ? `${displayWeight.toFixed(1)}g` : "Waiting"}
            </div>
          </div>
        </div>

        <div className={`status-pill mt-4 ${status.tone}`}>
          <Waves className="h-4 w-4" />
          <span>{status.label}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{status.body}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <MenuButton
          icon={Camera}
          label="Scan meal"
          description="Open the live camera flow and analyze what is on the plate."
          accent="blue"
          onClick={onScanFood}
        />
        <MenuButton
          icon={Upload}
          label="Upload image"
          description="Use a saved photo when the meal is already plated or shared."
          accent="mint"
          onClick={onUploadImage}
        />
        <MenuButton
          icon={Scale}
          label="Calibrate"
          description="Reset the scale to zero before you start a new serving."
          accent="amber"
          onClick={onCalibrate}
        />
        <MenuButton
          icon={MoreHorizontal}
          label="More options"
          description="Open debug and device tools without leaving the experience."
          accent="slate"
          onClick={onMoreOptions}
        />
      </div>

      <div className="mt-5 surface-card rounded-[32px] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">Today</div>
            <p className="mt-1 text-sm text-slate-500">A lighter dashboard for your first meal.</p>
          </div>
          <div className="badge-chip">No history yet</div>
        </div>

        <div className="empty-state-card mt-5 px-4 py-5">
          <div className="text-sm font-semibold text-slate-900">Nothing logged yet</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start with the camera or upload a photo. SmartBite will use the scale reading whenever
            one is available.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {[
            "Connect or continue in bypass mode.",
            "Capture your meal with the camera or a saved photo.",
            "Review nutrition insights once analysis is complete.",
          ].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-[24px] bg-white/72 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

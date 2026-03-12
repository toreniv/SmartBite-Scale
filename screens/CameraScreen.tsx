"use client";

import { ArrowLeft, Camera } from "lucide-react";
import type { ComponentProps } from "react";

interface CameraScreenProps {
  videoRef: ComponentProps<"video">["ref"];
  weight: number;
  onAnalyze: () => void;
  onBack: () => void;
}

export function CameraScreen({
  videoRef,
  weight,
  onAnalyze,
  onBack,
}: CameraScreenProps) {
  return (
    <div className="phone-frame flex min-h-screen flex-col bg-black">
      <div className="relative flex-1">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 z-10 rounded-full bg-black/45 p-3 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full min-h-[70vh] w-full object-cover"
        />
      </div>

      <div className="-mt-6 rounded-t-[32px] bg-white px-5 py-6">
        <h2 className="text-xl font-bold text-blue-500">Analysis Result</h2>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
          {weight > 0 ? `Current weight: ${weight.toFixed(1)}g` : "Point camera at your food to analyze"}
        </p>

        <button
          onClick={onAnalyze}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          <Camera className="h-5 w-5" />
          Analyze
        </button>
      </div>
    </div>
  );
}

"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { Camera, ImagePlus, Loader2, Sparkles, StopCircle } from "lucide-react";
import { AnalysisResultCard } from "@/components/cards/AnalysisResultCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import type { MealAnalysisResult } from "@/lib/types";

export function CaptureScreen({
  videoRef,
  previewUrl,
  note,
  onNoteChange,
  onStartCamera,
  onStopCamera,
  onAnalyzeCamera,
  onSelectFile,
  onAnalyzeUpload,
  cameraReady,
  status,
  stableWeight,
  latestWeight,
  result,
  disclaimer,
}: {
  videoRef: ComponentProps<"video">["ref"];
  previewUrl: string | null;
  note: string;
  onNoteChange: (value: string) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onAnalyzeCamera: () => void;
  onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeUpload: () => void;
  cameraReady: boolean;
  status: "idle" | "loading" | "success" | "error";
  stableWeight: number;
  latestWeight: number;
  result: MealAnalysisResult | null;
  disclaimer: string;
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="aspect-[4/5] bg-slate-950">
          {cameraReady ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
              <Camera className="h-10 w-10 text-blue-300" />
              <div className="mt-4 text-xl font-semibold">Ready to scan your meal</div>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Start the camera for a live preview or upload a photo from your device.
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 p-5">
          <div className="flex gap-3">
            <Button variant="primary" fullWidth onClick={onStartCamera}>
              <Camera className="mr-2 h-4 w-4" />
              {cameraReady ? "Restart camera" : "Start camera"}
            </Button>
            <Button variant="ghost" fullWidth onClick={onStopCamera}>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <div className="text-sm text-slate-500">Live weight</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{latestWeight.toFixed(1)}g</div>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <div className="text-sm text-slate-500">Stable weight</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{stableWeight.toFixed(1)}g</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Field label="Meal note" helper="Optional. Add context like “salad with chicken” or “oatmeal with berries”.">
          <Input value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Add an optional note" />
        </Field>

        <div className="mt-4 flex gap-3">
          <Button variant="success" fullWidth onClick={onAnalyzeCamera} disabled={!cameraReady || status === "loading"}>
            {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Capture and analyze
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Upload an image</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">Analyze from your gallery</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <ImagePlus className="h-5 w-5" />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-blue-200 bg-blue-50/60 px-4 py-8 text-center">
          <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
          {previewUrl ? (
            <img src={previewUrl} alt="Selected meal" className="aspect-[4/3] w-full rounded-[24px] object-cover" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-blue-600" />
              <div className="mt-3 text-sm text-slate-600">Tap to select a meal image</div>
            </>
          )}
        </label>

        <Button className="mt-4" fullWidth onClick={onAnalyzeUpload} disabled={!previewUrl || status === "loading"}>
          {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Upload and analyze
        </Button>
      </Card>

      {result ? (
        <AnalysisResultCard result={result} measuredWeight={stableWeight || latestWeight} disclaimer={disclaimer} />
      ) : null}
    </div>
  );
}

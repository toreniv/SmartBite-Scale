"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { Camera, ImagePlus, Loader2, Sparkles, StopCircle } from "lucide-react";
import { AnalysisResultCard } from "@/components/cards/AnalysisResultCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { useLanguage } from "@/hooks/useLanguage";
import type { MealAnalysisResult, NavDirection } from "@/lib/types";

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
  navDirection,
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
  navDirection: NavDirection;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="aspect-[4/5] bg-slate-950">
          {cameraReady ? (
            <div className="h-full w-full overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <video
          src="/assets/scale/scale-demo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          onError={() => console.error("Video failed to load: /assets/scale/scale-demo.mp4")}
        />
          )}
        </div>
      </Card>

      <div className="px-4 pt-1 text-center">
        <h3 className="text-xl font-semibold text-slate-950">{t("capture.readyTitle")}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("capture.readyBody")}</p>
      </div>

      <Card>
        <div className="flex gap-3">
          <Button variant="primary" fullWidth onClick={onStartCamera}>
            <Camera className="mr-2 h-4 w-4" />
            {cameraReady ? t("capture.restartCamera") : t("capture.startCamera")}
          </Button>
          <Button variant="ghost" fullWidth onClick={onStopCamera}>
            <StopCircle className="mr-2 h-4 w-4" />
            {t("capture.stop")}
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <div className="text-sm text-slate-500">{t("dashboard.liveWeight")}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {latestWeight.toFixed(1)}
              {t("common.gramsShort")}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-4">
            <div className="text-sm text-slate-500">{t("dashboard.stableWeight")}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {stableWeight.toFixed(1)}
              {t("common.gramsShort")}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Field label={t("capture.mealNote")} helper={t("capture.mealNoteHelper")}>
          <Input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={t("capture.mealNotePlaceholder")}
          />
        </Field>

        <div className="mt-4 flex gap-3">
          <Button
            variant="success"
            fullWidth
            onClick={onAnalyzeCamera}
            disabled={!cameraReady || status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {t("capture.captureAndAnalyze")}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">{t("capture.uploadImage")}</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              {t("capture.uploadSubtitle")}
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <ImagePlus className="h-5 w-5" />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-blue-200 bg-blue-50/60 px-4 py-8 text-center">
          <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected meal"
              className="aspect-[4/3] w-full overflow-hidden rounded-[24px] object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-blue-600" />
              <div className="mt-3 text-sm text-slate-600">{t("capture.tapToSelect")}</div>
            </>
          )}
        </label>

        <Button
          className="mt-4"
          fullWidth
          onClick={onAnalyzeUpload}
          disabled={!previewUrl || status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {t("capture.uploadAndAnalyze")}
        </Button>
      </Card>

      {result ? (
        <AnalysisResultCard
          result={result}
          measuredWeight={stableWeight || latestWeight}
          disclaimer={disclaimer}
        />
      ) : null}
    </div>
  );
}

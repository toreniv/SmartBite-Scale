"use client";

import { useEffect, useState, type ChangeEvent, type ComponentProps } from "react";
import { AlertCircle, Camera, ImagePlus, RefreshCw, Sparkles, StopCircle } from "lucide-react";
import { AnalysisResultCard } from "@/components/cards/AnalysisResultCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { useLanguage } from "@/hooks/useLanguage";
import type { MealAnalysisResult, NavDirection } from "@/lib/types";

const DEFAULT_PLATE_VIDEO = "/assets/scale/scale-demo.mp4";
const LOADING_MESSAGES = [
  "Analyzing your meal...",
  "Reading nutrients...",
  "Almost done...",
] as const;

function ProgressRing({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200" />
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80 113"
        className="origin-center -rotate-90 text-cyan-500 animate-spin"
      />
    </svg>
  );
}

function AnalysisLoadingCard({ message }: { message: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-cyan-50 p-2">
          <ProgressRing className="h-12 w-12" />
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-950">{message}</div>
          <div className="mt-1 text-sm text-slate-500">We&apos;re estimating calories, macros, and portion size.</div>
        </div>
      </div>

      <div className="mt-5 animate-pulse space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 rounded-full bg-slate-200" />
            <div className="h-8 w-48 rounded-full bg-slate-200" />
            <div className="h-5 w-28 rounded-full bg-slate-200" />
          </div>
          <div className="h-20 w-20 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-32 rounded-[28px] bg-slate-200" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 rounded-3xl bg-slate-200" />
          <div className="h-24 rounded-3xl bg-slate-200" />
          <div className="h-24 rounded-3xl bg-slate-200" />
        </div>
        <div className="h-4 w-full rounded-full bg-slate-200" />
        <div className="h-4 w-4/5 rounded-full bg-slate-200" />
      </div>
    </Card>
  );
}

function AnalysisErrorCard({
  message,
  canRetry,
  onRetry,
  disabled,
}: {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="border-rose-100 bg-rose-50/70">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white p-2 text-rose-500">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-slate-950">{message}</div>
          <div className="mt-1 text-sm text-slate-600">Check the photo and try again if needed.</div>
        </div>
      </div>

      {canRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry} disabled={disabled}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </Card>
  );
}

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
  isConnected,
  isDemoMode,
  measurementStatus,
  stableWeight,
  latestWeight,
  result,
  resultImageUrl,
  analysisError,
  disclaimer,
  onRetryAnalysis,
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
  isConnected: boolean;
  isDemoMode: boolean;
  measurementStatus: "disconnected" | "idle" | "measuring" | "stable";
  stableWeight: number;
  latestWeight: number;
  result: MealAnalysisResult | null;
  resultImageUrl?: string | null;
  analysisError: { message: string; canRetry: boolean } | null;
  disclaimer: string;
  onRetryAnalysis: () => void;
  navDirection: NavDirection;
}) {
  const { t } = useLanguage();
  const estimatedWeight = stableWeight || latestWeight;
  const showStableServing = isConnected && measurementStatus === "stable" && stableWeight > 0;
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!cameraReady || status === "loading") {
      if (showLivePreview && cameraReady && status === "loading" && videoRef && "current" in videoRef && videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const context = canvas.getContext("2d");

        if (context && canvas.width > 0 && canvas.height > 0) {
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          setCapturedPreviewUrl(canvas.toDataURL("image/jpeg", 0.9));
        }
      }

      setShowLivePreview(false);
    }
  }, [cameraReady, showLivePreview, status, videoRef]);

  useEffect(() => {
    if (showLivePreview) {
      setCapturedPreviewUrl(null);
    }
  }, [showLivePreview]);

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden p-0">
        <div className="overflow-hidden rounded-[28px] bg-slate-950">
          {showLivePreview && cameraReady ? (
            <div className="aspect-[4/5] w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="block h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/5] w-full">
              {capturedPreviewUrl ? (
                <img
                  src={capturedPreviewUrl}
                  alt="Captured meal preview"
                  className="block h-full w-full object-cover"
                />
              ) : (
                <video
                  src={DEFAULT_PLATE_VIDEO}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="block h-full w-full object-cover"
                />
              )}
            </div>
          )}
        </div>
        <div className="space-y-3 px-4 pb-4 pt-4">
          <Button
            variant="success"
            fullWidth
            className="py-4 text-base"
            onClick={onAnalyzeCamera}
            disabled={!cameraReady || status === "loading"}
          >
            {status === "loading" ? (
              <ProgressRing className="mr-2 h-4 w-4" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {t("capture.captureAndAnalyze")}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              fullWidth
              className="h-12 rounded-xl bg-emerald-500 text-white shadow-[0_16px_30px_rgba(16,185,129,0.22)] hover:bg-emerald-600"
              onClick={() => {
                setShowLivePreview(true);
                onStartCamera();
              }}
            >
              <Camera size={18} className="mr-2" />
              Start camera
            </Button>
            <Button
              variant="secondary"
              fullWidth
              className="h-12 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => {
                setShowLivePreview(false);
                onStopCamera();
              }}
            >
              <StopCircle size={18} className="mr-2" />
              Stop
            </Button>
          </div>
          <p className="px-1 text-center text-sm leading-6 text-slate-600">
            {t("capture.readyBody")}
          </p>
          <div className="grid grid-cols-2 gap-3">
          {isDemoMode ? (
            <div className="col-span-2 rounded-3xl bg-slate-50 px-4 py-4">
              <div className="text-sm text-slate-500">Demo estimate</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                ~{estimatedWeight.toFixed(0)}
                {t("common.gramsShort")}
              </div>
              <div className="mt-1 text-xs text-slate-400">estimated weight</div>
            </div>
          ) : (
            <>
              <div className="rounded-3xl bg-slate-50 px-4 py-4">
                <div className="text-sm text-slate-500">{t("dashboard.liveWeight")}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {latestWeight.toFixed(1)}
                  {t("common.gramsShort")}
                </div>
                {isConnected ? (
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live from scale hardware
                  </div>
                ) : null}
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                  <span>{t("dashboard.stableWeight")}</span>
                  {showStableServing ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                      Stable serving
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {stableWeight.toFixed(1)}
                  {t("common.gramsShort")}
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <Field label={t("capture.mealNote")} helper={t("capture.mealNoteHelper")}>
          <Input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={t("capture.mealNotePlaceholder")}
          />
        </Field>

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
            <ProgressRing className="mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {t("capture.uploadAndAnalyze")}
        </Button>
      </Card>

      {status === "loading" ? (
        <AnalysisLoadingCard message={LOADING_MESSAGES[loadingMessageIndex]} />
      ) : analysisError ? (
        <AnalysisErrorCard
          message={analysisError.message}
          canRetry={analysisError.canRetry}
          onRetry={onRetryAnalysis}
          disabled={false}
        />
      ) : result ? (
        <AnalysisResultCard
          result={result}
          imageUrl={resultImageUrl}
          measuredWeight={stableWeight || latestWeight}
          disclaimer={disclaimer}
          isDemoMode={isDemoMode}
        />
      ) : null}
    </div>
  );
}

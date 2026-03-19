"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import type { AnalyzeMealProviderAttempt, MealAnalysisResult } from "@/lib/types";

function getConfidenceMeta(confidence: number) {
  if (confidence >= 0.75) {
    return {
      label: "High confidence",
      className: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    };
  }

  if (confidence >= 0.5) {
    return {
      label: "Rough estimate",
      className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    };
  }

  return {
    label: "Low confidence",
    className: "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
  };
}

export function AnalysisResultCard({
  result,
  measuredWeight,
  disclaimer,
  imageUrl,
}: {
  result: MealAnalysisResult;
  measuredWeight?: number | null;
  disclaimer: string;
  imageUrl?: string | null;
}) {
  const { t } = useLanguage();
  const attempts = result.attempts ?? [];
  const displayWeight = Math.round(measuredWeight ?? result.estimatedWeightGrams);
  const confidenceMeta = getConfidenceMeta(result.confidence);
  const isMockResult = result.provider === "mock";
  const hasLowConfidence = result.confidence < 0.5;
  const providerLabel =
    result.provider === "gemini"
      ? "Analyzed by Gemini"
      : result.provider === "openai"
        ? "Analyzed by OpenAI"
        : "Demo mode - no API key";
  const weightLabel =
    measuredWeight && measuredWeight > 0
      ? `Weight used: ${Math.round(measuredWeight)} ${t("common.gramsShort")} from scale`
      : "Image-only estimate";
  const calorieCardClassName = isMockResult
    ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500"
    : "bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600";
  const isDirectGeminiMode = disclaimer.includes("Direct Gemini");
  const hasWeightMismatch =
    Boolean(measuredWeight) &&
    measuredWeight! > 0 &&
    Math.abs(result.estimatedWeightGrams - measuredWeight!) / measuredWeight! > 0.2;

  return (
    <Card className={isMockResult ? "border-amber-200 bg-amber-50/50" : ""}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{t("dashboard.latestMealEstimate")}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="text-2xl font-semibold text-slate-950">{result.foodName}</div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.02em] ${confidenceMeta.className}`}
            >
              {confidenceMeta.label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                isMockResult
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {providerLabel}
            </span>
            {isMockResult ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Demo result
              </span>
            ) : null}
            {isDirectGeminiMode ? (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800">
                {"\u26A1 Direct mode - testing only"}
              </span>
            ) : null}
          </div>
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={result.foodName}
            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
        )}
      </div>

      <div
        className={`mt-5 rounded-[28px] px-5 py-6 text-center text-white shadow-[0_20px_40px_rgba(14,116,144,0.24)] ${calorieCardClassName}`}
      >
        <div className="text-sm font-medium text-cyan-50/90">
          {isMockResult ? "Demo Mode" : t("dashboard.estimatedCalories")}
        </div>
        <div className="mt-3 text-5xl font-bold tracking-tight">{result.calories}</div>
        <div className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-cyan-50/80">
          {t("common.kcal")}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">{t("dashboard.weightUsed")}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {displayWeight}
            {t("common.gramsShort")}
          </div>
          <div className="mt-1 text-xs text-slate-400">{weightLabel}</div>
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">{t("common.confidence")}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {Math.round(result.confidence * 100)}%
          </div>
          <div className="mt-1 text-xs text-slate-400">{confidenceMeta.label}</div>
        </div>
      </div>

      {hasLowConfidence ? (
        <div className="mt-4 rounded-3xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Low confidence estimate \u2014 verify manually
        </div>
      ) : null}

      {isMockResult ? (
        <div className="mt-4 rounded-3xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          {"\u26A0\uFE0F Demo mode \u2014 no AI provider available"}
        </div>
      ) : null}

      {hasWeightMismatch ? (
        <div className="mt-4 rounded-3xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
          Note: AI estimated {Math.round(result.estimatedWeightGrams)}g, scale measured {Math.round(measuredWeight ?? 0)}g {"\u2014"} scale value was used
        </div>
      ) : null}

      <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-4">
        <div className="text-sm font-medium text-slate-500">Likely ingredients</div>
        {result.ingredients.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                {ingredient}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-500">No ingredients identified</div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-3xl bg-sky-50 px-3 py-4 text-center ring-1 ring-sky-100">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            {t("common.protein")}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{result.protein}</div>
          <div className="mt-1 text-xs text-sky-700">{t("common.gramsShort")}</div>
        </div>
        <div className="rounded-3xl bg-amber-50 px-3 py-4 text-center ring-1 ring-amber-100">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
            {t("common.carbs")}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{result.carbs}</div>
          <div className="mt-1 text-xs text-amber-700">{t("common.gramsShort")}</div>
        </div>
        <div className="rounded-3xl bg-rose-50 px-3 py-4 text-center ring-1 ring-rose-100">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
            {t("common.fat")}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{result.fat}</div>
          <div className="mt-1 text-xs text-rose-700">{t("common.gramsShort")}</div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{result.explanation}</p>

      {attempts.length > 0 ? (
        <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm font-medium text-slate-500">Analysis path</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {attempts.map((attempt: AnalyzeMealProviderAttempt) => (
              <span
                key={`${attempt.provider}-${attempt.status}`}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  attempt.status === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {attempt.provider}: {attempt.status}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-400">{disclaimer}</p>
    </Card>
  );
}

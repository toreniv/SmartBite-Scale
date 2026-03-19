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
  isDemoMode = false,
  imageUrl,
}: {
  result: MealAnalysisResult;
  measuredWeight?: number;
  disclaimer: string;
  isDemoMode?: boolean;
  imageUrl?: string | null;
}) {
  const { t } = useLanguage();
  const providerLabel = result.provider.toUpperCase();
  const attempts = result.attempts ?? [];
  const usedFallback = Boolean(result.usedFallback);
  const displayWeight = Math.round(measuredWeight ?? result.estimatedWeightGrams);
  const confidenceMeta = getConfidenceMeta(result.confidence);

  return (
    <Card>
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
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Provider: {providerLabel}
            </span>
            {usedFallback ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mock fallback
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

      <div className="mt-5 rounded-[28px] bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 px-5 py-6 text-center text-white shadow-[0_20px_40px_rgba(14,116,144,0.24)]">
        <div className="text-sm font-medium text-cyan-50/90">
          {isDemoMode ? "AI estimate based on visual analysis" : t("dashboard.estimatedCalories")}
        </div>
        <div className="mt-3 text-5xl font-bold tracking-tight">{result.calories}</div>
        <div className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-cyan-50/80">
          {t("common.kcal")}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">
            {isDemoMode ? "Demo weight" : t("dashboard.weightUsed")}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {isDemoMode ? "~" : ""}
            {displayWeight}
            {t("common.gramsShort")}
          </div>
          {isDemoMode ? <div className="mt-1 text-xs text-slate-400">demo estimate</div> : null}
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">{t("common.confidence")}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">
            {Math.round(result.confidence * 100)}%
          </div>
          <div className="mt-1 text-xs text-slate-400">{confidenceMeta.label}</div>
        </div>
      </div>

      {isDemoMode ? (
        <div className="mt-4 rounded-3xl bg-blue-50 px-4 py-3 text-sm text-slate-600">
          AI estimate based on visual analysis
        </div>
      ) : null}

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

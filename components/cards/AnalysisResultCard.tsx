"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLanguage } from "@/hooks/useLanguage";
import type { AnalyzeMealProviderAttempt, MealAnalysisResult } from "@/lib/types";

export function AnalysisResultCard({
  result,
  measuredWeight,
  disclaimer,
  isDemoMode = false,
}: {
  result: MealAnalysisResult;
  measuredWeight?: number;
  disclaimer: string;
  isDemoMode?: boolean;
}) {
  const { t } = useLanguage();
  const providerLabel = result.provider.toUpperCase();
  const attempts = result.attempts ?? [];
  const usedFallback = Boolean(result.usedFallback);
  const displayWeight = Math.round(measuredWeight ?? result.estimatedWeightGrams);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{t("dashboard.latestMealEstimate")}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{result.foodName}</div>
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
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <div className="text-sm text-slate-500">
            {isDemoMode ? "AI estimate based on visual analysis" : t("dashboard.estimatedCalories")}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">{result.calories}</div>
        </div>
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
      </div>

      {isDemoMode ? (
        <div className="mt-4 rounded-3xl bg-blue-50 px-4 py-3 text-sm text-slate-600">
          AI estimate based on visual analysis
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>{t("common.protein")}</span>
            <span>
              {result.protein}
              {t("common.gramsShort")}
            </span>
          </div>
          <ProgressBar value={result.protein} max={50} colorClassName="bg-emerald-500" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>{t("common.carbs")}</span>
            <span>
              {result.carbs}
              {t("common.gramsShort")}
            </span>
          </div>
          <ProgressBar value={result.carbs} max={80} colorClassName="bg-amber-400" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-500">
            <span>{t("common.fat")}</span>
            <span>
              {result.fat}
              {t("common.gramsShort")}
            </span>
          </div>
          <ProgressBar value={result.fat} max={40} colorClassName="bg-pink-400" />
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-blue-50 px-4 py-4">
        <div className="text-sm text-slate-500">{t("common.confidence")}</div>
        <div className="mt-1 text-lg font-semibold text-slate-950">
          {Math.round(result.confidence * 100)}%
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{result.explanation}</p>
      </div>

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

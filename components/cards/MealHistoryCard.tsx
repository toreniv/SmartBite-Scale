"use client";

import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import { formatTime } from "@/lib/nutrition";
import type { MealHistoryItem } from "@/lib/types";

export function MealHistoryCard({ meal }: { meal: MealHistoryItem }) {
  const { t } = useLanguage();
  const displayWeight = meal.measuredWeightGrams ?? meal.estimatedWeightGrams;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
          {meal.imageDataUrl ? (
            <img src={meal.imageDataUrl} alt={meal.foodName} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-950">{meal.foodName}</div>
          <div className="mt-1 text-xs text-slate-400">{formatTime(meal.createdAt)}</div>
          <div className="mt-2 flex gap-3 text-sm text-slate-600">
            <span>
              {meal.calories} {t("common.kcal")}
            </span>
            <span>
              {displayWeight}
              {t("common.gramsShort")}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">View</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
      </div>
    </Card>
  );
}

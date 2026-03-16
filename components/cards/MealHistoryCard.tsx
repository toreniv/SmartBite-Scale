"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/hooks/useLanguage";
import { formatTime } from "@/lib/nutrition";
import type { MealHistoryItem } from "@/lib/types";

export function MealHistoryCard({ meal }: { meal: MealHistoryItem }) {
  const { t } = useLanguage();

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
              {meal.estimatedWeightGrams}
              {t("common.gramsShort")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

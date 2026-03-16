"use client";

import { MealHistoryCard } from "@/components/cards/MealHistoryCard";
import { Card } from "@/components/ui/Card";
import { PlateStage } from "@/components/ui/PlateStage";
import { useLanguage } from "@/hooks/useLanguage";
import type { MealHistoryItem, NavDirection } from "@/lib/types";

export function HistoryScreen({
  meals,
  navDirection,
}: {
  meals: MealHistoryItem[];
  navDirection: NavDirection;
}) {
  const { t } = useLanguage();

  if (meals.length === 0) {
    return (
      <div className="space-y-4">
        <PlateStage currentScreen="history" mode="resultsCompact" navDirection={navDirection} />
        <Card>
          <div className="text-sm font-medium text-slate-500">{t("history.title")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">{t("history.emptyTitle")}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("history.emptyBody")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PlateStage currentScreen="history" mode="resultsCompact" navDirection={navDirection} />
      {meals.map((meal) => (
        <MealHistoryCard key={meal.id} meal={meal} />
      ))}
    </div>
  );
}

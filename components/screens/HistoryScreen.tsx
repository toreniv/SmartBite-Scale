"use client";

import { MealHistoryCard } from "@/components/cards/MealHistoryCard";
import { Card } from "@/components/ui/Card";
import type { MealHistoryItem } from "@/lib/types";

export function HistoryScreen({ meals }: { meals: MealHistoryItem[] }) {
  if (meals.length === 0) {
    return (
      <Card>
        <div className="text-sm font-medium text-slate-500">Meal history</div>
        <div className="mt-1 text-xl font-semibold text-slate-950">No meals logged yet</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your recent analyses will appear here with thumbnails, time, calories, and measured weight.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <MealHistoryCard key={meal.id} meal={meal} />
      ))}
    </div>
  );
}

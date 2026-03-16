"use client";

import { Flame, Target } from "lucide-react";
import { RingProgress } from "@/components/charts/RingProgress";
import { Card } from "@/components/ui/Card";
import type { DailyProgress } from "@/lib/types";

export function GoalSummaryCard({ progress }: { progress: DailyProgress }) {
  const remainingLabel =
    progress.remainingCalories >= 0
      ? `${progress.remainingCalories}`
      : `+${Math.abs(progress.remainingCalories)}`;

  return (
    <Card className="overflow-hidden bg-[linear-gradient(160deg,rgba(219,234,254,0.95),rgba(255,255,255,0.9))]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">Daily calorie goal</div>
          <div className="mt-1 text-3xl font-semibold text-slate-950">
            {progress.goalCalories}
          </div>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 text-blue-600">
          <Target className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <RingProgress
          value={progress.consumedCalories}
          total={progress.goalCalories}
          label="Consumed today"
          detail={`${progress.consumedCalories} kcal`}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white/70 px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Flame className="h-4 w-4 text-orange-500" />
            {progress.remainingCalories >= 0 ? "Remaining" : "Over target"}
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            {remainingLabel}
          </div>
        </div>
        <div className="rounded-3xl bg-white/70 px-4 py-4">
          <div className="text-sm text-slate-500">Meals logged</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">{progress.mealsLogged}</div>
        </div>
      </div>
    </Card>
  );
}

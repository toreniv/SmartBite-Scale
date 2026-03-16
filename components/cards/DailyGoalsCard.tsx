"use client";

import type { ReactNode } from "react";
import { Droplets, Flame, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DailyProgress, HealthMetrics, UserProfile } from "@/lib/types";

function GoalRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white/80 px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="rounded-2xl bg-slate-100 p-2 text-slate-700">{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm leading-5 text-slate-500">{hint}</div>
    </div>
  );
}

export function DailyGoalsCard({
  profile,
  metrics,
  progress,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  progress: DailyProgress;
}) {
  const calorieStatus =
    progress.remainingCalories >= 0
      ? `${progress.remainingCalories} kcal left today`
      : `${Math.abs(progress.remainingCalories)} kcal above target`;
  const proteinGap = Math.max(metrics.proteinTarget - progress.macros.protein.consumed, 0);

  return (
    <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(255,247,237,0.95),rgba(255,255,255,0.96))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-orange-600">Daily goals</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            Built around your {profile.goalType === "gain-muscle" ? "muscle-gain" : profile.goalType === "lose-weight" ? "fat-loss" : "maintenance"} plan
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Simple targets based on your body size, activity, and selected goal.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-3 text-orange-500 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <GoalRow
          icon={<Flame className="h-4 w-4" />}
          label="Calories"
          value={`${metrics.dailyCalorieTarget}`}
          hint={calorieStatus}
        />
        <GoalRow
          icon={<TrendingUp className="h-4 w-4" />}
          label="Protein"
          value={`${metrics.proteinTarget} g`}
          hint={proteinGap > 0 ? `${proteinGap} g still recommended today` : "Protein target reached"}
        />
        <GoalRow
          icon={<Droplets className="h-4 w-4" />}
          label="Water"
          value={`${metrics.waterTargetLiters} L`}
          hint="Basic hydration target for a normal day"
        />
        <GoalRow
          icon={<TrendingUp className="h-4 w-4" />}
          label="Goal pace"
          value={metrics.goalPace.weeklyDeltaKg === 0 ? "Steady" : `${Math.abs(metrics.goalPace.weeklyDeltaKg)} kg/wk`}
          hint={metrics.goalPace.summary}
        />
      </div>
    </Card>
  );
}

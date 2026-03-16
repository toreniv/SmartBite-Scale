"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  ACTIVITY_LEVELS,
  GOAL_DESCRIPTIONS,
  GOAL_LABELS,
} from "@/lib/constants";
import type { HealthMetrics, Sex, UserProfile } from "@/lib/types";

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] bg-slate-50 px-4 py-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm leading-5 text-slate-500">{hint}</div>
    </div>
  );
}

export function ProfileScreen({
  profile,
  metrics,
  onChange,
  onOpenDebug,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  onChange: (profile: UserProfile) => void;
  onOpenDebug: () => void;
}) {
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const targetDelta = (profile.targetWeightKg ?? profile.weightKg) - profile.weightKg;
  const targetSummary =
    targetDelta === 0
      ? "Target weight matches your current weight."
      : `${Math.abs(targetDelta).toFixed(1)} kg ${targetDelta > 0 ? "above" : "below"} your current weight.`;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(239,246,255,0.98),rgba(255,255,255,0.95))]">
        <div className="text-sm font-medium text-blue-600">Health profile</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">Personalize your daily goals</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Stored locally for now. Adjust the values and the calorie, protein, and pace targets update immediately.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Age">
            <Input
              type="number"
              min={16}
              max={100}
              value={profile.age}
              onChange={(e) => update("age", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Sex">
            <Select value={profile.sex} onChange={(e) => update("sex", e.target.value as Sex)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </Field>
          <Field label="Height (cm)">
            <Input
              type="number"
              min={120}
              max={230}
              value={profile.heightCm}
              onChange={(e) => update("heightCm", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Weight (kg)">
            <Input
              type="number"
              min={35}
              max={250}
              step="0.1"
              value={profile.weightKg}
              onChange={(e) => update("weightKg", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Activity" helper="Used to estimate how much energy you burn in a typical day.">
            <Select
              value={profile.activityLevel}
              onChange={(e) =>
                update("activityLevel", e.target.value as UserProfile["activityLevel"])
              }
            >
              {Object.entries(ACTIVITY_LEVELS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Goal" helper={GOAL_DESCRIPTIONS[profile.goalType]}>
            <Select
              value={profile.goalType}
              onChange={(e) => update("goalType", e.target.value as UserProfile["goalType"])}
            >
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Target weight (optional)"
            helper={`${targetSummary} This is used as a planning reference, not a strict rule.`}
          >
            <Input
              type="number"
              min={35}
              max={250}
              step="0.1"
              value={profile.targetWeightKg ?? ""}
              onChange={(e) => update("targetWeightKg", Number(e.target.value) || undefined)}
            />
          </Field>
        </div>

        <Button variant="ghost" className="mt-4" onClick={onOpenDebug}>
          Open debug tools
        </Button>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">Calculated health metrics</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label="BMI"
            value={`${metrics.bmi}`}
            hint={`${metrics.bmiLabel} range`}
          />
          <MetricTile
            label="Healthy range"
            value={`${metrics.healthyWeightRange.minKg}-${metrics.healthyWeightRange.maxKg} kg`}
            hint="Estimated from BMI 18.5-24.9"
          />
          <MetricTile
            label="BMR"
            value={`${metrics.bmr} kcal`}
            hint="Approximate resting energy use"
          />
          <MetricTile
            label="TDEE"
            value={`${metrics.tdee} kcal`}
            hint="Estimated total daily energy burn"
          />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">Daily plan</div>
        <div className="mt-1 text-xl font-semibold text-slate-950">
          {GOAL_LABELS[profile.goalType]} with simple guardrails
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label="Calorie target"
            value={`${metrics.dailyCalorieTarget} kcal`}
            hint={
              metrics.calorieAdjustment === 0
                ? "Matches your estimated maintenance"
                : `${metrics.calorieAdjustment > 0 ? "+" : ""}${metrics.calorieAdjustment} kcal vs maintenance`
            }
          />
          <MetricTile
            label="Protein goal"
            value={`${metrics.proteinTarget} g`}
            hint="Set higher than average to support satiety and muscle retention"
          />
          <MetricTile
            label="Water target"
            value={`${metrics.waterTargetLiters} L`}
            hint="A basic hydration estimate"
          />
          <MetricTile
            label="Expected pace"
            value={metrics.goalPace.weeklyDeltaKg === 0 ? "Maintain" : metrics.goalPace.summary}
            hint={
              metrics.goalPace.weeklyDeltaKg === 0
                ? "No intentional weekly weight change built in"
                : `${Math.abs(metrics.goalPace.monthlyDeltaKg)} kg per month if your intake stays close`
            }
          />
        </div>
      </Card>
    </div>
  );
}

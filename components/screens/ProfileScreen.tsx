"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useLanguage } from "@/hooks/useLanguage";
import type {
  ActivityLevel,
  GoalType,
  HealthMetrics,
  NavDirection,
  Sex,
  UserProfile,
} from "@/lib/types";

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
  userName,
  onSignOut,
  navDirection,
}: {
  profile: UserProfile;
  metrics: HealthMetrics;
  onChange: (profile: UserProfile) => void;
  onOpenDebug: () => void;
  userName?: string;
  onSignOut: () => void;
  navDirection: NavDirection;
}) {
  const { t } = useLanguage();
  const bannerName = userName?.trim() || "User";
  const bannerInitial = bannerName.charAt(0).toUpperCase();

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const targetDelta = (profile.targetWeightKg ?? profile.weightKg) - profile.weightKg;
  const targetSummary =
    targetDelta === 0
      ? t("profile.targetWeightSame")
      : t(targetDelta > 0 ? "profile.targetWeightAbove" : "profile.targetWeightBelow", {
          value: Math.abs(targetDelta).toFixed(1),
        });
  const goalLabel = t(`common.goalLabel.${profile.goalType}`);
  const activityOptions: ActivityLevel[] = [
    "sedentary",
    "light",
    "moderate",
    "active",
    "very-active",
  ];
  const goalOptions: GoalType[] = ["lose-weight", "maintain", "gain-muscle"];

  return (
    <div className="space-y-4">
      <div className="mx-1 mb-4 flex items-center gap-3 rounded-[20px] bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#4338ca)] text-white text-lg font-semibold shadow-md">
          {bannerInitial}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-950">{bannerName}</div>
          <div className="text-[11px] text-slate-500">Personal nutrition profile</div>
        </div>
      </div>
      <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(239,246,255,0.98),rgba(255,255,255,0.95))]">
        <div className="text-sm font-medium text-blue-600">{t("profile.eyebrow")}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{t("profile.title")}</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("profile.body")}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label={t("profile.age")}>
            <Input
              type="number"
              min={16}
              max={100}
              value={profile.age}
              onChange={(e) => update("age", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.sex")}>
            <Select value={profile.sex} onChange={(e) => update("sex", e.target.value as Sex)}>
              <option value="female">{t("common.sexLabel.female")}</option>
              <option value="male">{t("common.sexLabel.male")}</option>
            </Select>
          </Field>
          <Field label={t("profile.heightCm")}>
            <Input
              type="number"
              min={120}
              max={230}
              value={profile.heightCm}
              onChange={(e) => update("heightCm", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.weightKg")}>
            <Input
              type="number"
              min={35}
              max={250}
              step="0.1"
              value={profile.weightKg}
              onChange={(e) => update("weightKg", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("profile.activity")} helper={t("profile.activityHelper")}>
            <Select
              value={profile.activityLevel}
              onChange={(e) =>
                update("activityLevel", e.target.value as UserProfile["activityLevel"])
              }
            >
              {activityOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`common.activityLabel.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("profile.goal")} helper={t(`common.goalDescription.${profile.goalType}`)}>
            <Select
              value={profile.goalType}
              onChange={(e) => update("goalType", e.target.value as UserProfile["goalType"])}
            >
              {goalOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`common.goalLabel.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label={t("profile.targetWeight")}
            helper={`${targetSummary} ${t("profile.targetWeightHelperSuffix")}`}
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
          {t("common.openDebugTools")}
        </Button>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">{t("profile.metricsTitle")}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label={t("profile.bmi")}
            value={`${metrics.bmi}`}
            hint={t(`common.bmiLabel.${metrics.bmiLabel}`)}
          />
          <MetricTile
            label={t("profile.healthyRange")}
            value={`${metrics.healthyWeightRange.minKg}-${metrics.healthyWeightRange.maxKg} kg`}
            hint={t("profile.healthyRangeHint")}
          />
          <MetricTile
            label={t("profile.bmr")}
            value={`${metrics.bmr} ${t("common.kcal")}`}
            hint={t("profile.bmrHint")}
          />
          <MetricTile
            label={t("profile.tdee")}
            value={`${metrics.tdee} ${t("common.kcal")}`}
            hint={t("profile.tdeeHint")}
          />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-500">{t("profile.dailyPlan")}</div>
        <div className="mt-1 text-xl font-semibold text-slate-950">
          {t("profile.dailyPlanTitle", { goal: goalLabel })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricTile
            label={t("profile.calorieTarget")}
            value={`${metrics.dailyCalorieTarget} ${t("common.kcal")}`}
            hint={
              metrics.calorieAdjustment === 0
                ? t("profile.calorieTargetMaintenance")
                : t("profile.calorieTargetDelta", { value: metrics.calorieAdjustment })
            }
          />
          <MetricTile
            label={t("profile.proteinGoal")}
            value={`${metrics.proteinTarget} ${t("common.gramsShort")}`}
            hint={t("profile.proteinGoalHint")}
          />
          <MetricTile
            label={t("profile.waterTarget")}
            value={`${metrics.waterTargetLiters} ${t("common.litersShort")}`}
            hint={t("profile.waterTargetHint")}
          />
          <MetricTile
            label={t("profile.expectedPace")}
            value={
              metrics.goalPace.weeklyDeltaKg === 0
                ? t("profile.expectedPaceMaintain")
                : metrics.goalPace.summary
            }
            hint={
              metrics.goalPace.weeklyDeltaKg === 0
                ? t("profile.expectedPaceMaintainHint")
                : t("profile.expectedPaceMonthly", {
                    value: Math.abs(metrics.goalPace.monthlyDeltaKg),
                  })
            }
          />
        </div>
      </Card>

      <Button variant="secondary" fullWidth onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}

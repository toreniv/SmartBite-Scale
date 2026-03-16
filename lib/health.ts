import { ACTIVITY_LEVELS } from "@/lib/constants";
import type { GoalType, HealthMetrics, UserProfile } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToNearest(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function calculateBMI(weightKg: number, heightCm: number) {
  const heightMeters = heightCm / 100;
  if (!heightMeters || !weightKg) {
    return 0;
  }

  return weightKg / (heightMeters * heightMeters);
}

export function getBmiLabel(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

export function calculateHealthyWeightRange(heightCm: number) {
  const heightMeters = heightCm / 100;

  if (!heightMeters) {
    return { minKg: 0, maxKg: 0 };
  }

  return {
    minKg: Number((18.5 * heightMeters * heightMeters).toFixed(1)),
    maxKg: Number((24.9 * heightMeters * heightMeters).toFixed(1)),
  };
}

export function calculateBMR(profile: UserProfile) {
  const base =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;

  return profile.sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: UserProfile) {
  return calculateBMR(profile) * ACTIVITY_LEVELS[profile.activityLevel].multiplier;
}

export function calculateCalorieAdjustment(goalType: GoalType, weightKg: number) {
  const baseChange = clamp(weightKg * 4.5, 180, 450);

  if (goalType === "lose-weight") {
    return -Math.round(baseChange);
  }

  if (goalType === "gain-muscle") {
    return Math.round(clamp(weightKg * 3.5, 150, 300));
  }

  return 0;
}

export function calculateDailyCalorieTarget(
  goalType: GoalType,
  tdee: number,
  weightKg = 70,
) {
  return Math.round(tdee + calculateCalorieAdjustment(goalType, weightKg));
}

export function calculateDailyCalorieTargetFromProfile(profile: UserProfile, tdee = calculateTDEE(profile)) {
  const adjustment = calculateCalorieAdjustment(profile.goalType, profile.weightKg);
  const minimum = profile.sex === "male" ? 1500 : 1200;
  return clamp(Math.round(tdee + adjustment), minimum, 4200);
}

export function calculateProteinTarget(profile: UserProfile) {
  const multiplier =
    profile.goalType === "gain-muscle"
      ? 1.9
      : profile.goalType === "lose-weight"
        ? 1.8
        : 1.6;

  return Math.round(profile.weightKg * multiplier);
}

export function calculateWaterTargetLiters(profile: UserProfile) {
  const baseline = profile.weightKg * 0.033;
  const activityBoost =
    profile.activityLevel === "active" || profile.activityLevel === "very-active" ? 0.35 : 0;

  return Number((baseline + activityBoost).toFixed(1));
}

export function calculateGoalPace(profile: UserProfile) {
  const targetWeight = profile.targetWeightKg ?? profile.weightKg;
  const weightGap = Number((targetWeight - profile.weightKg).toFixed(1));
  const defaultWeeklyDelta =
    profile.goalType === "lose-weight"
      ? -0.35
      : profile.goalType === "gain-muscle"
        ? 0.2
        : 0;

  const weeklyDelta =
    profile.goalType === "maintain"
      ? 0
      : weightGap === 0
        ? defaultWeeklyDelta
        : clamp(weightGap, -0.6, 0.35);

  if (weeklyDelta === 0) {
    return {
      weeklyDeltaKg: 0,
      monthlyDeltaKg: 0,
      summary: "Weight maintenance focus",
    };
  }

  const absolute = Math.abs(weeklyDelta);
  const direction = weeklyDelta > 0 ? "gain" : "loss";

  return {
    weeklyDeltaKg: Number(weeklyDelta.toFixed(2)),
    monthlyDeltaKg: Number((weeklyDelta * 4).toFixed(1)),
    summary: `${absolute.toFixed(2)} kg/week ${direction}`,
  };
}

export function buildHealthMetrics(profile: UserProfile): HealthMetrics {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const healthyWeightRange = calculateHealthyWeightRange(profile.heightCm);
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const calorieAdjustment = calculateCalorieAdjustment(profile.goalType, profile.weightKg);
  const dailyCalorieTarget = calculateDailyCalorieTargetFromProfile(profile, tdee);
  const proteinTarget = calculateProteinTarget(profile);
  const waterTargetLiters = calculateWaterTargetLiters(profile);
  const goalPace = calculateGoalPace(profile);

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiLabel: getBmiLabel(bmi),
    healthyWeightRange,
    bmr: Math.round(bmr),
    tdee: roundToNearest(tdee, 5),
    calorieAdjustment,
    dailyCalorieTarget: roundToNearest(dailyCalorieTarget, 5),
    proteinTarget,
    waterTargetLiters,
    goalPace,
  };
}

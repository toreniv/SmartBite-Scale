import { ACTIVITY_LEVELS } from "@/lib/constants";
import type { GoalType, HealthMetrics, UserProfile } from "@/lib/types";

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

export function calculateBMR(profile: UserProfile) {
  const base =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;

  return profile.sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: UserProfile) {
  return calculateBMR(profile) * ACTIVITY_LEVELS[profile.activityLevel].multiplier;
}

export function calculateDailyCalorieTarget(goalType: GoalType, tdee: number) {
  if (goalType === "lose-weight") {
    return tdee - 450;
  }

  if (goalType === "gain-muscle") {
    return tdee + 300;
  }

  return tdee;
}

export function buildHealthMetrics(profile: UserProfile): HealthMetrics {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const dailyCalorieTarget = calculateDailyCalorieTarget(profile.goalType, tdee);

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiLabel: getBmiLabel(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget: Math.round(dailyCalorieTarget),
  };
}

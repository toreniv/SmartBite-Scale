import { EMPTY_RECOMMENDATIONS } from "@/lib/constants";
import type {
  DailyProgress,
  MacroTargets,
  MealHistoryItem,
  RecommendationItem,
} from "@/lib/types";

function safeRatio(consumed: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return consumed / target;
}

export function buildMacroTargets(calories: number, proteinTarget?: number): MacroTargets {
  const protein = proteinTarget ?? Math.round((calories * 0.3) / 4);
  const proteinCalories = protein * 4;
  const fatCalories = calories * 0.28;
  const remainingCalories = Math.max(calories - proteinCalories - fatCalories, calories * 0.2);

  return {
    calories,
    protein,
    carbs: Math.round(remainingCalories / 4),
    fat: Math.round(fatCalories / 9),
  };
}

export function buildDailyProgress(
  goalCalories: number,
  meals: MealHistoryItem[],
  proteinTarget?: number,
): DailyProgress {
  const macroTargets = buildMacroTargets(goalCalories, proteinTarget);
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const remainingCalories = Math.round(goalCalories - consumedCalories);

  return {
    goalCalories,
    consumedCalories: Math.round(consumedCalories),
    remainingCalories,
    mealsLogged: meals.length,
    caloriesRatio: safeRatio(consumedCalories, goalCalories),
    macros: {
      protein: {
        consumed: Math.round(protein),
        target: macroTargets.protein,
        ratio: safeRatio(protein, macroTargets.protein),
      },
      carbs: {
        consumed: Math.round(carbs),
        target: macroTargets.carbs,
        ratio: safeRatio(carbs, macroTargets.carbs),
      },
      fat: {
        consumed: Math.round(fat),
        target: macroTargets.fat,
        ratio: safeRatio(fat, macroTargets.fat),
      },
    },
  };
}

export function buildRecommendations(
  progress: DailyProgress,
  latestMeal?: MealHistoryItem,
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if (progress.consumedCalories >= progress.goalCalories * 0.85) {
    recommendations.push({
      id: "calorie-close",
      title: "You are close to today's calorie target",
      body: "Keep the next meal lighter unless you still need more protein.",
      tone: "warning",
    });
  }

  if (latestMeal && latestMeal.protein < 20) {
    recommendations.push({
      id: "low-protein",
      title: "This meal looks a bit low in protein",
      body: "Consider adding yogurt, eggs, tofu, chicken, or legumes next time.",
      tone: "neutral",
    });
  }

  if (latestMeal && latestMeal.calories / Math.max(latestMeal.estimatedWeightGrams, 1) > 2.4) {
    recommendations.push({
      id: "dense-meal",
      title: "This meal appears calorie dense",
      body: "Balance it with vegetables or lean protein later in the day.",
      tone: "warning",
    });
  }

  if (progress.macros.protein.consumed >= progress.macros.protein.target * 0.8) {
    recommendations.push({
      id: "protein-good",
      title: "Protein intake is on track",
      body: "You're covering protein well today. Keep the rest of your meals balanced.",
      tone: "good",
    });
  }

  if (progress.mealsLogged >= 2 && progress.macros.protein.ratio < 0.55) {
    recommendations.push({
      id: "protein-gap",
      title: "Protein is lagging behind your daily goal",
      body: "A lean protein snack or a higher-protein dinner would close the gap without adding too many calories.",
      tone: "neutral",
    });
  }

  if (progress.remainingCalories < -150) {
    recommendations.push({
      id: "over-target",
      title: "Today's intake is above your calorie target",
      body: "Treat this as a trend signal, not a failure. A lighter next meal or a walk is usually enough.",
      tone: "warning",
    });
  }

  return recommendations.length > 0 ? recommendations : EMPTY_RECOMMENDATIONS;
}

export function isToday(isoDate: string) {
  const today = new Date();
  const date = new Date(isoDate);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

import type { AnalysisProvider, MealAnalysisResult } from "@/lib/types";

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function normalizeAnalysisResult(
  input: Partial<MealAnalysisResult>,
  provider: AnalysisProvider,
): MealAnalysisResult {
  return {
    foodName: toString(input.foodName, "Estimated meal"),
    estimatedWeightGrams: Math.round(toNumber(input.estimatedWeightGrams, 0)),
    calories: Math.round(toNumber(input.calories, 0)),
    protein: Math.round(toNumber(input.protein, 0)),
    carbs: Math.round(toNumber(input.carbs, 0)),
    fat: Math.round(toNumber(input.fat, 0)),
    confidence: Number(toNumber(input.confidence, 0.7).toFixed(2)),
    explanation: toString(
      input.explanation,
      "This is an estimated nutrition summary based on the image and available context.",
    ),
    provider,
  };
}

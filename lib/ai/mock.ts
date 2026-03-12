import { normalizeAnalysisResult } from "@/lib/ai/normalize";
import type { AnalyzeMealRequest } from "@/lib/types";

const MOCK_MEALS = [
  { foodName: "Chicken rice bowl", density: 1.7, proteinRatio: 0.22, carbRatio: 0.34, fatRatio: 0.11 },
  { foodName: "Avocado toast", density: 2.4, proteinRatio: 0.09, carbRatio: 0.28, fatRatio: 0.15 },
  { foodName: "Pasta with tomato sauce", density: 1.6, proteinRatio: 0.11, carbRatio: 0.31, fatRatio: 0.08 },
  { foodName: "Greek yogurt fruit bowl", density: 1.15, proteinRatio: 0.16, carbRatio: 0.18, fatRatio: 0.06 },
];

function hashString(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export async function analyzeMealWithMock(request: AnalyzeMealRequest) {
  const weight = Math.max(request.measuredWeightGrams ?? 180, 60);
  const seed = hashString(request.note ?? request.imageBase64.slice(0, 40));
  const preset = MOCK_MEALS[seed % MOCK_MEALS.length];
  const calories = Math.round(weight * preset.density);
  const protein = Math.round(weight * preset.proteinRatio);
  const carbs = Math.round(weight * preset.carbRatio);
  const fat = Math.round(weight * preset.fatRatio);

  return normalizeAnalysisResult(
    {
      foodName: preset.foodName,
      estimatedWeightGrams: request.measuredWeightGrams ?? weight,
      calories,
      protein,
      carbs,
      fat,
      confidence: request.measuredWeightGrams ? 0.86 : 0.71,
      explanation:
        "This estimate uses visible meal features, portion heuristics, and any measured scale weight provided.",
    },
    "mock",
  );
}

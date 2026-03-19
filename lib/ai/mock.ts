import type { AnalyzeMealRequest } from "@/lib/types";
import { normalizeAnalysisResult } from "@/lib/ai/normalize";

const MOCK_MEALS = [
  {
    foodName: "Chicken rice bowl",
    ingredients: ["chicken", "rice", "vegetables"],
    caloriesPerGram: 1.72,
    proteinPerGram: 0.084,
    carbsPerGram: 0.112,
    fatPerGram: 0.042,
  },
  {
    foodName: "Avocado toast",
    ingredients: ["bread", "avocado", "olive oil"],
    caloriesPerGram: 2.35,
    proteinPerGram: 0.051,
    carbsPerGram: 0.166,
    fatPerGram: 0.109,
  },
  {
    foodName: "Pasta with tomato sauce",
    ingredients: ["pasta", "tomato sauce", "parmesan"],
    caloriesPerGram: 1.58,
    proteinPerGram: 0.048,
    carbsPerGram: 0.208,
    fatPerGram: 0.036,
  },
  {
    foodName: "Greek yogurt fruit bowl",
    ingredients: ["greek yogurt", "berries", "granola"],
    caloriesPerGram: 1.14,
    proteinPerGram: 0.079,
    carbsPerGram: 0.124,
    fatPerGram: 0.028,
  },
];

function hashString(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export async function analyzeMealWithMock(request: AnalyzeMealRequest) {
  const fallbackSeed = `${request.note ?? ""}:${request.imageBase64.slice(0, 64)}`;
  const preset = MOCK_MEALS[hashString(fallbackSeed) % MOCK_MEALS.length];
  const estimatedWeightGrams = Math.max(Math.round(request.measuredWeightGrams ?? 180), 60);

  return normalizeAnalysisResult(
    {
      foodName: preset.foodName,
      estimatedWeightGrams,
      calories: estimatedWeightGrams * preset.caloriesPerGram,
      protein: estimatedWeightGrams * preset.proteinPerGram,
      carbs: estimatedWeightGrams * preset.carbsPerGram,
      fat: estimatedWeightGrams * preset.fatPerGram,
      ingredients: preset.ingredients,
      confidence: request.measuredWeightGrams ? 0.82 : 0.68,
      explanation:
        "This is a mock estimate generated from portion heuristics because no real AI provider key is configured.",
    },
    "mock",
  );
}

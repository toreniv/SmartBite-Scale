"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeMealWithGemini, hasGeminiApiKey } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { toProviderAttempt } from "@/lib/ai/normalize";
import { APP_DISCLAIMER, STORAGE_KEYS } from "@/lib/constants";
import { buildDailyProgress, buildRecommendations, isToday } from "@/lib/nutrition";
import { readStorage, writeStorage } from "@/lib/storage";
import type {
  AnalyzeMealResponse,
  MealHistoryItem,
  RecommendationItem,
  UserProfile,
} from "@/lib/types";

type AnalysisStatus = "idle" | "loading" | "success" | "error";

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

export function useMealAnalysis(
  profile: UserProfile,
  dailyCalorieTarget: number,
  proteinTarget: number,
) {
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [result, setResult] = useState<AnalyzeMealResponse | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [error, setError] = useState("");
  const [disclaimer, setDisclaimer] = useState(APP_DISCLAIMER);

  useEffect(() => {
    setHistory(readStorage<MealHistoryItem[]>(STORAGE_KEYS.meals, []));
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.meals, history);
  }, [history]);

  const todayMeals = useMemo(
    () => history.filter((item) => isToday(item.createdAt)),
    [history],
  );

  const dailyProgress = useMemo(
    () => buildDailyProgress(dailyCalorieTarget, todayMeals, proteinTarget),
    [dailyCalorieTarget, proteinTarget, todayMeals],
  );

  const recommendations: RecommendationItem[] = useMemo(
    () => buildRecommendations(dailyProgress, todayMeals[0]),
    [dailyProgress, todayMeals],
  );

  const analyzeImage = async (file: Blob, note: string, measuredWeightGrams?: number) => {
    setStatus("loading");
    setError("");

    try {
      const imageBase64 = await fileToDataUrl(file);
      const request = {
        imageBase64,
        note,
        measuredWeightGrams,
        profile,
      };

      let data: AnalyzeMealResponse;

      if (hasGeminiApiKey()) {
        try {
          const geminiResult = await analyzeMealWithGemini(request);
          data = {
            ...geminiResult,
            disclaimer: APP_DISCLAIMER,
            usedFallback: false,
            attempts: [toProviderAttempt("gemini", "success")],
          };
        } catch {
          const mockResult = await analyzeMealWithMock(request);
          data = {
            ...mockResult,
            disclaimer: APP_DISCLAIMER,
            usedFallback: true,
            attempts: [
              toProviderAttempt("gemini", "failed"),
              toProviderAttempt("mock", "success"),
            ],
          };
        }
      } else {
        const mockResult = await analyzeMealWithMock(request);
        data = {
          ...mockResult,
          disclaimer: APP_DISCLAIMER,
          usedFallback: true,
          attempts: [toProviderAttempt("mock", "success")],
        };
      }

      setResult(data);
      setDisclaimer(data.disclaimer);
      setStatus("success");

      const meal: MealHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        note,
        imageDataUrl: imageBase64,
        measuredWeightGrams,
        ...data,
      };

      setHistory((current) => [meal, ...current].slice(0, 20));
      return meal;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Analysis failed.";
      setError(message);
      setStatus("error");
      throw nextError;
    }
  };

  const removeMeal = (mealId: string) => {
    setHistory((current) => current.filter((meal) => meal.id !== mealId));
  };

  return {
    analyzeImage,
    dailyProgress,
    disclaimer,
    error,
    history,
    removeMeal,
    recommendations,
    result,
    status,
    todayMeals,
  };
}

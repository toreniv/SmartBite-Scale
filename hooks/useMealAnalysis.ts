"use client";

import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { buildDailyProgress, buildRecommendations, isToday } from "@/lib/nutrition";
import { readStorage, writeStorage } from "@/lib/storage";
import type {
  AnalyzeMealResponse,
  MealHistoryItem,
  MealAnalysisResult,
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

export function useMealAnalysis(profile: UserProfile, dailyCalorieTarget: number) {
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [result, setResult] = useState<MealAnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [error, setError] = useState("");
  const [disclaimer, setDisclaimer] = useState("");

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
    () => buildDailyProgress(dailyCalorieTarget, todayMeals),
    [dailyCalorieTarget, todayMeals],
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
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          note,
          measuredWeightGrams,
          profile,
          fallbackToGemini: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed.");
      }

      const data = (await response.json()) as AnalyzeMealResponse;
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

  return {
    analyzeImage,
    dailyProgress,
    disclaimer,
    error,
    history,
    recommendations,
    result,
    status,
    todayMeals,
  };
}

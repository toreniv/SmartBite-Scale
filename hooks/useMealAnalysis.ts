"use client";

import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "@/lib/api";
import { APP_DISCLAIMER, STORAGE_KEYS } from "@/lib/constants";
import { buildDailyProgress, buildRecommendations, isToday } from "@/lib/nutrition";
import { readStorage, writeStorage } from "@/lib/storage";
import type {
  AnalyzeMealErrorResponse,
  AnalyzeMealErrorCode,
  AnalyzeMealResponse,
  MealHistoryItem,
  RecommendationItem,
  UserProfile,
} from "@/lib/types";

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type AnalysisErrorState = {
  code: AnalyzeMealErrorCode | "UNKNOWN";
  message: string;
  canRetry: boolean;
};

type AnalysisErrorLike = {
  code?: string;
  message?: string;
};

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function isAnalysisErrorLike(value: unknown): value is AnalysisErrorLike {
  return typeof value === "object" && value !== null;
}

function createAnalysisError(error: AnalysisErrorState) {
  const wrapped = new Error(error.message) as Error & {
    code: AnalysisErrorState["code"];
    canRetry: boolean;
  };

  wrapped.name = "AnalysisError";
  wrapped.code = error.code;
  wrapped.canRetry = error.canRetry;

  return wrapped;
}

function normalizeAnalysisError(error: unknown): AnalysisErrorState {
  const code = isAnalysisErrorLike(error) && typeof error.code === "string" ? error.code : "";
  const message = error instanceof Error ? error.message : isAnalysisErrorLike(error) ? error.message || "" : "";

  if (code === "TIMEOUT") {
    return {
      code,
      message: "Gemini is taking too long. Please try again.",
      canRetry: true,
    };
  }

  if (code === "IMAGE_TOO_LARGE") {
    return {
      code,
      message: "Photo is too large. Try a closer shot.",
      canRetry: false,
    };
  }

  if (
    code === "PROVIDER_UNAVAILABLE" ||
    message.includes("Backend URL not configured") ||
    message.includes("NEXT_PUBLIC_API_BASE_URL")
  ) {
    return {
      code: code === "PROVIDER_UNAVAILABLE" ? code : "UNKNOWN",
      message: "Not connected to analysis server.",
      canRetry: false,
    };
  }

  return {
    code: code && typeof code === "string" ? (code as AnalysisErrorState["code"]) : "UNKNOWN",
    message: "Analysis failed. Please try again.",
    canRetry: true,
  };
}

async function readAnalyzeError(response: Response) {
  try {
    const payload = (await response.json()) as AnalyzeMealErrorResponse;
    return {
      code: payload.error?.code,
      message: payload.error?.message?.trim() || "",
    };
  } catch {
    return {
      code: undefined,
      message: "",
    };
  }
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
  const [analysisError, setAnalysisError] = useState<AnalysisErrorState | null>(null);
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
    setAnalysisError(null);

    try {
      const imageBase64 = await fileToDataUrl(file);
      const request = {
        imageBase64,
        note,
        measuredWeightGrams,
        profile,
      };
      const analyzeUrl = buildApiUrl("/api/analyze");

      const response = await fetch(analyzeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw await readAnalyzeError(response);
      }

      const data = (await response.json()) as AnalyzeMealResponse;

      setResult(data);
      setDisclaimer(data.disclaimer);
      setAnalysisError(null);
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
      const normalizedError = normalizeAnalysisError(nextError);
      setError(normalizedError.message);
      setAnalysisError(normalizedError);
      setStatus("error");
      throw createAnalysisError(normalizedError);
    }
  };

  const removeMeal = (mealId: string) => {
    setHistory((current) => current.filter((meal) => meal.id !== mealId));
  };

  return {
    analyzeImage,
    analysisError,
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

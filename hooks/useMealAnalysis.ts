"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeImageWithGeminiDirect } from "@/lib/ai/geminiDirect";
import { buildApiUrl } from "@/lib/api";
import { APP_DISCLAIMER, STORAGE_KEYS } from "@/lib/constants";
import { log } from "@/lib/debugLog";
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
  status?: number;
  details?: unknown;
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isAnalysisErrorLike(error) && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function isNetworkError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    error instanceof TypeError ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

function logAnalysisEvent(label: string, details: Record<string, unknown>) {
  console.info(`[MealAnalysis] ${label}`, details);
}

function logAnalysisError(label: string, error: unknown, details: Record<string, unknown> = {}) {
  console.error(`[MealAnalysis] ${label}`, {
    ...details,
    error,
  });
}

function isGeminiDirectModeEnabled() {
  return process.env.NEXT_PUBLIC_GEMINI_DIRECT === "true";
}

function hasGeminiDirectApiKey() {
  return Boolean(process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim());
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
  const message = getErrorMessage(error);

  if (isNetworkError(error)) {
    return {
      code: "UNKNOWN",
      message: "Not connected to analysis server.",
      canRetry: true,
    };
  }

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
    code === "INVALID_REQUEST" ||
    message.includes("NEXT_PUBLIC_GEMINI_API_KEY") ||
    message.includes("Direct Gemini") ||
    message.includes("Gemini direct") ||
    message.includes("No real meal analysis provider is configured") ||
    message.includes("Backend URL not configured") ||
    message.includes("NEXT_PUBLIC_API_BASE_URL")
  ) {
    return {
      code: code === "PROVIDER_UNAVAILABLE" || code === "INVALID_REQUEST" ? code : "UNKNOWN",
      message: message.includes("No real meal analysis provider is configured")
        ? "Meal analysis is not configured on the server, and demo fallback is disabled."
        : message.includes("NEXT_PUBLIC_GEMINI_API_KEY") ||
            message.includes("Direct Gemini") ||
            message.includes("Gemini direct")
          ? message
        : code === "INVALID_REQUEST" && message
          ? message
        : "Not connected to analysis server.",
      canRetry: code === "INVALID_REQUEST" || message.includes("Direct Gemini request failed"),
    };
  }

  return {
    code: code && typeof code === "string" ? (code as AnalysisErrorState["code"]) : "UNKNOWN",
    message: "Analysis failed. Please try again.",
    canRetry: true,
  };
}

async function readAnalyzeError(response: Response) {
  const status = response.status;
  const statusText = response.statusText;

  try {
    const payload = (await response.json()) as AnalyzeMealErrorResponse;
    return {
      status,
      code: payload.error?.code,
      message: payload.error?.message?.trim() || `${status} ${statusText}`.trim(),
      details: payload,
    };
  } catch {
    return {
      status,
      code: undefined,
      message: `${status} ${statusText}`.trim(),
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
      log("CAPTURE", "analyze triggered", {
        directMode: isGeminiDirectModeEnabled(),
        hasKey: hasGeminiDirectApiKey(),
      });
      const imageBase64 = await fileToDataUrl(file);
      const isDirectMode = isGeminiDirectModeEnabled();
      const requestTarget = isDirectMode ? "gemini-direct" : buildApiUrl("/api/analyze-meal");
      const imageFile = new File([file], "meal-photo.jpg", {
        type: file.type || "image/jpeg",
      });
      log("CAPTURE", "image selected", {
        hasBase64: imageBase64.length > 0,
        length: imageBase64.length,
      });

      logAnalysisEvent("request:start", {
        mode: isDirectMode ? "direct" : "backend",
        url: requestTarget,
        fileType: imageFile.type,
        fileSizeBytes: imageFile.size,
        noteLength: note.trim().length,
        weightGrams: measuredWeightGrams ?? null,
      });
      if (isDirectMode) {
        log("ANALYSIS", "direct mode active", { url: "gemini direct" });
      }
      log("ANALYSIS", "sending request", {
        url: requestTarget,
        hasImage: imageBase64.length > 0,
        weightGrams: measuredWeightGrams ?? null,
      });

      let data: AnalyzeMealResponse;

      if (isDirectMode) {
        data = await analyzeImageWithGeminiDirect(imageBase64, measuredWeightGrams ?? null);
      } else {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("note", note);
        formData.append(
          "weightGrams",
          measuredWeightGrams !== undefined ? String(measuredWeightGrams) : "null",
        );
        formData.append("profile", JSON.stringify(profile));

        const response = await fetch(requestTarget, {
          method: "POST",
          body: formData,
        });
        log("ANALYSIS", "response status", { status: response.status });

        if (!response.ok) {
          const responseError = await readAnalyzeError(response);
          logAnalysisError("request:response-error", responseError, {
            url: requestTarget,
            status: response.status,
            statusText: response.statusText,
          });
          throw responseError;
        }

        data = (await response.json()) as AnalyzeMealResponse;
      }

      logAnalysisEvent("request:success", {
        mode: isDirectMode ? "direct" : "backend",
        url: requestTarget,
        provider: data.provider,
        confidence: data.confidence,
      });

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
      log("ANALYSIS", "error", {
        message: nextError instanceof Error ? nextError.message : String(nextError),
        stack: nextError instanceof Error ? nextError.stack : undefined,
      });
      logAnalysisError("request:failed", nextError, {
        url:
          (() => {
            try {
              return isGeminiDirectModeEnabled() ? "gemini-direct" : buildApiUrl("/api/analyze-meal");
            } catch (urlError) {
              return getErrorMessage(urlError) || "unavailable";
            }
          })(),
        mode: isGeminiDirectModeEnabled() ? "direct" : "backend",
        fileType: file.type || "image/jpeg",
        fileSizeBytes: file.size,
        weightGrams: measuredWeightGrams ?? null,
      });
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

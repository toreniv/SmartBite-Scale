"use client";

import {
  AIProviderError,
  MEAL_ANALYSIS_JSON_SCHEMA,
  normalizeAnalysisResult,
  parseImageDataUrl,
  toProviderAttempt,
} from "@/lib/ai/normalize";
import { log } from "@/lib/debugLog";
import type { AnalyzeMealResponse } from "@/lib/types";

const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_DIRECT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest"] as const;
const DIRECT_GEMINI_DISCLAIMER = "Direct Gemini analysis - for testing only";

interface GeminiDirectErrorPayload {
  error?: {
    message?: string;
  };
}

interface GeminiDirectResponsePayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function getDirectGeminiApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIProviderError("gemini", "NEXT_PUBLIC_GEMINI_API_KEY is not configured for direct mode.", {
      retryable: false,
    });
  }

  return apiKey;
}

function buildDirectPrompt(weightGrams?: number | null) {
  return [
    "Analyze this meal image and return a JSON object with:",
    "foodName, estimatedWeightGrams, calories, protein, carbs, fat, ingredients (array), confidence (0-1), explanation.",
    weightGrams != null
      ? `If weight is provided use it: ${Math.round(weightGrams)}g measured weight.`
      : "If no measured weight is provided, estimate portion size from the image only.",
    "Return only valid JSON, no markdown.",
  ].join(" ");
}

function extractGeminiDirectText(payload: GeminiDirectResponsePayload) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text?.trim() || "")
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("Gemini did not return any text output.");
  }

  return text;
}

export async function analyzeImageWithGeminiDirect(
  imageBase64: string,
  weightGrams?: number | null,
): Promise<AnalyzeMealResponse> {
  const image = parseImageDataUrl(imageBase64);
  const apiKey = getDirectGeminiApiKey();
  let lastError: AIProviderError | null = null;

  for (const model of GEMINI_DIRECT_MODELS) {
    const url = `${GEMINI_API_ROOT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    log("GEMINI_DIRECT", "calling API", {
      model,
      keyLength: apiKey.length,
      hasImage: image.data.length > 0,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildDirectPrompt(weightGrams) },
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: MEAL_ANALYSIS_JSON_SCHEMA,
        },
      }),
    });
    log("GEMINI_DIRECT", "response received", {
      model,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const rawText = await response.text();
      let details = "";

      try {
        const payload = JSON.parse(rawText) as GeminiDirectErrorPayload;
        details = payload.error?.message?.trim() || "";
      } catch {
        details = rawText.trim();
      }

      log("GEMINI_DIRECT", "error", {
        model,
        message: details || `Direct Gemini request failed with status ${response.status}.`,
        raw: rawText,
      });

      lastError = new AIProviderError(
        "gemini",
        details || `Direct Gemini request failed with status ${response.status}.`,
        {
          status: response.status,
          retryable: response.status >= 500 || response.status === 429,
        },
      );

      if (response.status === 404 && model !== GEMINI_DIRECT_MODELS[GEMINI_DIRECT_MODELS.length - 1]) {
        continue;
      }

      throw lastError;
    }

    const payload = (await response.json()) as GeminiDirectResponsePayload;
    const outputText = extractGeminiDirectText(payload);

    try {
      const normalized = normalizeAnalysisResult(outputText, "gemini");
      log("GEMINI_DIRECT", "parsed result", {
        model,
        foodName: normalized.foodName,
        calories: normalized.calories,
        confidence: normalized.confidence,
      });

      return {
        ...normalized,
        disclaimer: DIRECT_GEMINI_DISCLAIMER,
        usedFallback: false,
        attempts: [toProviderAttempt("gemini", "success")],
      };
    } catch (error) {
      log("GEMINI_DIRECT", "error", {
        model,
        message:
          error instanceof Error
            ? `Gemini direct response parsing failed: ${error.message}`
            : "Gemini direct response parsing failed.",
        raw: outputText,
      });
      throw new AIProviderError(
        "gemini",
        error instanceof Error
          ? `Gemini direct response parsing failed: ${error.message}`
          : "Gemini direct response parsing failed.",
        {
          cause: error,
          retryable: false,
        },
      );
    }
  }

  throw lastError ?? new AIProviderError("gemini", "No Gemini direct model could be used.", {
    retryable: false,
  });
}

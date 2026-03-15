import { NextResponse } from "next/server";
import { analyzeMealWithGemini, hasGeminiApiKey } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { AIProviderError, parseImageDataUrl, toProviderAttempt } from "@/lib/ai/normalize";
import { analyzeMealWithOpenAI, hasOpenAIApiKey } from "@/lib/ai/openai";
import { APP_DISCLAIMER } from "@/lib/constants";
import type {
  AnalysisProvider,
  AnalyzeMealErrorResponse,
  AnalyzeMealPayload,
  AnalyzeMealProviderAttempt,
  AnalyzeMealResponse,
  UserProfile,
} from "@/lib/types";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function sanitizeOptionalWeight(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value > 0 ? Number(value.toFixed(1)) : undefined;
}

function sanitizeOptionalProfile(value: unknown) {
  return isObject(value) ? (value as UserProfile) : undefined;
}

function parseAnalyzeMealPayload(payload: unknown): AnalyzeMealPayload {
  if (!isObject(payload)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (typeof payload.imageBase64 !== "string" || !payload.imageBase64.trim()) {
    throw new Error("imageBase64 is required.");
  }

  parseImageDataUrl(payload.imageBase64);

  return {
    imageBase64: payload.imageBase64.trim(),
    note: sanitizeOptionalString(payload.note, 500),
    measuredWeightGrams: sanitizeOptionalWeight(payload.measuredWeightGrams),
    profile: sanitizeOptionalProfile(payload.profile),
    fallbackToGemini: payload.fallbackToGemini !== false,
  };
}

function errorResponse(
  status: number,
  code: AnalyzeMealErrorResponse["error"]["code"],
  message: string,
  retryable: boolean,
  attempts?: AnalyzeMealProviderAttempt[],
) {
  return NextResponse.json<AnalyzeMealErrorResponse>(
    {
      error: {
        code,
        message,
        retryable,
      },
      ...(attempts?.length ? { attempts } : {}),
    },
    { status },
  );
}

function successResponse(
  response: AnalyzeMealResponse,
) {
  return NextResponse.json<AnalyzeMealResponse>(response);
}

function logProviderError(provider: AnalysisProvider, error: unknown) {
  console.error(`[analyze-meal] ${provider} provider failed`, error);
}

export async function POST(request: Request) {
  let payload: AnalyzeMealPayload;

  try {
    const body = (await request.json()) as unknown;
    payload = parseAnalyzeMealPayload(body);
  } catch (error) {
    return errorResponse(
      400,
      "INVALID_REQUEST",
      error instanceof Error ? error.message : "Invalid analyze meal request.",
      false,
    );
  }

  const attempts: AnalyzeMealProviderAttempt[] = [];
  const canUseOpenAI = hasOpenAIApiKey();
  const canUseGemini = payload.fallbackToGemini !== false && hasGeminiApiKey();

  if (!canUseOpenAI && !canUseGemini) {
    const result = await analyzeMealWithMock(payload);
    attempts.push(toProviderAttempt("mock", "success"));

    return successResponse({
      ...result,
      disclaimer: APP_DISCLAIMER,
      usedFallback: true,
      attempts,
    });
  }

  if (canUseOpenAI) {
    try {
      const result = await analyzeMealWithOpenAI(payload);
      attempts.push(toProviderAttempt("openai", "success"));

      return successResponse({
        ...result,
        disclaimer: APP_DISCLAIMER,
        usedFallback: false,
        attempts,
      });
    } catch (error) {
      logProviderError("openai", error);
      attempts.push(toProviderAttempt("openai", "failed"));

      if (!canUseGemini) {
        return errorResponse(
          502,
          "PROVIDER_UNAVAILABLE",
          "Meal analysis is temporarily unavailable. Please try again shortly.",
          error instanceof AIProviderError ? error.retryable : true,
          attempts,
        );
      }
    }
  }

  if (canUseGemini) {
    try {
      const result = await analyzeMealWithGemini(payload);
      attempts.push(toProviderAttempt("gemini", "success"));

      return successResponse({
        ...result,
        disclaimer: APP_DISCLAIMER,
        usedFallback: true,
        attempts,
      });
    } catch (error) {
      logProviderError("gemini", error);
      attempts.push(toProviderAttempt("gemini", "failed"));
    }
  }

  return errorResponse(
    502,
    "ANALYSIS_FAILED",
    "Meal analysis is temporarily unavailable. Please try again shortly.",
    true,
    attempts,
  );
}

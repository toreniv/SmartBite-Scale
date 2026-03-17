import { NextResponse } from "next/server";
import { analyzeMealWithGemini, hasGeminiApiKey } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { toProviderAttempt } from "@/lib/ai/normalize";
import { APP_DISCLAIMER } from "@/lib/constants";
import type {
  AnalyzeMealErrorResponse,
  AnalyzeMealRequest,
  AnalyzeMealResponse,
} from "@/lib/types";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAnalyzeMealRequest(value: unknown): value is AnalyzeMealRequest {
  if (!isObject(value) || typeof value.imageBase64 !== "string" || !value.imageBase64.trim()) {
    return false;
  }

  if (value.note !== undefined && typeof value.note !== "string") {
    return false;
  }

  if (
    value.measuredWeightGrams !== undefined &&
    (typeof value.measuredWeightGrams !== "number" || !Number.isFinite(value.measuredWeightGrams))
  ) {
    return false;
  }

  if (value.profile !== undefined && !isObject(value.profile)) {
    return false;
  }

  return true;
}

function jsonError(
  status: number,
  code: AnalyzeMealErrorResponse["error"]["code"],
  message: string,
  retryable: boolean,
  attempts: AnalyzeMealErrorResponse["attempts"] = [],
) {
  const payload: AnalyzeMealErrorResponse = {
    error: {
      code,
      message,
      retryable,
    },
    attempts,
  };

  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "INVALID_REQUEST", "Request body must be valid JSON.", false);
  }

  if (!isAnalyzeMealRequest(payload)) {
    return jsonError(
      400,
      "INVALID_REQUEST",
      "Request body must include a valid imageBase64 data URL.",
      false,
    );
  }

  if (hasGeminiApiKey()) {
    try {
      const geminiResult = await analyzeMealWithGemini(payload);
      const response: AnalyzeMealResponse = {
        ...geminiResult,
        disclaimer: APP_DISCLAIMER,
        usedFallback: false,
        attempts: [toProviderAttempt("gemini", "success")],
      };

      return NextResponse.json(response);
    } catch {
      const mockResult = await analyzeMealWithMock(payload);
      const response: AnalyzeMealResponse = {
        ...mockResult,
        disclaimer: APP_DISCLAIMER,
        usedFallback: true,
        attempts: [
          toProviderAttempt("gemini", "failed"),
          toProviderAttempt("mock", "success"),
        ],
      };

      return NextResponse.json(response);
    }
  }

  const mockResult = await analyzeMealWithMock(payload);
  const response: AnalyzeMealResponse = {
    ...mockResult,
    disclaimer: APP_DISCLAIMER,
    usedFallback: true,
    attempts: [toProviderAttempt("mock", "success")],
  };

  return NextResponse.json(response);
}

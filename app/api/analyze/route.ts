import { NextResponse } from "next/server";
import { analyzeMealWithGemini, hasGeminiApiKey } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { AIProviderError, toProviderAttempt } from "@/lib/ai/normalize";
import { APP_DISCLAIMER } from "@/lib/constants";
import type {
  AnalyzeMealErrorResponse,
  AnalyzeMealRequest,
  AnalyzeMealResponse,
} from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMockFallbackEnabled() {
  return process.env.ALLOW_MOCK_ANALYSIS_FALLBACK === "true" || process.env.NODE_ENV !== "production";
}

function getCorsAllowedOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin")?.trim();
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!requestOrigin || !configuredOrigins?.length) {
    return "";
  }

  if (configuredOrigins.includes("*")) {
    return "*";
  }

  return configuredOrigins.includes(requestOrigin) ? requestOrigin : "";
}

function withCorsHeaders(response: NextResponse, request: Request) {
  const allowedOrigin = getCorsAllowedOrigin(request);

  if (!allowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  response.headers.set("Vary", "Origin");

  return response;
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
  request: Request,
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

  return withCorsHeaders(NextResponse.json(payload, { status }), request);
}

function jsonResponse(request: Request, payload: AnalyzeMealResponse) {
  return withCorsHeaders(NextResponse.json(payload), request);
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(new NextResponse(null, { status: 204 }), request);
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(request, 400, "INVALID_REQUEST", "Request body must be valid JSON.", false);
  }

  if (!isAnalyzeMealRequest(payload)) {
    return jsonError(
      request,
      400,
      "INVALID_REQUEST",
      "Request body must include a valid imageBase64 data URL.",
      false,
    );
  }

  if (!hasGeminiApiKey()) {
    if (!isMockFallbackEnabled()) {
      return jsonError(
        request,
        503,
        "PROVIDER_UNAVAILABLE",
        "Gemini API key is not configured on the backend.",
        false,
      );
    }

    const mockResult = await analyzeMealWithMock(payload);
    return jsonResponse(request, {
      ...mockResult,
      disclaimer: APP_DISCLAIMER,
      usedFallback: true,
      attempts: [toProviderAttempt("mock", "success")],
    });
  }

  try {
    const geminiResult = await analyzeMealWithGemini(payload);
    return jsonResponse(request, {
      ...geminiResult,
      disclaimer: APP_DISCLAIMER,
      usedFallback: false,
      attempts: [toProviderAttempt("gemini", "success")],
    });
  } catch (error) {
    if (isMockFallbackEnabled()) {
      const mockResult = await analyzeMealWithMock(payload);
      return jsonResponse(request, {
        ...mockResult,
        disclaimer: APP_DISCLAIMER,
        usedFallback: true,
        attempts: [
          toProviderAttempt("gemini", "failed"),
          toProviderAttempt("mock", "success"),
        ],
      });
    }

    if (error instanceof AIProviderError) {
      return jsonError(
        request,
        error.status ?? 502,
        "ANALYSIS_FAILED",
        error.message,
        error.retryable,
        [toProviderAttempt("gemini", "failed")],
      );
    }

    return jsonError(
      request,
      500,
      "ANALYSIS_FAILED",
      "Meal analysis failed on the backend.",
      true,
      [toProviderAttempt("gemini", "failed")],
    );
  }
}

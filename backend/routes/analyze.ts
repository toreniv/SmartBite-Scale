import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";
import type { Response } from "express";

import type {
  AnalyzeMealErrorCode,
  AnalyzeMealErrorResponse,
  AnalyzeMealProviderAttempt,
  AnalyzeMealRequest,
  AnalyzeMealResponse,
  MealAnalysisResult,
  UserProfile,
} from "../../lib/types";

const router = Router();

const APP_DISCLAIMER = "";
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_TIMEOUT_MS = 25_000;
const JSON_BLOCK_PATTERN = /```json\s*([\s\S]*?)```/i;
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;
const BACKEND_SYSTEM_PROMPT = [
  "You are a nutritionist analyzing the food in the image.",
  "Estimate nutrition for plated meals from an image and optional context.",
  "Identify the visible food first, then estimate calories, macros, and portion size.",
  "Prefer specific food names over generic labels when the image supports it.",
  "Use measuredWeightGrams only for portion sizing and nutrition estimation, not for deciding the food identity.",
  "Return only valid JSON for the requested schema.",
].join(" ");

type AnalyzeRequestBody = {
  imageBase64?: unknown;
  image?: unknown;
  mimeType?: unknown;
  note?: unknown;
  mealContext?: unknown;
  measuredWeightGrams?: unknown;
  weightGrams?: unknown;
  profile?: unknown;
};

type ParsedAnalyzeRequest =
  | {
      request: AnalyzeMealRequest;
    }
  | {
      error: string;
    };

type JsonRecord = Record<string, unknown>;

class AIProviderError extends Error {
  code?: AnalyzeMealErrorCode | "TIMEOUT";
  status?: number;
  retryable: boolean;
  cause?: unknown;

  constructor(
    message: string,
    options?: {
      code?: AnalyzeMealErrorCode | "TIMEOUT";
      cause?: unknown;
      retryable?: boolean;
      status?: number;
    },
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = options?.code;
    this.status = options?.status;
    this.retryable = options?.retryable ?? true;
    this.cause = options?.cause;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function stripCodeFence(text: string) {
  const fenced = text.match(JSON_BLOCK_PATTERN);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return text.replace(/^```/i, "").replace(/```$/, "").trim();
}

function parseProviderJson(value: unknown): JsonRecord {
  if (isObject(value)) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error("Provider returned an unexpected response.");
  }

  const normalized = stripCodeFence(value);

  try {
    const parsed = JSON.parse(normalized);
    if (isObject(parsed)) {
      return parsed;
    }
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");

    if (start >= 0 && end > start) {
      const sliced = normalized.slice(start, end + 1);
      const parsed = JSON.parse(sliced);
      if (isObject(parsed)) {
        return parsed;
      }
    }
  }

  throw new Error("Provider did not return valid JSON.");
}

function parseImageDataUrl(imageBase64: string) {
  const match = imageBase64.trim().match(DATA_URL_PATTERN);

  if (!match) {
    throw new Error("imageBase64 must be a valid base64 image data URL.");
  }

  return {
    mimeType: match[1],
    data: match[2].replace(/\s+/g, ""),
  };
}

function buildMealAnalysisPrompt(request: AnalyzeMealRequest) {
  return [
    "Analyze the food shown in the image.",
    "First determine the most likely visible food item or meal.",
    "Use a specific name when possible, such as 'salmon croissant', 'chicken wrap', or 'ham and cheese sandwich', instead of a generic category.",
    "If there are multiple visible components, name the dominant meal clearly and reflect the whole visible portion.",
    "Use measured weight only to refine portion size after identifying the food visually.",
    `Measured weight grams: ${request.measuredWeightGrams ?? "unknown"}`,
    `User note: ${request.note?.trim() || "none"}`,
    `Profile context: ${request.profile ? JSON.stringify(request.profile) : "none"}`,
    "Respond with schema-compliant JSON only.",
  ].join("\n");
}

function normalizeAnalysisResult(input: unknown): MealAnalysisResult {
  const record = parseProviderJson(input);
  const estimatedWeightGrams = Math.round(Math.max(toFiniteNumber(record.estimatedWeightGrams, 0), 0));
  const calories = Math.round(Math.max(toFiniteNumber(record.calories, 0), 0));
  const protein = Math.round(Math.max(toFiniteNumber(record.protein, 0), 0));
  const carbs = Math.round(Math.max(toFiniteNumber(record.carbs, 0), 0));
  const fat = Math.round(Math.max(toFiniteNumber(record.fat, 0), 0));
  const confidence = Number(clamp(toFiniteNumber(record.confidence, 0.72), 0, 1).toFixed(2));

  return {
    foodName: toNonEmptyString(record.foodName, "Estimated meal"),
    estimatedWeightGrams,
    calories,
    protein,
    carbs,
    fat,
    confidence,
    explanation: toNonEmptyString(
      record.explanation,
      "This is an estimated nutrition summary based on the meal image and available context.",
    ),
    provider: "gemini",
  };
}

function toProviderAttempt(
  status: AnalyzeMealProviderAttempt["status"],
): AnalyzeMealProviderAttempt {
  return {
    provider: "gemini",
    status,
    message:
      status === "success"
        ? "gemini analysis succeeded."
        : "gemini analysis was unavailable.",
  };
}

function jsonError(
  response: Response,
  status: number,
  code: AnalyzeMealErrorCode | "TIMEOUT",
  message: string,
  retryable: boolean,
  attempts: AnalyzeMealErrorResponse["attempts"] = [],
) {
  const payload = {
    error: {
      code,
      message,
      retryable,
    },
    attempts,
  };

  return response.status(status).json(payload);
}

function normalizeMimeType(value: unknown) {
  return isNonEmptyString(value) ? value.trim() : "image/jpeg";
}

function toImageDataUrl(body: AnalyzeRequestBody) {
  if (isNonEmptyString(body.imageBase64)) {
    return body.imageBase64.trim();
  }

  if (!isNonEmptyString(body.image)) {
    return null;
  }

  const rawImage = body.image.trim();

  if (rawImage.startsWith("data:")) {
    return rawImage;
  }

  return `data:${normalizeMimeType(body.mimeType)};base64,${rawImage.replace(/\s+/g, "")}`;
}

function normalizeWeight(body: AnalyzeRequestBody) {
  const candidate = body.measuredWeightGrams ?? body.weightGrams;

  if (candidate === undefined) {
    return undefined;
  }

  return isFiniteNumber(candidate) ? candidate : null;
}

function normalizeNote(body: AnalyzeRequestBody) {
  const candidate = body.note ?? body.mealContext;

  if (candidate === undefined) {
    return undefined;
  }

  return typeof candidate === "string" ? candidate : null;
}

function normalizeProfile(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return isObject(value) ? (value as unknown as UserProfile) : null;
}

function parseAnalyzeRequest(value: unknown): ParsedAnalyzeRequest {
  if (!isObject(value)) {
    return {
      error: "Request body must be a JSON object.",
    };
  }

  const body = value as AnalyzeRequestBody;
  const imageBase64 = toImageDataUrl(body);

  if (!imageBase64) {
    return {
      error: "Image is required and must be a base64 string",
    };
  }

  const note = normalizeNote(body);
  if (note === null) {
    return {
      error: "mealContext/note must be a string when provided.",
    };
  }

  const measuredWeightGrams = normalizeWeight(body);
  if (measuredWeightGrams === null) {
    return {
      error: "weightGrams/measuredWeightGrams must be a finite number when provided.",
    };
  }

  const profile = normalizeProfile(body.profile);
  if (profile === null) {
    return {
      error: "profile must be an object when provided.",
    };
  }

  const request: AnalyzeMealRequest = {
    imageBase64,
    ...(note !== undefined ? { note } : {}),
    ...(measuredWeightGrams !== undefined ? { measuredWeightGrams } : {}),
    ...(profile !== undefined ? { profile } : {}),
  };

  return { request };
}

function buildBackendPrompt(request: AnalyzeMealRequest) {
  return [
    buildMealAnalysisPrompt(request),
    request.measuredWeightGrams !== undefined
      ? `The food has been weighed and is ${request.measuredWeightGrams}g. Use this as the ground truth for portion size.`
      : "No measured weight is available. Estimate portion size from the image alone.",
    "Return ONLY a valid JSON object with no markdown, no explanation outside the JSON, and no code fences.",
    "Use exactly this JSON shape:",
    `{`,
    `  "foodName": "string",`,
    `  "estimatedWeightGrams": number,`,
    `  "calories": number,`,
    `  "protein": number,`,
    `  "carbs": number,`,
    `  "fat": number,`,
    `  "confidence": number,`,
    `  "explanation": "string"`,
    `}`,
    "Set confidence as a number between 0 and 1.",
  ].join("\n");
}

async function generateGeminiText(request: AnalyzeMealRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIProviderError("Gemini API key is not configured on the backend.", {
      retryable: false,
      status: 503,
    });
  }

  const image = parseImageDataUrl(request.imageBase64);
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: BACKEND_SYSTEM_PROMPT,
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new AIProviderError("Analysis took too long. Please try again.", {
            code: "TIMEOUT",
            retryable: true,
            status: 503,
          }),
        );
      }, GEMINI_TIMEOUT_MS);
    });

    const result = await Promise.race([
      model.generateContent([
        { text: buildBackendPrompt(request) },
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
      ]),
      timeoutPromise,
    ]);

    const text = result.response.text().trim();

    if (!text) {
      throw new AIProviderError("Gemini did not return any text output.", {
        retryable: true,
        status: 502,
      });
    }

    return text;
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }

    throw new AIProviderError(
      error instanceof Error ? error.message : "Gemini analysis request failed.",
      {
        cause: error,
        retryable: true,
        status: 502,
      },
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

router.post("/", async (request, response) => {
  const parsed = parseAnalyzeRequest(request.body);

  if ("error" in parsed) {
    return jsonError(
      response,
      400,
      "INVALID_REQUEST",
      parsed.error,
      false,
      [],
    );
  }

  try {
    const outputText = await generateGeminiText(parsed.request);
    let geminiPayload: Record<string, unknown>;

    try {
      geminiPayload = parseProviderJson(outputText);
    } catch {
      return jsonError(
        response,
        500,
        "ANALYSIS_FAILED",
        "Failed to parse Gemini response",
        false,
        [toProviderAttempt("failed")],
      );
    }

    const payload: AnalyzeMealResponse = {
      ...normalizeAnalysisResult(geminiPayload),
      disclaimer: APP_DISCLAIMER,
      usedFallback: false,
      attempts: [toProviderAttempt("success")],
    };

    return response.status(200).json(payload);
  } catch (error) {
    if (error instanceof AIProviderError) {
      return jsonError(
        response,
        error.status ?? 502,
        error.code ?? (error.status === 503 ? "PROVIDER_UNAVAILABLE" : "ANALYSIS_FAILED"),
        error.message,
        error.retryable,
        [toProviderAttempt("failed")],
      );
    }

    return jsonError(
      response,
      500,
      "ANALYSIS_FAILED",
      "Meal analysis failed on the backend.",
      true,
      [toProviderAttempt("failed")],
    );
  }
});

export default router;

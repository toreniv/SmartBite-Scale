import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import { analyzeMealWithFallback } from "@/lib/ai/analyzeMeal";
import { AIProviderError } from "@/lib/ai/normalize";
import { APP_DISCLAIMER } from "@/lib/constants";
import type {
  AnalyzeMealErrorCode,
  AnalyzeMealErrorResponse,
  AnalyzeMealRequest,
  UserProfile,
} from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ParsedAnalyzeRequest =
  | {
      request: AnalyzeMealRequest;
    }
  | {
      error: string;
      code?: AnalyzeMealErrorCode;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWeight(value: unknown) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeNote(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return typeof value === "string" ? value.trim() : null;
}

function normalizeProfile(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isObject(parsed) ? (parsed as unknown as UserProfile) : null;
    } catch {
      return null;
    }
  }

  return isObject(value) ? (value as unknown as UserProfile) : null;
}

function getApproximateImageSizeBytes(imageBase64: string) {
  const separatorIndex = imageBase64.indexOf(",");
  const base64 =
    separatorIndex === -1 ? imageBase64.trim() : imageBase64.slice(separatorIndex + 1).replace(/\s+/g, "");

  return Math.ceil(base64.length * 0.75);
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

function jsonError(
  request: Request,
  status: number,
  code: AnalyzeMealErrorCode,
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

async function parseJsonRequest(request: Request): Promise<ParsedAnalyzeRequest> {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return { error: "Request body must be valid JSON." };
  }

  const imageBase64 =
    typeof payload.imageBase64 === "string" && payload.imageBase64.trim() ? payload.imageBase64.trim() : null;

  if (!imageBase64) {
    return { error: "Request body must include a valid imageBase64 data URL." };
  }

  const note = normalizeNote(payload.note);
  if (note === null) {
    return { error: "note must be a string when provided." };
  }

  const measuredWeightGrams = normalizeWeight(payload.weightGrams ?? payload.measuredWeightGrams);
  if (measuredWeightGrams === null) {
    return { error: "weightGrams must be a finite number when provided." };
  }

  const profile = normalizeProfile(payload.profile);
  if (profile === null) {
    return { error: "profile must be an object when provided." };
  }

  return {
    request: {
      imageBase64,
      ...(note ? { note } : {}),
      ...(measuredWeightGrams !== undefined ? { measuredWeightGrams, weightGrams: measuredWeightGrams } : {}),
      ...(profile ? { profile } : {}),
    } satisfies AnalyzeMealRequest,
  };
}

async function parseFormDataRequest(request: Request): Promise<ParsedAnalyzeRequest> {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return { error: "An image file is required." };
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return { code: "IMAGE_TOO_LARGE" as const, error: "Image is too large. Please use a smaller photo." };
  }

  const note = normalizeNote(formData.get("note"));
  if (note === null) {
    return { error: "note must be a string when provided." };
  }

  const measuredWeightGrams = normalizeWeight(
    formData.get("weightGrams") ?? formData.get("measuredWeightGrams"),
  );
  if (measuredWeightGrams === null) {
    return { error: "weightGrams must be a finite number when provided." };
  }

  const profile = normalizeProfile(formData.get("profile"));
  if (profile === null) {
    return { error: "profile must be valid JSON when provided." };
  }

  const imageBase64 = `data:${image.type || "image/jpeg"};base64,${Buffer.from(
    await image.arrayBuffer(),
  ).toString("base64")}`;

  return {
    request: {
      imageBase64,
      ...(note ? { note } : {}),
      ...(measuredWeightGrams !== undefined ? { measuredWeightGrams, weightGrams: measuredWeightGrams } : {}),
      ...(profile ? { profile } : {}),
    } satisfies AnalyzeMealRequest,
  };
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(new NextResponse(null, { status: 204 }), request);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";

  try {
    const parsed = contentType.includes("multipart/form-data")
      ? await parseFormDataRequest(request)
      : await parseJsonRequest(request);

    if ("error" in parsed) {
      return jsonError(
        request,
        parsed.code === "IMAGE_TOO_LARGE" ? 400 : 400,
        parsed.code ?? "INVALID_REQUEST",
        parsed.error,
        false,
      );
    }

    if (getApproximateImageSizeBytes(parsed.request.imageBase64) > MAX_IMAGE_BYTES) {
      return jsonError(
        request,
        400,
        "IMAGE_TOO_LARGE",
        "Image is too large. Please use a smaller photo.",
        false,
      );
    }

    const result = await analyzeMealWithFallback(parsed.request, APP_DISCLAIMER);
    return withCorsHeaders(NextResponse.json(result), request);
  } catch (error) {
    if (error instanceof AIProviderError) {
      return jsonError(
        request,
        error.status ?? 503,
        "PROVIDER_UNAVAILABLE",
        error.message || "Meal analysis failed for the configured providers.",
        error.retryable,
        error.attempts,
      );
    }

    return jsonError(
      request,
      500,
      "ANALYSIS_FAILED",
      "Meal analysis failed on the server.",
      true,
    );
  }
}

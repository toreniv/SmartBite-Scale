import { Buffer } from "node:buffer";
import { Readable } from "node:stream";

import { Router } from "express";
import type { Request, Response } from "express";

import { analyzeMealWithFallback } from "../../lib/ai/analyzeMeal";
import { AIProviderError } from "../../lib/ai/normalize";
import { APP_DISCLAIMER } from "../../lib/constants";
import type {
  AnalyzeMealErrorCode,
  AnalyzeMealErrorResponse,
  AnalyzeMealRequest,
  UserProfile,
} from "../../lib/types";

const router = Router();

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

type AnalyzeRequestBody = {
  imageBase64?: unknown;
  note?: unknown;
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
      status: number;
      code: AnalyzeMealErrorCode;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getApproximateImageSizeBytes(imageBase64: string) {
  const separatorIndex = imageBase64.indexOf(",");
  const base64 =
    separatorIndex === -1 ? imageBase64.trim() : imageBase64.slice(separatorIndex + 1).replace(/\s+/g, "");

  return Math.ceil(base64.length * 0.75);
}

function parseImageDataUrl(imageBase64: string) {
  const match = imageBase64.trim().match(DATA_URL_PATTERN);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2].replace(/\s+/g, ""),
  };
}

function normalizeWeight(value: unknown) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return isFiniteNumber(value) ? value : null;
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

function normalizeNote(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return typeof value === "string" ? value.trim() : null;
}

function parseJsonBody(body: unknown): ParsedAnalyzeRequest {
  if (!isObject(body)) {
    return {
      error: "Request body must be a JSON object or multipart form data.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const input = body as AnalyzeRequestBody;
  const imageBase64 =
    typeof input.imageBase64 === "string" && input.imageBase64.trim() ? input.imageBase64.trim() : null;

  if (!imageBase64 || !parseImageDataUrl(imageBase64)) {
    return {
      error: "imageBase64 must be a valid image data URL.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const note = normalizeNote(input.note);
  if (note === null) {
    return {
      error: "note must be a string when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const measuredWeightGrams = normalizeWeight(input.weightGrams ?? input.measuredWeightGrams);
  if (measuredWeightGrams === null) {
    return {
      error: "weightGrams must be a finite number when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const profile = normalizeProfile(input.profile);
  if (profile === null) {
    return {
      error: "profile must be valid JSON when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  return {
    request: {
      imageBase64,
      ...(note ? { note } : {}),
      ...(measuredWeightGrams !== undefined ? { measuredWeightGrams, weightGrams: measuredWeightGrams } : {}),
      ...(profile ? { profile } : {}),
    },
  };
}

async function parseMultipartRequest(request: Request): Promise<ParsedAnalyzeRequest> {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  const origin = `http://${request.headers.host ?? "localhost"}`;
  const body = Readable.toWeb(request) as unknown as ReadableStream<Uint8Array>;
  const webRequest = new Request(new URL(request.originalUrl, origin), {
    method: request.method,
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  let formData: FormData;

  try {
    formData = await webRequest.formData();
  } catch {
    return {
      error: "Multipart form data is invalid.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return {
      error: "An image file is required.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return {
      error: "Image is too large. Please use a smaller photo.",
      status: 400,
      code: "IMAGE_TOO_LARGE",
    };
  }

  const note = normalizeNote(formData.get("note"));
  if (note === null) {
    return {
      error: "note must be a string when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const measuredWeightGrams = normalizeWeight(
    formData.get("weightGrams") ?? formData.get("measuredWeightGrams"),
  );
  if (measuredWeightGrams === null) {
    return {
      error: "weightGrams must be a finite number when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const profile = normalizeProfile(formData.get("profile"));
  if (profile === null) {
    return {
      error: "profile must be valid JSON when provided.",
      status: 400,
      code: "INVALID_REQUEST",
    };
  }

  const mimeType = image.type?.trim() || "image/jpeg";
  const imageBase64 = `data:${mimeType};base64,${bytes.toString("base64")}`;

  return {
    request: {
      imageBase64,
      ...(note ? { note } : {}),
      ...(measuredWeightGrams !== undefined ? { measuredWeightGrams, weightGrams: measuredWeightGrams } : {}),
      ...(profile ? { profile } : {}),
    },
  };
}

async function parseAnalyzeRequest(request: Request): Promise<ParsedAnalyzeRequest> {
  const contentType = request.headers["content-type"]?.toLowerCase() || "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartRequest(request);
  }

  return parseJsonBody(request.body);
}

function jsonError(
  response: Response,
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

  return response.status(status).json(payload);
}

router.post("/", async (request, response) => {
  const parsed = await parseAnalyzeRequest(request);

  if ("error" in parsed) {
    return jsonError(response, parsed.status, parsed.code, parsed.error, false);
  }

  if (getApproximateImageSizeBytes(parsed.request.imageBase64) > MAX_IMAGE_BYTES) {
    return jsonError(
      response,
      400,
      "IMAGE_TOO_LARGE",
      "Image is too large. Please use a smaller photo.",
      false,
    );
  }

  try {
    const result = await analyzeMealWithFallback(parsed.request, APP_DISCLAIMER);
    return response.status(200).json(result);
  } catch (error) {
    console.error("Meal analysis backend error:", error);

    if (error instanceof AIProviderError) {
      const message =
        error.message || "Meal analysis failed for the configured providers.";

      return jsonError(
        response,
        error.status ?? 503,
        "PROVIDER_UNAVAILABLE",
        message,
        error.retryable,
        error.attempts,
      );
    }

    return jsonError(
      response,
      500,
      "ANALYSIS_FAILED",
      "Meal analysis failed on the backend.",
      true,
    );
  }
});

export default router;

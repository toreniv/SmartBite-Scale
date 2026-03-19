import type {
  AnalysisProvider,
  AnalyzeMealProviderAttempt,
  AnalyzeMealRequest,
  MealAnalysisResult,
} from "@/lib/types";

type JsonRecord = Record<string, unknown>;

const JSON_BLOCK_PATTERN = /```json\s*([\s\S]*?)```/i;
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

export const MEAL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    foodName: {
      type: "string",
      description: "Short meal name, for example 'Grilled salmon with rice'.",
    },
    estimatedWeightGrams: {
      type: "number",
      description: "Estimated total plated meal weight in grams.",
    },
    calories: {
      type: "number",
      description: "Estimated calories for the meal.",
    },
    protein: {
      type: "number",
      description: "Estimated protein in grams.",
    },
    carbs: {
      type: "number",
      description: "Estimated carbohydrates in grams.",
    },
    fat: {
      type: "number",
      description: "Estimated fat in grams.",
    },
    ingredients: {
      type: "array",
      description: "Short list of likely visible ingredients or meal components.",
      items: {
        type: "string",
      },
    },
    confidence: {
      type: "number",
      description: "Confidence from 0 to 1.",
    },
    explanation: {
      type: "string",
      description: "One short explanation describing the estimate and uncertainty.",
    },
  },
  required: [
    "foodName",
    "estimatedWeightGrams",
    "calories",
    "protein",
    "carbs",
    "fat",
    "ingredients",
    "confidence",
    "explanation",
  ],
} as const;

export const MEAL_ANALYSIS_SYSTEM_PROMPT = [
  "You estimate nutrition for plated meals from an image and optional context.",
  "Identify the visible food first, then estimate nutrition.",
  "Prefer specific food names over generic labels when the image supports it.",
  "Handle croissants, pastries, bakery items, sandwiches, wraps, bowls, mixed plates, and composed meals carefully.",
  "Use measuredWeightGrams only for portion sizing and nutrition estimation, not for deciding the food identity.",
  "If the food is visually specific, avoid broad labels like 'rice bowl' or 'sandwich' without the main filling or style.",
  "Return only JSON matching the supplied schema.",
  "Keep explanation concise and practical.",
].join(" ");

export class AIProviderError extends Error {
  provider: AnalysisProvider;
  status?: number;
  retryable: boolean;
  cause?: unknown;
  attempts?: AnalyzeMealProviderAttempt[];

  constructor(
    provider: AnalysisProvider,
    message: string,
    options?: {
      attempts?: AnalyzeMealProviderAttempt[];
      cause?: unknown;
      retryable?: boolean;
      status?: number;
    },
  ) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.status = options?.status;
    this.retryable = options?.retryable ?? true;
    this.cause = options?.cause;
    this.attempts = options?.attempts;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function buildMealAnalysisPrompt(request: AnalyzeMealRequest) {
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

export function parseProviderJson(value: unknown): JsonRecord {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error("Provider returned an unexpected response.");
  }

  const normalized = stripCodeFence(value);

  try {
    const parsed = JSON.parse(normalized);
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");

    if (start >= 0 && end > start) {
      const sliced = normalized.slice(start, end + 1);
      const parsed = JSON.parse(sliced);
      if (isRecord(parsed)) {
        return parsed;
      }
    }
  }

  throw new Error("Provider did not return valid JSON.");
}

export function parseImageDataUrl(imageBase64: string) {
  const match = imageBase64.trim().match(DATA_URL_PATTERN);

  if (!match) {
    throw new Error("imageBase64 must be a valid base64 image data URL.");
  }

  return {
    mimeType: match[1],
    data: match[2].replace(/\s+/g, ""),
  };
}

export function normalizeAnalysisResult(
  input: unknown,
  provider: AnalysisProvider,
): MealAnalysisResult {
  const record = parseProviderJson(input);
  const estimatedWeightGrams = Math.round(Math.max(toFiniteNumber(record.estimatedWeightGrams, 0), 0));
  const calories = Math.round(Math.max(toFiniteNumber(record.calories, 0), 0));
  const protein = Math.round(Math.max(toFiniteNumber(record.protein, 0), 0));
  const carbs = Math.round(Math.max(toFiniteNumber(record.carbs, 0), 0));
  const fat = Math.round(Math.max(toFiniteNumber(record.fat, 0), 0));
  const ingredients = Array.isArray(record.ingredients)
    ? record.ingredients
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const confidence = Number(clamp(toFiniteNumber(record.confidence, 0.72), 0, 1).toFixed(2));

  return {
    foodName: toNonEmptyString(record.foodName, "Estimated meal"),
    estimatedWeightGrams,
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    confidence,
    explanation: toNonEmptyString(
      record.explanation,
      "This is an estimated nutrition summary based on the meal image and available context.",
    ),
    provider,
  };
}

export function toProviderAttempt(
  provider: AnalysisProvider,
  status: AnalyzeMealProviderAttempt["status"],
): AnalyzeMealProviderAttempt {
  return {
    provider,
    status,
    message:
      status === "success"
        ? `${provider} analysis succeeded.`
        : `${provider} analysis was unavailable.`,
  };
}

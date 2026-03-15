import type { AnalyzeMealRequest } from "@/lib/types";
import {
  AIProviderError,
  buildMealAnalysisPrompt,
  MEAL_ANALYSIS_JSON_SCHEMA,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  normalizeAnalysisResult,
  parseImageDataUrl,
} from "@/lib/ai/normalize";

const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

interface GeminiErrorPayload {
  error?: {
    message?: string;
  };
}

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export function hasGeminiApiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getGeminiModel() {
  return process.env.GEMINI_MEAL_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

async function readGeminiError(response: Response) {
  try {
    const payload = (await response.json()) as GeminiErrorPayload;
    return payload.error?.message?.trim() || "";
  } catch {
    return "";
  }
}

function extractGeminiText(payload: GeminiResponsePayload) {
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

export async function analyzeMealWithGemini(request: AnalyzeMealRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIProviderError("gemini", "Gemini API key is not configured.", {
      retryable: false,
    });
  }

  const image = parseImageDataUrl(request.imageBase64);
  const response = await fetch(`${GEMINI_API_ROOT}/${getGeminiModel()}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: MEAL_ANALYSIS_SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            { text: buildMealAnalysisPrompt(request) },
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

  if (!response.ok) {
    const details = await readGeminiError(response);
    throw new AIProviderError("gemini", details || "Gemini analysis request failed.", {
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
    });
  }

  const payload = (await response.json()) as GeminiResponsePayload;
  const outputText = extractGeminiText(payload);

  return normalizeAnalysisResult(outputText, "gemini");
}

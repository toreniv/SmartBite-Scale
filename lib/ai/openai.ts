import type { AnalyzeMealRequest } from "@/lib/types";
import {
  AIProviderError,
  buildMealAnalysisPrompt,
  MEAL_ANALYSIS_JSON_SCHEMA,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  normalizeAnalysisResult,
} from "@/lib/ai/normalize";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

interface OpenAIErrorPayload {
  error?: {
    message?: string;
  };
}

interface OpenAIResponsePayload {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

export function hasOpenAIApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getOpenAIModel() {
  return process.env.OPENAI_MEAL_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

async function readOpenAIError(response: Response) {
  try {
    const payload = (await response.json()) as OpenAIErrorPayload;
    return payload.error?.message?.trim() || "";
  } catch {
    return "";
  }
}

function extractOpenAIText(payload: OpenAIResponsePayload) {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  const text = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((item) => item.text?.trim() || "")
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("OpenAI did not return any text output.");
  }

  return text;
}

export async function analyzeMealWithOpenAI(request: AnalyzeMealRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIProviderError("openai", "OpenAI API key is not configured.", {
      retryable: false,
    });
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      instructions: MEAL_ANALYSIS_SYSTEM_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildMealAnalysisPrompt(request),
            },
            {
              type: "input_image",
              image_url: request.imageBase64,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "meal_analysis",
          schema: MEAL_ANALYSIS_JSON_SCHEMA,
          strict: true,
        },
      },
      max_output_tokens: 500,
    }),
  });

  if (!response.ok) {
    const details = await readOpenAIError(response);
    throw new AIProviderError("openai", details || "OpenAI analysis request failed.", {
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
    });
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const outputText = extractOpenAIText(payload);

  return normalizeAnalysisResult(outputText, "openai");
}

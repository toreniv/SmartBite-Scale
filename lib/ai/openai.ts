import type { AnalyzeMealRequest } from "@/lib/types";
import {
  AIProviderError,
  buildMealAnalysisPrompt,
  MEAL_ANALYSIS_JSON_SCHEMA,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  normalizeAnalysisResult,
} from "@/lib/ai/normalize";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

interface OpenAIErrorPayload {
  error?: {
    message?: string;
  };
}

interface OpenAITextContent {
  text?: string;
}

interface OpenAIOutputMessage {
  content?: OpenAITextContent[];
}

interface OpenAIResponsePayload {
  output_text?: string;
  output?: OpenAIOutputMessage[];
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
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.text?.trim()) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI did not return any text output.");
}

export async function analyzeMealWithOpenAI(request: AnalyzeMealRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIProviderError("openai", "OpenAI API key is not configured.", {
      retryable: false,
    });
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: MEAL_ANALYSIS_SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: buildMealAnalysisPrompt(request) },
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
          strict: true,
          schema: MEAL_ANALYSIS_JSON_SCHEMA,
        },
      },
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

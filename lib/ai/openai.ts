import { normalizeAnalysisResult } from "@/lib/ai/normalize";
import type { AnalyzeMealRequest } from "@/lib/types";

const OPENAI_URL = "https://api.openai.com/v1/responses";

export async function analyzeMealWithOpenAI(request: AnalyzeMealRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prompt = [
    "Estimate the meal nutrition from the image and context.",
    "Return JSON with keys:",
    "foodName, estimatedWeightGrams, calories, protein, carbs, fat, confidence, explanation",
    `Measured weight grams: ${request.measuredWeightGrams ?? "unknown"}`,
    `User note: ${request.note ?? "none"}`,
    `Profile context: ${request.profile ? JSON.stringify(request.profile) : "none"}`,
  ].join("\n");

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: request.imageBase64 },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as {
    output_text?: string;
  };

  const parsed = json.output_text ? JSON.parse(json.output_text) : {};
  return normalizeAnalysisResult(parsed, "openai");
}

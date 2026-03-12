import { normalizeAnalysisResult } from "@/lib/ai/normalize";
import type { AnalyzeMealRequest } from "@/lib/types";

export async function analyzeMealWithGemini(request: AnalyzeMealRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: [
                "Estimate meal nutrition and return JSON only.",
                `Measured weight grams: ${request.measuredWeightGrams ?? "unknown"}`,
                `User note: ${request.note ?? "none"}`,
              ].join("\n"),
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: request.imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""),
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return normalizeAnalysisResult(JSON.parse(text), "gemini");
}

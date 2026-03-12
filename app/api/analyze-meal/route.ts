import { NextResponse } from "next/server";
import { analyzeMealWithGemini } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { analyzeMealWithOpenAI } from "@/lib/ai/openai";
import { APP_DISCLAIMER } from "@/lib/constants";
import type { AnalyzeMealPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeMealPayload;

    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required." }, { status: 400 });
    }

    try {
      const result = await analyzeMealWithOpenAI(body);
      return NextResponse.json({ ...result, disclaimer: APP_DISCLAIMER });
    } catch (openAiError) {
      if (process.env.GEMINI_API_KEY && body.fallbackToGemini !== false) {
        try {
          const result = await analyzeMealWithGemini(body);
          return NextResponse.json({ ...result, disclaimer: APP_DISCLAIMER });
        } catch {
          const result = await analyzeMealWithMock(body);
          return NextResponse.json({ ...result, disclaimer: APP_DISCLAIMER });
        }
      }

      const result = await analyzeMealWithMock(body);
      return NextResponse.json({
        ...result,
        disclaimer: APP_DISCLAIMER,
        fallbackReason:
          openAiError instanceof Error
            ? openAiError.message
            : "Primary provider unavailable.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to analyze meal.",
      },
      { status: 500 },
    );
  }
}

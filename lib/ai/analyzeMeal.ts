import { analyzeMealWithGemini, hasGeminiApiKey } from "@/lib/ai/gemini";
import { analyzeMealWithMock } from "@/lib/ai/mock";
import { AIProviderError, toProviderAttempt } from "@/lib/ai/normalize";
import { analyzeMealWithOpenAI, hasOpenAIApiKey } from "@/lib/ai/openai";
import type {
  AnalyzeMealProviderAttempt,
  AnalyzeMealRequest,
  AnalyzeMealResponse,
} from "@/lib/types";

export function isMockFallbackEnabled() {
  return process.env.ALLOW_MOCK_ANALYSIS_FALLBACK === "true";
}

export function hasAnyRealAnalysisProvider() {
  return hasGeminiApiKey() || hasOpenAIApiKey();
}

export async function analyzeMealWithFallback(
  request: AnalyzeMealRequest,
  disclaimer: string,
): Promise<AnalyzeMealResponse> {
  const attempts: AnalyzeMealProviderAttempt[] = [];
  let lastProviderError: AIProviderError | null = null;

  if (hasGeminiApiKey()) {
    try {
      const geminiResult = await analyzeMealWithGemini(request);
      attempts.push(toProviderAttempt("gemini", "success"));
      return {
        ...geminiResult,
        disclaimer,
        usedFallback: false,
        attempts,
      };
    } catch (error) {
      attempts.push(toProviderAttempt("gemini", "failed"));
      if (!(error instanceof AIProviderError)) {
        throw error;
      }
      error.attempts = [...attempts];
      lastProviderError = error;
    }
  }

  if (hasOpenAIApiKey()) {
    try {
      const openAiResult = await analyzeMealWithOpenAI(request);
      attempts.push(toProviderAttempt("openai", "success"));
      return {
        ...openAiResult,
        disclaimer,
        usedFallback: attempts.some((attempt) => attempt.status === "failed"),
        attempts,
      };
    } catch (error) {
      attempts.push(toProviderAttempt("openai", "failed"));
      if (!(error instanceof AIProviderError)) {
        throw error;
      }
      error.attempts = [...attempts];
      lastProviderError = error;
    }
  }

  if (isMockFallbackEnabled()) {
    const mockResult = await analyzeMealWithMock(request);
    attempts.push(toProviderAttempt("mock", "success"));
    return {
      ...mockResult,
      disclaimer,
      usedFallback: true,
      attempts,
    };
  }

  if (lastProviderError) {
    lastProviderError.attempts = [...attempts];
    throw lastProviderError;
  }

  throw new AIProviderError(
    hasAnyRealAnalysisProvider() ? "gemini" : "mock",
    hasAnyRealAnalysisProvider()
      ? "Meal analysis failed for every configured provider."
      : "No real meal analysis provider is configured, and mock fallback is disabled.",
    {
      attempts,
      retryable: hasAnyRealAnalysisProvider(),
      status: 503,
    },
  );
}

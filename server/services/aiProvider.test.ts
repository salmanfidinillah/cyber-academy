import { describe, expect, it, vi } from "vitest";
const { sdkGenerateContent } = vi.hoisted(() => ({
  sdkGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: sdkGenerateContent };
  },
}));

import {
  AiGenerateRequest,
  AiProvider,
  AiServiceError,
  createAiProvider,
  generateWithRetry,
  isRetryableAiError,
} from "./aiProvider";

const request: AiGenerateRequest = {
  contents: "test",
  systemInstruction: "test",
  temperature: 0,
  responseSchema: {},
};

describe("AI reliability", () => {
  it("retries HTTP 429 with exponential backoff and jitter", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("quota"), { status: 429 }))
      .mockResolvedValueOnce("{}");
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await generateWithRetry(
      { generateContent },
      request,
      { requestTimeoutMs: 1_000, maxRetries: 2 },
      { sleep, random: () => 0.5 }
    );
    expect(result).toBe("{}");
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(800);
  });

  it("does not retry authentication, authorization, or invalid input errors", async () => {
    for (const status of [400, 401, 403]) {
      const generateContent = vi.fn().mockRejectedValue(Object.assign(new Error("permanent"), { status }));
      await expect(
        generateWithRetry({ generateContent }, request, { requestTimeoutMs: 1_000, maxRetries: 2 }, {
          sleep: vi.fn(),
        })
      ).rejects.toBeInstanceOf(AiServiceError);
      expect(generateContent).toHaveBeenCalledTimes(1);
    }
  });

  it("stops after the configured maximum of two retries", async () => {
    const generateContent = vi.fn().mockRejectedValue(Object.assign(new Error("unavailable"), { status: 503 }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      generateWithRetry({ generateContent }, request, { requestTimeoutMs: 1_000, maxRetries: 2 }, {
        sleep,
        random: () => 0,
      })
    ).rejects.toMatchObject({ code: "AI_TEMPORARILY_UNAVAILABLE", retryable: true });
    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 600);
    expect(sleep).toHaveBeenNthCalledWith(2, 1_200);
  });

  it("turns a hanging provider request into a structured timeout", async () => {
    const provider: AiProvider = { generateContent: vi.fn(() => new Promise<string>(() => {})) };
    await expect(
      generateWithRetry(provider, request, { requestTimeoutMs: 5, maxRetries: 0 })
    ).rejects.toMatchObject({ code: "AI_TIMEOUT", statusCode: 503 });
  });

  it("classifies network resets and temporary capacity as retryable", () => {
    expect(isRetryableAiError(Object.assign(new Error("reset"), { code: "ECONNRESET" }))).toBe(true);
    expect(isRetryableAiError(new Error("temporary capacity exhausted"))).toBe(true);
    expect(isRetryableAiError(Object.assign(new Error("not found"), { status: 404 }))).toBe(false);
  });

  it("preserves metadata and only requests JSON when a response schema is supplied", async () => {
    sdkGenerateContent.mockResolvedValueOnce({
      text: '{"summary":"ok"}',
      candidates: [{ finishReason: "MAX_TOKENS" }],
      promptFeedback: { blockReason: "SAFETY" },
      modelVersion: "gemini-2.5-flash-001",
    });
    const provider = createAiProvider({
      configured: true,
      errors: [],
      config: {
        provider: "vertex",
        project: "test-project",
        location: "global",
        model: "gemini-2.5-flash",
        requestTimeoutMs: 1_000,
        maxInputChars: 4_000,
        maxHistoryMessages: 12,
        maxOutputTokens: 800,
        insightMaxOutputTokens: 1_400,
        maxRetries: 0,
      },
    });

    const result = await provider!.generateStructuredContent!({
      ...request,
      maxOutputTokens: 1_400,
    });

    expect(result).toEqual({
      text: '{"summary":"ok"}',
      finishReason: "MAX_TOKENS",
      blockReason: "SAFETY",
      candidateCount: 1,
      model: "gemini-2.5-flash-001",
    });
    expect(sdkGenerateContent.mock.calls.at(-1)?.[0].config).toMatchObject({
      maxOutputTokens: 1_400,
      responseMimeType: "application/json",
      responseSchema: request.responseSchema,
    });

    sdkGenerateContent.mockResolvedValueOnce({
      text: "Jawaban Tutor dalam teks biasa.",
      candidates: [{ finishReason: "STOP" }],
      modelVersion: "gemini-2.5-flash-001",
    });
    const plainTextResult = await provider!.generateStructuredContent!({
      contents: "test",
      systemInstruction: "test",
      temperature: 0,
    });
    const plainTextConfig = sdkGenerateContent.mock.calls.at(-1)?.[0].config;

    expect(plainTextResult.text).toBe("Jawaban Tutor dalam teks biasa.");
    expect(plainTextConfig).not.toHaveProperty("responseMimeType");
    expect(plainTextConfig).not.toHaveProperty("responseSchema");
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  AiGenerateRequest,
  AiProvider,
  AiServiceError,
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
});

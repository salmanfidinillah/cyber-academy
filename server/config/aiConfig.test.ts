import { describe, expect, it } from "vitest";
import { getAiHealthStatus, loadAiConfig } from "./aiConfig";

describe("AI configuration", () => {
  it("accepts a valid Vertex AI configuration and applies safe defaults", () => {
    const state = loadAiConfig({
      AI_PROVIDER: "vertex",
      GOOGLE_CLOUD_PROJECT: "cyber-academy-test",
    });
    expect(state.configured).toBe(true);
    expect(state.config).toMatchObject({
      provider: "vertex",
      project: "cyber-academy-test",
      location: "global",
      model: "gemini-2.5-flash",
      requestTimeoutMs: 25_000,
      maxInputChars: 4_000,
      maxHistoryMessages: 12,
      maxOutputTokens: 800,
      insightMaxOutputTokens: 1_400,
    });
  });

  it("marks Vertex AI unavailable when GOOGLE_CLOUD_PROJECT is empty", () => {
    const state = loadAiConfig({ AI_PROVIDER: "vertex", GOOGLE_CLOUD_PROJECT: "" });
    expect(state.configured).toBe(false);
    expect(state.errors).toContain("GOOGLE_CLOUD_PROJECT wajib diisi ketika AI_PROVIDER=vertex.");
  });

  it("rejects an unknown provider", () => {
    const state = loadAiConfig({ AI_PROVIDER: "automatic-fallback" });
    expect(state.configured).toBe(false);
    expect(state.errors.join(" ")).toContain("AI_PROVIDER");
  });

  it("rejects invalid timeout and token limits without crashing the server", () => {
    const state = loadAiConfig({
      AI_PROVIDER: "vertex",
      GOOGLE_CLOUD_PROJECT: "cyber-academy-test",
      AI_REQUEST_TIMEOUT_MS: "NaN",
      AI_MAX_OUTPUT_TOKENS: "-1",
      AI_INSIGHT_MAX_OUTPUT_TOKENS: "not-a-number",
    });
    expect(state.configured).toBe(false);
    expect(state.errors.join(" ")).toContain("AI_REQUEST_TIMEOUT_MS");
    expect(state.errors.join(" ")).toContain("AI_MAX_OUTPUT_TOKENS");
    expect(state.errors.join(" ")).toContain("AI_INSIGHT_MAX_OUTPUT_TOKENS");
  });

  it("keeps the Learning Insight token limit separate from AI Tutor", () => {
    const state = loadAiConfig({
      AI_PROVIDER: "vertex",
      GOOGLE_CLOUD_PROJECT: "cyber-academy-test",
      AI_MAX_OUTPUT_TOKENS: "800",
      AI_INSIGHT_MAX_OUTPUT_TOKENS: "1400",
    });
    expect(state.config).toMatchObject({
      maxOutputTokens: 800,
      insightMaxOutputTokens: 1_400,
    });
  });

  it("keeps the API-key provider only as an explicit compatibility mode", () => {
    expect(loadAiConfig({ AI_PROVIDER: "gemini-api", GEMINI_API_KEY: "test-key" }).configured).toBe(true);
    expect(loadAiConfig({ AI_PROVIDER: "gemini-api" }).configured).toBe(false);
  });

  it("builds health status from local configuration without a provider call", () => {
    const state = loadAiConfig({
      AI_PROVIDER: "vertex",
      GOOGLE_CLOUD_PROJECT: "cyber-academy-test",
    });
    expect(getAiHealthStatus(state)).toEqual({ provider: "vertex", configured: true });
  });
});

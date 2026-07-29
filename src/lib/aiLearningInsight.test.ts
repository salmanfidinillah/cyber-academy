// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/apiClient", () => ({
  authenticatedFetch: vi.fn(),
}));

import { authenticatedFetch } from "../services/apiClient";
import {
  AiInsightClientError,
  getAiLearningInsight,
} from "./learningStore";

const validInsight = {
  summary: "Kemajuan belajar stabil.",
  strongTopics: [{ topic: "MFA", reason: "Skor kuis baik." }],
  improvementTopics: [{ topic: "Phishing", reason: "Perlu latihan lagi." }],
  recommendations: [
    {
      type: "simulation",
      id: "phishing-email",
      title: "Deteksi Phishing",
      reason: "Latihan defensif.",
    },
  ],
  studyTip: "Ulangi latihan secara berkala.",
  confidence: "medium",
};

function mockResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("AI Learning Insight client cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("stores one validated Insight response exactly once", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse(true, validInsight));

    const result = await getAiLearningInsight("user-1", 3, [], [], 25, true);

    expect(result).toMatchObject(validInsight);
    expect(result.createdAt).toEqual(expect.any(String));
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem.mock.calls[0][0]).toBe("ai_insight_user-1");
  });

  it("does not store a successful HTTP response with an invalid Insight shape", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(authenticatedFetch).mockResolvedValue(
      mockResponse(true, { ...validInsight, recommendations: "simulation" })
    );

    await expect(
      getAiLearningInsight("user-2", 3, [], [], 25, true)
    ).rejects.toMatchObject({
      code: "AI_INSIGHT_INVALID_FORMAT",
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("preserves the structured server error code for the UI", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      mockResponse(false, {
        success: false,
        error: {
          code: "AI_INSIGHT_TRUNCATED",
          message: "Insight belum dapat diproses karena respons AI terpotong.",
          retryable: true,
        },
      })
    );

    await expect(
      getAiLearningInsight("user-3", 3, [], [], 25, true)
    ).rejects.toMatchObject({
      code: "AI_INSIGHT_TRUNCATED",
      retryable: true,
    });
  });

  it("removes an invalid cached Insight instead of displaying it as success", async () => {
    localStorage.setItem("ai_insight_user-4", JSON.stringify({ summary: "rusak" }));
    vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse(true, validInsight));

    const result = await getAiLearningInsight("user-4", 3, [], [], 25);

    expect(result).toMatchObject(validInsight);
    expect(authenticatedFetch).toHaveBeenCalledTimes(1);
  });

  it("returns a validated cached Insight without calling the backend again", async () => {
    localStorage.setItem(
      "ai_insight_user-5",
      JSON.stringify({ ...validInsight, createdAt: "2026-07-29T00:00:00.000Z" })
    );

    const result = await getAiLearningInsight("user-5", 3, [], [], 25);

    expect(result.createdAt).toBe("2026-07-29T00:00:00.000Z");
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it("returns a structured network error", async () => {
    vi.mocked(authenticatedFetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      getAiLearningInsight("user-6", 3, [], [], 25, true)
    ).rejects.toEqual(
      expect.objectContaining<Partial<AiInsightClientError>>({
        code: "AI_INSIGHT_NETWORK_ERROR",
        retryable: true,
      })
    );
  });
});

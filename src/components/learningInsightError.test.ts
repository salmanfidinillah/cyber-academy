import { describe, expect, it } from "vitest";
import { getLearningInsightErrorView } from "./learningInsightError";

describe("Learning Insight error messages", () => {
  it("does not blame the internet connection for invalid JSON", () => {
    const view = getLearningInsightErrorView({
      code: "AI_INSIGHT_INVALID_FORMAT",
      message: "raw backend message",
    });

    expect(view.title).toBe("Insight belum dapat diproses");
    expect(view.message).toContain("Respons AI belum sesuai format");
    expect(`${view.title} ${view.message}`.toLowerCase()).not.toContain("internet");
  });

  it("shows the non-AI availability guarantee when Vertex is unavailable", () => {
    const view = getLearningInsightErrorView({
      code: "AI_TEMPORARILY_UNAVAILABLE",
    });

    expect(view.title).toBe("AI Insight sedang tidak tersedia");
    expect(view.message).toBe("Progress, kuis, dan simulasi tetap dapat digunakan.");
  });

  it("uses a distinct message for timeout or network failures", () => {
    const view = getLearningInsightErrorView({ code: "AI_TIMEOUT" });

    expect(view.title).toBe("Koneksi AI Insight terganggu");
    expect(view.message).toContain("terlalu lama");
  });
});

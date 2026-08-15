import { describe, expect, it } from "vitest";
import { AiServiceError } from "./aiProvider";
import { parseLearningInsightOutput } from "./aiStructuredOutput";

describe("Learning Insight structured output", () => {
  const validInsight = {
    summary: "Kemajuan belajar stabil.",
    strongTopics: [{ topic: "MFA", reason: "Skor kuis menunjukkan pemahaman yang baik." }],
    improvementTopics: [{ topic: "Phishing", reason: "Deteksi tautan masih perlu dilatih." }],
    recommendations: [
      {
        type: "simulation",
        id: "phishing-email",
        title: "Deteksi Phishing",
        reason: "Latihan ini memperkuat identifikasi tanda bahaya.",
      },
    ],
    studyTip: "Ulangi simulasi singkat setelah mempelajari materi.",
    confidence: "medium",
  } as const;

  function expectInsightError(action: () => unknown, code: string) {
    try {
      action();
      throw new Error("Expected parser to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(AiServiceError);
      expect(error).toMatchObject({ code });
    }
  }

  it("accepts valid JSON", () => {
    expect(parseLearningInsightOutput(JSON.stringify(validInsight))).toEqual(validInsight);
  });

  it("accepts valid JSON surrounded by whitespace", () => {
    expect(parseLearningInsightOutput(` \n ${JSON.stringify(validInsight)} \n `)).toEqual(validInsight);
  });

  it("removes a complete json Markdown fence", () => {
    expect(parseLearningInsightOutput(`\`\`\`json\n${JSON.stringify(validInsight)}\n\`\`\``)).toEqual(validInsight);
  });

  it("removes a complete plain Markdown fence", () => {
    expect(parseLearningInsightOutput(`\`\`\`\n${JSON.stringify(validInsight)}\n\`\`\``)).toEqual(validInsight);
  });

  it("returns a dedicated empty-response error", () => {
    expectInsightError(() => parseLearningInsightOutput(" \n "), "AI_INSIGHT_EMPTY_RESPONSE");
  });

  it("rejects invalid JSON syntax without exposing the raw response", () => {
    expectInsightError(() => parseLearningInsightOutput("not-json-sensitive-content"), "AI_INSIGHT_INVALID_FORMAT");
  });

  it("rejects a missing required field", () => {
    const { summary: _summary, ...missingSummary } = validInsight;
    expectInsightError(
      () => parseLearningInsightOutput(JSON.stringify(missingSummary)),
      "AI_INSIGHT_SCHEMA_VALIDATION_FAILED"
    );
  });

  it("rejects a score field with a string because score is not part of the existing contract", () => {
    expectInsightError(
      () =>
        parseLearningInsightOutput(
          JSON.stringify({ ...validInsight, securityReadinessScore: "80" })
        ),
      "AI_INSIGHT_SCHEMA_VALIDATION_FAILED"
    );
  });

  it("rejects an array field changed into a string", () => {
    expectInsightError(
      () => parseLearningInsightOutput(JSON.stringify({ ...validInsight, strongTopics: "MFA" })),
      "AI_INSIGHT_SCHEMA_VALIDATION_FAILED"
    );
  });

  it("detects structurally truncated JSON", () => {
    const truncated = JSON.stringify(validInsight).slice(0, -12);
    expectInsightError(() => parseLearningInsightOutput(truncated), "AI_INSIGHT_TRUNCATED");
  });

  it("does not extract JSON aggressively from surrounding prose", () => {
    expectInsightError(
      () => parseLearningInsightOutput(`Pembuka ${JSON.stringify(validInsight)} Penutup`),
      "AI_INSIGHT_INVALID_FORMAT"
    );
  });
});

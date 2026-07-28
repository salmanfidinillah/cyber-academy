import { describe, expect, it } from "vitest";
import { parseStructuredOutput, tutorResponseSchema } from "./aiStructuredOutput";

describe("Structured AI output", () => {
  const valid = {
    answer: "Gunakan MFA dan passphrase unik.",
    summary: "Amankan akun dengan lapisan tambahan.",
    suggestedQuestions: ["Apa itu MFA?"],
    safetyStatus: "safe",
    requiresOfficialHelp: false,
  };

  it("parses a valid response without changing the frontend contract", () => {
    expect(parseStructuredOutput(JSON.stringify(valid), tutorResponseSchema)).toEqual(valid);
  });

  it("locally repairs a markdown fence and a safely missing boolean", () => {
    const { requiresOfficialHelp: _omitted, ...repairable } = valid;
    const result = parseStructuredOutput(`\`\`\`json\n${JSON.stringify(repairable)}\n\`\`\``, tutorResponseSchema);
    expect(result.requiresOfficialHelp).toBe(false);
  });

  it("rejects invalid JSON and wrong field types", () => {
    expect(() => parseStructuredOutput("{invalid", tutorResponseSchema)).toThrow(/JSON/);
    expect(() =>
      parseStructuredOutput(JSON.stringify({ ...valid, suggestedQuestions: 42 }), tutorResponseSchema)
    ).toThrow(/Struktur/);
  });

  it("rejects empty output", () => {
    expect(() => parseStructuredOutput("   ", tutorResponseSchema)).toThrow(/kosong/);
  });
});


import { z } from "zod";
import { AiServiceError } from "./aiProvider";

const topicSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(300),
}).strict();

export const learningInsightSchema = z.object({
  summary: z.string().trim().min(1).max(300),
  strongTopics: z.array(topicSchema).max(2),
  improvementTopics: z.array(topicSchema).max(2),
  recommendations: z
    .array(
      z.object({
        type: z.enum(["lesson", "quiz", "simulation"]),
        id: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(200),
        reason: z.string().trim().min(1).max(300),
      }).strict()
    )
    .max(2),
  studyTip: z.string().trim().min(1).max(200),
  confidence: z.enum(["high", "medium", "low"]),
}).strict();

export interface StructuredOutputDiagnostics {
  responseLength: number;
  hasMarkdownFence: boolean;
}

function inspectStructuredOutput(value: string): StructuredOutputDiagnostics {
  const trimmed = value.trim();
  return {
    responseLength: value.length,
    hasMarkdownFence: /^```(?:json)?(?:\s|$)/i.test(trimmed),
  };
}

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function looksLikeTruncatedJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;

  const expectedClosers: string[] = [];
  let inString = false;
  let escaped = false;

  for (const character of trimmed) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
    } else if (character === "{") {
      expectedClosers.push("}");
    } else if (character === "[") {
      expectedClosers.push("]");
    } else if (character === "}" || character === "]") {
      if (expectedClosers.at(-1) !== character) return false;
      expectedClosers.pop();
    }
  }

  return inString || expectedClosers.length > 0;
}

export function parseLearningInsightOutput(text: string): z.infer<typeof learningInsightSchema> {
  const diagnostics = inspectStructuredOutput(text);
  if (!text.trim()) {
    throw new AiServiceError(
      "Insight belum dapat diproses karena respons AI kosong.",
      "AI_INSIGHT_EMPTY_RESPONSE",
      502,
      true,
      { safeMetadata: diagnostics }
    );
  }

  const normalized = stripMarkdownFence(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch (error) {
    const truncated = looksLikeTruncatedJson(normalized);
    throw new AiServiceError(
      truncated
        ? "Insight belum dapat diproses karena respons AI terpotong."
        : "Insight belum dapat diproses karena respons AI belum sesuai format.",
      truncated ? "AI_INSIGHT_TRUNCATED" : "AI_INSIGHT_INVALID_FORMAT",
      502,
      truncated,
      { cause: error, safeMetadata: diagnostics }
    );
  }

  const validated = learningInsightSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AiServiceError(
      "Insight belum dapat diproses karena struktur respons AI belum sesuai.",
      "AI_INSIGHT_SCHEMA_VALIDATION_FAILED",
      502,
      false,
      {
        cause: validated.error,
        safeMetadata: {
          ...diagnostics,
          validationIssueCount: validated.error.issues.length,
        },
      }
    );
  }
  return validated.data;
}

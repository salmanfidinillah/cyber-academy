import { z } from "zod";
import { AiServiceError } from "./aiProvider";

export const tutorResponseSchema = z.object({
  answer: z.string().trim().min(1).max(20_000),
  summary: z.string().trim().min(1).max(1_000),
  suggestedQuestions: z.array(z.string().trim().min(1).max(300)).max(4),
  safetyStatus: z.enum(["safe", "caution", "blocked_and_redirected", "insufficient_context"]),
  requiresOfficialHelp: z.boolean(),
  warningMsg: z.string().trim().max(1_000).optional(),
});

const topicSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(300),
});

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
      })
    )
    .max(2),
  studyTip: z.string().trim().min(1).max(200),
  confidence: z.enum(["high", "medium", "low"]),
});

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function localRepair(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const object = { ...(value as Record<string, unknown>) };
  if (object.requiresOfficialHelp === undefined && typeof object.answer === "string") {
    object.requiresOfficialHelp = false;
  }
  if (typeof object.suggestedQuestions === "string") {
    object.suggestedQuestions = [object.suggestedQuestions];
  }
  return object;
}

export function parseStructuredOutput<T>(text: string, schema: z.ZodType<T>): T {
  if (!text.trim()) {
    throw new AiServiceError("Model mengembalikan respons kosong.", "AI_INVALID_RESPONSE", 502, false);
  }

  let normalized = stripMarkdownFence(text);
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    normalized = normalized.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch (error) {
    throw new AiServiceError("Model mengembalikan JSON yang tidak valid.", "AI_INVALID_RESPONSE", 502, false, {
      cause: error,
    });
  }

  const validated = schema.safeParse(localRepair(parsed));
  if (!validated.success) {
    throw new AiServiceError("Struktur respons model tidak valid.", "AI_INVALID_RESPONSE", 502, false, {
      cause: validated.error,
    });
  }
  return validated.data;
}


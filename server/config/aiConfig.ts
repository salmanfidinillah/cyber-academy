import { z } from "zod";

export const AI_PROVIDER_VALUES = ["vertex", "gemini-api"] as const;
export type AiProviderName = (typeof AI_PROVIDER_VALUES)[number];

export interface AiConfig {
  provider: AiProviderName;
  project?: string;
  location: string;
  model: string;
  apiKey?: string;
  requestTimeoutMs: number;
  maxInputChars: number;
  maxHistoryMessages: number;
  maxOutputTokens: number;
  maxRetries: number;
}

export interface AiConfigState {
  configured: boolean;
  config?: AiConfig;
  errors: string[];
}

export function getAiHealthStatus(state: AiConfigState) {
  return {
    provider: state.config?.provider || "unavailable",
    configured: state.configured,
  };
}

const positiveInt = (name: string, fallback: number, minimum: number, maximum: number) =>
  z.coerce
    .number({ error: `${name} harus berupa angka.` })
    .int(`${name} harus berupa bilangan bulat.`)
    .min(minimum, `${name} minimal ${minimum}.`)
    .max(maximum, `${name} maksimal ${maximum}.`)
    .catch(fallback);

const providerSchema = z.enum(AI_PROVIDER_VALUES, {
  error: `AI_PROVIDER hanya menerima: ${AI_PROVIDER_VALUES.join(", ")}.`,
});

function parseStrictPositiveInt(
  raw: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
  errors: string[]
): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const result = positiveInt(name, fallback, minimum, maximum).safeParse(raw);
  if (!result.success) {
    errors.push(result.error.issues[0]?.message || `${name} tidak valid.`);
    return fallback;
  }

  const numeric = Number(raw);
  if (!Number.isInteger(numeric) || numeric < minimum || numeric > maximum) {
    errors.push(`${name} harus berupa bilangan bulat antara ${minimum} dan ${maximum}.`);
    return fallback;
  }
  return result.data;
}

export function loadAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfigState {
  const errors: string[] = [];
  const providerResult = providerSchema.safeParse(env.AI_PROVIDER?.trim() || "vertex");
  if (!providerResult.success) {
    return {
      configured: false,
      errors: [providerResult.error.issues[0]?.message || "AI_PROVIDER tidak valid."],
    };
  }

  const provider = providerResult.data;
  const project = env.GOOGLE_CLOUD_PROJECT?.trim() || undefined;
  const location = env.GOOGLE_CLOUD_LOCATION?.trim() || "global";
  const model = env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const apiKey = env.GEMINI_API_KEY?.trim() || undefined;

  if (provider === "vertex" && !project) {
    errors.push("GOOGLE_CLOUD_PROJECT wajib diisi ketika AI_PROVIDER=vertex.");
  }
  if (provider === "gemini-api" && !apiKey) {
    errors.push("GEMINI_API_KEY wajib diisi ketika AI_PROVIDER=gemini-api.");
  }
  if (!/^[a-z0-9][a-z0-9-]{3,62}$/i.test(location)) {
    errors.push("GOOGLE_CLOUD_LOCATION tidak valid.");
  }
  if (!/^[A-Za-z0-9._:/-]{3,200}$/.test(model)) {
    errors.push("GEMINI_MODEL tidak valid.");
  }

  const requestTimeoutMs = parseStrictPositiveInt(
    env.AI_REQUEST_TIMEOUT_MS,
    "AI_REQUEST_TIMEOUT_MS",
    25_000,
    1_000,
    120_000,
    errors
  );
  const maxInputChars = parseStrictPositiveInt(
    env.AI_MAX_INPUT_CHARS,
    "AI_MAX_INPUT_CHARS",
    4_000,
    200,
    20_000,
    errors
  );
  const maxHistoryMessages = parseStrictPositiveInt(
    env.AI_MAX_HISTORY_MESSAGES,
    "AI_MAX_HISTORY_MESSAGES",
    12,
    0,
    50,
    errors
  );
  const maxOutputTokens = parseStrictPositiveInt(
    env.AI_MAX_OUTPUT_TOKENS,
    "AI_MAX_OUTPUT_TOKENS",
    800,
    64,
    8_192,
    errors
  );
  const maxRetries = parseStrictPositiveInt(
    env.AI_MAX_RETRIES,
    "AI_MAX_RETRIES",
    2,
    0,
    2,
    errors
  );

  return {
    configured: errors.length === 0,
    errors,
    config: {
      provider,
      project,
      location,
      model,
      apiKey,
      requestTimeoutMs,
      maxInputChars,
      maxHistoryMessages,
      maxOutputTokens,
      maxRetries,
    },
  };
}

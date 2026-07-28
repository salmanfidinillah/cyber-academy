import { GoogleGenAI } from "@google/genai";
import { AiConfig, AiConfigState } from "../config/aiConfig";

export interface AiGenerateRequest {
  contents: string;
  systemInstruction: string;
  temperature: number;
  responseSchema: Record<string, unknown>;
}

export interface AiProvider {
  generateContent(request: AiGenerateRequest): Promise<string>;
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly retryable: boolean,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "AiServiceError";
  }
}

type Sleep = (ms: number) => Promise<void>;
type Random = () => number;

function statusFromError(error: any): number | undefined {
  const raw = error?.status ?? error?.statusCode ?? error?.response?.status;
  const numeric = typeof raw === "string" ? Number(raw) : raw;
  return Number.isInteger(numeric) ? numeric : undefined;
}

export function isRetryableAiError(error: unknown): boolean {
  if (error instanceof AiServiceError) return error.retryable;
  const anyError = error as any;
  const status = statusFromError(anyError);
  if (status !== undefined) return [429, 500, 502, 503, 504].includes(status);

  const code = String(anyError?.code || "").toUpperCase();
  if (["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"].includes(code)) {
    return true;
  }

  const message = String(anyError?.message || "").toLowerCase();
  return [
    "network reset",
    "fetch failed",
    "temporarily unavailable",
    "temporary capacity",
    "resource exhausted",
    "deadline exceeded",
    "timed out",
    "timeout",
  ].some((fragment) => message.includes(fragment));
}

function publicErrorFrom(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;
  const status = statusFromError(error as any);
  const retryable = isRetryableAiError(error);
  if (status === 401) {
    return new AiServiceError("Autentikasi Vertex AI gagal.", "AI_AUTHENTICATION_FAILED", 503, false, { cause: error });
  }
  if (status === 403) {
    return new AiServiceError("Izin service account untuk Vertex AI ditolak.", "AI_PERMISSION_DENIED", 503, false, {
      cause: error,
    });
  }
  if (status === 404) {
    return new AiServiceError("Model atau lokasi Vertex AI tidak ditemukan.", "AI_MODEL_NOT_FOUND", 503, false, {
      cause: error,
    });
  }
  return new AiServiceError(
    "AI Tutor sedang sibuk atau sementara tidak tersedia. Materi, kuis, dan simulasi tetap dapat digunakan. Silakan coba kembali beberapa saat lagi.",
    retryable ? "AI_TEMPORARILY_UNAVAILABLE" : "AI_PROVIDER_ERROR",
    503,
    retryable,
    { cause: error }
  );
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new AiServiceError("Permintaan AI melewati batas waktu.", "AI_TIMEOUT", 503, true));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export async function generateWithRetry(
  provider: AiProvider,
  request: AiGenerateRequest,
  config: Pick<AiConfig, "requestTimeoutMs" | "maxRetries">,
  dependencies: { sleep?: Sleep; random?: Random } = {}
): Promise<string> {
  const sleep = dependencies.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = dependencies.random || Math.random;
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      return await withTimeout(provider.generateContent(request), config.requestTimeoutMs);
    } catch (error) {
      lastError = error;
      if (!isRetryableAiError(error) || attempt >= config.maxRetries) break;
      const baseDelay = 600 * 2 ** attempt;
      const jitter = Math.floor(random() * 400);
      await sleep(baseDelay + jitter);
    }
  }

  throw publicErrorFrom(lastError);
}

export function createAiProvider(configState: AiConfigState): AiProvider | null {
  if (!configState.configured || !configState.config) return null;
  const config = configState.config;
  const sharedOptions = {
    httpOptions: {
      timeout: config.requestTimeoutMs,
      retryOptions: { attempts: 1 },
      headers: { "User-Agent": "cyber-academy-ai" },
    },
  };

  const client =
    config.provider === "vertex"
      ? new GoogleGenAI({
          vertexai: true,
          project: config.project,
          location: config.location,
          apiVersion: "v1",
          ...sharedOptions,
        })
      : new GoogleGenAI({
          apiKey: config.apiKey,
          ...sharedOptions,
        });

  return {
    async generateContent(request) {
      const response = await client.models.generateContent({
        model: config.model,
        contents: request.contents,
        config: {
          systemInstruction: request.systemInstruction,
          temperature: request.temperature,
          maxOutputTokens: config.maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: request.responseSchema,
        },
      });
      return response.text || "";
    },
  };
}


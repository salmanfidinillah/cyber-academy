export interface LearningInsightErrorView {
  title: string;
  message: string;
}

const FORMAT_ERROR_CODES = new Set([
  "AI_INSIGHT_EMPTY_RESPONSE",
  "AI_INSIGHT_INVALID_FORMAT",
  "AI_INSIGHT_SCHEMA_VALIDATION_FAILED",
  "AI_INSIGHT_TRUNCATED",
]);

const UNAVAILABLE_ERROR_CODES = new Set([
  "AI_NOT_CONFIGURED",
  "AI_AUTHENTICATION_FAILED",
  "AI_PERMISSION_DENIED",
  "AI_MODEL_NOT_FOUND",
  "AI_TEMPORARILY_UNAVAILABLE",
  "AI_PROVIDER_ERROR",
  "AI_INSIGHT_INTERNAL_ERROR",
]);

export function getLearningInsightErrorView(error: unknown): LearningInsightErrorView {
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const fallbackMessage =
    typeof candidate?.message === "string" && candidate.message.trim()
      ? candidate.message.trim()
      : "Silakan coba kembali beberapa saat lagi.";

  if (FORMAT_ERROR_CODES.has(code)) {
    return {
      title: "Insight belum dapat diproses",
      message: "Respons AI belum sesuai format yang diperlukan. Silakan coba kembali beberapa saat lagi.",
    };
  }
  if (code === "AI_INSIGHT_SAFETY_REJECTED") {
    return {
      title: "Insight tidak dapat dibuat",
      message: "AI tidak dapat membuat insight untuk data ini karena kebijakan keamanan.",
    };
  }
  if (code === "AI_TIMEOUT" || code === "AI_INSIGHT_NETWORK_ERROR") {
    return {
      title: "Koneksi AI Insight terganggu",
      message: "Layanan AI membutuhkan waktu terlalu lama untuk merespons. Silakan coba kembali beberapa saat lagi.",
    };
  }
  if (UNAVAILABLE_ERROR_CODES.has(code)) {
    return {
      title: "AI Insight sedang tidak tersedia",
      message: "Progress, kuis, dan simulasi tetap dapat digunakan.",
    };
  }
  return {
    title: "Insight belum dapat diproses",
    message: fallbackMessage,
  };
}

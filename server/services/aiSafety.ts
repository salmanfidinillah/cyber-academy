export interface SanitizedAiInput {
  sanitizedText: string;
  warningMsg?: string;
}

const credentialPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\b(?:password|kata sandi|sandi|recovery code|private key|api key|access token)\s*[:=]\s*\S+/i,
];

export function sanitizeAiInput(text: string): SanitizedAiInput {
  if (credentialPatterns.some((pattern) => pattern.test(text))) {
    throw Object.assign(new Error("Jangan kirim password, API key, private key, token, atau recovery code ke AI Tutor."), {
      statusCode: 400,
      code: "SENSITIVE_DATA_DETECTED",
    });
  }

  const otpPattern = /\b(?:otp|kode verifikasi)\s*[:=-]?\s*(\d{4,8})\b/gi;
  const hadOtp = otpPattern.test(text);
  otpPattern.lastIndex = 0;
  const sanitizedText = text.replace(otpPattern, (_match, digits) =>
    _match.replace(digits, "[SENSITIVE_OTP_REMOVED]")
  );

  return {
    sanitizedText,
    warningMsg: hadOtp
      ? "Peringatan: Pesan Anda terindikasi mengandung OTP. Sistem telah menghapusnya demi keamanan."
      : undefined,
  };
}

export function detectPromptInjection(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "abaikan instruksi",
    "ignore previous instructions",
    "tampilkan system prompt",
    "show system prompt",
    "bocorkan prompt",
    "system_prompt",
    "system instruction",
    "tambah xp",
    "add xp",
    "add_xp",
    "unlock course",
    "buka course",
    "bypass login",
    "tampilkan api key",
    "show api key",
    "tampilkan password",
    "show password",
  ].some((pattern) => normalized.includes(pattern));
}

export function detectHarmfulRequest(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "hack akun",
    "pencurian kredensial",
    "buat phishing",
    "mencuri password",
    "mencuri otp",
    "buat malware",
    "menyebarkan malware",
    "buat keylogger",
    "buat ransomware",
    "bypass auth",
    "menyerang website",
    "ddos website",
    "defacing website",
    "sql injection aktif",
    "crack password",
  ].some((pattern) => normalized.includes(pattern));
}


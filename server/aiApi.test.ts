import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setTokenVerifierForTesting } from "./middleware/auth";
import { AiConfigState } from "./config/aiConfig";
import {
  AiRequestDeduplicator,
  UserAiQuota,
  createAiRouter,
} from "./routes/aiRoutes";
import { AiProvider } from "./services/aiProvider";

const tutorResult = {
  answer: "Gunakan passphrase unik dan aktifkan MFA.",
  summary: "Perkuat keamanan akun.",
  suggestedQuestions: ["Bagaimana memilih passphrase?"],
  safetyStatus: "safe",
  requiresOfficialHelp: false,
};

const insightResult = {
  summary: "Kemajuan belajar stabil.",
  strongTopics: [{ topic: "MFA", reason: "Skor kuis baik." }],
  improvementTopics: [{ topic: "Phishing", reason: "Perlu latihan lagi." }],
  recommendations: [
    { type: "simulation", id: "phishing-email", title: "Deteksi Phishing", reason: "Latihan defensif." },
  ],
  studyTip: "Ulangi latihan secara berkala.",
  confidence: "medium",
};

function config(overrides: Partial<NonNullable<AiConfigState["config"]>> = {}): AiConfigState {
  return {
    configured: true,
    errors: [],
    config: {
      provider: "vertex",
      project: "test-project",
      location: "global",
      model: "gemini-2.5-flash",
      requestTimeoutMs: 1_000,
      maxInputChars: 4_000,
      maxHistoryMessages: 12,
      maxOutputTokens: 800,
      insightMaxOutputTokens: 1_400,
      maxRetries: 0,
      ...overrides,
    },
  };
}

function createApp(
  provider: AiProvider,
  options: {
    configState?: AiConfigState;
    messageLoader?: (uid: string, conversationId: string) => Promise<Array<Record<string, any>>>;
    deduplicator?: AiRequestDeduplicator;
  } = {}
) {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/ai",
    createAiRouter({
      configState: options.configState || config(),
      provider,
      messageLoader: options.messageLoader,
      quota: new UserAiQuota(),
      deduplicator: options.deduplicator,
    })
  );
  app.get("/api/non-ai", (_req, res) => res.json({ ok: true }));
  return app;
}

const authHeader = { Authorization: "Bearer valid-token" };

describe("Vertex AI API contract", () => {
  beforeEach(() => {
    setTokenVerifierForTesting({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "user-1", email: "user@example.com" } as any),
    });
  });

  it("returns 401 without a Firebase token", async () => {
    const provider = { generateContent: vi.fn() };
    const response = await request(createApp(provider)).post("/api/ai/tutor").send({ message: "Apa itu MFA?" });
    expect(response.status).toBe(401);
    expect(provider.generateContent).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid or empty payload", async () => {
    const provider = { generateContent: vi.fn() };
    const response = await request(createApp(provider))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: " " });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("AI_INVALID_REQUEST");
  });

  it("returns 413 when the question exceeds the configured limit", async () => {
    const provider = { generateContent: vi.fn() };
    const response = await request(createApp(provider, { configState: config({ maxInputChars: 10 }) }))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Pertanyaan ini terlalu panjang" });
    expect(response.status).toBe(413);
    expect(provider.generateContent).not.toHaveBeenCalled();
  });

  it("returns a validated Tutor response with the existing frontend shape", async () => {
    const provider = { generateContent: vi.fn().mockResolvedValue(JSON.stringify(tutorResult)) };
    const response = await request(createApp(provider))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Bagaimana mengamankan akun?", contextType: "general" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(tutorResult);
  });

  it("returns a structured error and does not accept invalid model JSON", async () => {
    const provider = { generateContent: vi.fn().mockResolvedValue("not-json") };
    const response = await request(createApp(provider))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Apa itu phishing?" });
    expect(response.status).toBe(502);
    expect(response.body.code).toBe("AI_INVALID_RESPONSE");
  });

  it("limits Firestore history before sending it to the provider", async () => {
    const provider = { generateContent: vi.fn().mockResolvedValue(JSON.stringify(tutorResult)) };
    const history = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: `history-${index}`,
    }));
    const response = await request(
      createApp(provider, {
        configState: config({ maxHistoryMessages: 2 }),
        messageLoader: vi.fn().mockResolvedValue(history),
      })
    )
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({
        message: "Lanjutkan penjelasannya.",
        conversationId: "conversation-1",
      });
    expect(response.status).toBe(200);
    const prompt = (provider.generateContent as any).mock.calls[0][0].contents;
    expect(prompt).toContain("history-18");
    expect(prompt).toContain("history-19");
    expect(prompt).not.toContain("history-17");
  });

  it("does not expose a conversation owned by another user", async () => {
    const provider = { generateContent: vi.fn() };
    const foreignError = Object.assign(new Error("Percakapan tidak ditemukan."), { statusCode: 404 });
    const response = await request(
      createApp(provider, { messageLoader: vi.fn().mockRejectedValue(foreignError) })
    )
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Halo", conversationId: "foreign-conversation" });
    expect(response.status).toBe(404);
    expect(provider.generateContent).not.toHaveBeenCalled();
  });

  it("rejects credentials and sanitizes a fake OTP before the provider call", async () => {
    const provider = { generateContent: vi.fn().mockResolvedValue(JSON.stringify(tutorResult)) };
    const credentialResponse = await request(createApp(provider))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "password: rahasia123" });
    expect(credentialResponse.status).toBe(400);
    expect(credentialResponse.body.code).toBe("SENSITIVE_DATA_DETECTED");

    const otpResponse = await request(createApp(provider))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "OTP: 123456, apa yang harus saya lakukan?" });
    expect(otpResponse.status).toBe(200);
    const prompt = (provider.generateContent as any).mock.calls.at(-1)[0].contents;
    expect(prompt).toContain("[SENSITIVE_OTP_REMOVED]");
    expect(prompt).not.toContain("123456");
    expect(otpResponse.body.warningMsg).toContain("OTP");
  });

  it("deduplicates concurrent requests with the same requestId", async () => {
    let resolveProvider!: (value: string) => void;
    const providerPromise = new Promise<string>((resolve) => {
      resolveProvider = resolve;
    });
    const provider = { generateContent: vi.fn(() => providerPromise) };
    const app = createApp(provider, { deduplicator: new AiRequestDeduplicator() });
    const payload = {
      message: "Apa itu MFA?",
      requestId: "8d86d02c-0728-4cd0-b779-4f3b2e456999",
    };
    const first = request(app).post("/api/ai/tutor").set(authHeader).send(payload);
    const second = request(app).post("/api/ai/tutor").set(authHeader).send(payload);
    await new Promise((resolve) => setTimeout(resolve, 10));
    resolveProvider(JSON.stringify(tutorResult));
    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(provider.generateContent).toHaveBeenCalledTimes(1);
  });

  it("keeps the learning-insight success contract on the new provider", async () => {
    const provider = { generateContent: vi.fn().mockResolvedValue(JSON.stringify(insightResult)) };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(insightResult);
  });

  it("uses the dedicated Learning Insight token limit without changing the Tutor limit", async () => {
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: JSON.stringify(insightResult),
      finishReason: "STOP",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(
      createApp(provider, {
        configState: config({ maxOutputTokens: 500, insightMaxOutputTokens: 1_400 }),
      })
    )
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(200);
    expect(generateStructuredContent.mock.calls[0][0].maxOutputTokens).toBe(1_400);
  });

  it("detects MAX_TOKENS before JSON parsing and retries only once", async () => {
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: '{"summary":"terpotong"',
      finishReason: "MAX_TOKENS",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "AI_INSIGHT_TRUNCATED" },
    });
    expect(generateStructuredContent).toHaveBeenCalledTimes(2);
  });

  it("retries an empty Insight response once and returns a dedicated error", async () => {
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: " ",
      finishReason: "STOP",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 0,
        quizScores: [],
        simulationResults: [],
        overallProgress: 0,
      });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("AI_INSIGHT_EMPTY_RESPONSE");
    expect(generateStructuredContent).toHaveBeenCalledTimes(2);
  });

  it("does not retry an Insight schema validation error", async () => {
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({ ...insightResult, strongTopics: "MFA" }),
      finishReason: "STOP",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("AI_INSIGHT_SCHEMA_VALIDATION_FAILED");
    expect(generateStructuredContent).toHaveBeenCalledTimes(1);
  });

  it("returns a dedicated safety rejection without retrying", async () => {
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: "",
      finishReason: "SAFETY",
      blockReason: "SAFETY",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("AI_INSIGHT_SAFETY_REJECTED");
    expect(generateStructuredContent).toHaveBeenCalledTimes(1);
  });

  it("returns a structured timeout without using the global provider retries", async () => {
    const generateStructuredContent = vi.fn(() => new Promise<never>(() => {}));
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(
      createApp(provider, { configState: config({ requestTimeoutMs: 5, maxRetries: 2 }) })
    )
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("AI_TIMEOUT");
    expect(generateStructuredContent).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent valid Insight requests with the same requestId", async () => {
    let resolveProvider!: (value: {
      text: string;
      finishReason: string;
      model: string;
    }) => void;
    const providerPromise = new Promise<{
      text: string;
      finishReason: string;
      model: string;
    }>((resolve) => {
      resolveProvider = resolve;
    });
    const generateStructuredContent = vi.fn(() => providerPromise);
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const app = createApp(provider, { deduplicator: new AiRequestDeduplicator() });
    const payload = {
      completedLessonsCount: 3,
      quizScores: [],
      simulationResults: [],
      overallProgress: 25,
      requestId: "3df49630-df9e-4a3e-93d9-b53aaf1f06dd",
    };
    const first = request(app).post("/api/ai/insight").set(authHeader).send(payload);
    const second = request(app).post("/api/ai/insight").set(authHeader).send(payload);
    await new Promise((resolve) => setTimeout(resolve, 10));
    resolveProvider({
      text: JSON.stringify(insightResult),
      finishReason: "STOP",
      model: "gemini-2.5-flash",
    });
    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(generateStructuredContent).toHaveBeenCalledTimes(1);
  });

  it("logs only safe Insight metadata for an invalid response", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const rawResponse = "private-model-output-that-must-not-be-logged";
    const generateStructuredContent = vi.fn().mockResolvedValue({
      text: rawResponse,
      finishReason: "STOP",
      model: "gemini-2.5-flash",
    });
    const provider = { generateContent: vi.fn(), generateStructuredContent };
    const response = await request(createApp(provider))
      .post("/api/ai/insight")
      .set(authHeader)
      .send({
        completedLessonsCount: 3,
        quizScores: [],
        simulationResults: [],
        overallProgress: 25,
      });

    expect(response.status).toBe(502);
    const logged = consoleError.mock.calls.flat().join(" ");
    expect(logged).toContain("AI_INSIGHT_INVALID_FORMAT");
    expect(logged).toContain('"finishReason":"STOP"');
    expect(logged).toContain(`"responseLength":${rawResponse.length}`);
    expect(logged).not.toContain(rawResponse);
    consoleError.mockRestore();
  });

  it("returns 503 when AI is unavailable while non-AI endpoints still work", async () => {
    const provider = { generateContent: vi.fn().mockRejectedValue(Object.assign(new Error("down"), { status: 503 })) };
    const app = createApp(provider);
    const aiResponse = await request(app)
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Apa itu phishing?" });
    const nonAiResponse = await request(app).get("/api/non-ai");
    expect(aiResponse.status).toBe(503);
    expect(aiResponse.body.error).toContain("sementara tidak tersedia");
    expect(nonAiResponse.status).toBe(200);
    expect(nonAiResponse.body).toEqual({ ok: true });
  });

  it("returns 503 for invalid AI configuration instead of crashing the app", async () => {
    const unavailable: AiConfigState = {
      configured: false,
      errors: ["GOOGLE_CLOUD_PROJECT wajib diisi."],
      config: config().config,
    };
    const provider = { generateContent: vi.fn() };
    const response = await request(createApp(provider, { configState: unavailable }))
      .post("/api/ai/tutor")
      .set(authHeader)
      .send({ message: "Apa itu MFA?" });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("AI_NOT_CONFIGURED");
    expect(provider.generateContent).not.toHaveBeenCalled();
  });
});

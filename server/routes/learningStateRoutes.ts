import { Router, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticateUser } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  getUserProgress,
  getUserXpTransactions,
  completeLesson,
  resetLearningState,
} from "../services/learningStateService";

const router = Router();

// Rate limiters for mutations
const completeLessonLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 completions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan penyelesaian materi. Silakan coba sesaat lagi." },
});

const resetProgressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 resets per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan reset progres. Silakan coba sesaat lagi." },
});

// Strict empty body schema for complete lesson endpoint
const completeLessonBodySchema = z.object({}).strict();

// Schema for reset endpoint
const resetBodySchema = z.object({
  confirmation: z.literal("RESET_MY_PROGRESS", {
    message: "Konfirmasi reset tidak sesuai.",
  }),
}).strict();

// GET /api/me/progress
router.get("/progress", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.authUser!.uid;
    const progress = await getUserProgress(uid);
    res.json({ progress });
  } catch (error: any) {
    console.error("GET /api/me/progress error:", error);
    res.status(error.statusCode || 500).json({
      error: error.message || "Gagal mengambil data progress.",
    });
  }
});

// GET /api/me/xp-transactions
router.get("/xp-transactions", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.authUser!.uid;

    const limitQuery = req.query.limit;
    let limitNum = 20; // default

    if (limitQuery !== undefined) {
      const parsed = Number(limitQuery);
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
        res.status(400).json({ error: "Limit harus berupa integer antara 1 dan 50." });
        return;
      }
      limitNum = parsed;
    }

    const cursor = req.query.cursor ? (req.query.cursor as string) : undefined;
    if (cursor !== undefined) {
      if (
        typeof cursor !== "string" ||
        cursor.trim() === "" ||
        cursor.length > 256 ||
        cursor.includes("/") ||
        cursor.includes("\\") ||
        cursor.includes("..")
      ) {
        res.status(400).json({ error: "Cursor tidak valid atau mengandung karakter tidak aman." });
        return;
      }
    }

    const result = await getUserXpTransactions(uid, limitNum, cursor);
    res.json(result);
  } catch (error: any) {
    console.error("GET /api/me/xp-transactions error:", error);
    res.status(error.statusCode || 500).json({
      error: error.message || "Gagal mengambil data transaksi XP.",
    });
  }
});

// POST /api/me/lessons/:lessonId/complete
router.post(
  "/lessons/:lessonId/complete",
  authenticateUser,
  completeLessonLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.authUser!.uid;
      const lessonId = req.params.lessonId;

      // 4. Validasi lessonId
      if (
        typeof lessonId !== "string" ||
        lessonId.trim() === "" ||
        lessonId.length > 128 ||
        !/^[a-zA-Z0-9_\-]+$/.test(lessonId)
      ) {
        res.status(400).json({
          error: "ID materi pelajaran tidak valid atau mengandung karakter tidak aman.",
        });
        return;
      }

      // 2. Hanya plain object kosong {} yang diterima. Tolak segalanya yang lain.
      let body = req.body;
      if (body === undefined) {
        body = {};
      }
      const isPlainObject = typeof body === "object" && body !== null && !Array.isArray(body);
      if (!isPlainObject || Object.keys(body).length > 0) {
        res.status(400).json({
          error: "Body request harus berupa objek kosong yang valid ({}). Kunci tambahan tidak diizinkan.",
        });
        return;
      }

      const result = await completeLesson(uid, lessonId);
      res.json(result);
    } catch (error: any) {
      console.error(`POST /api/me/lessons/${req.params.lessonId}/complete error:`, error);
      const status = error.statusCode || 500;
      res.status(status).json({
        error: error.message || "Gagal menyelesaikan materi.",
      });
    }
  }
);

// POST /api/me/learning-state/reset
router.post(
  "/learning-state/reset",
  authenticateUser,
  resetProgressLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.authUser!.uid;
      const parseResult = resetBodySchema.safeParse(req.body || {});
      if (!parseResult.success) {
        res.status(400).json({
          error: "Konfirmasi reset tidak sesuai.",
        });
        return;
      }

      const result = await resetLearningState(uid, parseResult.data.confirmation as string);
      res.json(result);
    } catch (error: any) {
      console.error("POST /api/me/learning-state/reset error:", error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Gagal mereset progres belajar.",
      });
    }
  }
);

export default router;

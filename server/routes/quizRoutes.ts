import { Router, Response } from "express";
import rateLimit from "express-rate-limit";
import { authenticateUser, requireAdmin } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { QuizSubmissionSchema, QuizCreateSchema, QuizUpdateSchema, QuestionCreateSchema, QuestionUpdateSchema } from "../validation/quizSchemas";
import {
  getPublishedQuizForCourse,
  getPublishedQuestionsForQuiz,
  submitQuizAttempt,
  getQuizAttemptById,
  getUserQuizAttempts,
  getQuizSummary,
  getAdminQuizzes,
  getAdminQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAdminQuestions,
  getAdminQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../services/quizService";
import { ApiError } from "../services/contentService";

const router = Router();

const quizSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak pengiriman kuis. Silakan coba beberapa saat lagi." },
});

function handleQuizError(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error("Quiz API Error:", error);
  res.status(500).json({ error: "Terjadi kesalahan internal pada server kuis." });
}

// ==============================================================
// PUBLIC / USER QUIZ ENDPOINTS (/api/quizzes)
// ==============================================================

router.get("/quizzes/course/:courseId", async (req, res) => {
  try {
    const quiz = await getPublishedQuizForCourse(req.params.courseId);
    if (!quiz) {
      res.status(404).json({ error: "Kuis tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(quiz);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/quizzes/:quizId/questions", async (req, res) => {
  try {
    const questions = await getPublishedQuestionsForQuiz(req.params.quizId);
    if (questions.length === 0) {
      res.status(404).json({ error: "Soal kuis tidak ditemukan." });
      return;
    }
    res.json(questions);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.post("/quizzes/:quizId/attempts", authenticateUser, quizSubmissionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = QuizSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Format jawaban tidak valid", details: parsed.error.issues });
      return;
    }

    const result = await submitQuizAttempt(req.authUser!.uid, req.params.quizId, parsed.data.answers);
    res.json(result);
  } catch (error) {
    handleQuizError(res, error);
  }
});

// ==============================================================
// USER ATTEMPT & SUMMARY ENDPOINTS (/api/me/quiz-attempts & summaries)
// ==============================================================

router.get("/me/quiz-attempts", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quizId = req.query.quizId as string | undefined;
    const attempts = await getUserQuizAttempts(req.authUser!.uid, quizId);
    res.json(attempts);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/me/quiz-attempts/:attemptId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attempt = await getQuizAttemptById(req.authUser!.uid, req.params.attemptId);
    if (!attempt) {
      res.status(404).json({ error: "Attempt kuis tidak ditemukan atau akses ditolak." });
      return;
    }
    res.json(attempt);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/me/quiz-summaries/:quizId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getQuizSummary(req.authUser!.uid, req.params.quizId);
    res.json(summary);
  } catch (error) {
    handleQuizError(res, error);
  }
});

// ==============================================================
// ADMIN QUIZ & QUESTION CRUD ENDPOINTS (/api/admin/quizzes & questions)
// ==============================================================

router.get("/admin/quizzes", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const status = req.query.status as string | undefined;
    const quizzes = await getAdminQuizzes({ courseId, status });
    res.json({ items: quizzes });
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/admin/quizzes/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quiz = await getAdminQuizById(req.params.id);
    if (!quiz) {
      res.status(404).json({ error: "Kuis admin tidak ditemukan." });
      return;
    }
    res.json(quiz);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.post("/admin/quizzes", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = QuizCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const created = await createQuiz(req.authUser!.uid, parsed.data);
    res.status(201).json(created);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.patch("/admin/quizzes/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = QuizUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const updated = await updateQuiz(req.authUser!.uid, req.params.id, parsed.data);
    res.json(updated);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.delete("/admin/quizzes/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteQuiz(req.authUser!.uid, req.params.id);
    res.json(result);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/admin/questions", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quizId = req.query.quizId as string | undefined;
    const questions = await getAdminQuestions(quizId);
    res.json({ items: questions });
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.get("/admin/questions/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await getAdminQuestionById(req.params.id);
    if (!q) {
      res.status(404).json({ error: "Pertanyaan tidak ditemukan." });
      return;
    }
    res.json(q);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.post("/admin/questions", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = QuestionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const created = await createQuestion(req.authUser!.uid, parsed.data);
    res.status(201).json(created);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.patch("/admin/questions/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = QuestionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const updated = await updateQuestion(req.authUser!.uid, req.params.id, parsed.data);
    res.json(updated);
  } catch (error) {
    handleQuizError(res, error);
  }
});

router.delete("/admin/questions/:id", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteQuestion(req.authUser!.uid, req.params.id);
    res.json(result);
  } catch (error) {
    handleQuizError(res, error);
  }
});

export default router;

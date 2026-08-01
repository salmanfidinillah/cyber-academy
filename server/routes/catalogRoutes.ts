import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  getCatalogLearningPaths,
  getCatalogLearningPathById,
  getCatalogCoursesForPath,
  getCatalogCourseById,
  getCatalogCourseBySlug,
  getCatalogLessonsForCourse,
  getCatalogLessonById,
  getCatalogLessonByCourseAndLessonSlug,
} from "../services/contentService";

const router = Router();

export const catalogRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan katalog. Silakan coba beberapa saat lagi." },
});

router.use(catalogRateLimiter);

router.get("/learning-paths", async (_req: Request, res: Response) => {
  try {
    const items = await getCatalogLearningPaths();
    res.json(items);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil catalog learning paths." });
  }
});

router.get("/learning-paths/:id", async (req: Request, res: Response) => {
  try {
    const item = await getCatalogLearningPathById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Learning path tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil data learning path." });
  }
});

router.get("/learning-paths/:id/courses", async (req: Request, res: Response) => {
  try {
    const items = await getCatalogCoursesForPath(req.params.id);
    res.json(items);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil daftar course untuk learning path ini." });
  }
});

router.get("/course-by-slug/:slug", async (req: Request, res: Response) => {
  try {
    const item = await getCatalogCourseBySlug(req.params.slug);
    if (!item) {
      res.status(404).json({ error: "Course tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil data course berdasarkan slug." });
  }
});

router.get("/courses/:id", async (req: Request, res: Response) => {
  try {
    const item = await getCatalogCourseById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Course tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil data course." });
  }
});

router.get("/courses/:courseId/lessons", async (req: Request, res: Response) => {
  try {
    const items = await getCatalogLessonsForCourse(req.params.courseId);
    res.json(items);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil daftar lesson untuk course ini." });
  }
});

router.get("/courses/by-slug/:courseSlug/lessons/:lessonSlug", async (req: Request, res: Response) => {
  try {
    const item = await getCatalogLessonByCourseAndLessonSlug(req.params.courseSlug, req.params.lessonSlug);
    if (!item) {
      res.status(404).json({ error: "Lesson tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil data lesson berdasarkan slug." });
  }
});

router.get("/lesson-by-slug/:slug", async (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Endpoint global /lesson-by-slug/:slug telah didepresiasi. Gunakan /courses/by-slug/:courseSlug/lessons/:lessonSlug.",
  });
});

router.get("/lessons/:id", async (req: Request, res: Response) => {
  try {
    const item = await getCatalogLessonById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Lesson tidak ditemukan atau belum dipublikasikan." });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Catalog API Error:", error);
    res.status(500).json({ error: "Gagal mengambil data lesson." });
  }
});

export default router;

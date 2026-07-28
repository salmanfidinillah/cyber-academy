import { Router, Response } from "express";
import { authenticateUser, requireAdmin } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  LearningPathCreateSchema,
  LearningPathUpdateSchema,
  CourseCreateSchema,
  CourseUpdateSchema,
  LessonCreateSchema,
  LessonUpdateSchema,
} from "../validation/contentSchemas";
import {
  ApiError,
  getAdminLearningPaths,
  getLearningPathById,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  getAdminCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../services/contentService";

const router = Router();

// Middleware: authenticateUser + requireAdmin for all /api/admin content routes
router.use(authenticateUser, requireAdmin);

// Helper for error responses
function handleError(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error("Admin Content API Error:", error);
  res.status(500).json({ error: "Terjadi kesalahan internal pada server." });
}

// -------------------------------------------------------------
// LEARNING PATHS
// -------------------------------------------------------------

router.get("/learning-paths", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const limit = limitParam && !isNaN(limitParam) ? limitParam : undefined;

    const result = await getAdminLearningPaths({ status, search, limit, cursor });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/learning-paths/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await getLearningPathById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Learning path tidak ditemukan." });
      return;
    }
    res.json(item);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/learning-paths", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = LearningPathCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const created = await createLearningPath(req.authUser!.uid, parsed.data);
    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
});

router.patch("/learning-paths/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Payload update tidak boleh kosong." });
      return;
    }
    const parsed = LearningPathUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const updated = await updateLearningPath(req.authUser!.uid, req.params.id, parsed.data);
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/learning-paths/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteLearningPath(req.authUser!.uid, req.params.id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// -------------------------------------------------------------
// COURSES
// -------------------------------------------------------------

router.get("/courses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const learningPathId = req.query.learningPathId as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const limit = limitParam && !isNaN(limitParam) ? limitParam : undefined;

    const result = await getAdminCourses({ learningPathId, status, search, limit, cursor });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/courses/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await getCourseById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Course tidak ditemukan." });
      return;
    }
    res.json(item);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/courses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CourseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const created = await createCourse(req.authUser!.uid, parsed.data);
    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
});

router.patch("/courses/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Payload update tidak boleh kosong." });
      return;
    }
    const parsed = CourseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const updated = await updateCourse(req.authUser!.uid, req.params.id, parsed.data);
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/courses/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteCourse(req.authUser!.uid, req.params.id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// -------------------------------------------------------------
// LESSONS
// -------------------------------------------------------------

router.get("/lessons", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const limit = limitParam && !isNaN(limitParam) ? limitParam : undefined;

    const result = await getAdminLessons({ courseId, status, search, limit, cursor });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/lessons/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await getLessonById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Lesson tidak ditemukan." });
      return;
    }
    res.json(item);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/lessons", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = LessonCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const created = await createLesson(req.authUser!.uid, parsed.data);
    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
});

router.patch("/lessons/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Payload update tidak boleh kosong." });
      return;
    }
    const parsed = LessonUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validasi gagal", details: parsed.error.issues });
      return;
    }
    const updated = await updateLesson(req.authUser!.uid, req.params.id, parsed.data);
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/lessons/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteLesson(req.authUser!.uid, req.params.id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

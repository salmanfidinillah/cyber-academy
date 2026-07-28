import { Router, Response } from "express";
import { z } from "zod";
import { authenticateUser } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { createConversation, deleteConversation, listConversations, listMessages, saveExchange } from "../services/aiHistoryService";

const router = Router();
const id = z.string().trim().regex(/^[A-Za-z0-9_-]{1,128}$/);
function fail(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Data percakapan tidak valid.", details: error.flatten() });
    return;
  }
  res.status(error?.statusCode || 500).json({ error: error?.message || "Terjadi kesalahan internal." });
}

router.use(authenticateUser);
router.get("/conversations", async (req: AuthenticatedRequest, res) => {
  try { res.json(await listConversations(req.authUser!.uid)); } catch (error) { fail(res, error); }
});
router.post("/conversations", async (req: AuthenticatedRequest, res) => {
  try {
    const payload = z.object({
      contextType: z.enum(["general", "lesson", "remedial", "simulation"]),
      title: z.string().trim().min(2).max(120),
      learningPathId: id.optional(),
      courseId: id.optional(),
      lessonId: id.optional(),
    }).strict().parse(req.body);
    res.status(201).json(await createConversation(req.authUser!.uid, payload));
  } catch (error) { fail(res, error); }
});
router.delete("/conversations/:conversationId", async (req: AuthenticatedRequest, res) => {
  try {
    await deleteConversation(req.authUser!.uid, id.parse(req.params.conversationId));
    res.status(204).send();
  } catch (error) { fail(res, error); }
});
router.get("/conversations/:conversationId/messages", async (req: AuthenticatedRequest, res) => {
  try { res.json(await listMessages(req.authUser!.uid, id.parse(req.params.conversationId))); } catch (error) { fail(res, error); }
});
router.post("/conversations/:conversationId/exchanges", async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = id.parse(req.params.conversationId);
    const payload = z.object({
      userContent: z.string().trim().min(1).max(4000),
      assistantContent: z.string().min(1).max(20000),
      safetyStatus: z.enum(["safe", "caution", "blocked_and_redirected", "insufficient_context"]),
      requestId: z.string().uuid().optional(),
    }).strict().parse(req.body);
    await saveExchange(
      req.authUser!.uid,
      conversationId,
      payload.userContent,
      payload.assistantContent,
      payload.safetyStatus,
      payload.requestId
    );
    res.status(201).json({ success: true });
  } catch (error) { fail(res, error); }
});
export default router;

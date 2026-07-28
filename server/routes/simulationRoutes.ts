import { Router, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authenticateUser, requireAdmin } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  checkSimulationAnswer,
  listSimulationAttempts,
  listSimulations,
  submitSimulation,
  updateSimulation,
} from "../services/simulationService";

const router = Router();
const id = z.string().trim().regex(/^[A-Za-z0-9_-]{1,100}$/);
const submitLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
const legacySubmission = z.object({
  classification: z.enum(["Aman", "Mencurigakan", "Phishing"]),
  selectedIndicators: z.array(z.string().trim().min(2).max(100)).min(1).max(10),
}).strict();
const modernSubmission = z.object({
  answers: z.record(id, id).refine((value) => Object.keys(value).length >= 1 && Object.keys(value).length <= 30),
  elapsedSeconds: z.number().int().min(0).max(86_400).optional(),
}).strict();
const answerCheck = z.object({
  scenarioId: id,
  actionId: id,
}).strict();

function fail(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Data simulasi tidak valid.", details: error.flatten() });
    return;
  }
  res.status(error?.statusCode || 500).json({ error: error?.message || "Terjadi kesalahan internal." });
}

router.get("/simulations", async (_req, res) => {
  try { res.json(await listSimulations(false)); } catch (error) { fail(res, error); }
});

router.get("/me/simulation-attempts", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const simulationId = req.query.simulationId ? id.parse(req.query.simulationId) : undefined;
    res.json(await listSimulationAttempts(req.authUser!.uid, simulationId));
  } catch (error) { fail(res, error); }
});

router.post("/simulations/:simulationId/check", submitLimiter, authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const simulationId = id.parse(req.params.simulationId);
    const payload = answerCheck.parse(req.body);
    res.json(checkSimulationAnswer(simulationId, payload.scenarioId, payload.actionId));
  } catch (error) { fail(res, error); }
});

router.post("/simulations/:simulationId/attempts", submitLimiter, authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const simulationId = id.parse(req.params.simulationId);
    const payload = z.union([modernSubmission, legacySubmission]).parse(req.body);
    const result = "answers" in payload
      ? await submitSimulation(req.authUser!.uid, simulationId, payload.answers, payload.elapsedSeconds || 0)
      : await submitSimulation(req.authUser!.uid, simulationId, payload.classification, payload.selectedIndicators);
    res.status(201).json(result);
  } catch (error) { fail(res, error); }
});

router.get("/admin/simulations", authenticateUser, requireAdmin, async (_req, res) => {
  try { res.json(await listSimulations(true)); } catch (error) { fail(res, error); }
});

router.patch("/admin/simulations/:simulationId", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const simulationId = id.parse(req.params.simulationId);
    const payload = z.object({
      title: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().min(2).max(500).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      xpReward: z.number().int().min(0).max(500).optional(),
      passingScore: z.number().int().min(0).max(100).optional(),
    }).strict().refine((value) => Object.keys(value).length > 0).parse(req.body);
    res.json(await updateSimulation(req.authUser!.uid, simulationId, payload));
  } catch (error) { fail(res, error); }
});

export default router;

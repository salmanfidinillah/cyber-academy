import { Router, Response } from "express";
import { z } from "zod";
import { authenticateUser, requireAdmin } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { getAdminDashboardStats, listAuditLogs, listUsers, updateUserAccess } from "../services/adminUserService";

const router = Router();
const uidSchema = z.string().trim().min(1).max(128);

function fail(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Data pengguna tidak valid.", details: error.flatten() });
    return;
  }
  res.status(error?.statusCode || 500).json({ error: error?.message || "Terjadi kesalahan internal." });
}

router.use(authenticateUser, requireAdmin);

router.get("/users", async (req, res) => {
  try {
    const limit = z.coerce.number().int().min(1).max(500).default(100).parse(req.query.limit);
    res.json(await listUsers(limit));
  } catch (error) { fail(res, error); }
});

router.patch("/users/:uid", async (req: AuthenticatedRequest, res) => {
  try {
    const uid = uidSchema.parse(req.params.uid);
    const payload = z.object({
      role: z.enum(["user", "admin"]).optional(),
      accountStatus: z.enum(["active", "disabled"]).optional(),
    }).strict().refine((value) => Object.keys(value).length > 0).parse(req.body);
    res.json(await updateUserAccess(req.authUser!.uid, uid, payload));
  } catch (error) { fail(res, error); }
});

router.get("/audit-logs", async (req, res) => {
  try {
    const limit = z.coerce.number().int().min(1).max(100).default(50).parse(req.query.limit);
    res.json(await listAuditLogs(limit));
  } catch (error) { fail(res, error); }
});

router.get("/stats", async (_req, res) => {
  try { res.json(await getAdminDashboardStats()); } catch (error) { fail(res, error); }
});

export default router;

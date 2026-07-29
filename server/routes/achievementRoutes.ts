import { Router, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authenticateUser, requireAdmin } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  evaluateUserBadgeState,
  findCertificateByCode,
  generateCertificate,
  getCertificateEligibility,
  getUserBadgeProgress,
  listAllCertificates,
  listBadges,
  listUserBadges,
  listUserCertificates,
  setCertificateStatus,
  updateBadge,
} from "../services/achievementService";

const router = Router();
const idSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,120}$/);
const certificateSchema = z.object({
  learningPathId: idSchema,
  recipientName: z.string().trim().min(2).max(100).optional(),
}).strict();
const certificateCodeSchema = z.string().trim().toUpperCase().regex(/^CYBER-\d{4}-[A-Z0-9]{6}$/);
const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan verifikasi. Silakan coba beberapa saat lagi." },
});

function sendError(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Data permintaan tidak valid.", details: error.flatten() });
    return;
  }
  res.status(error?.statusCode || 500).json({ error: error?.message || "Terjadi kesalahan internal." });
}

router.get("/badges", async (_req, res) => {
  try {
    res.json(await listBadges(false));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/certificates/verify/:certificateCode", publicVerifyLimiter, async (req, res) => {
  try {
    const code = certificateCodeSchema.parse(req.params.certificateCode);
    const certificate: any = await findCertificateByCode(code);
    if (!certificate) {
      res.status(404).json({ error: "Sertifikat tidak ditemukan atau kode tidak valid." });
      return;
    }
    if (certificate.status !== "active") {
      res.status(410).json({
        error: "Sertifikat tidak berlaku.",
        status: "revoked",
        certificateCode: certificate.certificateCode,
      });
      return;
    }
    res.json({
      success: true,
      status: "Sertifikat Valid",
      recipientName: certificate.recipientName,
      learningPathTitle: certificate.learningPathTitle,
      issuedAt: certificate.issuedAt,
      certificateCode: certificate.certificateCode,
      issuer: "Cyber Academy AI",
      certStatus: certificate.status,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/badges", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await listUserBadges(req.authUser!.uid));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/badges/progress", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await getUserBadgeProgress(req.authUser!.uid));
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/me/badges/evaluate", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (Object.keys(req.body || {}).length > 0) {
      res.status(400).json({ error: "Endpoint ini tidak menerima data progress dari client." });
      return;
    }
    const state = await evaluateUserBadgeState(req.authUser!.uid);
    res.json({ success: true, ...state });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/certificates", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await listUserCertificates(req.authUser!.uid));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/certificates/eligibility/:learningPathId", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const learningPathId = idSchema.parse(req.params.learningPathId);
    res.json(await getCertificateEligibility(req.authUser!.uid, learningPathId));
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/me/certificates", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = certificateSchema.parse(req.body);
    res.status(201).json({
      success: true,
      certificate: await generateCertificate(req.authUser!.uid, payload.learningPathId, payload.recipientName),
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/admin/badges", authenticateUser, requireAdmin, async (_req, res) => {
  try {
    res.json(await listBadges(true));
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/admin/badges/:badgeId", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const badgeId = idSchema.parse(req.params.badgeId);
    const payload = z.object({
      title: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().min(2).max(500).optional(),
      status: z.enum(["active", "inactive"]).optional(),
      order: z.number().int().min(1).max(999).optional(),
    }).strict().refine((value) => Object.keys(value).length > 0).parse(req.body);
    res.json(await updateBadge(req.authUser!.uid, badgeId, payload));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/admin/certificates", authenticateUser, requireAdmin, async (_req, res) => {
  try {
    res.json(await listAllCertificates());
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/admin/certificates/:certificateId/status", authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const certificateId = idSchema.parse(req.params.certificateId);
    const { status } = z.object({ status: z.enum(["active", "revoked"]) }).strict().parse(req.body);
    res.json(await setCertificateStatus(req.authUser!.uid, certificateId, status));
  } catch (error) {
    sendError(res, error);
  }
});

export default router;

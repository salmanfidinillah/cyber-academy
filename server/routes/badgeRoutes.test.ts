import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const serviceMocks = vi.hoisted(() => ({
  listBadges: vi.fn(),
  listUserBadges: vi.fn(),
  getUserBadgeProgress: vi.fn(),
  evaluateUserBadgeState: vi.fn(),
  updateBadge: vi.fn(),
}));

vi.mock("../services/achievementService", () => ({
  ...serviceMocks,
  findCertificateByCode: vi.fn(),
  generateCertificate: vi.fn(),
  getCertificateEligibility: vi.fn(),
  listAllCertificates: vi.fn().mockResolvedValue([]),
  listUserCertificates: vi.fn().mockResolvedValue([]),
  setCertificateStatus: vi.fn(),
}));

import achievementRoutes from "./achievementRoutes";
import { setTokenVerifierForTesting } from "../middleware/auth";

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use("/api", achievementRoutes);
  return instance;
}

function token(admin = false, uid = "user-a") {
  setTokenVerifierForTesting({
    verifyIdToken: async () => ({ uid, admin } as any),
  });
}

describe("badge API authorization and response contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTokenVerifierForTesting(null);
    serviceMocks.listBadges.mockResolvedValue([
      { badgeId: "badge-cyber-defender" },
      { badgeId: "badge-intermediate-defender" },
      { badgeId: "badge-advanced-specialist" },
      { badgeId: "badge-simulation-analyst" },
    ]);
    serviceMocks.listUserBadges.mockResolvedValue([]);
    serviceMocks.getUserBadgeProgress.mockResolvedValue([]);
    serviceMocks.evaluateUserBadgeState.mockResolvedValue({
      userBadges: [],
      progress: [],
    });
  });

  it("1. public badge catalog returns the four active definitions", async () => {
    const response = await request(app()).get("/api/badges");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(serviceMocks.listBadges).toHaveBeenCalledWith(false);
  });

  it("2. unauthenticated user badge request is rejected", async () => {
    const response = await request(app()).get("/api/me/badges");
    expect(response.status).toBe(401);
  });

  it("3. unauthenticated badge progress request is rejected", async () => {
    const response = await request(app()).get("/api/me/badges/progress");
    expect(response.status).toBe(401);
  });

  it("4. private badge endpoint uses only the UID from the verified token", async () => {
    token(false, "verified-user");
    const response = await request(app())
      .get("/api/me/badges")
      .set("authorization", "Bearer valid-token");
    expect(response.status).toBe(200);
    expect(serviceMocks.listUserBadges).toHaveBeenCalledWith("verified-user");
  });

  it("5. progress endpoint uses only the UID from the verified token", async () => {
    token(false, "verified-user");
    const response = await request(app())
      .get("/api/me/badges/progress")
      .set("authorization", "Bearer valid-token");
    expect(response.status).toBe(200);
    expect(serviceMocks.getUserBadgeProgress).toHaveBeenCalledWith("verified-user");
  });

  it("6. fake client progress data is rejected before evaluation", async () => {
    token(false, "verified-user");
    const response = await request(app())
      .post("/api/me/badges/evaluate")
      .set("authorization", "Bearer valid-token")
      .send({ userId: "victim", completedPaths: ["advanced-path"] });
    expect(response.status).toBe(400);
    expect(serviceMocks.evaluateUserBadgeState).not.toHaveBeenCalled();
  });

  it("7. empty evaluation body preserves the existing response and adds progress", async () => {
    token(false, "verified-user");
    const response = await request(app())
      .post("/api/me/badges/evaluate")
      .set("authorization", "Bearer valid-token")
      .send({});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      userBadges: [],
      progress: [],
    });
    expect(serviceMocks.evaluateUserBadgeState).toHaveBeenCalledWith("verified-user");
  });

  it("8. non-admin cannot access admin badge records", async () => {
    token(false);
    const response = await request(app())
      .get("/api/admin/badges")
      .set("authorization", "Bearer valid-token");
    expect(response.status).toBe(403);
  });

  it("9. admin can read active and legacy badge records", async () => {
    token(true, "admin-user");
    const response = await request(app())
      .get("/api/admin/badges")
      .set("authorization", "Bearer valid-token");
    expect(response.status).toBe(200);
    expect(serviceMocks.listBadges).toHaveBeenCalledWith(true);
  });

  it("10. admin cannot submit a duplicate or changed slug through the update endpoint", async () => {
    token(true, "admin-user");
    const response = await request(app())
      .patch("/api/admin/badges/badge-cyber-defender")
      .set("authorization", "Bearer valid-token")
      .send({ slug: "intermediate-master" });
    expect(response.status).toBe(400);
    expect(serviceMocks.updateBadge).not.toHaveBeenCalled();
  });
});

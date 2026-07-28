import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response } from "express";
import { authenticateUser, requireAdmin, setTokenVerifierForTesting } from "./auth";
import { AuthenticatedRequest } from "../types";

function createMockRes() {
  const res: Partial<Response> = {};
  res.status = function (code: number) {
    (this as any).statusCode = code;
    return this as any;
  };
  res.json = function (data: any) {
    (this as any).jsonData = data;
    return this as any;
  };
  return res as Response & { statusCode?: number; jsonData?: any };
}

describe("Authentication & Authorization Middleware", () => {
  beforeEach(() => {
    setTokenVerifierForTesting(null);
  });

  it("returns 401 if Authorization header is missing", async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(res.statusCode).toBe(401);
    expect(res.jsonData?.error).toBeDefined();
    expect(nextCalled).toBe(false);
  });

  it("returns 401 for malformed Bearer header (extra args, wrong scheme, empty token)", async () => {
    const malformedHeaders = [
      "Bearer",
      "Bearer ",
      "Basic some_base64_token",
      "Bearer token1 token2",
      "Token xyz",
    ];

    for (const header of malformedHeaders) {
      const req = { headers: { authorization: header } } as AuthenticatedRequest;
      const res = createMockRes();
      let nextCalled = false;

      await authenticateUser(req, res, () => {
        nextCalled = true;
      });

      expect(res.statusCode).toBe(401);
      expect(nextCalled).toBe(false);
    }
  });

  it("returns 401 for fake Bearer UID or invalid format token", async () => {
    const req = { headers: { authorization: "Bearer fake-uid-123" } } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    setTokenVerifierForTesting({
      verifyIdToken: async () => {
        throw new Error("Decoding Firebase ID token failed");
      },
    });

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(res.statusCode).toBe(401);
    expect(res.jsonData?.error).toBeDefined();
    expect(nextCalled).toBe(false);
  });

  it("returns 401 for invalid/expired/revoked Firebase token", async () => {
    const req = { headers: { authorization: "Bearer expired_token" } } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    setTokenVerifierForTesting({
      verifyIdToken: async () => {
        throw new Error("Firebase ID token has expired");
      },
    });

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  it("calls verifyIdToken with checkRevoked = true", async () => {
    const req = { headers: { authorization: "Bearer valid_token" } } as AuthenticatedRequest;
    const res = createMockRes();
    const mockVerify = vi.fn().mockResolvedValue({
      uid: "user_123",
      email: "user@example.com",
    });

    setTokenVerifierForTesting({
      verifyIdToken: mockVerify,
    });

    await authenticateUser(req, res, () => {});

    expect(mockVerify).toHaveBeenCalledWith("valid_token", true);
  });

  it("extracts UID from decoded token, ignoring spoofed body UID", async () => {
    const req = {
      headers: { authorization: "Bearer valid_user_token" },
      body: { userId: "attacker_spoofed_uid" },
    } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    setTokenVerifierForTesting({
      verifyIdToken: async () => ({
        uid: "real_user_uid_123",
        email: "user@example.com",
        admin: false,
      } as any),
    });

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.authUser).toBeDefined();
    expect(req.authUser?.uid).toBe("real_user_uid_123");
    expect(req.authUser?.admin).toBe(false);
    expect(req.authUser?.uid).not.toBe(req.body.userId);
  });

  it("does NOT grant admin access when token has role: 'admin' but NOT admin: true", async () => {
    const req = {
      headers: { authorization: "Bearer token_with_role_only" },
    } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    setTokenVerifierForTesting({
      verifyIdToken: async () => ({
        uid: "user_role_admin",
        email: "user@example.com",
        role: "admin", // Claim role = admin but admin != true
      } as any),
    });

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.authUser?.admin).toBe(false);
  });

  it("grants admin access when token has admin: true", async () => {
    const req = {
      headers: { authorization: "Bearer admin_token" },
    } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    setTokenVerifierForTesting({
      verifyIdToken: async () => ({
        uid: "admin_uid_789",
        email: "admin@example.com",
        admin: true,
      } as any),
    });

    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.authUser?.admin).toBe(true);
  });

  it("returns 403 when non-admin user accesses admin endpoint via requireAdmin", async () => {
    const req = {
      authUser: {
        uid: "user_456",
        email: "user@example.com",
        admin: false,
        token: {} as any,
      },
    } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    expect(res.statusCode).toBe(403);
    expect(res.jsonData?.error).toBe("Anda tidak memiliki akses.");
    expect(nextCalled).toBe(false);
  });

  it("allows access when valid admin claim is present via requireAdmin", async () => {
    const req = {
      authUser: {
        uid: "admin_789",
        email: "admin@example.com",
        admin: true,
        token: { admin: true } as any,
      },
    } as AuthenticatedRequest;
    const res = createMockRes();
    let nextCalled = false;

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });
});

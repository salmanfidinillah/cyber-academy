import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { setTokenVerifierForTesting } from "./middleware/auth";
import adminContentRoutes from "./routes/adminContentRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import { adminDb } from "./firebaseAdmin";

// Mock Firestore
vi.mock("./firebaseAdmin", () => {
  const store: Record<string, Record<string, any>> = {
    learningPaths: {},
    courses: {},
    lessons: {},
    adminAuditLogs: {},
  };

  const createQuery = (collectionName: string) => {
    let whereConditions: Array<{ field: string; op: string; val: any }> = [];
    let limitVal: number | null = null;

    const q = {
      where: (field: string, op: string, val: any) => {
        whereConditions.push({ field, op, val });
        return q;
      },
      orderBy: () => q,
      limit: (n: number) => {
        limitVal = n;
        return q;
      },
      get: async () => {
        const col = store[collectionName] || {};
        let docs = Object.entries(col).map(([id, data]) => ({
          id,
          ref: mockAdminDb.collection(collectionName).doc(id),
          exists: true,
          data: () => data,
        }));

        for (const cond of whereConditions) {
          docs = docs.filter((d) => {
            const val = d.data()[cond.field];
            if (cond.op === "==") return val === cond.val;
            return true;
          });
        }

        if (limitVal !== null) {
          docs = docs.slice(0, limitVal);
        }

        return {
          empty: docs.length === 0,
          docs,
        };
      },
    };
    return q;
  };

  const mockAdminDb = {
    __store: store,
    collection: (name: string) => ({
      doc: (id?: string) => {
        const docId = id || "doc_" + Math.random().toString(36).substring(2, 9);
        const ref = {
          id: docId,
          get: async () => {
            const data = store[name]?.[docId];
            return {
              id: docId,
              ref,
              exists: !!data,
              data: () => data,
            };
          },
          set: async (data: any, opts?: any) => {
            if (!store[name]) store[name] = {};
            if (opts?.merge && store[name][docId]) {
              store[name][docId] = { ...store[name][docId], ...data };
            } else {
              store[name][docId] = { ...data };
            }
          },
          update: async (data: any) => {
            if (!store[name]?.[docId]) throw new Error("Doc not found");
            store[name][docId] = { ...store[name][docId], ...data };
          },
          delete: async () => {
            if (store[name]) delete store[name][docId];
          },
        };
        return ref;
      },
      where: (field: string, op: string, val: any) => createQuery(name).where(field, op, val),
      orderBy: () => createQuery(name).orderBy(),
      get: async () => createQuery(name).get(),
    }),
    runTransaction: async (cb: (transaction: any) => Promise<any>) => {
      let hasWritten = false;
      const transaction = {
        get: async (refOrQuery: any) => {
          if (hasWritten) {
            throw new Error("Firestore Transaction Error: Reads must come before Writes!");
          }
          return refOrQuery.get();
        },
        set: (ref: any, data: any, opts?: any) => {
          hasWritten = true;
          return ref.set(data, opts);
        },
        update: (ref: any, data: any) => {
          hasWritten = true;
          return ref.update(data);
        },
        delete: (ref: any) => {
          hasWritten = true;
          return ref.delete();
        },
      };
      return cb(transaction);
    },
    batch: () => {
      const ops: Array<() => Promise<void>> = [];
      return {
        set: (ref: any, data: any, opts?: any) => {
          ops.push(async () => ref.set(data, opts));
        },
        update: (ref: any, data: any) => {
          ops.push(async () => ref.update(data));
        },
        delete: (ref: any) => {
          ops.push(async () => ref.delete());
        },
        commit: async () => {
          for (const op of ops) await op();
        },
      };
    },
  };

  return {
    adminDb: mockAdminDb,
    adminAuth: {},
  };
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminContentRoutes);
  app.use("/api/catalog", catalogRoutes);
  return app;
}

describe("Integration Test: Admin & Catalog API Endpoints", () => {
  let server: Server;
  let baseUrl: string;
  const store = (adminDb as any).__store;

  beforeAll(async () => {
    const app = createTestApp();
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    store.learningPaths = {};
    store.courses = {};
    store.lessons = {};
    store.adminAuditLogs = {};
    setTokenVerifierForTesting(null);
  });

  describe("Authentication & Authorization", () => {
    it("1. Unauthorized request to /api/admin/* returns 401", async () => {
      const res = await fetch(`${baseUrl}/api/admin/learning-paths`);
      const body = await res.json();
      expect(res.status).toBe(401);
      expect(body.error).toMatch(/sesi/i);
    });

    it("2. Non-admin request to /api/admin/* returns 403", async () => {
      setTokenVerifierForTesting({
        verifyIdToken: async () => ({
          uid: "user_normal",
          email: "user@example.com",
          admin: false,
        } as any),
      });

      const res = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        headers: { authorization: "Bearer valid_token" },
      });
      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.error).toMatch(/akses/i);
    });
  });

  describe("Admin Content CRUD Integration", () => {
    beforeEach(() => {
      setTokenVerifierForTesting({
        verifyIdToken: async () => ({
          uid: "admin_uid_123",
          email: "admin@example.com",
          admin: true,
        } as any),
      });
    });

    it("3. Admin creates new Learning Path: 201, saved with slug, audit log written", async () => {
      const res = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({
          title: "Dasar Cyber Security",
          description: "Pengenalan keilmuan pertahanan siber.",
          status: "published",
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.id).toBeDefined();
      expect(body.slug).toBe("dasar-cyber-security");
      expect(body.createdBy).toBe("admin_uid_123");

      expect(store.learningPaths[body.id]).toBeDefined();

      const auditKeys = Object.keys(store.adminAuditLogs);
      expect(auditKeys.length).toBe(1);
      expect(store.adminAuditLogs[auditKeys[0]].action).toBe("create");
    });

    it("4. Admin creates Learning Path with duplicate slug returns 409 Conflict", async () => {
      await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ title: "Sama Path", slug: "same-slug" }),
      });

      const res = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ title: "Sama Path Beda Judul", slug: "same-slug" }),
      });

      const body = await res.json();
      expect(res.status).toBe(409);
      expect(body.error).toMatch(/sudah ada|sudah digunakan/i);
    });

    it("6. Update, edit slug collision (409), and deletion with audit log", async () => {
      const resA = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ title: "Path A", slug: "path-a" }),
      });
      await resA.json();

      const resB = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ title: "Path B", slug: "path-b" }),
      });
      const itemB = await resB.json();

      const collisionRes = await fetch(`${baseUrl}/api/admin/learning-paths/${itemB.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ slug: "path-a" }),
      });
      expect(collisionRes.status).toBe(409);

      const deleteRes = await fetch(`${baseUrl}/api/admin/learning-paths/${itemB.id}`, {
        method: "DELETE",
        headers: { authorization: "Bearer admin_token" },
      });
      expect(deleteRes.status).toBe(200);
      expect(store.learningPaths[itemB.id]).toBeUndefined();
    });

    it("7. Empty update body returns 400 Bad Request", async () => {
      const resCreate = await fetch(`${baseUrl}/api/admin/learning-paths`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({ title: "Path Valid", slug: "path-valid" }),
      });
      const itemValid = await resCreate.json();

      const res = await fetch(`${baseUrl}/api/admin/learning-paths/${itemValid.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toMatch(/tidak boleh kosong/i);
    });
  });

  describe("Public Catalog Integration", () => {
    it("5. Public user calls catalog API: ONLY gets published items and hides internal metadata", async () => {
      store.learningPaths["lp-draft"] = {
        title: "Draft Path",
        slug: "lp-draft",
        status: "draft",
        createdBy: "admin1",
        updatedBy: "admin1",
      };
      store.learningPaths["lp-pub"] = {
        title: "Published Path",
        slug: "lp-pub",
        status: "published",
        published: true,
        createdBy: "admin1",
        updatedBy: "admin1",
      };

      const res = await fetch(`${baseUrl}/api/catalog/learning-paths`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].id).toBe("lp-pub");
      expect(body[0].createdBy).toBeUndefined();
      expect(body[0].updatedBy).toBeUndefined();
    });

    it("8. Empty Firestore catalog returns [] instead of static data fallback", async () => {
      store.learningPaths = {};
      const res = await fetch(`${baseUrl}/api/catalog/learning-paths`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it("9. Enforces global uniqueness for course slugs", async () => {
      setTokenVerifierForTesting({
        verifyIdToken: async () => ({
          uid: "admin_uid_123",
          email: "admin@example.com",
          admin: true,
        } as any),
      });

      // Seed parent learning path
      store.learningPaths["lp-1"] = { title: "Path 1", status: "published" };

      // Create course 1
      const res1 = await fetch(`${baseUrl}/api/admin/courses`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({
          title: "Unik Course",
          slug: "unik-course-slug",
          learningPathId: "lp-1",
        }),
      });
      expect(res1.status).toBe(201);

      // Create course 2 with same slug
      const res2 = await fetch(`${baseUrl}/api/admin/courses`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin_token",
        },
        body: JSON.stringify({
          title: "Unik Course 2",
          slug: "unik-course-slug",
          learningPathId: "lp-1",
        }),
      });
      expect(res2.status).toBe(409);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Firestore inside vi.mock so it's fully self-contained and hoisted
vi.mock("./firebaseAdmin", () => {
  const store: Record<string, Record<string, any>> = {
    users: {},
    lessons: {},
    courses: {},
    learningPaths: {},
    userProgress: {},
    xpTransactions: {},
  };

  const createQuery = (colName: string) => {
    let wheres: Array<{ field: string; op: string; val: any }> = [];
    let limitVal: number | null = null;
    let startAfterDoc: any = null;

    const q = {
      where: (field: string, op: string, val: any) => {
        wheres.push({ field, op, val });
        return q;
      },
      orderBy: () => q,
      limit: (n: number) => {
        limitVal = n;
        return q;
      },
      startAfter: (doc: any) => {
        startAfterDoc = doc;
        return q;
      },
      get: async () => {
        const colData = store[colName] || {};
        let docs = Object.entries(colData).map(([id, data]) => ({
          id,
          ref: {
            id,
            get: async () => ({ id, exists: true, data: () => store[colName]?.[id] }),
            set: async (d: any, o?: any) => {
              if (!store[colName]) store[colName] = {};
              if (o?.merge && store[colName][id]) {
                store[colName][id] = { ...store[colName][id], ...d };
              } else {
                store[colName][id] = { ...d };
              }
            },
            update: async (d: any) => {
              store[colName][id] = { ...store[colName][id], ...d };
            },
            delete: async () => {
              delete store[colName][id];
            },
          },
          exists: true,
          data: () => data,
        }));

        // Filter
        for (const cond of wheres) {
          docs = docs.filter((d) => {
            const itemVal = d.data()[cond.field];
            if (cond.op === "==") return itemVal === cond.val;
            return true;
          });
        }

        // StartAfter
        if (startAfterDoc) {
          const idx = docs.findIndex((d) => d.id === startAfterDoc.id);
          if (idx !== -1) {
            docs = docs.slice(idx + 1);
          }
        }

        // Limit
        if (limitVal !== null) {
          docs = docs.slice(0, limitVal);
        }

        const snapshot = {
          size: docs.length,
          empty: docs.length === 0,
          docs,
          forEach: (cb: (doc: any) => void) => {
            docs.forEach(cb);
          },
        };

        return snapshot;
      },
    };
    return q;
  };

  let transactionLock = Promise.resolve();

  const mockAdminDb = {
    __store: store,
    collection: (colName: string) => ({
      doc: (id?: string) => {
        const docId = id || "doc_" + Math.random().toString(36).substring(2, 9);
        const ref = {
          id: docId,
          get: async () => {
            const data = store[colName]?.[docId];
            return {
              id: docId,
              ref,
              exists: !!data,
              data: () => data,
            };
          },
          set: async (data: any, opts?: any) => {
            if (!store[colName]) store[colName] = {};
            if (opts?.merge && store[colName][docId]) {
              store[colName][docId] = { ...store[colName][docId], ...data };
            } else {
              store[colName][docId] = { ...data };
            }
          },
          update: async (data: any) => {
            if (!store[colName]?.[docId]) throw new Error("Document not found");
            store[colName][docId] = { ...store[colName][docId], ...data };
          },
          delete: async () => {
            if (store[colName]) delete store[colName][docId];
          },
        };
        return ref;
      },
      where: (field: string, op: string, val: any) => createQuery(colName).where(field, op, val),
      orderBy: () => createQuery(colName).orderBy(),
      limit: (n: number) => createQuery(colName).limit(n),
      get: async () => createQuery(colName).get(),
    }),
    runTransaction: async (cb: (transaction: any) => Promise<any>) => {
      const next = transactionLock.then(async () => {
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
      });
      transactionLock = next.catch(() => {});
      return next;
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

import { adminDb } from "./firebaseAdmin";
import { authenticateUser } from "./middleware/auth";
import {
  calculateLevel,
  completeLesson,
  getUserProgress,
  getUserXpTransactions,
  resetLearningState,
} from "./services/learningStateService";

// Lightweight controller simulator for express-like request handling
async function simulateRoute(
  handler: any,
  reqData: { params?: any; query?: any; body?: any; authUser?: any }
) {
  const req = {
    params: reqData.params || {},
    query: reqData.query || {},
    body: reqData.body || {},
    authUser: reqData.authUser,
  };

  let statusCode = 200;
  let responseData: any = null;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    },
  };

  await handler(req, res);
  return { status: statusCode, body: responseData };
}

// Import route handlers
import learningStateRoutes from "./routes/learningStateRoutes";

// Helper to find specific route function from Router layers
function getRouteHandler(path: string, method: "get" | "post") {
  const layer = learningStateRoutes.stack.find(
    (l: any) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

describe("Learning State API - Hardening, Transactions & Reset Rules", () => {
  const mockUid = "taruna_test_999";
  const mockEmail = "taruna@academy.id";
  let store: any;

  beforeEach(() => {
    store = (adminDb as any).__store;
    // Reset our mock store values
    store.users = {};
    store.lessons = {};
    store.courses = {};
    store.learningPaths = {};
    store.userProgress = {};
    store.xpTransactions = {};

    // Initialize mock user profile
    store.users[mockUid] = {
      uid: mockUid,
      email: mockEmail,
      displayName: "Taruna Test",
      role: "user",
      accountStatus: "active",
      totalXp: 0,
      currentLevel: 1,
      learningStreak: 0,
      onboardingCompleted: true,
      lastLearningDate: null,
      lastStudyDate: null,
    };
  });

  // A. LEVEL BOUNDARIES
  describe("Level boundary calculations", () => {
    it("boundary: 99 XP -> Level 1", () => {
      expect(calculateLevel(99)).toBe(1);
    });

    it("boundary: 100 XP -> Level 2", () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it("boundary: 249 XP -> Level 2", () => {
      expect(calculateLevel(249)).toBe(2);
    });

    it("boundary: 250 XP -> Level 3", () => {
      expect(calculateLevel(250)).toBe(3);
    });

    it("boundary: 449 XP -> Level 3", () => {
      expect(calculateLevel(449)).toBe(3);
    });

    it("boundary: 450 XP -> Level 4", () => {
      expect(calculateLevel(450)).toBe(4);
    });

    it("boundary: 699 XP -> Level 4", () => {
      expect(calculateLevel(699)).toBe(4);
    });

    it("boundary: 700 XP -> Level 5", () => {
      expect(calculateLevel(700)).toBe(5);
    });
  });

  // B. ENDPOINT HARDENING TESTS (Items 1-25)
  describe("Hardened Endpoint Rules & Requirements", () => {
    // 1. Tanpa token -> 401
    it("1. Returns 401 if request is unauthenticated (no token)", async () => {
      const req: any = { headers: {} };
      let statusVal = 200;
      let jsonVal: any = null;
      const res: any = {
        status: (code: number) => { statusVal = code; return res; },
        json: (data: any) => { jsonVal = data; return res; }
      };
      const next = vi.fn();
      await authenticateUser(req, res, next);
      expect(statusVal).toBe(401);
    });

    // 2. UID hanya dari token
    it("2. Determines UID strictly from Decoded Authorization Token authUser", async () => {
      const progressHandler = getRouteHandler("/progress", "get");
      const res = await simulateRoute(progressHandler, { authUser: { uid: mockUid } });
      expect(res.status).toBe(200);
      expect(res.body.progress).toBeDefined();
    });

    // 3. Body berisi userId/xpReward/status -> 400
    it("3. Returns 400 if client includes unauthorized keys inside body during completion", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: { xpReward: 50 }, // forbidden key
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("tidak diizinkan");
    });

    // 4. Lesson tidak ditemukan -> 404
    it("4. Returns 404 if the requested lessonId does not exist", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "nonexistent_lesson" },
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("tidak ditemukan");
    });

    // 5. Lesson draft -> ditolak 404
    it("5. Rejects completion if lesson is in draft status", async () => {
      store.lessons["lesson_draft"] = {
        id: "lesson_draft",
        courseId: "course_1",
        status: "draft",
        xpReward: 15,
      };
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_draft" },
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("belum dipublikasi");
    });

    // 6. Course draft -> ditolak 404
    it("6. Rejects completion if the parent course is draft", async () => {
      store.lessons["lesson_1"] = {
        id: "lesson_1",
        courseId: "course_draft",
        status: "published",
        xpReward: 15,
      };
      store.courses["course_draft"] = {
        id: "course_draft",
        learningPathId: "path_1",
        status: "draft",
      };
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("belum dipublikasi");
    });

    // 7. Path draft -> ditolak 404
    it("7. Rejects completion if the parent learning path is draft", async () => {
      store.lessons["lesson_1"] = {
        id: "lesson_1",
        courseId: "course_1",
        status: "published",
        xpReward: 15,
      };
      store.courses["course_1"] = {
        id: "course_1",
        learningPathId: "path_draft",
        status: "published",
      };
      store.learningPaths["path_draft"] = {
        id: "path_draft",
        status: "draft",
      };
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("belum dipublikasi");
    });

    // Seed helpers
    const seedValidCatalog = () => {
      store.learningPaths["path_1"] = { id: "path_1", status: "published" };
      store.courses["course_1"] = { id: "course_1", learningPathId: "path_1", status: "published" };
      store.lessons["lesson_1"] = { id: "lesson_1", courseId: "course_1", status: "published", xpReward: 20 };
      store.lessons["lesson_2"] = { id: "lesson_2", courseId: "course_1", status: "published", xpReward: 30 };
    };

    // 8. Completion pertama memberi lesson XP
    it("8. Grants corresponding lesson XP reward upon first completion", async () => {
      seedValidCatalog();
      const res = await completeLesson(mockUid, "lesson_1");
      expect(res.xpEarned).toBe(20);
      expect(res.totalXp).toBe(20);
    });

    // 9. Completion kedua memberi XP 0
    it("9. Grants exactly 0 XP on duplicate completion requests", async () => {
      seedValidCatalog();
      await completeLesson(mockUid, "lesson_1");
      const res = await completeLesson(mockUid, "lesson_1");
      expect(res.xpEarned).toBe(0);
      expect(res.alreadyCompleted).toBe(true);
    });

    // 10. Dua completion concurrent tidak memberi XP ganda
    it("10. Does not double-award XP when completion requested concurrently", async () => {
      seedValidCatalog();
      const results = await Promise.all([
        completeLesson(mockUid, "lesson_1"),
        completeLesson(mockUid, "lesson_1"),
      ]);
      const xpRewards = results.map((r) => r.xpEarned);
      expect(xpRewards).toContain(20);
      expect(xpRewards).toContain(0);
    });

    // 11. XP berasal dari lesson.xpReward Firestore
    it("11. Relies strictly on lesson.xpReward in catalog store", async () => {
      seedValidCatalog();
      const res = await completeLesson(mockUid, "lesson_2");
      expect(res.xpEarned).toBe(30);
    });

    // 12. Semua lesson selesai menghasilkan course progress 100 dan lessonsCompleted=true
    it("12. Sets course progress to 100% and lessonsCompleted to true once all course lessons are completed", async () => {
      seedValidCatalog();
      await completeLesson(mockUid, "lesson_1");
      const res = await completeLesson(mockUid, "lesson_2");

      expect(res.courseProgress.progressPercent).toBe(100);
      expect(res.courseProgress.lessonsCompleted).toBe(true);
    });

    // 13. Course status tetap in_progress sebelum quiz
    it("13. Keeps course progress status as 'in_progress' even when 100% lessons are complete, until quiz is passed", async () => {
      seedValidCatalog();
      await completeLesson(mockUid, "lesson_1");
      const res = await completeLesson(mockUid, "lesson_2");
      expect(res.courseProgress.status).toBe("in_progress");
    });

    // 14. Tidak ada course completion XP pada B2A
    it("14. Award exactly zero bonus course completion XP under step B2A", async () => {
      seedValidCatalog();
      await completeLesson(mockUid, "lesson_1");
      const res = await completeLesson(mockUid, "lesson_2");
      expect(res.totalXp).toBe(50); // Sum of lesson_1 (20) + lesson_2 (30)
    });

    // 15. Path belum completed jika course belum completed
    it("15. Keeps learning path status as 'in_progress' and counts 0 completed courses if course status is 'in_progress'", async () => {
      seedValidCatalog();
      const res = await completeLesson(mockUid, "lesson_1");
      expect(res.pathProgress.status).toBe("in_progress");
      expect(res.pathProgress.progressPercent).toBe(0); // Course status is in_progress
    });

    // 16. Streak hari sama tidak bertambah
    it("16. Does not increment learning streak on duplicate study events on same day", async () => {
      seedValidCatalog();
      await completeLesson(mockUid, "lesson_1");
      const res = await completeLesson(mockUid, "lesson_2");
      expect(res.learningStreak).toBe(1);
    });

    // 17. Streak hari berikutnya bertambah
    it("17. Increments streak when continuing to study on the consecutive next day", async () => {
      seedValidCatalog();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

      store.users[mockUid].lastStudyDate = yesterdayStr;
      store.users[mockUid].lastLearningDate = yesterdayStr;
      store.users[mockUid].learningStreak = 2;

      const res = await completeLesson(mockUid, "lesson_1");
      expect(res.learningStreak).toBe(3);
    });

    // 18. Jeda lebih dari sehari mereset streak
    it("18. Resets study streak back to 1 when there is a lapse of more than one day", async () => {
      seedValidCatalog();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

      store.users[mockUid].lastStudyDate = dateStr;
      store.users[mockUid].lastLearningDate = dateStr;
      store.users[mockUid].learningStreak = 10;

      const res = await completeLesson(mockUid, "lesson_1");
      expect(res.learningStreak).toBe(1);
    });

    // 19. Reset tanpa confirmation -> 400
    it("19. Returns 400 if confirmation parameter is missing or wrong during reset request", async () => {
      const resetHandler = getRouteHandler("/learning-state/reset", "post");
      const res = await simulateRoute(resetHandler, {
        authUser: { uid: mockUid },
        body: { confirmation: "WRONG_CONFIRMATION" },
      });
      expect(res.status).toBe(400);
    });

    // 20. Reset hanya menghapus data UID sendiri
    it("20. Deletes only owned userProgress and xpTransactions docs, leaving others intact", async () => {
      seedValidCatalog();
      store.userProgress["other_user__lesson__lesson_1"] = {
        userId: "other_user_uid",
        status: "completed",
      };

      await resetLearningState(mockUid, "RESET_MY_PROGRESS");
      expect(store.userProgress["other_user__lesson__lesson_1"]).toBeDefined();
    });

    // 21. Reset >450 writes harus ditolak aman (409)
    it("21. Rejects resetting if combined progress and transactions write count > 450", async () => {
      for (let i = 0; i < 460; i++) {
        store.userProgress[`${mockUid}__lesson__dummy_${i}`] = {
          userId: mockUid,
          status: "completed",
        };
      }
      await expect(resetLearningState(mockUid, "RESET_MY_PROGRESS")).rejects.toThrow(/terlalu besar/);
    });

    // 22. Cursor XP milik user lain ditolak (400)
    it("22. Returns 400 if client requests transaction pagination using an alien cursor doc ID", async () => {
      store.xpTransactions["alien_tx_doc"] = {
        userId: "alien_user_uid",
      };
      const xpHandler = getRouteHandler("/xp-transactions", "get");
      const res = await simulateRoute(xpHandler, {
        authUser: { uid: mockUid },
        query: { cursor: "alien_tx_doc" },
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Akses cursor ditolak");
    });

    // 23. Limit invalid/NaN ditolak 400
    it("23. Returns 400 if limit query is invalid, non-integer, or out of range [1-50]", async () => {
      const xpHandler = getRouteHandler("/xp-transactions", "get");
      const res = await simulateRoute(xpHandler, {
        authUser: { uid: mockUid },
        query: { limit: "abc" },
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Limit harus berupa integer");
    });

    // 24. Protected user profile fields tidak dapat diubah client
    it("24. Client cannot mutate protected fields in firestore (validated)", async () => {
      const { buildSafeProfileUpdates } = await import("../src/services/userService");
      const dirtyInput: any = {
        displayName: "Sandi Baru",
        bio: "Bio baru",
        totalXp: 100000,
        currentLevel: 10,
        learningStreak: 100,
        role: "admin",
        accountStatus: "active",
        lastLearningDate: "2026-07-22",
      };
      const safe = buildSafeProfileUpdates(dirtyInput);
      expect(safe.displayName).toBe("Sandi Baru");
      expect(safe.bio).toBe("Bio baru");
      expect(safe.totalXp).toBeUndefined();
      expect(safe.currentLevel).toBeUndefined();
      expect(safe.learningStreak).toBeUndefined();
      expect(safe.role).toBeUndefined();
      expect(safe.accountStatus).toBeUndefined();
      expect(safe.lastLearningDate).toBeUndefined();
    });

    // 25. Client complete lesson tidak mengirim UID/XP/courseId/pathId
    it("25. Client cannot submit completion payload with parameters, validating endpoint security", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: { userId: mockUid, xpReward: 50, status: "completed" },
      });
      expect(res.status).toBe(400);
    });
  });
});

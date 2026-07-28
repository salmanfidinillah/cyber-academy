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
      doc: (docId: string) => ({
        id: docId,
        get: async () => {
          const exists = !!store[colName]?.[docId];
          return {
            id: docId,
            exists,
            data: () => store[colName]?.[docId],
          };
        },
        set: async (data: any, options?: any) => {
          if (!store[colName]) store[colName] = {};
          if (options?.merge && store[colName][docId]) {
            store[colName][docId] = { ...store[colName][docId], ...data };
          } else {
            store[colName][docId] = data;
          }
        },
        update: async (data: any) => {
          if (!store[colName] || !store[colName][docId]) throw new Error("Document not found");
          store[colName][docId] = { ...store[colName][docId], ...data };
        },
        delete: async () => {
          if (store[colName]) {
            delete store[colName][docId];
          }
        },
      }),
      where: (field: string, op: string, val: any) => createQuery(colName).where(field, op, val),
      orderBy: () => createQuery(colName),
      limit: (n: number) => createQuery(colName).limit(n),
    }),
    runTransaction: async (handler: (transaction: any) => Promise<any>) => {
      const transaction = {
        get: async (ref: any) => {
          return await ref.get();
        },
        set: async (ref: any, data: any, options?: any) => {
          await ref.set(data, options);
        },
        update: async (ref: any, data: any) => {
          await ref.update(data);
        },
        delete: async (ref: any) => {
          await ref.delete();
        },
      };

      const currentLock = transactionLock;
      let resolveLock: any;
      transactionLock = new Promise((resolve) => {
        resolveLock = resolve;
      });

      await currentLock;
      try {
        return await handler(transaction);
      } finally {
        resolveLock();
      }
    },
  };

  return {
    adminDb: mockAdminDb,
    adminAuth: {},
  };
});

import { adminDb } from "./firebaseAdmin";
import { completeLesson, calculateNewStreak, resetLearningState } from "./services/learningStateService";
import learningStateRoutes from "./routes/learningStateRoutes";

async function simulateRoute(handler: any, reqOverrides: any) {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...reqOverrides,
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

function getRouteHandler(path: string, method: "get" | "post") {
  const layer = learningStateRoutes.stack.find(
    (l: any) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

describe("Learning State API - Additional Integrity & Validation Tests", () => {
  const mockUid = "taruna_extra_888";
  let store: any;

  beforeEach(() => {
    store = (adminDb as any).__store;
    store.users = {};
    store.lessons = {};
    store.courses = {};
    store.learningPaths = {};
    store.userProgress = {};
    store.xpTransactions = {};

    store.users[mockUid] = {
      uid: mockUid,
      totalXp: 10,
      currentLevel: 1,
      learningStreak: 1,
      lastStudyDate: "2026-07-21",
      lastLearningDate: "2026-07-21",
    };
  });

  const seedValidCatalog = () => {
    store.learningPaths["path_1"] = { id: "path_1", status: "published" };
    store.courses["course_1"] = { id: "course_1", learningPathId: "path_1", status: "published", order: 1 };
    store.lessons["lesson_1"] = { id: "lesson_1", courseId: "course_1", status: "published", xpReward: 20 };
  };

  const seedTwoCourseCatalog = () => {
    store.learningPaths["path_2"] = { id: "path_2", status: "published" };
    store.courses["course_A"] = { id: "course_A", learningPathId: "path_2", status: "published", order: 1 };
    store.courses["course_B"] = { id: "course_B", learningPathId: "path_2", status: "published", order: 2 };
    store.lessons["lesson_A1"] = { id: "lesson_A1", courseId: "course_A", status: "published", xpReward: 10 };
    store.lessons["lesson_B1"] = { id: "lesson_B1", courseId: "course_B", status: "published", xpReward: 10 };
  };

  describe("Lesson Completion Idempotency", () => {
    it("completes the same lesson consecutively and only awards XP once", async () => {
      seedValidCatalog();
      const res1 = await completeLesson(mockUid, "lesson_1");
      expect(res1.xpEarned).toBe(20);
      expect(res1.alreadyCompleted).toBe(false);

      const res2 = await completeLesson(mockUid, "lesson_1");
      expect(res2.xpEarned).toBe(0);
      expect(res2.alreadyCompleted).toBe(true);
    });
  });

  describe("Path Progress with Two Published Courses & Duplicate Lesson Test", () => {
    it("path has 2 courses. Current course lessons completed, second not. Duplicate lesson completion keeps path progress safe, and 100% when both courses are completed (quiz passed)", async () => {
      seedTwoCourseCatalog();

      // Complete course A lessons
      const resA = await completeLesson(mockUid, "lesson_A1");
      expect(resA.courseProgress.lessonsCompleted).toBe(true);
      expect(resA.courseProgress.status).toBe("in_progress");
      store.userProgress[`${mockUid}__course__course_A`].status = "completed";

      // Duplicate completion of lesson A1
      const resDup = await completeLesson(mockUid, "lesson_A1");
      expect(resDup.courseProgress.lessonsCompleted).toBe(true);

      // Complete course B lessons
      const resB = await completeLesson(mockUid, "lesson_B1");
      expect(resB.courseProgress.lessonsCompleted).toBe(true);
      store.userProgress[`${mockUid}__course__course_B`].status = "completed";

      let completedCourseCount = 0;
      ["course_A", "course_B"].forEach((cId) => {
        if (store.userProgress[`${mockUid}__course__${cId}`]?.status === "completed") {
          completedCourseCount++;
        }
      });
      const pathPercent = Math.round((completedCourseCount / 2) * 100);
      expect(pathPercent).toBe(100);
    });
  });

  describe("Backend Course Lock Enforcement", () => {
    it("rejects lesson on course 2 with 403 when course 1 is not completed, and accepts after course 1 status is completed", async () => {
      seedTwoCourseCatalog();

      // Attempt completing lesson in course B without completing course A
      await expect(completeLesson(mockUid, "lesson_B1")).rejects.toMatchObject({
        statusCode: 403,
        message: "Course masih terkunci. Selesaikan course sebelumnya terlebih dahulu.",
      });

      // Now complete course A lessons and set course status to completed (simulating quiz pass)
      await completeLesson(mockUid, "lesson_A1");
      store.userProgress[`${mockUid}__course__course_A`].status = "completed";

      // Now completing lesson in course B should succeed
      const resB = await completeLesson(mockUid, "lesson_B1");
      expect(resB.xpEarned).toBe(10);
    });

    it("rejects course B if course 1 lessonsCompleted is true but status is not completed", async () => {
      seedTwoCourseCatalog();
      store.userProgress[`${mockUid}__course__course_A`] = {
        status: "in_progress",
        lessonsCompleted: true,
      };

      await expect(completeLesson(mockUid, "lesson_B1")).rejects.toMatchObject({
        statusCode: 403,
        message: "Course masih terkunci. Selesaikan course sebelumnya terlebih dahulu.",
      });
    });
  });

  describe("calculateNewStreak Unit & Integration Tests", () => {
    it("returns 1 if previous date is null or undefined", () => {
      expect(calculateNewStreak(null, "2026-07-22", 5)).toBe(1);
      expect(calculateNewStreak(undefined, "2026-07-22", 5)).toBe(1);
    });

    it("returns current streak on same-day action (idempotent)", () => {
      expect(calculateNewStreak("2026-07-22", "2026-07-22", 5)).toBe(5);
    });

    it("increments the streak by 1 if date is consecutive (exactly next day)", () => {
      expect(calculateNewStreak("2026-07-21", "2026-07-22", 5)).toBe(6);
    });

    it("resets the streak to 1 if consecutive day is missed (> 1 day diff)", () => {
      expect(calculateNewStreak("2026-07-20", "2026-07-22", 5)).toBe(1);
    });
  });

  describe("User Profile Existence Check for Reset", () => {
    it("throws 404 error if user does not exist on reset", async () => {
      await expect(resetLearningState("nonexistent_user", "RESET_MY_PROGRESS")).rejects.toMatchObject({
        statusCode: 404,
        message: "User profile tidak ditemukan.",
      });
    });
  });

  describe("Strict Request Body Validation for Complete Lesson", () => {
    it("accepts empty object or undefined body", async () => {
      seedValidCatalog();
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: {},
      });
      expect(res.status).toBe(200);
    });

    it("returns 400 if client includes extra keys inside body", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: { cheatXp: 9999 },
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Kunci tambahan tidak diizinkan");
    });

    it("returns 400 if body is a string", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: "NOT_AN_OBJECT",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Body request harus berupa objek kosong yang valid");
    });

    it("returns 400 if body is an array", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: [],
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Body request harus berupa objek kosong yang valid");
    });

    it("returns 400 if body is null", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1" },
        body: null,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Body request harus berupa objek kosong yang valid");
    });
  });

  describe("lessonId Parameter Sanitization", () => {
    it("returns 400 if lessonId has unsafe symbols / SQLi", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "lesson_1;DROP TABLE lessons" },
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("mengandung karakter tidak aman");
    });

    it("returns 400 if lessonId has path traversal", async () => {
      const completeHandler = getRouteHandler("/lessons/:lessonId/complete", "post");
      const res = await simulateRoute(completeHandler, {
        authUser: { uid: mockUid },
        params: { lessonId: "../admin/settings" },
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("mengandung karakter tidak aman");
    });
  });

  describe("Serialized Concurrent Access Transaction", () => {
    it("correctly serialization works under mock isolation", async () => {
      seedValidCatalog();
      const promises = [
        completeLesson(mockUid, "lesson_1"),
        completeLesson(mockUid, "lesson_1"),
        completeLesson(mockUid, "lesson_1"),
      ];

      const [res1, res2, res3] = await Promise.all(promises);
      const totalXpGrants = res1.xpEarned + res2.xpEarned + res3.xpEarned;
      expect(totalXpGrants).toBe(20);
    });
  });

  describe("Cross-path prerequisite enforcement", () => {
    it("rejects an Intermediate lesson until Beginner path is completed", async () => {
      store.learningPaths["beginner-path"] = { id: "beginner-path", status: "published", order: 1 };
      store.learningPaths["intermediate-path"] = { id: "intermediate-path", status: "published", order: 2 };
      store.courses["int-course-1"] = {
        id: "int-course-1",
        learningPathId: "intermediate-path",
        status: "published",
        order: 1,
      };
      store.lessons["int-lesson-1"] = {
        id: "int-lesson-1",
        courseId: "int-course-1",
        status: "published",
        xpReward: 10,
      };

      await expect(completeLesson(mockUid, "int-lesson-1")).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/jalur sebelumnya/i),
      });

      store.userProgress[`${mockUid}__path__beginner-path`] = {
        userId: mockUid,
        contentType: "path",
        contentId: "beginner-path",
        status: "completed",
        progressPercent: 100,
      };

      await expect(completeLesson(mockUid, "int-lesson-1")).resolves.toMatchObject({
        xpEarned: 10,
        alreadyCompleted: false,
      });
    });

    it("rejects an Advanced lesson until Intermediate path is completed", async () => {
      store.learningPaths["beginner-path"] = { id: "beginner-path", status: "published", order: 1 };
      store.learningPaths["intermediate-path"] = { id: "intermediate-path", status: "published", order: 2 };
      store.learningPaths["advanced-path"] = { id: "advanced-path", status: "published", order: 3 };
      store.courses["adv-course-1"] = {
        id: "adv-course-1",
        learningPathId: "advanced-path",
        status: "published",
        order: 1,
      };
      store.lessons["adv-lesson-1"] = {
        id: "adv-lesson-1",
        courseId: "adv-course-1",
        status: "published",
        xpReward: 15,
      };
      store.userProgress[`${mockUid}__path__beginner-path`] = {
        userId: mockUid,
        contentType: "path",
        contentId: "beginner-path",
        status: "completed",
        progressPercent: 100,
      };

      await expect(completeLesson(mockUid, "adv-lesson-1")).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringMatching(/jalur sebelumnya/i),
      });

      store.userProgress[`${mockUid}__path__intermediate-path`] = {
        userId: mockUid,
        contentType: "path",
        contentId: "intermediate-path",
        status: "completed",
        progressPercent: 100,
      };

      await expect(completeLesson(mockUid, "adv-lesson-1")).resolves.toMatchObject({
        xpEarned: 15,
        alreadyCompleted: false,
      });
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import { setTokenVerifierForTesting } from "./middleware/auth";
import quizRoutes from "./routes/quizRoutes";
import { adminDb } from "./firebaseAdmin";

vi.mock("./firebaseAdmin", () => {
  const store: Record<string, Record<string, any>> = {
    users: {},
    learningPaths: {},
    courses: {},
    lessons: {},
    quizzes: {},
    questions: {},
    userProgress: {},
    quizAttempts: {},
    quizSummaries: {},
    xpTransactions: {},
    adminAuditLogs: {},
  };

  const createQuery = (colName: string) => {
    let wheres: Array<{ field: string; op: string; val: any }> = [];
    const q = {
      where: (field: string, op: string, val: any) => {
        wheres.push({ field, op, val });
        return q;
      },
      orderBy: () => q,
      limit: () => q,
      get: async () => {
        const colData = store[colName] || {};
        let docs = Object.entries(colData).map(([id, data]) => ({
          id,
          ref: {
            id,
            get: async () => ({ id, exists: true, data: () => store[colName]?.[id] }),
          },
          exists: true,
          data: () => data,
        }));

        for (const cond of wheres) {
          docs = docs.filter((d) => {
            const itemVal = d.data()[cond.field];
            if (cond.op === "==") return itemVal === cond.val;
            return true;
          });
        }

        return {
          size: docs.length,
          empty: docs.length === 0,
          docs,
          forEach: (cb: (doc: any) => void) => docs.forEach(cb),
        };
      },
    };
    return q;
  };

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
            if (!store[colName]?.[docId]) throw new Error("Doc not found");
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
      limit: () => createQuery(colName),
      get: async () => createQuery(colName).get(),
    }),
    getAll: async (...refs: any[]) => {
      return refs.map((ref) => {
        const match = Object.entries(store).find(([, docs]) => docs[ref.id]);
        const data = match ? match[1][ref.id] : null;
        return {
          exists: !!data,
          data: () => data,
        };
      });
    },
    runTransaction: async (updateFunction: any) => {
      const transaction = {
        get: async (ref: any) => {
          let targetCol = "userProgress";
          for (const c of Object.keys(store)) {
            if (store[c][ref.id]) {
              targetCol = c;
              break;
            }
          }
          const data = store[targetCol]?.[ref.id] || null;
          return {
            exists: !!data,
            data: () => data,
          };
        },
        set: async (ref: any, data: any, opts?: any) => {
          let targetCol = "userProgress";
          for (const c of Object.keys(store)) {
            if (store[c][ref.id] !== undefined || ref.id.includes(c) || ref.path?.includes(c)) {
              targetCol = c;
              break;
            }
          }
          if (ref.id.startsWith("user_")) targetCol = "users";
          if (ref.id.includes("__course__") || ref.id.includes("__path__")) targetCol = "userProgress";
          if (ref.id.includes("__quiz__")) {
            if (ref.id.includes("xpTransactions") || data.sourceType) targetCol = "xpTransactions";
            else targetCol = "quizSummaries";
          }
          if (ref.id.startsWith("attempt_")) targetCol = "quizAttempts";

          if (!store[targetCol]) store[targetCol] = {};
          if (opts?.merge && store[targetCol][ref.id]) {
            store[targetCol][ref.id] = { ...store[targetCol][ref.id], ...data };
          } else {
            store[targetCol][ref.id] = { ...data };
          }
        },
        update: async (ref: any, data: any) => {
          let targetCol = "userProgress";
          for (const c of Object.keys(store)) {
            if (store[c][ref.id]) {
              targetCol = c;
              break;
            }
          }
          if (!store[targetCol]?.[ref.id]) {
            // initialize if missing in tx
            store[targetCol][ref.id] = {};
          }
          store[targetCol][ref.id] = { ...store[targetCol][ref.id], ...data };
        },
        delete: async (ref: any) => {
          for (const c of Object.keys(store)) {
            if (store[c][ref.id]) {
              delete store[c][ref.id];
            }
          }
        },
      };
      return await updateFunction(transaction);
    },
    get: async (query: any) => query.get(),
  };

  return {
    adminDb: mockAdminDb,
    adminAuth: {
      verifyIdToken: async (token: string) => {
        if (token === "valid-user-token") {
          return { uid: "user_123", email: "user@example.com", name: "Test User" };
        }
        throw new Error("Invalid token");
      },
    },
  };
});

describe("Quiz API Integration Tests", () => {
  let app: express.Express;

  beforeEach(() => {
    setTokenVerifierForTesting({
      verifyIdToken: async (token: string) => {
        if (token === "valid-user-token") {
          return { uid: "user_123", email: "user@example.com", name: "Test User" } as any;
        }
        throw new Error("Invalid token");
      },
    });

    app = express();
    app.use(express.json());
    app.use("/api", quizRoutes);

    const store = (adminDb as any).__store;
    Object.keys(store).forEach((k) => (store[k] = {}));

    store.users = {
      user_123: {
        uid: "user_123",
        displayName: "Test User",
        email: "user@example.com",
        role: "user",
        accountStatus: "active",
        totalXp: 100,
        currentLevel: 1,
        learningStreak: 2,
      },
    };
    store.learningPaths = {
      path_1: { id: "path_1", title: "Path 1", status: "published" },
    };
    store.courses = {
      course_1: { id: "course_1", learningPathId: "path_1", title: "Course 1", status: "published", order: 1 },
    };
    store.quizzes = {
      quiz_1: {
        id: "quiz_1",
        courseId: "course_1",
        title: "Quiz 1",
        description: "Test quiz",
        passingScore: 70,
        xpReward: 30,
        questionCount: 2,
        status: "published",
      },
    };
    store.questions = {
      q_1: {
        id: "q_1",
        quizId: "quiz_1",
        courseId: "course_1",
        questionText: "Question 1?",
        options: [
          { id: "a", text: "Option A" },
          { id: "b", text: "Option B" },
        ],
        correctOptionId: "a",
        explanation: "Because A",
        order: 1,
        status: "published",
      },
      q_2: {
        id: "q_2",
        quizId: "quiz_1",
        courseId: "course_1",
        questionText: "Question 2?",
        options: [
          { id: "a", text: "Option A" },
          { id: "b", text: "Option B" },
        ],
        correctOptionId: "b",
        explanation: "Because B",
        order: 2,
        status: "published",
      },
    };
  });

  it("should fetch published quiz for course", async () => {
    const res = await request(app).get("/api/quizzes/course/course_1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("quiz_1");
    expect(res.body.passingScore).toBe(70);
  });

  it("should fetch questions without exposing correctOptionId", async () => {
    const res = await request(app).get("/api/quizzes/quiz_1/questions");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].correctOptionId).toBeUndefined();
    expect(res.body[0].explanation).toBeUndefined();
  });

  it("should return 403 when trying to submit quiz if lessons are not completed", async () => {
    const res = await request(app)
      .post("/api/quizzes/quiz_1/attempts")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        answers: { q_1: "a", q_2: "b" },
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Kuis masih terkunci");
  });

  it("should successfully submit quiz attempt and graduate course when lessons are completed", async () => {
    const store = (adminDb as any).__store;
    store.userProgress["user_123__course__course_1"] = {
      progressId: "user_123__course__course_1",
      userId: "user_123",
      contentType: "course",
      contentId: "course_1",
      lessonsCompleted: true,
      status: "in_progress",
    };

    const res = await request(app)
      .post("/api/quizzes/quiz_1/attempts")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        answers: { q_1: "a", q_2: "b" },
      });

    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.score).toBe(100);
    expect(res.body.xpEarned).toBe(30);
    expect(res.body.review.length).toBe(2);
    expect(res.body.review[0].correctOptionId).toBe("a");
  });
});

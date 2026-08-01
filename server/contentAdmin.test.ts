import { describe, it, expect, beforeEach, vi } from "vitest";
import { setTokenVerifierForTesting } from "./middleware/auth";
import {
  createLearningPath,
  createCourse,
  updateCourse,
  createLesson,
  updateLesson,
  getAdminLearningPaths,
  getCatalogLessonByCourseAndLessonSlug,
  ApiError,
} from "./services/contentService";
import {
  LearningPathCreateSchema,
  CourseCreateSchema,
  LessonCreateSchema,
} from "./validation/contentSchemas";
import { validateSeedData } from "../scripts/seed-content";
import { adminDb } from "./firebaseAdmin";

// Mock Firestore with Read-Before-Write Transaction enforcement
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
    let startAfterId: string | null = null;

    const q = {
      where: (field: string, op: string, val: any) => {
        whereConditions.push({ field, op, val });
        return q;
      },
      orderBy: () => q,
      startAfter: (doc: any) => {
        startAfterId = doc.id;
        return q;
      },
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

        docs.sort((a, b) => (a.data().order ?? 0) - (b.data().order ?? 0) || a.id.localeCompare(b.id));

        if (startAfterId) {
          const idx = docs.findIndex((d) => d.id === startAfterId);
          if (idx !== -1) {
            docs = docs.slice(idx + 1);
          }
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

describe("Admin Content CRUD, Security Rules & Catalog Service", () => {
  const adminUid = "admin_test_uid";
  const store = (adminDb as any).__store;

  beforeEach(() => {
    store.learningPaths = {};
    store.courses = {};
    store.lessons = {};
    store.adminAuditLogs = {};
    setTokenVerifierForTesting(null);
  });

  describe("Payload Validation (Zod strict)", () => {
    it("rejects request body containing 'id' or 'createdBy' with validation error", () => {
      const invalidLp = {
        id: "custom-id",
        title: "Test LP",
        createdBy: "hacker",
      };
      const lpCheck = LearningPathCreateSchema.safeParse(invalidLp);
      expect(lpCheck.success).toBe(false);

      const invalidCourse = {
        id: "custom-course-id",
        learningPathId: "lp1",
        title: "Test Course",
      };
      const courseCheck = CourseCreateSchema.safeParse(invalidCourse);
      expect(courseCheck.success).toBe(false);

      const invalidLesson = {
        id: "custom-lesson-id",
        courseId: "c1",
        title: "Test Lesson",
      };
      const lessonCheck = LessonCreateSchema.safeParse(invalidLesson);
      expect(lessonCheck.success).toBe(false);
    });
  });

  describe("Learning Path CRUD", () => {
    it("creates a learning path with auto-generated ID and writes audit log", async () => {
      const result = await createLearningPath(adminUid, {
        title: "Test Learning Path",
        description: "Deskripsi LP",
        status: "draft",
      });

      expect(result.id).toBeDefined();
      expect(result.createdBy).toBe(adminUid);
      expect(store.learningPaths[result.id]).toBeDefined();

      const auditKeys = Object.keys(store.adminAuditLogs);
      expect(auditKeys.length).toBe(1);
      const log = store.adminAuditLogs[auditKeys[0]];
      expect(log.actorUid).toBe(adminUid);
      expect(log.action).toBe("create");
      expect(log.entityType).toBe("learning_path");
    });

    it("prevents duplicate slug creation (409 Conflict)", async () => {
      await createLearningPath(adminUid, {
        title: "Duplicate Test",
        slug: "dup-path",
      });

      await expect(
        createLearningPath(adminUid, {
          title: "Duplicate Test 2",
          slug: "dup-path",
        })
      ).rejects.toThrowError(ApiError);
    });
  });

  describe("Course & Lesson Relocation Transaction Ordering", () => {
    it("moves course to another path adhering to Read-Before-Write order", async () => {
      const lp1 = await createLearningPath(adminUid, { title: "LP 1", slug: "lp-1" });
      const lp2 = await createLearningPath(adminUid, { title: "LP 2", slug: "lp-2" });
      const course = await createCourse(adminUid, {
        learningPathId: lp1.id,
        title: "Course Move Test",
        slug: "course-move",
      });
      const lesson = await createLesson(adminUid, {
        courseId: course.id,
        title: "Lesson Move Test",
        slug: "lesson-move",
      });

      const updated = await updateCourse(adminUid, course.id, {
        learningPathId: lp2.id,
      });

      expect((updated as any).learningPathId).toBe(lp2.id);
      expect(store.lessons[lesson.id].learningPathId).toBe(lp2.id);
    });

    it("moves lesson to another course and updates lessonCounts properly", async () => {
      const lp = await createLearningPath(adminUid, { title: "LP Main", slug: "lp-main" });
      const c1 = await createCourse(adminUid, { learningPathId: lp.id, title: "Course 1", slug: "c-1" });
      const c2 = await createCourse(adminUid, { learningPathId: lp.id, title: "Course 2", slug: "c-2" });
      const lesson = await createLesson(adminUid, { courseId: c1.id, title: "Lesson 1", slug: "l-1" });

      expect(store.courses[c1.id].lessonCount).toBe(1);
      expect(store.courses[c2.id].lessonCount).toBe(0);

      await updateLesson(adminUid, lesson.id, { courseId: c2.id });

      expect(store.courses[c1.id].lessonCount).toBe(0);
      expect(store.courses[c2.id].lessonCount).toBe(1);
    });
  });

  describe("Scoped Lesson Lookup", () => {
    it("allows two courses to have same lesson slug and returns correct lesson for each URL", async () => {
      const lp = await createLearningPath(adminUid, { title: "LP Scoped", slug: "lp-scoped", status: "published" });
      const c1 = await createCourse(adminUid, { learningPathId: lp.id, title: "Course Alpha", slug: "course-alpha", status: "published" });
      const c2 = await createCourse(adminUid, { learningPathId: lp.id, title: "Course Beta", slug: "course-beta", status: "published" });

      await createLesson(adminUid, { courseId: c1.id, title: "Pengenalan Alpha", slug: "pengenalan", status: "published" });
      await createLesson(adminUid, { courseId: c2.id, title: "Pengenalan Beta", slug: "pengenalan", status: "published" });

      const l1 = await getCatalogLessonByCourseAndLessonSlug("course-alpha", "pengenalan");
      const l2 = await getCatalogLessonByCourseAndLessonSlug("course-beta", "pengenalan");

      expect(l1?.title).toBe("Pengenalan Alpha");
      expect(l2?.title).toBe("Pengenalan Beta");
    });
  });

  describe("Firestore Cursor Pagination", () => {
    it("paginates admin paths using cursor and limits", async () => {
      await createLearningPath(adminUid, { title: "Path A", slug: "path-a", order: 1 });
      await createLearningPath(adminUid, { title: "Path B", slug: "path-b", order: 2 });
      await createLearningPath(adminUid, { title: "Path C", slug: "path-c", order: 3 });

      const page1 = await getAdminLearningPaths({ limit: 2 });
      expect(page1.items.length).toBe(2);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await getAdminLearningPaths({ limit: 2, cursor: page1.nextCursor! });
      expect(page2.items.length).toBe(1);
      expect(page2.items[0].title).toBe("Path C");
    });
  });

  describe("Seed Data Validation", () => {
    it("validates valid seed data and rejects corrupt seed data", () => {
      const validLps = [{ id: "lp1", slug: "lp1" }];
      const validCourses = [{ id: "c1", learningPathId: "lp1", slug: "c1" }];
      const validLessons = [{ id: "l1", courseId: "c1", slug: "l1" }];

      expect(validateSeedData(validLps, validCourses, validLessons)).toBe(true);

      // Duplicate ID test
      const corruptLps = [{ id: "dup" }, { id: "dup" }];
      expect(() => validateSeedData(corruptLps, [], [])).toThrow(/Duplicate ID/);

      // Missing parent course test
      const orphanLessons = [{ id: "l1", courseId: "non-existent", slug: "l1" }];
      expect(() => validateSeedData(validLps, validCourses, orphanLessons)).toThrow(/Parent courseId/);
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  validateSeedData,
  planSeedOperations,
} from "./seedValidator.js";

const firebaseAdminMock = vi.fn();
vi.mock("../server/firebaseAdmin.js", () => {
  firebaseAdminMock();
  return {
    adminDb: {
      collection: vi.fn(),
      batch: vi.fn(),
    },
  };
});

describe("Seed Data Validation & Planning", () => {
  it("1. Importing validator does not throw or execute main()", () => {
    expect(typeof validateSeedData).toBe("function");
    expect(typeof planSeedOperations).toBe("function");
  });

  it("2. Duplicate ID inside the same collection is rejected", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [
      { id: "course-1", title: "Course 1", learningPathId: "path-1" },
      { id: "course-1", title: "Course Duplicate", learningPathId: "path-1" },
    ];
    const lessons: any[] = [];

    expect(() => validateSeedData(lps, courses, lessons)).toThrow(/Duplicate ID/);
  });

  it("2b. The same document ID in different collections is valid", () => {
    const lps = [{ id: "shared-id", title: "Path 1" }];
    const courses = [{ id: "shared-id", slug: "course-shared", title: "Course 1", learningPathId: "shared-id" }];
    const quizzes = [{ id: "shared-id", courseId: "shared-id" }];

    expect(() => validateSeedData(lps, courses, [], quizzes, [])).not.toThrow();
  });

  it("3. Duplicate course slug global rejected", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [
      { id: "c-1", slug: "same-slug", title: "Course 1", learningPathId: "path-1" },
      { id: "c-2", slug: "same-slug", title: "Course 2", learningPathId: "path-1" },
    ];
    const lessons: any[] = [];

    expect(() => validateSeedData(lps, courses, lessons)).toThrow(/Duplicate course slug/);
  });

  it("4. Duplicate lesson slug within same course rejected", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "path-1" }];
    const lessons = [
      { id: "l-1", courseId: "c-1", slug: "lesson-slug", title: "Lesson 1" },
      { id: "l-2", courseId: "c-1", slug: "lesson-slug", title: "Lesson 2" },
    ];

    expect(() => validateSeedData(lps, courses, lessons)).toThrow(/Duplicate lesson slug/);
  });

  it("5. Orphan course/lesson rejected", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "non-existent-path" }];
    const lessons: any[] = [];

    expect(() => validateSeedData(lps, courses, lessons)).toThrow(/Parent learningPathId/);

    const validCourses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "path-1" }];
    const orphanLessons = [{ id: "l-1", courseId: "non-existent-course", slug: "lesson-1", title: "Lesson 1" }];

    expect(() => validateSeedData(lps, validCourses, orphanLessons)).toThrow(/Parent courseId/);
  });

  it("6. Existing documents produce skipped status with composite collection identity", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "path-1" }];
    const lessons = [{ id: "l-1", courseId: "c-1", slug: "lesson-1", title: "Lesson 1" }];

    const existingDocIds = new Set<string>(["learningPaths/path-1", "courses/c-1"]);

    const plan = planSeedOperations(lps, courses, lessons, existingDocIds);

    expect(plan.totalSource).toBe(3);
    expect(plan.skippedExisting).toBe(2);
    expect(plan.itemsToCreate.length).toBe(1);
    expect(plan.itemsToCreate[0].id).toBe("l-1");
  });

  it("6b. Cross-collection ID collision test: courses/item-1 does not cause learningPaths/item-1 to be skipped", () => {
    const lps = [{ id: "item-1", title: "Path Item 1" }];
    const courses = [{ id: "c-2", slug: "course-2", title: "Course 2", learningPathId: "item-1" }];
    const lessons: any[] = [];

    // Suppose 'courses/item-1' exists in Firestore
    const existingDocIds = new Set<string>(["courses/item-1"]);

    const plan = planSeedOperations(lps, courses, lessons, existingDocIds);

    // learningPaths/item-1 should NOT be skipped!
    expect(plan.skippedExisting).toBe(0);
    expect(plan.itemsToCreate.map((i) => `${i.collection}/${i.id}`)).toEqual([
      "learningPaths/item-1",
      "courses/c-2",
    ]);
  });

  it("7. Only missing documents are planned for create", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "path-1" }];
    const lessons: any[] = [];

    const existingDocIds = new Set<string>();

    const plan = planSeedOperations(lps, courses, lessons, existingDocIds);

    expect(plan.itemsToCreate.length).toBe(2);
    expect(plan.itemsToCreate.map((i) => i.id)).toEqual(["path-1", "c-1"]);
  });

  it("8. No set/update/delete in seed planner", () => {
    const lps = [{ id: "path-1", title: "Path 1" }];
    const courses = [{ id: "c-1", slug: "course-1", title: "Course 1", learningPathId: "path-1" }];
    const lessons: any[] = [];

    const plan = planSeedOperations(lps, courses, lessons, new Set());

    for (const op of plan.operations) {
      expect(op.type).toBe("create");
      expect((op as any).type).not.toBe("set");
      expect((op as any).type).not.toBe("update");
      expect((op as any).type).not.toBe("delete");
    }
  });

  it("9. Without --confirm, main() exits with 1 before calling Firestore or initializing Firebase Admin", async () => {
    firebaseAdminMock.mockClear();
    const { main } = await import("./seed-content.js");

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit(1) called");
    }) as any);

    await expect(main([])).rejects.toThrow("process.exit(1) called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(firebaseAdminMock).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it("10. ESM entry does not use require/module", async () => {
    const seedContentText = await import("fs").then((fs) =>
      fs.readFileSync("./scripts/seed-content.ts", "utf-8")
    );
    expect(seedContentText).not.toContain("require.main");
    expect(seedContentText).not.toContain("module.exports");
  });
});

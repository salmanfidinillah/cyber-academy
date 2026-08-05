import { describe, expect, it, vi } from "vitest";
import { planSeedOperations, validateSeedData } from "./seedValidator.js";

const firebaseAdminMock = vi.fn();
vi.mock("../server/firebaseAdmin.js", () => {
  firebaseAdminMock();
  return { adminDb: {} };
});

function validCatalogFixture() {
  const learningPaths = [
    { id: "path-1", title: "Path 1", slug: "path-1", courseCount: 1, order: 1 },
  ];
  const courses = [
    {
      id: "course-1",
      title: "Course 1",
      slug: "course-1",
      learningPathId: "path-1",
      lessonCount: 1,
      order: 1,
    },
  ];
  const lessons = [
    {
      id: "lesson-1",
      title: "Lesson 1",
      slug: "lesson-1",
      courseId: "course-1",
      order: 1,
    },
  ];
  const quizzes = [
    {
      id: "quiz-1",
      title: "Quiz 1",
      courseId: "course-1",
      questionCount: 1,
    },
  ];
  const questions = [
    {
      id: "question-1",
      quizId: "quiz-1",
      courseId: "course-1",
      questionText: "Question?",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      correctOptionId: "a",
      recommendedLessonId: "lesson-1",
      order: 1,
    },
  ];
  return { learningPaths, courses, lessons, quizzes, questions };
}

describe("Seed data validation and idempotent planning", () => {
  it("exports validator and planner without running the seed", () => {
    expect(typeof validateSeedData).toBe("function");
    expect(typeof planSeedOperations).toBe("function");
  });

  it("accepts a complete valid catalog", () => {
    const fixture = validCatalogFixture();
    expect(() =>
      validateSeedData(
        fixture.learningPaths,
        fixture.courses,
        fixture.lessons,
        fixture.quizzes,
        fixture.questions,
      ),
    ).not.toThrow();
  });

  it("rejects duplicate IDs inside the same collection", () => {
    const fixture = validCatalogFixture();
    fixture.courses.push({ ...fixture.courses[0] });
    expect(() =>
      validateSeedData(
        fixture.learningPaths,
        fixture.courses,
        fixture.lessons,
        fixture.quizzes,
        fixture.questions,
      ),
    ).toThrow(/Duplicate ID/);
  });

  it("allows the same document ID in different collections", () => {
    const fixture = validCatalogFixture();
    fixture.learningPaths[0].id = "shared-id";
    fixture.learningPaths[0].slug = "shared-path";
    fixture.courses[0].id = "shared-id";
    fixture.courses[0].learningPathId = "shared-id";
    fixture.lessons[0].courseId = "shared-id";
    fixture.quizzes[0].courseId = "shared-id";
    fixture.questions[0].courseId = "shared-id";
    expect(() =>
      validateSeedData(
        fixture.learningPaths,
        fixture.courses,
        fixture.lessons,
        fixture.quizzes,
        fixture.questions,
      ),
    ).not.toThrow();
  });

  it("rejects orphan relations and cross-course question relations", () => {
    const fixture = validCatalogFixture();
    fixture.lessons[0].courseId = "missing-course";
    expect(() =>
      validateSeedData(
        fixture.learningPaths,
        fixture.courses,
        fixture.lessons,
        fixture.quizzes,
        fixture.questions,
      ),
    ).toThrow(/Parent courseId/);

    const second = validCatalogFixture();
    second.questions[0].courseId = "different-course";
    expect(() =>
      validateSeedData(
        second.learningPaths,
        second.courses,
        second.lessons,
        second.quizzes,
        second.questions,
      ),
    ).toThrow(/Parent courseId|does not match quiz/);
  });

  it("rejects duplicate or non-sequential display order", () => {
    const fixture = validCatalogFixture();
    fixture.courses[0].order = 2;
    expect(() =>
      validateSeedData(
        fixture.learningPaths,
        fixture.courses,
        fixture.lessons,
        fixture.quizzes,
        fixture.questions,
      ),
    ).toThrow(/Invalid order/);
  });

  it("plans missing documents as creates and existing documents as merge updates", () => {
    const fixture = validCatalogFixture();
    const existing = new Set<string>([
      "learningPaths/path-1",
      "courses/course-1",
    ]);
    const plan = planSeedOperations(
      fixture.learningPaths,
      fixture.courses,
      fixture.lessons,
      existing,
      fixture.quizzes,
      fixture.questions,
    );

    expect(plan.totalSource).toBe(5);
    expect(plan.existing).toBe(2);
    expect(plan.itemsToUpdate.map((item) => `${item.collection}/${item.id}`)).toEqual([
      "learningPaths/path-1",
      "courses/course-1",
    ]);
    expect(plan.itemsToCreate).toHaveLength(3);
    expect(plan.operations.every((operation) => operation.type === "set")).toBe(true);
    expect(plan.operations.map((operation) => operation.mode)).toEqual([
      "update",
      "update",
      "create",
      "create",
      "create",
    ]);
  });

  it("detects existing catalog documents that are absent from source", () => {
    const fixture = validCatalogFixture();
    const plan = planSeedOperations(
      fixture.learningPaths,
      fixture.courses,
      fixture.lessons,
      new Set(["courses/legacy-course"]),
      fixture.quizzes,
      fixture.questions,
    );
    expect(plan.unexpectedExistingIds).toEqual(["courses/legacy-course"]);
  });

  it("never plans a delete operation", () => {
    const fixture = validCatalogFixture();
    const plan = planSeedOperations(
      fixture.learningPaths,
      fixture.courses,
      fixture.lessons,
      new Set(),
      fixture.quizzes,
      fixture.questions,
    );
    expect(plan.operations.every((operation) => operation.type === "set")).toBe(true);
    expect(plan.operations.some((operation) => (operation as any).type === "delete")).toBe(false);
  });

  it("blocks production write without the project-name confirmation before Firebase initializes", async () => {
    firebaseAdminMock.mockClear();
    const { main } = await import("./seed-content.js");
    await expect(
      main([
        "--target=production",
        "--project=cyber-academy-6aeba",
        "--confirm",
      ]),
    ).rejects.toThrow(/confirm-production/);
    expect(firebaseAdminMock).not.toHaveBeenCalled();
  });

  it("defaults to emulator and blocks when the emulator is not running", async () => {
    firebaseAdminMock.mockClear();
    const previous = process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    const { main } = await import("./seed-content.js");
    await expect(main(["--project=demo-cyber-academy"])).rejects.toThrow(
      /FIRESTORE_EMULATOR_HOST/,
    );
    expect(firebaseAdminMock).not.toHaveBeenCalled();
    if (previous) process.env.FIRESTORE_EMULATOR_HOST = previous;
  });

  it("keeps the ESM entry free from CommonJS main-module checks", async () => {
    const seedContentText = await import("node:fs").then((fs) =>
      fs.readFileSync("./scripts/seed-content.ts", "utf8"),
    );
    expect(seedContentText).not.toContain("require.main");
    expect(seedContentText).not.toContain("module.exports");
  });
});

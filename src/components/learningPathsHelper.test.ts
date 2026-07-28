import { describe, it, expect } from "vitest";
import { calculateCourseLocks, calculatePathLocks } from "./LearningPaths";
import { deriveLessonCompletionFlags } from "../lib/learningProgressHelpers";
import { Course } from "../types";
import fs from "fs";
import path from "path";

describe("UI Pure Helpers & Static Import Verifications", () => {
  describe("calculateCourseLocks", () => {
    const mockCourses: Course[] = [
      { id: "c1", learningPathId: "p1", title: "Course 1", slug: "c1", description: "", category: "", level: "beginner", order: 1, estimatedDuration: 10, xpReward: 10, learningOutcomes: [], lessonCount: 2, status: "published" },
      { id: "c2", learningPathId: "p1", title: "Course 2", slug: "c2", description: "", category: "", level: "beginner", order: 2, estimatedDuration: 10, xpReward: 10, learningOutcomes: [], lessonCount: 2, status: "published" },
      { id: "c3", learningPathId: "p1", title: "Course 3", slug: "c3", description: "", category: "", level: "beginner", order: 3, estimatedDuration: 10, xpReward: 10, learningOutcomes: [], lessonCount: 2, status: "published" },
    ];

    it("1. First course is always unlocked", () => {
      const locks = calculateCourseLocks(mockCourses, {});
      expect(locks["c1"]).toBe(false);
    });

    it("2. Subsequent courses are locked if previous course has no progress", () => {
      const locks = calculateCourseLocks(mockCourses, {});
      expect(locks["c2"]).toBe(true);
      expect(locks["c3"]).toBe(true);
    });

    it("3. Subsequent courses are locked if previous course progress status is not completed, even if lessonsCompleted is true", () => {
      const progressMap = {
        "course_c1": { status: "in_progress", lessonsCompleted: true },
      };
      const locks = calculateCourseLocks(mockCourses, progressMap);
      expect(locks["c1"]).toBe(false);
      expect(locks["c2"]).toBe(true);
    });

    it("4. Subsequent courses are unlocked only when previous course status is completed", () => {
      const progressMap = {
        "course_c1": { status: "completed", lessonsCompleted: true },
        "course_c2": { status: "in_progress" },
      };
      const locks = calculateCourseLocks(mockCourses, progressMap);
      expect(locks["c1"]).toBe(false);
      expect(locks["c2"]).toBe(false);
      expect(locks["c3"]).toBe(true);
    });
  });

  describe("calculatePathLocks", () => {
    const paths = [
      { id: "beginner-path", level: "Beginner" },
      { id: "intermediate-path", level: "Intermediate" },
      { id: "advanced-path", level: "Advanced" },
    ] as any;

    it("locks Intermediate until Beginner is completed", () => {
      const locks = calculatePathLocks(paths, {});
      expect(locks["beginner-path"]).toBe(false);
      expect(locks["intermediate-path"]).toBe(true);
      expect(locks["advanced-path"]).toBe(true);
    });

    it("unlocks each path only after its prerequisite path is completed", () => {
      const locks = calculatePathLocks(paths, {
        "path_beginner-path": { status: "completed" },
        "path_intermediate-path": { status: "completed" },
      });
      expect(locks["intermediate-path"]).toBe(false);
      expect(locks["advanced-path"]).toBe(false);
    });
  });

  describe("deriveLessonCompletionFlags (Production Semantic Helper)", () => {
    it("returns correct flags for completed course status", () => {
      expect(deriveLessonCompletionFlags({ status: "completed", lessonsCompleted: true })).toEqual({
        didCourseComplete: true,
        didFinishAllLessons: false,
      });
    });

    it("returns correct flags for in_progress with lessonsCompleted true", () => {
      expect(deriveLessonCompletionFlags({ status: "in_progress", lessonsCompleted: true })).toEqual({
        didCourseComplete: false,
        didFinishAllLessons: true,
      });
    });

    it("returns correct flags for in_progress with lessonsCompleted false", () => {
      expect(deriveLessonCompletionFlags({ status: "in_progress", lessonsCompleted: false })).toEqual({
        didCourseComplete: false,
        didFinishAllLessons: false,
      });
    });

    it("returns correct flags for null or undefined courseProgress", () => {
      expect(deriveLessonCompletionFlags(null)).toEqual({
        didCourseComplete: false,
        didFinishAllLessons: false,
      });
      expect(deriveLessonCompletionFlags(undefined)).toEqual({
        didCourseComplete: false,
        didFinishAllLessons: false,
      });
    });
  });

  describe("Static Source Acceptance Tests for Core Progress UI components", () => {
    const coreComponents = [
      "Dashboard.tsx",
      "ProgressPage.tsx",
      "LearningPaths.tsx",
      "CourseDetail.tsx",
      "LessonDetail.tsx",
    ];

    it("Verifies core UI components do not import getUserProgress or isCourseLocked from learningStore and have no dynamic learningStateService imports", () => {
      for (const comp of coreComponents) {
        const filePath = path.resolve(process.cwd(), `src/components/${comp}`);
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (const line of lines) {
          if (line.includes("learningStore")) {
            expect(line.includes("getUserProgress")).toBe(false);
            expect(line.includes("isCourseLocked")).toBe(false);
          }
        }

        const hasDynamicLearningState = content.includes("import(") && content.includes("learningStateService");
        expect(hasDynamicLearningState).toBe(false);
      }
    });
  });
});

import { describe, expect, it } from "vitest";
import { validateSeedData } from "../scripts/seedValidator";
import { courses, learningPaths, lessons } from "./data";
import {
  liveCatalogAdditionalCourses,
  liveCatalogAdditionalLessons,
  liveCatalogAdditionalQuestions,
  liveCatalogAdditionalQuizzes,
} from "./live_catalog_additions";
import { questions, quizzes } from "./quiz_data";

function expectSequentialOrder(items: Array<{ order: number }>) {
  expect(items.map((item) => item.order).sort((a, b) => a - b)).toEqual(
    Array.from({ length: items.length }, (_, index) => index + 1),
  );
}

describe("Complete production catalog integrity", () => {
  it("contains the exact 4/10/11 course distribution and 25 total courses", () => {
    const counts = Object.fromEntries(
      learningPaths.map((path) => [
        path.id,
        courses.filter((course) => course.learningPathId === path.id).length,
      ]),
    );
    expect(counts).toEqual({
      "beginner-path": 4,
      "intermediate-path": 10,
      "advanced-path": 11,
    });
    expect(courses).toHaveLength(25);
  });

  it("matches the document totals from the read-only production export", () => {
    expect(learningPaths).toHaveLength(3);
    expect(lessons).toHaveLength(79);
    expect(quizzes).toHaveLength(25);
    expect(questions).toHaveLength(160);
  });

  it("contains exactly the six recovered production courses and their descendants", () => {
    expect(liveCatalogAdditionalCourses.map((course) => course.id).sort()).toEqual([
      "incident-response-etika",
      "keamanan-jaringan-wifi",
      "keamanan-web-api",
      "kriptografi-praktis",
      "malware-ransomware-defense",
      "owasp-risk-awareness",
    ]);
    expect(liveCatalogAdditionalLessons).toHaveLength(12);
    expect(liveCatalogAdditionalQuizzes).toHaveLength(6);
    expect(liveCatalogAdditionalQuestions).toHaveLength(30);
  });

  it("has no duplicate document IDs inside any collection", () => {
    for (const collection of [learningPaths, courses, lessons, quizzes, questions]) {
      expect(new Set(collection.map((item) => item.id)).size).toBe(collection.length);
    }
  });

  it("keeps every parent relation valid and every summary count derived from children", () => {
    const pathIds = new Set(learningPaths.map((path) => path.id));
    const courseIds = new Set(courses.map((course) => course.id));
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    for (const path of learningPaths) {
      const pathCourses = courses.filter((course) => course.learningPathId === path.id);
      expect(path.courseCount).toBe(pathCourses.length);
      expectSequentialOrder(pathCourses);
    }

    for (const course of courses) {
      expect(pathIds.has(course.learningPathId)).toBe(true);
      const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
      const courseQuizzes = quizzes.filter((quiz) => quiz.courseId === course.id);
      expect(course.lessonCount).toBe(courseLessons.length);
      expect(courseQuizzes).toHaveLength(1);
      expectSequentialOrder(courseLessons);
    }

    for (const lesson of lessons) {
      expect(courseIds.has(lesson.courseId)).toBe(true);
    }

    for (const quiz of quizzes) {
      expect(courseIds.has(quiz.courseId)).toBe(true);
      const quizQuestions = questions.filter((question) => question.quizId === quiz.id);
      expect(quiz.questionCount).toBe(quizQuestions.length);
      expectSequentialOrder(quizQuestions);
    }

    for (const question of questions) {
      const quiz = quizById.get(question.quizId);
      expect(quiz?.courseId).toBe(question.courseId);
      if (question.recommendedLessonId) {
        expect(lessonById.has(question.recommendedLessonId)).toBe(true);
      }
    }
  });

  it("passes the same complete validation used before every seed", () => {
    expect(() => validateSeedData(learningPaths, courses, lessons, quizzes, questions)).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { learningPaths, courses, lessons } from "./data";
import { quizzes, questions } from "./quiz_data";
import { validateSeedData } from "../scripts/seedValidator";

describe("Advanced learning path curriculum integrity", () => {
  const advancedCourses = courses.filter((course) => course.learningPathId === "advanced-path");
  const courseIds = new Set(advancedCourses.map((course) => course.id));
  const advancedLessons = lessons.filter((lesson) => courseIds.has(lesson.courseId));
  const advancedQuizzes = quizzes.filter((quiz) => courseIds.has(quiz.courseId));

  it("contains exactly eleven ordered published courses", () => {
    expect(advancedCourses).toHaveLength(11);
    expect(advancedCourses.map((course) => course.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(advancedCourses.every((course) => course.status === "published")).toBe(true);
  });

  it("derives the path card count and duration from real course data", () => {
    const path = learningPaths.find((item) => item.id === "advanced-path");
    expect(path?.courseCount).toBe(advancedCourses.length);
    expect(path?.durationMinutes).toBe(
      advancedCourses.reduce((total, course) => total + course.estimatedDuration, 0)
    );
    expect(path?.courses).toHaveLength(11);
  });

  it("gives every course structured lessons and one server-compatible quiz", () => {
    for (const course of advancedCourses) {
      const courseLessons = advancedLessons.filter((lesson) => lesson.courseId === course.id);
      const courseQuizzes = advancedQuizzes.filter((quiz) => quiz.courseId === course.id);
      expect(courseLessons.length).toBeGreaterThanOrEqual(2);
      expect(course.lessonCount).toBe(courseLessons.length);
      expect(courseQuizzes).toHaveLength(1);
      expect(courseLessons.every((lesson) => lesson.content.trim().length > 0)).toBe(true);
      expect(courseLessons.every((lesson) => (lesson.securityTips?.length ?? 0) > 0)).toBe(true);
    }
  });

  it("keeps every course and lesson route slug unique", () => {
    expect(new Set(advancedCourses.map((course) => course.slug)).size).toBe(advancedCourses.length);
    for (const course of advancedCourses) {
      const courseLessons = advancedLessons.filter((lesson) => lesson.courseId === course.id);
      expect(new Set(courseLessons.map((lesson) => lesson.slug)).size).toBe(courseLessons.length);
      expect(courseLessons.every((lesson) => lesson.slug.length > 0)).toBe(true);
    }
  });

  it("provides a 25-question final quiz with an 80 passing grade", () => {
    const finalQuiz = quizzes.find((quiz) => quiz.id === "quiz-adv-zero-trust");
    expect(finalQuiz?.title).toBe("Final Quiz Advanced");
    expect(finalQuiz?.passingScore).toBe(80);
    expect(finalQuiz?.questionCount).toBe(25);
    expect(questions.filter((question) => question.quizId === finalQuiz?.id)).toHaveLength(25);
  });

  it("keeps every one-time lesson and quiz reward positive", () => {
    expect(advancedLessons.every((lesson) => lesson.xpReward > 0)).toBe(true);
    expect(advancedQuizzes.every((quiz) => quiz.xpReward > 0)).toBe(true);
  });

  it("keeps unsafe operational material out of Advanced lessons", () => {
    const combined = advancedLessons.map((lesson) => lesson.content.toLowerCase()).join("\n");
    expect(combined).not.toContain("cara mengeksploitasi target");
    expect(combined).not.toContain("langkah membuat malware");
    expect(combined).toContain("izin");
    expect(combined).toContain("defensif");
    expect(combined).toContain("tidak ada malware nyata");
  });

  it("passes the complete real seed integrity validator", () => {
    expect(() => validateSeedData(learningPaths, courses, lessons, quizzes, questions)).not.toThrow();
  });

  it("registers an idempotent Advanced path badge and exposes Advanced certificates", () => {
    const certificateSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/CertificatePreview.tsx"),
      "utf8"
    );
    const badgeDefinitionsSource = fs.readFileSync(
      path.resolve(process.cwd(), "server/services/badgeDefinitions.ts"),
      "utf8"
    );
    expect(badgeDefinitionsSource).toContain('"badge-advanced-specialist"');
    expect(badgeDefinitionsSource).toContain('requirementType: "learning_path_completion"');
    expect(badgeDefinitionsSource).toContain('requirementValue: "advanced-path"');
    expect(certificateSource).toContain('selectedPath?.level === "Advanced" ? 80');
    expect(certificateSource).not.toContain('selectedPathId === "beginner-path"');
  });
});

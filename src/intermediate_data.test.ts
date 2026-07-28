import { describe, expect, it } from "vitest";
import { learningPaths, courses, lessons } from "./data";
import { quizzes, questions } from "./quiz_data";
import { validateSeedData } from "../scripts/seedValidator";

describe("Intermediate learning path curriculum integrity", () => {
  const intermediateCourses = courses.filter((course) => course.learningPathId === "intermediate-path");
  const courseIds = new Set(intermediateCourses.map((course) => course.id));
  const intermediateLessons = lessons.filter((lesson) => courseIds.has(lesson.courseId));
  const intermediateQuizzes = quizzes.filter((quiz) => courseIds.has(quiz.courseId));

  it("contains exactly seven ordered published courses", () => {
    expect(intermediateCourses).toHaveLength(7);
    expect(intermediateCourses.map((course) => course.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(intermediateCourses.every((course) => course.status === "published")).toBe(true);
  });

  it("derives the path card count and duration from real course data", () => {
    const path = learningPaths.find((item) => item.id === "intermediate-path");
    expect(path?.courseCount).toBe(intermediateCourses.length);
    expect(path?.durationMinutes).toBe(
      intermediateCourses.reduce((total, course) => total + course.estimatedDuration, 0)
    );
  });

  it("gives every course real lessons and one server-compatible quiz", () => {
    for (const course of intermediateCourses) {
      const courseLessons = intermediateLessons.filter((lesson) => lesson.courseId === course.id);
      const courseQuizzes = intermediateQuizzes.filter((quiz) => quiz.courseId === course.id);
      expect(courseLessons.length).toBeGreaterThanOrEqual(3);
      expect(course.lessonCount).toBe(courseLessons.length);
      expect(courseQuizzes).toHaveLength(1);
      expect(courseLessons.every((lesson) => lesson.content.includes("**Mini Latihan**"))).toBe(true);
    }
  });

  it("keeps every course route and lesson route slug unique", () => {
    expect(new Set(intermediateCourses.map((course) => course.slug)).size).toBe(intermediateCourses.length);
    for (const course of intermediateCourses) {
      const courseLessons = intermediateLessons.filter((lesson) => lesson.courseId === course.id);
      expect(new Set(courseLessons.map((lesson) => lesson.slug)).size).toBe(courseLessons.length);
      expect(courseLessons.every((lesson) => lesson.slug.length > 0)).toBe(true);
    }
  });

  it("provides a 20-question final quiz with 75 passing grade", () => {
    const finalQuiz = quizzes.find((quiz) => quiz.id === "quiz-int-incident-response-dasar");
    expect(finalQuiz?.title).toBe("Final Quiz Intermediate");
    expect(finalQuiz?.passingScore).toBe(75);
    expect(finalQuiz?.questionCount).toBe(20);
    expect(questions.filter((question) => question.quizId === finalQuiz?.id)).toHaveLength(20);
  });

  it("keeps total one-time lesson and quiz rewards at or below 500 XP", () => {
    const lessonXp = intermediateLessons.reduce((total, lesson) => total + lesson.xpReward, 0);
    const quizXp = intermediateQuizzes.reduce((total, quiz) => total + quiz.xpReward, 0);
    expect(lessonXp + quizXp).toBe(500);
  });

  it("passes the real seed integrity validator", () => {
    expect(() => validateSeedData(learningPaths, courses, lessons, quizzes, questions)).not.toThrow();
  });
});

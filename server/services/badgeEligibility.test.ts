import { describe, expect, it } from "vitest";
import { ACTIVE_BADGE_DEFINITIONS } from "./badgeDefinitions";
import {
  BadgeEligibilityInput,
  calculateBadgeEligibility,
} from "./badgeEligibility";

function emptyInput(): BadgeEligibilityInput {
  return {
    paths: [],
    courses: [],
    lessons: [],
    quizzes: [],
    simulations: [],
    progress: [],
    quizSummaries: [],
    simulationAttempts: [],
  };
}

function addPath(
  input: BadgeEligibilityInput,
  pathId: string,
  options: {
    pathStatus?: string;
    courseStatus?: string;
    lessonStatus?: string;
    quizStatus?: string;
  } = {}
) {
  const courseId = `${pathId}-course`;
  const lessonId = `${courseId}-lesson`;
  const quizId = `${courseId}-quiz`;
  input.paths.push({ id: pathId, status: options.pathStatus || "published" });
  input.courses.push({
    id: courseId,
    learningPathId: pathId,
    status: options.courseStatus || "published",
  });
  input.lessons.push({
    id: lessonId,
    courseId,
    status: options.lessonStatus || "published",
  });
  input.quizzes.push({
    id: quizId,
    courseId,
    status: options.quizStatus || "published",
  });
  return { courseId, lessonId, quizId };
}

function completeCourse(
  input: BadgeEligibilityInput,
  ids: { courseId: string; lessonId: string; quizId: string }
) {
  input.progress.push(
    { contentType: "course", contentId: ids.courseId, status: "completed" },
    { contentType: "lesson", contentId: ids.lessonId, status: "completed" }
  );
  input.quizSummaries.push({ quizId: ids.quizId, courseId: ids.courseId, passed: true });
}

function result(input: BadgeEligibilityInput, badgeId: string) {
  return calculateBadgeEligibility(input).find((item) => item.badgeId === badgeId)!;
}

describe("badge definitions and server eligibility", () => {
  it("1. exposes exactly four active badge definitions", () => {
    expect(ACTIVE_BADGE_DEFINITIONS).toHaveLength(4);
    expect(ACTIVE_BADGE_DEFINITIONS.every((badge) => badge.status === "active")).toBe(true);
  });

  it("2. uses the four required public names", () => {
    expect(ACTIVE_BADGE_DEFINITIONS.map((badge) => badge.title)).toEqual([
      "Beginner Master",
      "Intermediate Master",
      "Advanced Master",
      "Simulation Defender",
    ]);
  });

  it("3. keeps canonical badge slugs unique", () => {
    const slugs = ACTIVE_BADGE_DEFINITIONS.map((badge) => badge.slug);
    expect(new Set(slugs).size).toBe(4);
  });

  it("4. does not unlock Beginner when no catalog exists", () => {
    expect(result(emptyInput(), "badge-cyber-defender").isEligible).toBe(false);
  });

  it("5. ignores a fake completed path aggregate", () => {
    const input = emptyInput();
    addPath(input, "beginner-path");
    input.progress.push({
      contentType: "path",
      contentId: "beginner-path",
      status: "completed",
    });
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("6. keeps Beginner locked when its quiz has not passed", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path");
    input.progress.push(
      { contentType: "course", contentId: ids.courseId, status: "completed" },
      { contentType: "lesson", contentId: ids.lessonId, status: "completed" }
    );
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("7. unlocks Beginner only after course, lesson, and quiz completion", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path");
    completeCourse(input, ids);
    expect(result(input, "badge-cyber-defender").isEligible).toBe(true);
  });

  it("8. keeps Intermediate locked while incomplete", () => {
    const input = emptyInput();
    addPath(input, "intermediate-path");
    expect(result(input, "badge-intermediate-defender").isEligible).toBe(false);
  });

  it("9. unlocks Intermediate when all requirements are complete", () => {
    const input = emptyInput();
    const ids = addPath(input, "intermediate-path");
    completeCourse(input, ids);
    expect(result(input, "badge-intermediate-defender").isEligible).toBe(true);
  });

  it("10. keeps Advanced locked while incomplete", () => {
    const input = emptyInput();
    addPath(input, "advanced-path");
    expect(result(input, "badge-advanced-specialist").isEligible).toBe(false);
  });

  it("11. unlocks Advanced when all requirements are complete", () => {
    const input = emptyInput();
    const ids = addPath(input, "advanced-path");
    completeCourse(input, ids);
    expect(result(input, "badge-advanced-specialist").isEligible).toBe(true);
  });

  it("12. does not unlock Simulation Defender after one simulation", () => {
    const input = emptyInput();
    input.simulations.push(
      { simulationId: "sim-1", status: "published" },
      { simulationId: "sim-2", status: "published" }
    );
    input.simulationAttempts.push({ simulationId: "sim-1", passed: true });
    expect(result(input, "badge-simulation-analyst").isEligible).toBe(false);
  });

  it("13. unlocks Simulation Defender after all required simulations pass", () => {
    const input = emptyInput();
    input.simulations.push(
      { simulationId: "sim-1", status: "published" },
      { simulationId: "sim-2", status: "published" }
    );
    input.simulationAttempts.push(
      { simulationId: "sim-1", passed: true },
      { simulationId: "sim-2", passed: true }
    );
    expect(result(input, "badge-simulation-analyst").isEligible).toBe(true);
  });

  it("14. does not count failed simulations as complete", () => {
    const input = emptyInput();
    input.simulations.push({ simulationId: "sim-1", status: "published" });
    input.simulationAttempts.push({ simulationId: "sim-1", passed: false });
    expect(result(input, "badge-simulation-analyst").completedItems).toBe(0);
  });

  it("15. deduplicates repeated passed simulation attempts", () => {
    const input = emptyInput();
    input.simulations.push(
      { simulationId: "sim-1", status: "published" },
      { simulationId: "sim-2", status: "published" }
    );
    input.simulationAttempts.push(
      { simulationId: "sim-1", passed: true },
      { simulationId: "sim-1", passed: true }
    );
    const simulation = result(input, "badge-simulation-analyst");
    expect(simulation.completedItems).toBe(1);
    expect(simulation.progressPercent).toBe(50);
  });

  it("16. ignores inactive simulations", () => {
    const input = emptyInput();
    input.simulations.push(
      { simulationId: "sim-live", status: "published" },
      { simulationId: "sim-draft", status: "draft" }
    );
    input.simulationAttempts.push({ simulationId: "sim-live", passed: true });
    expect(result(input, "badge-simulation-analyst").isEligible).toBe(true);
  });

  it("17. ignores unknown simulation attempts", () => {
    const input = emptyInput();
    input.simulations.push({ simulationId: "sim-required", status: "published" });
    input.simulationAttempts.push({ simulationId: "sim-unknown", passed: true });
    expect(result(input, "badge-simulation-analyst").completedItems).toBe(0);
  });

  it("18. ignores inactive courses when calculating a path", () => {
    const input = emptyInput();
    const live = addPath(input, "beginner-path");
    input.courses.push({
      id: "draft-course",
      learningPathId: "beginner-path",
      status: "draft",
    });
    completeCourse(input, live);
    expect(result(input, "badge-cyber-defender").isEligible).toBe(true);
  });

  it("19. ignores inactive lessons when calculating a course", () => {
    const input = emptyInput();
    const live = addPath(input, "beginner-path");
    input.lessons.push({
      id: "draft-lesson",
      courseId: live.courseId,
      status: "draft",
    });
    completeCourse(input, live);
    expect(result(input, "badge-cyber-defender").isEligible).toBe(true);
  });

  it("20. ignores inactive quizzes when calculating a course", () => {
    const input = emptyInput();
    const live = addPath(input, "beginner-path");
    input.quizzes.push({
      id: "draft-quiz",
      courseId: live.courseId,
      status: "draft",
    });
    completeCourse(input, live);
    expect(result(input, "badge-cyber-defender").isEligible).toBe(true);
  });

  it("21. refuses to unlock a draft learning path", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path", { pathStatus: "draft" });
    completeCourse(input, ids);
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("22. requires at least one published lesson per required course", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path", { lessonStatus: "draft" });
    input.progress.push({ contentType: "course", contentId: ids.courseId, status: "completed" });
    input.quizSummaries.push({ quizId: ids.quizId, courseId: ids.courseId, passed: true });
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("23. requires at least one published quiz per required course", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path", { quizStatus: "draft" });
    input.progress.push(
      { contentType: "course", contentId: ids.courseId, status: "completed" },
      { contentType: "lesson", contentId: ids.lessonId, status: "completed" }
    );
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("24. does not accept a passed quiz belonging to another quiz id", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path");
    input.progress.push(
      { contentType: "course", contentId: ids.courseId, status: "completed" },
      { contentType: "lesson", contentId: ids.lessonId, status: "completed" }
    );
    input.quizSummaries.push({
      quizId: "other-quiz",
      courseId: ids.courseId,
      passed: true,
    });
    expect(result(input, "badge-cyber-defender").isEligible).toBe(false);
  });

  it("25. never lets duplicate progress records exceed 100 percent", () => {
    const input = emptyInput();
    const ids = addPath(input, "beginner-path");
    completeCourse(input, ids);
    completeCourse(input, ids);
    const beginner = result(input, "badge-cyber-defender");
    expect(beginner.completedItems).toBe(1);
    expect(beginner.progressPercent).toBe(100);
  });

  it("26. returns zero progress when no required simulation is active", () => {
    const simulation = result(emptyInput(), "badge-simulation-analyst");
    expect(simulation.progressPercent).toBe(0);
    expect(simulation.isEligible).toBe(false);
  });

  it("27. keeps path progress non-negative for incomplete data", () => {
    const beginner = result(emptyInput(), "badge-cyber-defender");
    expect(beginner.progressPercent).toBeGreaterThanOrEqual(0);
  });
});

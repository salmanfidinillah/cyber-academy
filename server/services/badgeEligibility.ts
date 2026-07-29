import {
  ACTIVE_BADGE_DEFINITIONS,
  ActiveBadgeDefinition,
} from "./badgeDefinitions";

export interface BadgeCatalogPath {
  id: string;
  status: string;
}

export interface BadgeCatalogCourse {
  id: string;
  learningPathId: string;
  status: string;
}

export interface BadgeCatalogLesson {
  id: string;
  courseId: string;
  status: string;
}

export interface BadgeCatalogQuiz {
  id: string;
  courseId: string;
  status: string;
}

export interface BadgeCatalogSimulation {
  simulationId: string;
  status: string;
}

export interface BadgeProgressRecord {
  contentType: string;
  contentId: string;
  status: string;
}

export interface BadgeQuizSummary {
  quizId?: string;
  courseId?: string;
  passed: boolean;
}

export interface BadgeSimulationAttempt {
  simulationId: string;
  passed: boolean;
}

export interface BadgeEligibilityInput {
  paths: BadgeCatalogPath[];
  courses: BadgeCatalogCourse[];
  lessons: BadgeCatalogLesson[];
  quizzes: BadgeCatalogQuiz[];
  simulations: BadgeCatalogSimulation[];
  progress: BadgeProgressRecord[];
  quizSummaries: BadgeQuizSummary[];
  simulationAttempts: BadgeSimulationAttempt[];
}

export interface BadgeProgressResult {
  badgeId: string;
  badgeSlug: string;
  title: string;
  requirementType: string;
  requirementValue: string;
  completedItems: number;
  totalItems: number;
  progressPercent: number;
  isEligible: boolean;
  breakdown: {
    coursesCompleted?: number;
    totalCourses?: number;
    lessonsCompleted?: number;
    totalLessons?: number;
    quizzesPassed?: number;
    totalQuizzes?: number;
    simulationsPassed?: number;
    totalSimulations?: number;
  };
}

function clampPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

function evaluateLearningPath(
  definition: ActiveBadgeDefinition,
  input: BadgeEligibilityInput
): BadgeProgressResult {
  const path = input.paths.find(
    (item) => item.id === definition.requirementValue && item.status === "published"
  );
  const courses = path
    ? input.courses.filter(
        (course) =>
          course.learningPathId === definition.requirementValue &&
          course.status === "published"
      )
    : [];
  const courseIds = new Set(courses.map((course) => course.id));
  const lessons = input.lessons.filter(
    (lesson) => courseIds.has(lesson.courseId) && lesson.status === "published"
  );
  const quizzes = input.quizzes.filter(
    (quiz) => courseIds.has(quiz.courseId) && quiz.status === "published"
  );
  const completedCourseIds = new Set(
    input.progress
      .filter(
        (record) =>
          record.contentType === "course" &&
          record.status === "completed" &&
          courseIds.has(record.contentId)
      )
      .map((record) => record.contentId)
  );
  const completedLessonIds = new Set(
    input.progress
      .filter(
        (record) =>
          record.contentType === "lesson" &&
          record.status === "completed" &&
          lessons.some((lesson) => lesson.id === record.contentId)
      )
      .map((record) => record.contentId)
  );
  const passedQuizIds = new Set(
    input.quizSummaries
      .filter((summary) => summary.passed === true && summary.quizId)
      .map((summary) => summary.quizId as string)
  );

  const completedCourses = courses.filter((course) => {
    const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
    const courseQuizzes = quizzes.filter((quiz) => quiz.courseId === course.id);
    const allLessonsComplete =
      courseLessons.length > 0 &&
      courseLessons.every((lesson) => completedLessonIds.has(lesson.id));
    const allQuizzesPassed =
      courseQuizzes.length > 0 &&
      courseQuizzes.every((quiz) => passedQuizIds.has(quiz.id));
    return completedCourseIds.has(course.id) && allLessonsComplete && allQuizzesPassed;
  });

  const lessonsCompleted = lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const quizzesPassed = quizzes.filter((quiz) => passedQuizIds.has(quiz.id)).length;
  const isEligible =
    Boolean(path) &&
    courses.length > 0 &&
    completedCourses.length === courses.length;

  return {
    badgeId: definition.badgeId,
    badgeSlug: definition.slug,
    title: definition.title,
    requirementType: definition.requirementType,
    requirementValue: definition.requirementValue,
    completedItems: completedCourses.length,
    totalItems: courses.length,
    progressPercent: clampPercent(completedCourses.length, courses.length),
    isEligible,
    breakdown: {
      coursesCompleted: completedCourseIds.size,
      totalCourses: courses.length,
      lessonsCompleted,
      totalLessons: lessons.length,
      quizzesPassed,
      totalQuizzes: quizzes.length,
    },
  };
}

function evaluateSimulations(
  definition: ActiveBadgeDefinition,
  input: BadgeEligibilityInput
): BadgeProgressResult {
  const requiredIds = new Set(
    input.simulations
      .filter((simulation) => simulation.status === "published")
      .map((simulation) => simulation.simulationId)
  );
  const passedIds = new Set(
    input.simulationAttempts
      .filter(
        (attempt) =>
          attempt.passed === true && requiredIds.has(attempt.simulationId)
      )
      .map((attempt) => attempt.simulationId)
  );
  const completed = passedIds.size;
  const total = requiredIds.size;

  return {
    badgeId: definition.badgeId,
    badgeSlug: definition.slug,
    title: definition.title,
    requirementType: definition.requirementType,
    requirementValue: definition.requirementValue,
    completedItems: completed,
    totalItems: total,
    progressPercent: clampPercent(completed, total),
    isEligible: total > 0 && completed === total,
    breakdown: {
      simulationsPassed: completed,
      totalSimulations: total,
    },
  };
}

export function calculateBadgeEligibility(
  input: BadgeEligibilityInput
): BadgeProgressResult[] {
  return ACTIVE_BADGE_DEFINITIONS.map((definition) =>
    definition.requirementType === "learning_path_completion"
      ? evaluateLearningPath(definition, input)
      : evaluateSimulations(definition, input)
  );
}

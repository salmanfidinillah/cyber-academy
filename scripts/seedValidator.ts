import { normalizeSlug } from "../server/validation/contentSchemas.js";

export interface SeedItem {
  collection: "learningPaths" | "courses" | "lessons" | "quizzes" | "questions";
  id: string;
  data: any;
}

export interface SeedPlan {
  totalSource: number;
  existing: number;
  itemsToCreate: SeedItem[];
  itemsToUpdate: SeedItem[];
  unexpectedExistingIds: string[];
  operations: Array<{
    type: "set";
    mode: "create" | "update";
    collection: string;
    id: string;
    data: any;
  }>;
}

function assertSequentialOrder(scope: string, items: any[]): void {
  const actual = items
    .map((item) => Number(item.order))
    .sort((first, second) => first - second);
  const expected = Array.from({ length: items.length }, (_, index) => index + 1);

  if (
    actual.some((order) => !Number.isInteger(order) || order < 1) ||
    actual.some((order, index) => order !== expected[index])
  ) {
    throw new Error(
      `Invalid order in ${scope}. Expected ${expected.join(", ")}, received ${actual.join(", ")}.`,
    );
  }
}

export function validateSeedData(
  learningPathsData: any[],
  coursesData: any[],
  lessonsData: any[],
  quizzesData: any[] = [],
  questionsData: any[] = []
): boolean {
  // 1. Document IDs only need to be unique inside their own Firestore collection.
  // courses/foo and quizzes/foo are different, valid document identities.
  const collectionsData = [
    { name: "learningPaths", items: learningPathsData },
    { name: "courses", items: coursesData },
    { name: "lessons", items: lessonsData },
    { name: "quizzes", items: quizzesData },
    { name: "questions", items: questionsData },
  ];

  for (const col of collectionsData) {
    const collectionIds = new Set<string>();
    for (const item of col.items) {
      if (collectionIds.has(item.id)) {
        throw new Error(`Duplicate ID found in ${col.name}: ${item.id}`);
      }
      collectionIds.add(item.id);
    }
  }

  // 2. Check duplicate slugs
  const lpSlugs = new Set<string>();
  for (const lp of learningPathsData) {
    const slug = lp.slug || lp.id;
    if (lpSlugs.has(slug)) {
      throw new Error(`Duplicate slug in learningPaths: ${slug}`);
    }
    lpSlugs.add(slug);
  }

  const courseSlugs = new Set<string>();
  for (const c of coursesData) {
    const slug = c.slug || c.id;
    if (courseSlugs.has(slug)) {
      throw new Error(`Duplicate course slug globally: ${slug}`);
    }
    courseSlugs.add(slug);
  }

  const lessonSlugScope = new Set<string>();
  for (const l of lessonsData) {
    const slug = l.slug || normalizeSlug(l.title) || l.id;
    const key = `${l.courseId}:${slug}`;
    if (lessonSlugScope.has(key)) {
      throw new Error(`Duplicate lesson slug within course (${l.courseId}): ${slug}`);
    }
    lessonSlugScope.add(key);
  }

  // 3. Parent ID existence checks
  const pathIds = new Set(learningPathsData.map((lp) => lp.id));
  for (const c of coursesData) {
    const parentPathId = c.learningPathId || "beginner-path";
    if (!pathIds.has(parentPathId)) {
      throw new Error(`Parent learningPathId '${parentPathId}' for course '${c.id}' not found.`);
    }
  }

  const courseIds = new Set(coursesData.map((c) => c.id));
  for (const l of lessonsData) {
    if (!courseIds.has(l.courseId)) {
      throw new Error(`Parent courseId '${l.courseId}' for lesson '${l.id}' not found.`);
    }
  }

  if (quizzesData.length > 0) {
    const quizIds = new Set(quizzesData.map((q) => q.id));
    const quizById = new Map(quizzesData.map((quiz) => [quiz.id, quiz]));
    const lessonById = new Map(lessonsData.map((lesson) => [lesson.id, lesson]));
    for (const q of quizzesData) {
      if (!courseIds.has(q.courseId)) {
        throw new Error(`Parent courseId '${q.courseId}' for quiz '${q.id}' not found.`);
      }
    }

    for (const qn of questionsData) {
      if (!quizIds.has(qn.quizId)) {
        throw new Error(`Parent quizId '${qn.quizId}' for question '${qn.id}' not found.`);
      }
      if (!courseIds.has(qn.courseId)) {
        throw new Error(`Parent courseId '${qn.courseId}' for question '${qn.id}' not found.`);
      }
      const parentQuiz = quizById.get(qn.quizId);
      if (parentQuiz?.courseId !== qn.courseId) {
        throw new Error(
          `Question '${qn.id}' courseId '${qn.courseId}' does not match quiz '${qn.quizId}' courseId '${parentQuiz?.courseId}'.`,
        );
      }
      const options = qn.options || [];
      if (options.length < 2 || options.length > 6) {
        throw new Error(`Question '${qn.id}' must have between 2 and 6 options.`);
      }
      const optionIds = new Set(options.map((o: any) => o.id));
      if (optionIds.size !== options.length) {
        throw new Error(`Question '${qn.id}' has duplicate option IDs.`);
      }
      if (!optionIds.has(qn.correctOptionId)) {
        throw new Error(`Question '${qn.id}' correctOptionId '${qn.correctOptionId}' not found in options.`);
      }
      if (qn.recommendedLessonId) {
        const recommendedLesson = lessonById.get(qn.recommendedLessonId);
        if (!recommendedLesson) {
          throw new Error(
            `Question '${qn.id}' recommendedLessonId '${qn.recommendedLessonId}' not found.`,
          );
        }
      }
    }
  }

  // 4. Counts and display order must be derived from the real child data.
  for (const path of learningPathsData) {
    const pathCourses = coursesData.filter(
      (course) => (course.learningPathId || "beginner-path") === path.id,
    );
    if (pathCourses.length === 0) {
      throw new Error(`Learning path '${path.id}' has no courses.`);
    }
    if (path.courseCount !== undefined && path.courseCount !== pathCourses.length) {
      throw new Error(
        `Learning path '${path.id}' courseCount is ${path.courseCount}, expected ${pathCourses.length}.`,
      );
    }
    assertSequentialOrder(`courses of learning path '${path.id}'`, pathCourses);
  }

  for (const course of coursesData) {
    const courseLessons = lessonsData.filter((lesson) => lesson.courseId === course.id);
    const courseQuizzes = quizzesData.filter((quiz) => quiz.courseId === course.id);
    if (courseLessons.length === 0) {
      throw new Error(`Course '${course.id}' has no lessons.`);
    }
    if (course.lessonCount !== undefined && course.lessonCount !== courseLessons.length) {
      throw new Error(
        `Course '${course.id}' lessonCount is ${course.lessonCount}, expected ${courseLessons.length}.`,
      );
    }
    if (quizzesData.length > 0 && courseQuizzes.length !== 1) {
      throw new Error(
        `Course '${course.id}' must have exactly one quiz, found ${courseQuizzes.length}.`,
      );
    }
    assertSequentialOrder(`lessons of course '${course.id}'`, courseLessons);
  }

  for (const quiz of quizzesData) {
    const quizQuestions = questionsData.filter((question) => question.quizId === quiz.id);
    if (quizQuestions.length === 0) {
      throw new Error(`Quiz '${quiz.id}' has no questions.`);
    }
    if (quiz.questionCount !== undefined && quiz.questionCount !== quizQuestions.length) {
      throw new Error(
        `Quiz '${quiz.id}' questionCount is ${quiz.questionCount}, expected ${quizQuestions.length}.`,
      );
    }
    assertSequentialOrder(`questions of quiz '${quiz.id}'`, quizQuestions);
  }

  return true;
}

export function buildSeedItemPayloads(
  learningPathsData: any[],
  coursesData: any[],
  lessonsData: any[],
  quizzesData: any[] = [],
  questionsData: any[] = []
): SeedItem[] {
  const items: SeedItem[] = [];

  for (let i = 0; i < learningPathsData.length; i++) {
    const lp = learningPathsData[i];
    const courseCount = coursesData.filter((c) => (c.learningPathId || "beginner-path") === lp.id).length;
    items.push({
      collection: "learningPaths",
      id: lp.id,
      data: {
        title: lp.title,
        searchTitle: lp.title.toLowerCase(),
        slug: lp.id,
        description: lp.description || "",
        shortDescription: lp.description ? lp.description.substring(0, 300) : "",
        level: lp.level || "Beginner",
        estimatedDuration: lp.durationMinutes || 120,
        thumbnailURL: "",
        status: "published",
        order: i + 1,
        xpReward: lp.xpReward || 300,
        badgeName: lp.badgeName || "",
        bgColor: lp.bgColor || "bg-pastel-mint",
        courseCount,
        createdBy: "system_seed",
        updatedBy: "system_seed",
      },
    });
  }

  for (let i = 0; i < coursesData.length; i++) {
    const c = coursesData[i];
    const actualLessonCount = lessonsData.filter((l) => l.courseId === c.id).length;
    items.push({
      collection: "courses",
      id: c.id,
      data: {
        learningPathId: c.learningPathId || "beginner-path",
        title: c.title,
        searchTitle: c.title.toLowerCase(),
        slug: c.slug || c.id,
        description: c.description || "",
        shortDescription: c.description ? c.description.substring(0, 300) : "",
        category: c.category || "General",
        level: c.level || "beginner",
        estimatedDuration: c.estimatedDuration || 30,
        thumbnailURL: "",
        status: "published",
        order: c.order || i + 1,
        xpReward: c.xpReward || 50,
        learningOutcomes: Array.isArray(c.learningOutcomes) ? c.learningOutcomes : [],
        lessonCount: actualLessonCount,
        createdBy: "system_seed",
        updatedBy: "system_seed",
      },
    });
  }

  for (let i = 0; i < lessonsData.length; i++) {
    const l = lessonsData[i];
    const parentCourse = coursesData.find((c) => c.id === l.courseId);
    const parentPathId = parentCourse?.learningPathId || l.learningPathId || "beginner-path";
    items.push({
      collection: "lessons",
      id: l.id,
      data: {
        courseId: l.courseId,
        learningPathId: parentPathId,
        title: l.title,
        searchTitle: l.title.toLowerCase(),
        slug: l.slug || normalizeSlug(l.title),
        summary: l.objective || "",
        objective: l.objective || "",
        content: l.content || "",
        contentType: "text",
        estimatedDuration: l.estimatedDuration || 10,
        status: "published",
        order: l.order || i + 1,
        xpReward: l.xpReward || 15,
        exampleCase: l.exampleCase || null,
        securityTips: Array.isArray(l.securityTips) ? l.securityTips : [],
        keyTakeaways: Array.isArray(l.keyTakeaways) ? l.keyTakeaways : [],
        createdBy: "system_seed",
        updatedBy: "system_seed",
      },
    });
  }

  for (const q of quizzesData) {
    const questionCount = questionsData.filter((qn) => qn.quizId === q.id).length;
    items.push({
      collection: "quizzes",
      id: q.id,
      data: {
        courseId: q.courseId,
        title: q.title,
        description: q.description || "",
        passingScore: q.passingScore ?? 70,
        xpReward: q.xpReward ?? 30,
        questionCount,
        status: q.status || "published",
        createdBy: "system_seed",
        updatedBy: "system_seed",
      },
    });
  }

  for (const qn of questionsData) {
    items.push({
      collection: "questions",
      id: qn.id,
      data: {
        quizId: qn.quizId,
        courseId: qn.courseId,
        questionText: qn.questionText,
        options: qn.options,
        correctOptionId: qn.correctOptionId,
        explanation: qn.explanation,
        recommendedLessonId: qn.recommendedLessonId || null,
        order: qn.order || 1,
        status: qn.status || "published",
        createdBy: "system_seed",
        updatedBy: "system_seed",
      },
    });
  }

  return items;
}

export function planSeedOperations(
  learningPathsData: any[],
  coursesData: any[],
  lessonsData: any[],
  existingDocIds: Set<string>,
  quizzesData: any[] = [],
  questionsData: any[] = []
): SeedPlan {
  validateSeedData(learningPathsData, coursesData, lessonsData, quizzesData, questionsData);

  const allSeedItems = buildSeedItemPayloads(learningPathsData, coursesData, lessonsData, quizzesData, questionsData);
  const totalSource = allSeedItems.length;

  const itemsToCreate: SeedItem[] = [];
  const itemsToUpdate: SeedItem[] = [];
  const sourceKeys = new Set(allSeedItems.map((item) => `${item.collection}/${item.id}`));

  for (const item of allSeedItems) {
    const compositeKey = `${item.collection}/${item.id}`;
    if (existingDocIds.has(compositeKey)) {
      itemsToUpdate.push(item);
    } else {
      itemsToCreate.push(item);
    }
  }

  const unexpectedExistingIds = [...existingDocIds]
    .filter((compositeKey) => !sourceKeys.has(compositeKey))
    .sort();

  const operations = allSeedItems.map((item) => ({
    type: "set" as const,
    mode: existingDocIds.has(`${item.collection}/${item.id}`)
      ? ("update" as const)
      : ("create" as const),
    collection: item.collection,
    id: item.id,
    data: item.data,
  }));

  return {
    totalSource,
    existing: itemsToUpdate.length,
    itemsToCreate,
    itemsToUpdate,
    unexpectedExistingIds,
    operations,
  };
}

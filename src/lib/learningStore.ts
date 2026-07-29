// Client Learning Store for Gamification & Content Progress
// Manages local state for learning progress, XP, streak, quiz attempts, simulations, badges, certificates, and AI tutor cache per Firebase UID.

import { courses, lessons } from "../data";
import { quizzes, questions, questionToLessonMap } from "../quiz_data";
import { authenticatedFetch } from "../services/apiClient";
import {
  fetchCatalogCourseById,
  fetchCatalogCoursesForPath,
  fetchCatalogLessonById,
  fetchCatalogLessonsForCourse,
} from "../services/catalogService";
import { completeMyLesson, resetMyLearningState } from "../services/learningStateService";
import type { LearningInsight } from "../types";

export interface UserLearningStats {
  totalXp: number;
  currentLevel: number;
  learningStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getLearningStats = (userId: string): UserLearningStats => {
  if (!userId || !userId.trim()) {
    throw new Error("User ID tidak boleh kosong.");
  }
  const key = `cyber_academy_learning_stats_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }

  const now = new Date().toISOString();
  const defaultStats: UserLearningStats = {
    totalXp: 0,
    currentLevel: 1,
    learningStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(key, JSON.stringify(defaultStats));
  return defaultStats;
};

export const saveLearningStats = (userId: string, stats: UserLearningStats) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const key = `cyber_academy_learning_stats_${userId}`;
  localStorage.setItem(key, JSON.stringify(stats));
};

// USER-SPECIFIC STORAGE KEYS BASE NAMES
const USER_KEY_BASES = {
  PROGRESS: "cyber_academy_progress",
  XP_TRANSACTIONS: "cyber_academy_xp_transactions",
  QUIZ_ATTEMPTS: "cyber_academy_quiz_attempts",
  QUIZ_SUMMARIES: "cyber_academy_quiz_summaries",
  SIMULATION_ATTEMPTS: "cyber_academy_simulation_attempts",
  AI_CONVERSATIONS: "cyber_academy_ai_conversations",
  AI_MESSAGES: "cyber_academy_ai_messages",
  USER_BADGES: "cyber_academy_user_badges",
  CERTIFICATES: "cyber_academy_certificates",
};

function userStorageKey(base: string, uid: string): string {
  if (!uid || !uid.trim()) {
    throw new Error("UID tidak boleh kosong.");
  }
  return `${base}_${uid.trim()}`;
}

// SAFE MIGRATION HELPER
function ensureMigrated(uid: string): void {
  if (!uid || !uid.trim()) return;
  const cleanUid = uid.trim();
  const markerKey = `cyber_academy_storage_migrated_${cleanUid}`;
  if (localStorage.getItem(markerKey)) return;

  const migrateCollection = (legacyKey: string, newBase: string) => {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const userMap: Record<string, any> = {};
        Object.entries(parsed).forEach(([k, v]: [string, any]) => {
          if (v && v.userId === cleanUid) {
            userMap[k] = v;
          }
        });
        const targetKey = userStorageKey(newBase, cleanUid);
        if (!localStorage.getItem(targetKey) && Object.keys(userMap).length > 0) {
          localStorage.setItem(targetKey, JSON.stringify(userMap));
        }
      }
    } catch (e) {}
  };

  migrateCollection("cyber_academy_firestore_progress", USER_KEY_BASES.PROGRESS);
  migrateCollection("cyber_academy_firestore_xp_transactions", USER_KEY_BASES.XP_TRANSACTIONS);
  migrateCollection("cyber_academy_firestore_quiz_attempts", USER_KEY_BASES.QUIZ_ATTEMPTS);
  migrateCollection("cyber_academy_firestore_quiz_summaries", USER_KEY_BASES.QUIZ_SUMMARIES);
  migrateCollection("cyber_academy_firestore_simulation_attempts", USER_KEY_BASES.SIMULATION_ATTEMPTS);
  migrateCollection("cyber_academy_firestore_ai_conversations", USER_KEY_BASES.AI_CONVERSATIONS);
  migrateCollection("cyber_academy_firestore_ai_messages", USER_KEY_BASES.AI_MESSAGES);

  // User Badges legacy key: cyber_academy_firestore_user_badges_${uid}
  const legacyBadges = localStorage.getItem(`cyber_academy_firestore_user_badges_${cleanUid}`);
  if (legacyBadges) {
    try {
      const parsed = JSON.parse(legacyBadges);
      const targetKey = userStorageKey(USER_KEY_BASES.USER_BADGES, cleanUid);
      if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, JSON.stringify(parsed));
      }
    } catch (e) {}
  }

  // Certificates legacy key: cyber_academy_firestore_certificates_${uid}
  const legacyCerts = localStorage.getItem(`cyber_academy_firestore_certificates_${cleanUid}`);
  if (legacyCerts) {
    try {
      const parsed = JSON.parse(legacyCerts);
      const targetKey = userStorageKey(USER_KEY_BASES.CERTIFICATES, cleanUid);
      if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, JSON.stringify(parsed));
      }
    } catch (e) {}
  }

  localStorage.setItem(markerKey, "true");
}

// UID-BASED STORAGE ACCESSORS
export const getUserProgress = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.PROGRESS, userId));
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {}
  return {};
};

const saveUserProgress = (userId: string, progress: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.PROGRESS, userId), JSON.stringify(progress));
};

export const getUserXpTransactions = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.XP_TRANSACTIONS, userId));
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {}
  return {};
};

const saveUserXpTransactions = (userId: string, transactions: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.XP_TRANSACTIONS, userId), JSON.stringify(transactions));
};

// LEGACY_PENDING_B2B: Quiz progress & attempts bridges needed for B2B quiz module
export const getUserQuizAttempts = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.QUIZ_ATTEMPTS, userId));
  return data ? JSON.parse(data) : {};
};

const saveUserQuizAttempts = (userId: string, attempts: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.QUIZ_ATTEMPTS, userId), JSON.stringify(attempts));
};

// LEGACY_PENDING_B2B: Quiz summaries storage helper needed for B2B quiz module
export const getUserQuizSummaries = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.QUIZ_SUMMARIES, userId));
  return data ? JSON.parse(data) : {};
};

const saveUserQuizSummaries = (userId: string, summaries: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.QUIZ_SUMMARIES, userId), JSON.stringify(summaries));
};

export const getUserSimulationAttempts = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.SIMULATION_ATTEMPTS, userId));
  return data ? JSON.parse(data) : {};
};

const saveUserSimulationAttempts = (userId: string, attempts: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.SIMULATION_ATTEMPTS, userId), JSON.stringify(attempts));
};

export const getUserAiConversations = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.AI_CONVERSATIONS, userId));
  return data ? JSON.parse(data) : {};
};

const saveUserAiConversations = (userId: string, conversations: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.AI_CONVERSATIONS, userId), JSON.stringify(conversations));
};

export const getUserAiMessages = (userId: string): Record<string, any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  ensureMigrated(userId);
  const data = localStorage.getItem(userStorageKey(USER_KEY_BASES.AI_MESSAGES, userId));
  return data ? JSON.parse(data) : {};
};

const saveUserAiMessages = (userId: string, messages: Record<string, any>) => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  localStorage.setItem(userStorageKey(USER_KEY_BASES.AI_MESSAGES, userId), JSON.stringify(messages));
};

// Date & Time helpers for Asia/Jakarta timezone
export const getJakartaDateString = (): string => {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // "YYYY-MM-DD"
};

export const getJakartaDaysDifference = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(`${dateStr1}T00:00:00Z`);
  const d2 = new Date(`${dateStr2}T00:00:00Z`);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateLevel = (xp: number): number => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 450) return 3;
  if (xp < 700) return 4;
  return 5;
};

export const getLevelMinXp = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 450;
  return 700;
};

export const getLevelMaxXp = (level: number): number => {
  if (level <= 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 450;
  if (level === 4) return 700;
  return 1000;
};

export const getLevelProgressPercent = (xp: number): number => {
  const lvl = calculateLevel(xp);
  if (lvl >= 5) return 100;
  const minXp = getLevelMinXp(lvl);
  const maxXp = getLevelMaxXp(lvl);
  const range = maxXp - minXp;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, Math.floor(((xp - minXp) / range) * 100)));
};

export const getXpNeededForNextLevel = (xp: number): number => {
  const lvl = calculateLevel(xp);
  if (lvl >= 5) return 0;
  const maxXp = getLevelMaxXp(lvl);
  return Math.max(0, maxXp - xp);
};

// API: Get user progress list
export const getUserProgressList = async (userId: string): Promise<any[]> => {
  const progressDb = getUserProgress(userId);
  return Object.values(progressDb).filter((p: any) => p.userId === userId);
};

// API: Get XP transactions list
export const getXpTransactions = async (userId: string): Promise<any[]> => {
  const transDb = getUserXpTransactions(userId);
  return Object.values(transDb)
    .filter((t: any) => t.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// API: Get progress for a specific course
export const getCourseProgress = async (userId: string, courseId: string): Promise<any | null> => {
  const progressDb = getUserProgress(userId);
  const key = `${userId}_course_${courseId}`;
  return progressDb[key] || null;
};

// API: Check if a course is locked
export const isCourseLocked = async (userId: string, courseId: string, pathId?: string): Promise<boolean> => {
  const targetCourse = await fetchCatalogCourseById(courseId);
  if (!targetCourse || targetCourse.status !== "published") return true;

  const actualPathId = targetCourse.learningPathId || pathId;
  if (!actualPathId) return true;

  const pathCourses = await fetchCatalogCoursesForPath(actualPathId);
  if (!pathCourses || pathCourses.length === 0) return true;

  pathCourses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const targetIndex = pathCourses.findIndex(c => c.id === courseId);
  if (targetIndex === -1) {
    return true;
  }

  // Course index 0 is always unlocked
  if (targetIndex === 0) return false;

  const prevCourse = pathCourses[targetIndex - 1];
  const progressDb = getUserProgress(userId);

  // If the previous course is completed, it is unlocked!
  const prevCourseKey = `${userId}_course_${prevCourse.id}`;
  const prevCourseProgress = progressDb[prevCourseKey];
  if (prevCourseProgress && prevCourseProgress.status === "completed") {
    return false;
  }
  
  // 1. Check if all lessons in the previous course are completed
  const prevCourseLessons = await fetchCatalogLessonsForCourse(prevCourse.id);
  if (prevCourseLessons.length === 0) return false;

  const allLessonsCompleted = prevCourseLessons.every(l => {
    const lessonKey = `${userId}_lesson_${l.id}`;
    return progressDb[lessonKey] && progressDb[lessonKey].status === "completed";
  });

  if (!allLessonsCompleted) return true;

  // 2. Check if previous course quiz is passed (score >= 70)
  const summariesDb = getUserQuizSummaries(userId);
  const summaryKey = `${userId}_quiz_${prevCourse.id}`;
  const prevQuizSummary = summariesDb[summaryKey];

  return !prevQuizSummary || !prevQuizSummary.passed || prevQuizSummary.bestScore < 70;
};

// Core atomic helper for XP awarding and study streak handling
export const awardXpAndProcessStreak = async (
  userId: string,
  activityType: "lesson_completion" | "quiz_first_pass" | "simulation_first_completion" | "daily_challenge_completion" | "course_completion" | "learning_path_completion",
  activityId: string,
  amount: number,
  reason: string,
  progressUpdates?: () => void
): Promise<{ xpEarned: number; totalXp: number; levelUp: boolean; currentLevel: number; learningStreak: number; alreadyRewarded: boolean }> => {
  const stats = getLearningStats(userId);

  let keyType = activityType;
  if (activityType === "simulation_first_completion") {
    keyType = "simulation_completion" as any;
  } else if (activityType === "daily_challenge_completion") {
    keyType = "daily_challenge" as any;
  } else if (activityType === "learning_path_completion") {
    keyType = "path_completion" as any;
  }

  const idempotencyKey = `${keyType}:${userId}:${activityId}`;
  const transactionsDb = getUserXpTransactions(userId);

  const alreadyExists = Object.values(transactionsDb).some(
    (tx: any) => tx.idempotencyKey === idempotencyKey
  );

  let xpEarned = 0;
  let levelUp = false;
  const now = new Date().toISOString();

  if (!alreadyExists && amount > 0) {
    xpEarned = amount;

    const txId = `tx_${Math.random().toString(36).substring(2, 11)}`;
    transactionsDb[txId] = {
      transactionId: txId,
      userId,
      sourceType: activityType,
      sourceId: activityId,
      amount,
      reason,
      idempotencyKey,
      createdAt: now,
    };

    const oldXp = stats.totalXp || 0;
    const newXp = oldXp + xpEarned;
    const oldLevel = stats.currentLevel || 1;
    const newLevel = calculateLevel(newXp);
    
    if (newLevel > oldLevel) {
      levelUp = true;
    }

    stats.totalXp = newXp;
    stats.currentLevel = newLevel;
  }

  const todayStr = getJakartaDateString();
  const lastStudyDate = stats.lastStudyDate;

  if (!lastStudyDate) {
    stats.learningStreak = 1;
    stats.lastStudyDate = todayStr;
  } else {
    const diff = getJakartaDaysDifference(lastStudyDate, todayStr);
    if (diff === 1) {
      stats.learningStreak = (stats.learningStreak || 0) + 1;
      stats.lastStudyDate = todayStr;
    } else if (diff > 1) {
      stats.learningStreak = 1;
      stats.lastStudyDate = todayStr;
    } else if (diff < 0) {
      stats.learningStreak = 1;
      stats.lastStudyDate = todayStr;
    }
  }

  stats.longestStreak = Math.max(stats.longestStreak || 0, stats.learningStreak || 0);
  stats.lastActiveAt = now;
  stats.updatedAt = now;

  if (progressUpdates) {
    progressUpdates();
  }

  saveLearningStats(userId, stats);
  saveUserXpTransactions(userId, transactionsDb);

  return {
    xpEarned,
    totalXp: stats.totalXp,
    levelUp,
    currentLevel: stats.currentLevel,
    learningStreak: stats.learningStreak,
    alreadyRewarded: alreadyExists,
  };
};

// API: Complete Lesson with full Idempotency & Progress Recalculation
export const completeLesson = async (
  userId: string,
  lessonId: string,
  courseIdInput?: string,
  pathIdInput?: string
): Promise<{
  xpEarned: number;
  totalXp: number;
  levelUp: boolean;
  currentLevel: number;
  learningStreak: number;
  alreadyRewarded: boolean;
  courseCompleted: boolean;
}> => {
  const res = await completeMyLesson(lessonId);

  return {
    xpEarned: res.xpEarned,
    totalXp: res.totalXp,
    levelUp: res.levelUp,
    currentLevel: res.currentLevel,
    learningStreak: res.learningStreak,
    alreadyRewarded: res.alreadyCompleted,
    courseCompleted: res.courseProgress?.status === "completed",
  };
};

// Helper: Reset progress for testing
export const resetUserProgress = async (userId: string): Promise<void> => {
  await resetMyLearningState("RESET_MY_PROGRESS");

  try {
    localStorage.removeItem(`cyber_academy_${userId}_learning_progress_v2`);
    localStorage.removeItem(`cyber_academy_${userId}_xp_transactions_v2`);
  } catch (e) {
    console.error("Failed to clear local progress storage:", e);
  }
};

// API: Complete Course (Quiz Pass)
export const updateCourseProgress = async (
  userId: string,
  courseId: string,
  pathIdInput: string,
  status: "completed" | "in_progress"
): Promise<{ xpEarned: number; totalXp: number; levelUp: boolean; currentLevel: number }> => {
  const targetCourse = await fetchCatalogCourseById(courseId);
  if (!targetCourse || targetCourse.status !== "published") {
    throw new Error("Kelas tidak ditemukan.");
  }

  const learningPathId = targetCourse.learningPathId || pathIdInput;
  const pathCourses = await fetchCatalogCoursesForPath(learningPathId);

  const progressDb = getUserProgress(userId);
  const now = new Date().toISOString();
  const courseKey = `${userId}_course_${courseId}`;
  const existingCourseProgress = progressDb[courseKey];
  const wasCourseCompleted = existingCourseProgress?.status === "completed";

  let pathCompleted = false;

  const quizReward = 30;
  const courseReward = targetCourse.xpReward || 50;

  const quizResult = await awardXpAndProcessStreak(
    userId,
    "quiz_first_pass",
    courseId,
    quizReward,
    `Lulus kuis kelulusan kelas: ${targetCourse.title}`,
    () => {
      progressDb[courseKey] = {
        progressId: courseKey,
        userId,
        contentType: "course",
        contentId: courseId,
        learningPathId,
        status,
        progressPercent: status === "completed" ? 100 : (existingCourseProgress?.progressPercent || 0),
        completedLessonCount: existingCourseProgress?.completedLessonCount || targetCourse.lessonCount,
        lastLessonId: existingCourseProgress?.lastLessonId || "",
        startedAt: existingCourseProgress?.startedAt || now,
        completedAt: status === "completed" ? now : null,
        updatedAt: now,
      };

      const totalCoursesCount = pathCourses.length || 1;
      let completedCoursesCount = 0;
      pathCourses.forEach(c => {
        const key = `${userId}_course_${c.id}`;
        if (progressDb[key] && progressDb[key].status === "completed") {
          completedCoursesCount++;
        }
      });

      if (status === "completed" && !wasCourseCompleted) {
        completedCoursesCount++;
      }

      const pathPercent = Math.round((completedCoursesCount / totalCoursesCount) * 100);
      const pathKey = `${userId}_path_${learningPathId}`;
      const existingPathProgress = progressDb[pathKey];

      progressDb[pathKey] = {
        progressId: pathKey,
        userId,
        contentType: "path",
        contentId: learningPathId,
        status: pathPercent === 100 ? "completed" : "in_progress",
        progressPercent: pathPercent,
        startedAt: existingPathProgress?.startedAt || now,
        completedAt: pathPercent === 100 ? (existingPathProgress?.completedAt || now) : null,
        updatedAt: now,
      };

      if (pathPercent === 100 && existingPathProgress?.status !== "completed") {
        pathCompleted = true;
      }

      saveUserProgress(userId, progressDb);
    }
  );

  let courseXpEarned = 0;
  if (status === "completed" && !wasCourseCompleted) {
    const courseResult = await awardXpAndProcessStreak(
      userId,
      "course_completion",
      courseId,
      courseReward,
      `Menyelesaikan kelas: ${targetCourse.title}`
    );
    courseXpEarned = courseResult.xpEarned;
  }

  if (pathCompleted) {
    await awardXpAndProcessStreak(
      userId,
      "learning_path_completion",
      learningPathId,
      100,
      `Selamat! Menyelesaikan Jalur Belajar: ${learningPathId}`
    );
  }

  const latestStats = getLearningStats(userId);

  return {
    xpEarned: quizResult.xpEarned + courseXpEarned,
    totalXp: latestStats.totalXp,
    levelUp: quizResult.levelUp,
    currentLevel: latestStats.currentLevel,
  };
};

// API: Get stripped questions for the client
export const getQuizQuestionsForClient = async (quizId: string): Promise<any[]> => {
  const quizQuestions = questions.filter(q => q.quizId === quizId && q.status === "published");
  const sorted = [...quizQuestions].sort((a, b) => a.order - b.order);
  
  return sorted.map((q) => {
    const { correctOptionId, explanation, ...rest } = q;
    return rest;
  });
};

// API: Submit quiz answers with server-side validation, scoring, and progression gating
export const submitQuizAttempt = async (
  userId: string,
  quizId: string,
  answers: Record<string, string>
): Promise<any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const quizQuestions = questions.filter(q => q.quizId === quizId && q.status === "published");
  const totalQuestions = quizQuestions.length;

  if (totalQuestions === 0) {
    throw new Error("Kuis tidak ditemukan.");
  }

  let correctCount = 0;
  const incorrectQuestionIds: string[] = [];
  const recommendedLessonIdsSet = new Set<string>();

  quizQuestions.forEach(q => {
    const userAnswer = answers[q.id];
    if (userAnswer === q.correctOptionId) {
      correctCount++;
    } else {
      incorrectQuestionIds.push(q.id);
      const lessonId = questionToLessonMap[q.id];
      if (lessonId) {
        recommendedLessonIdsSet.add(lessonId);
      }
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 70;

  let resultStatus: "remedial_required" | "almost_passed" | "passed";
  if (score >= 70) {
    resultStatus = "passed";
  } else if (score >= 50) {
    resultStatus = "almost_passed";
  } else {
    resultStatus = "remedial_required";
  }

  const recommendedLessonIds = Array.from(recommendedLessonIdsSet).slice(0, 3);
  const attemptId = `attempt_${Math.random().toString(36).substring(2, 11)}`;
  const now = new Date().toISOString();

  const attempt: any = {
    attemptId,
    userId,
    quizId,
    courseId: quizId,
    answers,
    correctCount,
    totalQuestions,
    score,
    passed,
    xpEarned: 0,
    resultStatus,
    incorrectQuestionIds,
    recommendedLessonIds,
    remedialViewed: false,
    nextCourseUnlocked: passed,
    startedAt: now,
    submittedAt: now
  };

  let xpEarned = 0;
  let levelUp = false;
  let currentLevel = 1;
  let alreadyRewarded = false;

  if (passed) {
    const result = await awardXpAndProcessStreak(
      userId,
      "quiz_first_pass" as any,
      quizId,
      30,
      `Pertama kali lulus kuis kelas: ${quizId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
      () => {
        const progressDb = getUserProgress(userId);
        const courseKey = `${userId}_course_${quizId}`;
        const existingProgress = progressDb[courseKey];

        progressDb[courseKey] = {
          progressId: courseKey,
          userId,
          contentType: "course",
          contentId: quizId,
          learningPathId: "beginner-path",
          status: "completed",
          progressPercent: 100,
          completedLessonCount: existingProgress?.completedLessonCount || 2,
          lastLessonId: existingProgress?.lastLessonId || "",
          startedAt: existingProgress?.startedAt || now,
          completedAt: now,
          updatedAt: now
        };

        const targetCourse = courses.find(c => c.id === quizId);
        const learningPathId = targetCourse?.learningPathId || "beginner-path";
        const pathCourses = courses.filter(c => c.learningPathId === learningPathId && c.status === "published");
        const totalCoursesCount = pathCourses.length;
        let completedCoursesCount = 0;
        pathCourses.forEach(c => {
          const key = `${userId}_course_${c.id}`;
          if (progressDb[key] && progressDb[key].status === "completed") {
            completedCoursesCount++;
          }
        });

        const pathPercent = Math.round((completedCoursesCount / totalCoursesCount) * 100);
        const pathKey = `${userId}_path_${learningPathId}`;
        const existingPathProgress = progressDb[pathKey];

        progressDb[pathKey] = {
          progressId: pathKey,
          userId,
          contentType: "path",
          contentId: learningPathId,
          status: pathPercent === 100 ? "completed" : "in_progress",
          progressPercent: pathPercent,
          startedAt: existingPathProgress?.startedAt || now,
          completedAt: pathPercent === 100 ? (existingPathProgress?.completedAt || now) : null,
          updatedAt: now
        };

        saveUserProgress(userId, progressDb);
      }
    );

    xpEarned = result.xpEarned;
    attempt.xpEarned = xpEarned;
    levelUp = result.levelUp;
    currentLevel = result.currentLevel;
    alreadyRewarded = result.alreadyRewarded;
  }

  const attemptsDb = getUserQuizAttempts(userId);
  attemptsDb[attemptId] = attempt;
  saveUserQuizAttempts(userId, attemptsDb);

  const summariesDb = getUserQuizSummaries(userId);
  const summaryKey = `${userId}_quiz_${quizId}`;
  const existingSummary = summariesDb[summaryKey];

  const bestScore = existingSummary ? Math.max(existingSummary.bestScore, score) : score;
  const wasPassed = existingSummary ? existingSummary.passed : false;

  summariesDb[summaryKey] = {
    userId,
    quizId,
    attemptCount: (existingSummary?.attemptCount || 0) + 1,
    bestScore,
    passed: wasPassed || passed,
    firstPassedAt: wasPassed ? existingSummary.firstPassedAt : (passed ? now : null),
    lastAttemptAt: now
  };
  saveUserQuizSummaries(userId, summariesDb);

  const questionsForReview = quizQuestions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    correctOptionId: q.correctOptionId,
    explanation: q.explanation
  }));

  const userStats = getLearningStats(userId);

  return {
    attempt,
    questionsForReview,
    xpEarned,
    levelUp,
    currentLevel: levelUp ? currentLevel : userStats.currentLevel,
    totalXp: userStats.totalXp,
    learningStreak: userStats.learningStreak,
    alreadyRewarded
  };
};

export const getQuizAttempts = async (userId: string, quizId: string): Promise<any[]> => {
  const attemptsDb = getUserQuizAttempts(userId);
  return Object.values(attemptsDb)
    .filter((a: any) => a.userId === userId && a.quizId === quizId)
    .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getQuizAttemptById = async (userId: string, attemptId: string): Promise<any | null> => {
  if (!userId || !userId.trim()) return null;
  const attemptsDb = getUserQuizAttempts(userId);
  const attempt = attemptsDb[attemptId] || null;
  if (!attempt || attempt.userId !== userId) {
    return null;
  }
  return attempt;
};

export const getQuizSummary = async (userId: string, quizId: string): Promise<any | null> => {
  const summariesDb = getUserQuizSummaries(userId);
  return summariesDb[`${userId}_quiz_${quizId}`] || null;
};

export const recordRemedialLessonView = async (userId: string, lessonId: string): Promise<void> => {
  const attemptsDb = getUserQuizAttempts(userId);
  let changed = false;

  Object.keys(attemptsDb).forEach(key => {
    const attempt = attemptsDb[key];
    if (
      attempt.userId === userId &&
      attempt.resultStatus === "remedial_required" &&
      attempt.recommendedLessonIds.includes(lessonId) &&
      !attempt.remedialViewed
    ) {
      attempt.remedialViewed = true;
      changed = true;
    }
  });

  if (changed) {
    saveUserQuizAttempts(userId, attemptsDb);
  }
};

// API: Submit Phishing Simulation answers
export const submitSimulationAttempt = async (
  userId: string,
  simulationId: string,
  classification: "Aman" | "Mencurigakan" | "Phishing",
  selectedIndicators: string[]
): Promise<any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const response = await authenticatedFetch(`/api/simulations/${encodeURIComponent(simulationId)}/attempts`, {
    method: "POST",
    body: JSON.stringify({ classification, selectedIndicators }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Gagal mengirimkan simulasi.");
  return data;
};

export const getSimulationAttempts = async (userId: string, simulationId: string): Promise<any[]> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const response = await authenticatedFetch(`/api/me/simulation-attempts?simulationId=${encodeURIComponent(simulationId)}`);
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data.error || "Gagal mengambil riwayat simulasi.");
  return data;
};

// API: Create new conversation
export const createAiConversation = async (
  userId: string,
  contextType: "general" | "lesson" | "remedial" | "simulation",
  learningPathId?: string,
  courseId?: string,
  lessonId?: string,
  initialTitle?: string
): Promise<any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const title = initialTitle || (
    contextType === "lesson" ? `Tutor Lesson: ${lessonId}` :
    contextType === "remedial" ? `Asistensi Remedial` :
    contextType === "simulation" ? "Review Simulasi Keamanan" : "Diskusi Umum"
  );
  const response = await authenticatedFetch("/api/me/ai/conversations", {
    method: "POST",
    body: JSON.stringify({ contextType, title, learningPathId, courseId, lessonId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Gagal membuat percakapan.");
  return data;
};

// API: Get conversations for user
export const getAiConversations = async (userId: string): Promise<any[]> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const response = await authenticatedFetch("/api/me/ai/conversations");
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data.error || "Gagal mengambil percakapan.");
  return data;
};

// API: Delete a conversation
export const deleteAiConversation = async (userId: string, conversationId: string): Promise<void> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const response = await authenticatedFetch(`/api/me/ai/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menghapus percakapan.");
  }
};

// API: Get messages for a conversation
export const getAiMessages = async (userId: string, conversationId: string): Promise<any[]> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const response = await authenticatedFetch(`/api/me/ai/conversations/${encodeURIComponent(conversationId)}/messages`);
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data.error || "Gagal mengambil pesan.");
  return data;
};

// API: Send user message and get tutor response
export const sendAiMessage = async (
  userId: string,
  conversationId: string,
  messageContent: string,
  contextInfo?: {
    learningPathTitle?: string;
    courseTitle?: string;
    lessonTitle?: string;
    lessonSummary?: string;
    quizIncorrectTopics?: string[];
    simulationDetails?: any;
  }
): Promise<any> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const conversations = await getAiConversations(userId);
  const conv = conversations.find((item: any) => item.conversationId === conversationId);
  if (!conv || conv.userId !== userId) {
    throw new Error("Percakapan tidak ditemukan.");
  }
  const historyList = await getAiMessages(userId, conversationId);
  const requestId = crypto.randomUUID();

  try {
    const response = await authenticatedFetch("/api/ai/tutor", {
      method: "POST",
      body: JSON.stringify({
        message: messageContent,
        contextType: conv.contextType || "general",
        learningPathTitle: contextInfo?.learningPathTitle,
        courseTitle: contextInfo?.courseTitle,
        lessonTitle: contextInfo?.lessonTitle,
        lessonSummary: contextInfo?.lessonSummary,
        quizIncorrectTopics: contextInfo?.quizIncorrectTopics,
        simulationDetails: contextInfo?.simulationDetails,
        conversationId,
        requestId,
        history: historyList.slice(-5).map(h => ({
          role: h.role,
          content: h.role === "user" ? h.content : ((() => {
            try {
              return JSON.parse(h.content).answer;
            } catch {
              return h.content;
            }
          })())
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal menghubungi AI Tutor.");
    }

    const tutorResult = await response.json();

    const safeUserContent = tutorResult.warningMsg
      ? messageContent.replace(/\b\d{4,8}\b/g, "[SENSITIVE_OTP_REMOVED]")
      : messageContent;
    const persistResponse = await authenticatedFetch(`/api/me/ai/conversations/${encodeURIComponent(conversationId)}/exchanges`, {
      method: "POST",
      body: JSON.stringify({
        userContent: safeUserContent,
        assistantContent: JSON.stringify(tutorResult),
        safetyStatus: tutorResult.safetyStatus || "safe",
        requestId,
      }),
    });
    if (!persistResponse.ok) throw new Error("Jawaban diterima, tetapi riwayat percakapan gagal disimpan.");

    return tutorResult;
  } catch (error: any) {
    console.error("sendAiMessage API error:", error);
    throw new Error(error.message || "AI Tutor sedang tidak tersedia. Silakan coba kembali sesaat lagi.");
  }
};

export class AiInsightClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "AiInsightClientError";
  }
}

function isNonEmptyInsightString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInsightTopic(value: unknown): value is { topic: string; reason: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const topic = value as Record<string, unknown>;
  return isNonEmptyInsightString(topic.topic) && isNonEmptyInsightString(topic.reason);
}

function isInsightRecommendation(
  value: unknown
): value is LearningInsight["recommendations"][number] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const recommendation = value as Record<string, unknown>;
  return (
    ["lesson", "quiz", "simulation"].includes(String(recommendation.type)) &&
    isNonEmptyInsightString(recommendation.id) &&
    isNonEmptyInsightString(recommendation.title) &&
    isNonEmptyInsightString(recommendation.reason)
  );
}

export function isLearningInsightPayload(value: unknown): value is Omit<LearningInsight, "createdAt"> & {
  createdAt?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const insight = value as Record<string, unknown>;
  return (
    isNonEmptyInsightString(insight.summary) &&
    Array.isArray(insight.strongTopics) &&
    insight.strongTopics.length <= 2 &&
    insight.strongTopics.every(isInsightTopic) &&
    Array.isArray(insight.improvementTopics) &&
    insight.improvementTopics.length <= 2 &&
    insight.improvementTopics.every(isInsightTopic) &&
    Array.isArray(insight.recommendations) &&
    insight.recommendations.length <= 2 &&
    insight.recommendations.every(isInsightRecommendation) &&
    isNonEmptyInsightString(insight.studyTip) &&
    ["high", "medium", "low"].includes(String(insight.confidence)) &&
    (insight.createdAt === undefined || isNonEmptyInsightString(insight.createdAt))
  );
}

function readCachedLearningInsight(cachedKey: string): LearningInsight | null {
  const cachedData = localStorage.getItem(cachedKey);
  if (!cachedData) return null;
  try {
    const parsed: unknown = JSON.parse(cachedData);
    if (!isLearningInsightPayload(parsed)) {
      localStorage.removeItem(cachedKey);
      return null;
    }
    return {
      summary: parsed.summary,
      strongTopics: parsed.strongTopics,
      improvementTopics: parsed.improvementTopics,
      recommendations: parsed.recommendations,
      studyTip: parsed.studyTip,
      confidence: parsed.confidence,
      createdAt: parsed.createdAt || new Date().toISOString(),
    };
  } catch {
    localStorage.removeItem(cachedKey);
    return null;
  }
}

// API: Generate learning insights or fetch from cache
export const getAiLearningInsight = async (
  userId: string,
  completedLessonsCount: number,
  quizScores: any[],
  simulationResults: any[],
  overallProgress: number,
  forceRefresh = false
): Promise<LearningInsight> => {
  if (!userId || !userId.trim()) throw new Error("User ID tidak boleh kosong.");
  const cachedKey = `ai_insight_${userId}`;
  const cachedInsight = readCachedLearningInsight(cachedKey);

  if (!forceRefresh && cachedInsight) {
    return cachedInsight;
  }

  try {
    const response = await authenticatedFetch("/api/ai/insight", {
      method: "POST",
      body: JSON.stringify({
        completedLessonsCount,
        quizScores,
        simulationResults,
        overallProgress,
        requestId: crypto.randomUUID(),
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      const structuredError =
        errorData?.error && typeof errorData.error === "object"
          ? errorData.error
          : undefined;
      throw new AiInsightClientError(
        structuredError?.message ||
          (typeof errorData?.error === "string" ? errorData.error : "Gagal mendapatkan insight belajar."),
        structuredError?.code || errorData?.code || "AI_INSIGHT_REQUEST_FAILED",
        structuredError?.retryable === true || errorData?.retryable === true
      );
    }

    const responseData: unknown = await response.json();
    if (!isLearningInsightPayload(responseData)) {
      throw new AiInsightClientError(
        "Insight belum dapat diproses karena respons server belum sesuai format.",
        "AI_INSIGHT_INVALID_FORMAT",
        false
      );
    }
    const insight: LearningInsight = {
      summary: responseData.summary,
      strongTopics: responseData.strongTopics,
      improvementTopics: responseData.improvementTopics,
      recommendations: responseData.recommendations,
      studyTip: responseData.studyTip,
      confidence: responseData.confidence,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(cachedKey, JSON.stringify(insight));
    return insight;
  } catch (error: any) {
    console.error("getAiLearningInsight API error:", error);
    if (error instanceof AiInsightClientError) throw error;
    throw new AiInsightClientError(
      "Koneksi ke layanan AI Insight mengalami gangguan.",
      "AI_INSIGHT_NETWORK_ERROR",
      true
    );
  }
};


// Client API: Public verify certificate
export const verifyCertificatePublicly = async (certificateCode: string): Promise<any> => {
  const response = await fetch(`/api/certificates/verify/${certificateCode}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Sertifikat tidak valid atau tidak ditemukan.");
  }
  return response.json();
};

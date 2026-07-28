import { adminDb } from "../firebaseAdmin";
import { UserProgress, XpTransaction } from "../../src/types";
import { Timestamp } from "firebase-admin/firestore";

function toIso(val: any): string {
  if (!val) return "";
  if (typeof val.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (val && typeof val.toISOString === "function") {
    return val.toISOString();
  }
  return String(val);
}

function toIsoOrNull(val: any): string | null {
  if (!val) return null;
  return toIso(val);
}

export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 450) return 3;
  if (xp < 700) return 4;
  return 5;
}

export function getAsiaJakartaDateString(dateObj: Date = new Date()): string {
  return dateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function calculateNewStreak(
  lastDateStr: string | undefined | null,
  currentDateStr: string,
  currentStreak: number = 0
): number {
  if (!lastDateStr) {
    return 1;
  }
  if (lastDateStr === currentDateStr) {
    return currentStreak > 0 ? currentStreak : 1;
  }

  const lastDate = new Date(`${lastDateStr}T00:00:00Z`);
  const currentDate = new Date(`${currentDateStr}T00:00:00Z`);
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return (currentStreak || 0) + 1;
  } else if (diffDays > 1) {
    return 1;
  } else {
    return currentStreak || 1;
  }
}

export async function getUserProgress(uid: string): Promise<UserProgress[]> {
  if (!uid || !uid.trim()) {
    throw new Error("UID tidak boleh kosong.");
  }
  const snap = await adminDb
    .collection("userProgress")
    .where("userId", "==", uid)
    .get();

  const results: UserProgress[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    results.push({
      progressId: doc.id,
      userId: data.userId,
      contentType: data.contentType,
      contentId: data.contentId,
      learningPathId: data.learningPathId,
      courseId: data.courseId,
      status: data.status,
      progressPercent: data.progressPercent ?? 0,
      completedLessonCount: data.completedLessonCount,
      totalLessonCount: data.totalLessonCount,
      lessonsCompleted: data.lessonsCompleted,
      lastLessonId: data.lastLessonId,
      startedAt: toIso(data.startedAt),
      completedAt: toIsoOrNull(data.completedAt),
      updatedAt: toIso(data.updatedAt),
    });
  });

  return results;
}

export async function getUserXpTransactions(
  uid: string,
  limitNum: number = 20,
  cursor?: string
): Promise<{ transactions: XpTransaction[]; nextCursor: string | null }> {
  if (!uid || !uid.trim()) {
    throw new Error("UID tidak boleh kosong.");
  }

  const safeLimit = Math.min(Math.max(1, limitNum), 50);

  if (cursor) {
    const cursorDoc = await adminDb.collection("xpTransactions").doc(cursor).get();
    if (!cursorDoc.exists) {
      const err: any = new Error("Dokumen cursor tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
    const cursorData = cursorDoc.data();
    if (!cursorData || cursorData.userId !== uid) {
      const err: any = new Error("Akses cursor ditolak atau cursor tidak valid.");
      err.statusCode = 400;
      throw err;
    }
  }

  // Use limit + 1
  let query = adminDb
    .collection("xpTransactions")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(safeLimit + 1);

  if (cursor) {
    const cursorDoc = await adminDb.collection("xpTransactions").doc(cursor).get();
    query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  const rawDocs = snap.docs;

  const hasNextPage = rawDocs.length > safeLimit;
  const docsToProcess = hasNextPage ? rawDocs.slice(0, safeLimit) : rawDocs;

  const transactions: XpTransaction[] = [];
  docsToProcess.forEach((doc) => {
    const data = doc.data();
    transactions.push({
      transactionId: doc.id,
      userId: data.userId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      amount: data.amount,
      reason: data.reason,
      idempotencyKey: data.idempotencyKey,
      createdAt: toIso(data.createdAt),
    });
  });

  const nextCursor = hasNextPage && docsToProcess.length > 0 ? docsToProcess[docsToProcess.length - 1].id : null;

  return { transactions, nextCursor };
}

export interface CompleteLessonResult {
  lessonProgress: UserProgress;
  courseProgress: UserProgress;
  pathProgress: UserProgress;
  xpEarned: number;
  alreadyCompleted: boolean;
  totalXp: number;
  currentLevel: number;
  levelUp: boolean;
  learningStreak: number;
}

export async function completeLesson(
  uid: string,
  lessonId: string
): Promise<CompleteLessonResult> {
  if (!uid || !uid.trim()) {
    throw new Error("UID tidak boleh kosong.");
  }
  if (!lessonId || !lessonId.trim()) {
    throw new Error("Lesson ID tidak boleh kosong.");
  }

  return await adminDb.runTransaction(async (transaction) => {
    // 1. Fetch catalog lesson doc
    const lessonDocRef = adminDb.collection("lessons").doc(lessonId);
    const lessonDoc = await transaction.get(lessonDocRef);
    if (!lessonDoc.exists) {
      const err: any = new Error("Lesson tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
    const lessonData = lessonDoc.data()!;
    if (lessonData.status !== "published") {
      const err: any = new Error("Lesson belum dipublikasi.");
      err.statusCode = 404;
      throw err;
    }

    const courseId = lessonData.courseId;
    if (!courseId) {
      const err: any = new Error("Course ID untuk lesson tidak valid.");
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch catalog course doc
    const courseDocRef = adminDb.collection("courses").doc(courseId);
    const courseDoc = await transaction.get(courseDocRef);
    if (!courseDoc.exists) {
      const err: any = new Error("Course tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
    const courseData = courseDoc.data()!;
    if (courseData.status !== "published") {
      const err: any = new Error("Course belum dipublikasi.");
      err.statusCode = 404;
      throw err;
    }

    const learningPathId = courseData.learningPathId;
    if (!learningPathId) {
      const err: any = new Error("Learning path ID untuk course tidak valid.");
      err.statusCode = 400;
      throw err;
    }

    // 3. Fetch catalog learningPath doc
    const pathDocRef = adminDb.collection("learningPaths").doc(learningPathId);
    const pathDoc = await transaction.get(pathDocRef);
    if (!pathDoc.exists) {
      const err: any = new Error("Learning path tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
    const pathData = pathDoc.data()!;
    if (pathData.status !== "published") {
      const err: any = new Error("Learning path belum dipublikasi.");
      err.statusCode = 404;
      throw err;
    }

    // 4. Fetch all published lessons for course & all published courses for path
    const courseLessonsQuery = adminDb
      .collection("lessons")
      .where("courseId", "==", courseId)
      .where("status", "==", "published");
    const courseLessonsSnap = await transaction.get(courseLessonsQuery);
    const courseLessons = courseLessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const pathCoursesQuery = adminDb
      .collection("courses")
      .where("learningPathId", "==", learningPathId)
      .where("status", "==", "published");
    const pathCoursesSnap = await transaction.get(pathCoursesQuery);
    const rawPathCourses = pathCoursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const publishedPathsQuery = adminDb
      .collection("learningPaths")
      .where("status", "==", "published");
    const publishedPathsSnap = await transaction.get(publishedPathsQuery);
    const sortedPaths = publishedPathsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });
    const currentPathIndex = sortedPaths.findIndex((path: any) => path.id === learningPathId);
    const prerequisitePathId = currentPathIndex > 0 ? sortedPaths[currentPathIndex - 1].id : null;

    // Sort path courses deterministically by order, tie-breaker id
    const sortedPathCourses = [...rawPathCourses].sort((a: any, b: any) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

    // Prepare document references
    const lessonProgressRef = adminDb.collection("userProgress").doc(`${uid}__lesson__${lessonId}`);
    const courseProgressRef = adminDb.collection("userProgress").doc(`${uid}__course__${courseId}`);
    const pathProgressRef = adminDb.collection("userProgress").doc(`${uid}__path__${learningPathId}`);
    const xpTxRef = adminDb.collection("xpTransactions").doc(`${uid}__lesson__${lessonId}`);
    const userRef = adminDb.collection("users").doc(uid);
    const prerequisitePathProgressRef = prerequisitePathId
      ? adminDb.collection("userProgress").doc(`${uid}__path__${prerequisitePathId}`)
      : null;

    // Pre-fetch all lesson progress doc refs for this course to read inside transaction
    const allCourseLessonProgressRefs = courseLessons.map((l) =>
      adminDb.collection("userProgress").doc(`${uid}__lesson__${l.id}`)
    );

    // Pre-fetch all course progress doc refs for this sorted path to read inside transaction
    const allPathCourseProgressRefs = sortedPathCourses.map((c) =>
      adminDb.collection("userProgress").doc(`${uid}__course__${c.id}`)
    );

    // READ PHASE of user data inside transaction
    const targetLessonProgressSnap = await transaction.get(lessonProgressRef);
    const targetCourseProgressSnap = await transaction.get(courseProgressRef);
    const targetPathProgressSnap = await transaction.get(pathProgressRef);
    const xpTxSnap = await transaction.get(xpTxRef);
    const userSnap = await transaction.get(userRef);
    const prerequisitePathProgressSnap = prerequisitePathProgressRef
      ? await transaction.get(prerequisitePathProgressRef)
      : null;

    // Read all lesson progress snaps for this course
    const courseLessonProgressSnaps = await Promise.all(
      allCourseLessonProgressRefs.map((ref) => transaction.get(ref))
    );

    // Read all course progress snaps for this path
    const pathCourseProgressSnaps = await Promise.all(
      allPathCourseProgressRefs.map((ref) => transaction.get(ref))
    );

    if (
      prerequisitePathId &&
      (!prerequisitePathProgressSnap?.exists ||
        prerequisitePathProgressSnap.data()?.status !== "completed")
    ) {
      const err: any = new Error(
        "Jalur belajar masih terkunci. Selesaikan jalur sebelumnya terlebih dahulu."
      );
      err.statusCode = 403;
      throw err;
    }

    // Enforce backend course lock order
    const currentCourseIndex = sortedPathCourses.findIndex((c: any) => c.id === courseId);
    if (currentCourseIndex > 0) {
      const prevSnap = pathCourseProgressSnaps[currentCourseIndex - 1];
      const isPrevCompleted = prevSnap.exists && prevSnap.data()?.status === "completed";
      if (!isPrevCompleted) {
        const err: any = new Error("Course masih terkunci. Selesaikan course sebelumnya terlebih dahulu.");
        err.statusCode = 403;
        throw err;
      }
    }

    // Crucial check: User profile must exist!
    if (!userSnap.exists) {
      const err: any = new Error("User profile not found. Please complete profile recovery.");
      err.statusCode = 404;
      throw err;
    }

    // Determine completion status
    const alreadyCompleted =
      (targetLessonProgressSnap.exists &&
        targetLessonProgressSnap.data()?.status === "completed") ||
      xpTxSnap.exists;

    const baseReward = lessonData.xpReward ?? 15;
    const xpEarned = alreadyCompleted ? 0 : baseReward;

    // 1. Lesson Progress
    const existingLessonData = targetLessonProgressSnap.exists
      ? targetLessonProgressSnap.data()
      : null;

    const updatedLessonProgress: any = {
      progressId: lessonProgressRef.id,
      userId: uid,
      contentType: "lesson",
      contentId: lessonId,
      learningPathId,
      courseId,
      status: "completed",
      progressPercent: 100,
      startedAt: existingLessonData?.startedAt || Timestamp.now(),
      completedAt: existingLessonData?.completedAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    transaction.set(lessonProgressRef, updatedLessonProgress, { merge: true });

    // 2. XP Transaction (only if newly completed)
    if (!alreadyCompleted && xpEarned > 0) {
      const txData: any = {
        transactionId: xpTxRef.id,
        userId: uid,
        sourceType: "lesson_completion",
        sourceId: lessonId,
        amount: xpEarned,
        reason: `Menyelesaikan materi: ${lessonData.title || lessonId}`,
        idempotencyKey: `${uid}__lesson__${lessonId}`,
        createdAt: Timestamp.now(),
      };
      transaction.set(xpTxRef, txData);
    }

    // 3. Recalculate Course Progress
    let completedLessonCount = 0;
    courseLessons.forEach((l, index) => {
      const pSnap = courseLessonProgressSnaps[index];
      if (l.id === lessonId) {
        completedLessonCount++;
      } else if (pSnap && pSnap.exists && pSnap.data()?.status === "completed") {
        completedLessonCount++;
      }
    });

    const totalLessonCount = courseLessons.length || 1;
    const coursePercent = Math.min(
      100,
      Math.round((completedLessonCount / totalLessonCount) * 100)
    );
    const lessonsCompleted = completedLessonCount === totalLessonCount;

    const existingCourseData = targetCourseProgressSnap.exists
      ? targetCourseProgressSnap.data()
      : null;
    const existingCourseStatus = existingCourseData?.status || "in_progress";
    const courseStatus = existingCourseStatus === "completed" ? "completed" : "in_progress";

    const updatedCourseProgress: any = {
      progressId: courseProgressRef.id,
      userId: uid,
      contentType: "course",
      contentId: courseId,
      learningPathId,
      status: courseStatus,
      progressPercent: coursePercent,
      completedLessonCount,
      totalLessonCount,
      lessonsCompleted,
      lastLessonId: lessonId,
      startedAt: existingCourseData?.startedAt || Timestamp.now(),
      completedAt: courseStatus === "completed" ? (existingCourseData?.completedAt || Timestamp.now()) : null,
      updatedAt: Timestamp.now(),
    };

    transaction.set(courseProgressRef, updatedCourseProgress, { merge: true });

    // 4. Recalculate Learning Path Progress
    let completedCourseCount = 0;
    sortedPathCourses.forEach((c, index) => {
      const pSnap = pathCourseProgressSnaps[index];
      const isCurrentCourse = c.id === courseId;
      const status = isCurrentCourse ? courseStatus : (pSnap?.exists ? pSnap.data()?.status : "in_progress");
      if (status === "completed") {
        completedCourseCount++;
      }
    });

    const totalCourseCount = sortedPathCourses.length || 1;
    const pathPercent = Math.min(
      100,
      Math.round((completedCourseCount / totalCourseCount) * 100)
    );
    const pathStatus = pathPercent === 100 ? "completed" : "in_progress";

    const existingPathData = targetPathProgressSnap.exists
      ? targetPathProgressSnap.data()
      : null;

    const updatedPathProgress: any = {
      progressId: pathProgressRef.id,
      userId: uid,
      contentType: "path",
      contentId: learningPathId,
      status: pathStatus,
      progressPercent: pathPercent,
      startedAt: existingPathData?.startedAt || Timestamp.now(),
      completedAt: pathStatus === "completed" ? (existingPathData?.completedAt || Timestamp.now()) : null,
      updatedAt: Timestamp.now(),
    };

    transaction.set(pathProgressRef, updatedPathProgress, { merge: true });

    // 5. Update User Profile (totalXp, currentLevel, streak)
    const userData = userSnap.data()!;
    const oldXp = userData.totalXp ?? 0;
    const newTotalXp = oldXp + xpEarned;

    const oldLevel = userData.currentLevel ?? calculateLevel(oldXp);
    const newCurrentLevel = calculateLevel(newTotalXp);
    const levelUp = newCurrentLevel > oldLevel;

    const todayStr = getAsiaJakartaDateString();
    const lastStudyDate = userData.lastLearningDate || userData.lastStudyDate || null;
    const currentStreak = userData.learningStreak ?? 0;

    let newStreak = currentStreak;
    let finalLastLearningDate = userData.lastLearningDate || null;
    let finalLastStudyDate = userData.lastStudyDate || null;

    if (!alreadyCompleted && xpEarned > 0) {
      newStreak = calculateNewStreak(lastStudyDate, todayStr, currentStreak);
      finalLastLearningDate = todayStr;
      finalLastStudyDate = todayStr;
    }

    const userProfileUpdates: any = {
      totalXp: newTotalXp,
      currentLevel: newCurrentLevel,
      learningStreak: newStreak,
      lastLearningDate: finalLastLearningDate,
      lastStudyDate: finalLastStudyDate,
      updatedAt: Timestamp.now(),
      lastActiveAt: Timestamp.now(),
    };

    transaction.set(userRef, userProfileUpdates, { merge: true });

    const mapProgressToIso = (p: any): UserProgress => ({
      progressId: p.progressId,
      userId: p.userId,
      contentType: p.contentType,
      contentId: p.contentId,
      learningPathId: p.learningPathId,
      courseId: p.courseId,
      status: p.status,
      progressPercent: p.progressPercent,
      completedLessonCount: p.completedLessonCount,
      totalLessonCount: p.totalLessonCount,
      lessonsCompleted: p.lessonsCompleted,
      lastLessonId: p.lastLessonId,
      startedAt: toIso(p.startedAt),
      completedAt: toIsoOrNull(p.completedAt),
      updatedAt: toIso(p.updatedAt),
    });

    return {
      lessonProgress: mapProgressToIso(updatedLessonProgress),
      courseProgress: mapProgressToIso(updatedCourseProgress),
      pathProgress: mapProgressToIso(updatedPathProgress),
      xpEarned,
      alreadyCompleted,
      totalXp: newTotalXp,
      currentLevel: newCurrentLevel,
      levelUp,
      learningStreak: newStreak,
    };
  });
}

export async function resetLearningState(
  uid: string,
  confirmation: string
): Promise<{ success: boolean; message: string }> {
  if (!uid || !uid.trim()) {
    throw new Error("UID tidak boleh kosong.");
  }
  if (confirmation !== "RESET_MY_PROGRESS") {
    const err: any = new Error("Konfirmasi reset tidak sesuai.");
    err.statusCode = 400;
    throw err;
  }

  return await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      const err: any = new Error("User profile tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }

    const progressQuery = adminDb.collection("userProgress").where("userId", "==", uid);
    const txQuery = adminDb.collection("xpTransactions").where("userId", "==", uid);

    const progressSnap = await transaction.get(progressQuery);
    const txSnap = await transaction.get(txQuery);

    const totalWrites = progressSnap.size + txSnap.size + 1;
    if (totalWrites > 450) {
      const err: any = new Error("Reset progress ditolak karena volume data terlalu besar (> 450 dokumen). Harap hubungi dukungan admin.");
      err.statusCode = 409;
      throw err;
    }

    progressSnap.forEach((doc) => {
      transaction.delete(doc.ref);
    });

    txSnap.forEach((doc) => {
      transaction.delete(doc.ref);
    });

    const userData = userSnap.data() || {};
    const userUpdates: any = {
      totalXp: 0,
      currentLevel: 1,
      learningStreak: 0,
      lastLearningDate: null,
      lastStudyDate: null,
      updatedAt: Timestamp.now(),
    };

    if ("longestStreak" in userData) {
      userUpdates.longestStreak = 0;
    }

    transaction.set(userRef, userUpdates, { merge: true });

    return {
      success: true,
      message: "Seluruh progres belajar telah berhasil direset.",
    };
  });
}

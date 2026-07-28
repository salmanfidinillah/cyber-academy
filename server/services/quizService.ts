import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";
import { ApiError, formatDoc } from "./contentService";
import { calculateLevel, getAsiaJakartaDateString, calculateNewStreak } from "./learningStateService";
import { writeAuditLogInTransaction } from "./auditService";

export async function getPublishedQuizForCourse(courseId: string) {
  const courseDoc = await adminDb.collection("courses").doc(courseId).get();
  if (!courseDoc.exists || courseDoc.data()?.status !== "published") {
    return null;
  }

  const snapshot = await adminDb
    .collection("quizzes")
    .where("courseId", "==", courseId)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    courseId: data.courseId,
    title: data.title,
    description: data.description,
    passingScore: data.passingScore,
    xpReward: data.xpReward,
    questionCount: data.questionCount,
    status: data.status,
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
}

export async function getPublishedQuestionsForQuiz(quizId: string) {
  const quizDoc = await adminDb.collection("quizzes").doc(quizId).get();
  if (!quizDoc.exists || quizDoc.data()?.status !== "published") {
    return [];
  }

  const snapshot = await adminDb
    .collection("questions")
    .where("quizId", "==", quizId)
    .where("status", "==", "published")
    .get();

  if (snapshot.empty) return [];

  const questions = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      quizId: data.quizId,
      courseId: data.courseId,
      questionText: data.questionText,
      options: (data.options || []).map((opt: any) => ({
        id: opt.id,
        text: opt.text,
      })),
      order: data.order ?? 0,
    };
  });

  return questions.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

export async function submitQuizAttempt(uid: string, quizId: string, clientAnswers: Record<string, string>) {
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists || userSnap.data()?.accountStatus !== "active") {
    throw new ApiError(403, "Profil pengguna tidak aktif atau tidak ditemukan.");
  }

  const quizRef = adminDb.collection("quizzes").doc(quizId);
  const quizSnap = await quizRef.get();
  if (!quizSnap.exists || quizSnap.data()?.status !== "published") {
    throw new ApiError(404, "Kuis tidak ditemukan atau belum dipublikasikan.");
  }
  const quizData = quizSnap.data()!;
  const courseId = quizData.courseId;

  const courseDoc = await adminDb.collection("courses").doc(courseId).get();
  if (!courseDoc.exists || courseDoc.data()?.status !== "published") {
    throw new ApiError(404, "Course tidak ditemukan atau belum dipublikasikan.");
  }
  const courseData = courseDoc.data()!;
  const learningPathId = courseData.learningPathId;

  const pathDoc = await adminDb.collection("learningPaths").doc(learningPathId).get();
  if (!pathDoc.exists || pathDoc.data()?.status !== "published") {
    throw new ApiError(404, "Learning path tidak ditemukan atau belum dipublikasikan.");
  }

  const courseProgressRef = adminDb.collection("userProgress").doc(`${uid}__course__${courseId}`);
  const courseProgressSnap = await courseProgressRef.get();
  const courseProgressData = courseProgressSnap.exists ? courseProgressSnap.data() : null;

  if (!courseProgressData || !courseProgressData.lessonsCompleted) {
    throw new ApiError(403, "Kuis masih terkunci. Selesaikan seluruh materi terlebih dahulu.");
  }

  const questionsSnap = await adminDb
    .collection("questions")
    .where("quizId", "==", quizId)
    .where("status", "==", "published")
    .get();

  if (questionsSnap.empty) {
    throw new ApiError(400, "Kuis ini belum memiliki soal.");
  }

  const questionsMap = new Map<string, any>();
  questionsSnap.docs.forEach((doc) => {
    questionsMap.set(doc.id, doc.data());
  });

  const questionIds = Array.from(questionsMap.keys());
  const submittedQuestionIds = Object.keys(clientAnswers);

  if (submittedQuestionIds.length !== questionIds.length) {
    throw new ApiError(400, "Jumlah jawaban tidak sesuai dengan jumlah soal kuis.");
  }

  for (const qId of submittedQuestionIds) {
    if (!questionsMap.has(qId)) {
      throw new ApiError(400, `ID soal tidak valid: ${qId}`);
    }
    const qData = questionsMap.get(qId)!;
    const selectedOpt = clientAnswers[qId];
    const validOpt = (qData.options || []).some((o: any) => o.id === selectedOpt);
    if (!validOpt) {
      throw new ApiError(400, `Opsi jawaban tidak valid untuk soal ${qId}`);
    }
  }

  let correctCount = 0;
  const totalQuestions = questionIds.length;
  const incorrectQuestionIds: string[] = [];
  const recommendedLessonIdsSet = new Set<string>();
  const review: any[] = [];

  questionsMap.forEach((qData, qId) => {
    const selectedOptionId = clientAnswers[qId] || "";
    const correctOptionId = qData.correctOptionId;
    const isCorrect = selectedOptionId === correctOptionId;

    if (isCorrect) {
      correctCount++;
    } else {
      incorrectQuestionIds.push(qId);
      if (qData.recommendedLessonId) {
        recommendedLessonIdsSet.add(qData.recommendedLessonId);
      }
    }

    review.push({
      questionId: qId,
      selectedOptionId,
      correctOptionId,
      explanation: qData.explanation || "",
      isCorrect,
    });
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passingScore = quizData.passingScore ?? 70;
  const passed = score >= passingScore;

  let resultStatus: "remedial_required" | "almost_passed" | "passed" = "passed";
  if (score < 50) {
    resultStatus = "remedial_required";
  } else if (score < passingScore) {
    resultStatus = "almost_passed";
  } else {
    resultStatus = "passed";
  }

  const attemptId = `attempt_${Math.random().toString(36).substring(2, 11)}`;
  const now = Timestamp.now();
  const nowIso = now.toDate().toISOString();

  const summaryId = `${uid}__quiz__${quizId}`;
  const summaryRef = adminDb.collection("quizSummaries").doc(summaryId);
  const attemptRef = adminDb.collection("quizAttempts").doc(attemptId);
  const xpTxRef = adminDb.collection("xpTransactions").doc(`${uid}__quiz__${quizId}`);
  const pathProgressRef = adminDb.collection("userProgress").doc(`${uid}__path__${learningPathId}`);

  const pathCoursesQuery = adminDb
    .collection("courses")
    .where("learningPathId", "==", learningPathId)
    .where("status", "==", "published");
  const pathCoursesSnap = await pathCoursesQuery.get();
  const sortedPathCourses = pathCoursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const publishedPathsSnap = await adminDb.collection("learningPaths").where("status", "==", "published").get();
  const sortedPaths = publishedPathsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => {
      const orderDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
      return orderDiff || a.id.localeCompare(b.id);
    });
  const currentPathIndex = sortedPaths.findIndex((path: any) => path.id === learningPathId);
  const prerequisitePathId = currentPathIndex > 0 ? sortedPaths[currentPathIndex - 1].id : null;
  const prerequisitePathProgressRef = prerequisitePathId
    ? adminDb.collection("userProgress").doc(`${uid}__path__${prerequisitePathId}`)
    : null;

  const allPathCourseProgressRefs = sortedPathCourses.map((c) =>
    adminDb.collection("userProgress").doc(`${uid}__course__${c.id}`)
  );

  return await adminDb.runTransaction(async (transaction) => {
    const summarySnap = await transaction.get(summaryRef);
    const userSnapTx = await transaction.get(userRef);
    const courseProgressSnapTx = await transaction.get(courseProgressRef);
    const pathProgressSnapTx = await transaction.get(pathProgressRef);
    const xpTxSnapTx = await transaction.get(xpTxRef);
    const prerequisitePathProgressSnap = prerequisitePathProgressRef
      ? await transaction.get(prerequisitePathProgressRef)
      : null;

    const pathCourseProgressSnaps = await Promise.all(
      allPathCourseProgressRefs.map((ref) => transaction.get(ref))
    );

    if (
      prerequisitePathId &&
      (!prerequisitePathProgressSnap?.exists ||
        prerequisitePathProgressSnap.data()?.status !== "completed")
    ) {
      throw new ApiError(403, "Jalur belajar masih terkunci. Selesaikan jalur sebelumnya terlebih dahulu.");
    }

    const currentCourseIndex = sortedPathCourses.findIndex((course: any) => course.id === courseId);
    if (currentCourseIndex > 0) {
      const previousCourseProgress = pathCourseProgressSnaps[currentCourseIndex - 1];
      if (!previousCourseProgress?.exists || previousCourseProgress.data()?.status !== "completed") {
        throw new ApiError(403, "Kuis masih terkunci. Selesaikan kelas sebelumnya terlebih dahulu.");
      }
    }

    const existingSummary = summarySnap.exists ? summarySnap.data()! : null;
    const attemptCount = (existingSummary?.attemptCount || 0) + 1;
    const bestScore = Math.max(score, existingSummary?.bestScore || 0);
    const hasPassedBefore = !!existingSummary?.passed;
    const firstPassedAt = existingSummary?.firstPassedAt || (passed ? now : null);

    const isFirstPass = passed && !hasPassedBefore && !xpTxSnapTx.exists;
    const xpEarned = isFirstPass ? (quizData.xpReward ?? 30) : 0;

    const updatedSummary = {
      userId: uid,
      quizId,
      courseId,
      attemptCount,
      bestScore,
      passed: hasPassedBefore || passed,
      firstPassedAt,
      lastAttemptAt: now,
      updatedAt: now,
    };
    transaction.set(summaryRef, updatedSummary, { merge: true });

    const attemptData = {
      attemptId,
      userId: uid,
      quizId,
      courseId,
      answers: clientAnswers,
      correctCount,
      totalQuestions,
      score,
      passed,
      xpEarned,
      resultStatus,
      incorrectQuestionIds,
      recommendedLessonIds: Array.from(recommendedLessonIdsSet),
      startedAt: now,
      submittedAt: now,
    };
    transaction.set(attemptRef, attemptData);

    let finalTotalXp = userSnapTx.data()?.totalXp ?? 0;
    let finalCurrentLevel = userSnapTx.data()?.currentLevel ?? 1;
    let finalStreak = userSnapTx.data()?.learningStreak ?? 0;

    if (passed) {
      const existingCourseProg = courseProgressSnapTx.exists ? courseProgressSnapTx.data()! : {};
      const updatedCourseProgress = {
        progressId: courseProgressRef.id,
        userId: uid,
        contentType: "course",
        contentId: courseId,
        learningPathId,
        status: "completed",
        progressPercent: 100,
        lessonsCompleted: true,
        completedAt: existingCourseProg.completedAt || now,
        updatedAt: now,
      };
      transaction.set(courseProgressRef, updatedCourseProgress, { merge: true });

      if (isFirstPass && xpEarned > 0) {
        const txData = {
          transactionId: xpTxRef.id,
          userId: uid,
          sourceType: "quiz_pass",
          sourceId: quizId,
          amount: xpEarned,
          reason: `Lulus kuis: ${quizData.title}`,
          idempotencyKey: `${uid}__quiz__${quizId}`,
          createdAt: now,
        };
        transaction.set(xpTxRef, txData);

        const userData = userSnapTx.data()!;
        const oldXp = userData.totalXp ?? 0;
        finalTotalXp = oldXp + xpEarned;
        finalCurrentLevel = calculateLevel(finalTotalXp);

        const todayStr = getAsiaJakartaDateString();
        const lastStudyDate = userData.lastLearningDate || userData.lastStudyDate || null;
        finalStreak = calculateNewStreak(lastStudyDate, todayStr, userData.learningStreak ?? 0);

        transaction.set(
          userRef,
          {
            totalXp: finalTotalXp,
            currentLevel: finalCurrentLevel,
            learningStreak: finalStreak,
            lastLearningDate: todayStr,
            lastStudyDate: todayStr,
            updatedAt: now,
            lastActiveAt: now,
          },
          { merge: true }
        );
      }

      let completedCourseCount = 0;
      sortedPathCourses.forEach((c, index) => {
        const pSnap = pathCourseProgressSnaps[index];
        const isThisCourse = c.id === courseId;
        const status = isThisCourse ? "completed" : (pSnap?.exists ? pSnap.data()?.status : "in_progress");
        if (status === "completed") {
          completedCourseCount++;
        }
      });

      const totalCourseCount = sortedPathCourses.length || 1;
      const pathPercent = Math.min(100, Math.round((completedCourseCount / totalCourseCount) * 100));
      const pathStatus = pathPercent === 100 ? "completed" : "in_progress";
      const existingPathData = pathProgressSnapTx.exists ? pathProgressSnapTx.data()! : {};

      const updatedPathProgress = {
        progressId: pathProgressRef.id,
        userId: uid,
        contentType: "path",
        contentId: learningPathId,
        status: pathStatus,
        progressPercent: pathPercent,
        completedAt: pathStatus === "completed" ? (existingPathData.completedAt || now) : null,
        updatedAt: now,
      };
      transaction.set(pathProgressRef, updatedPathProgress, { merge: true });
    }

    return {
      attemptId,
      quizId,
      courseId,
      score,
      passed,
      correctCount,
      totalQuestions,
      xpEarned,
      resultStatus,
      incorrectQuestionIds,
      recommendedLessonIds: Array.from(recommendedLessonIdsSet),
      submittedAt: nowIso,
      review,
    };
  });
}

export async function getQuizAttemptById(uid: string, attemptId: string) {
  const doc = await adminDb.collection("quizAttempts").doc(attemptId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.userId !== uid) {
    return null;
  }

  const questionsSnap = await adminDb
    .collection("questions")
    .where("quizId", "==", data.quizId)
    .where("status", "==", "published")
    .get();

  const questionsMap = new Map<string, any>();
  questionsSnap.docs.forEach((d) => questionsMap.set(d.id, d.data()));

  const review = Object.entries(data.answers || {}).map(([qId, selectedOptionId]) => {
    const qData = questionsMap.get(qId);
    return {
      questionId: qId,
      selectedOptionId,
      correctOptionId: qData?.correctOptionId || "",
      explanation: qData?.explanation || "",
      isCorrect: selectedOptionId === qData?.correctOptionId,
    };
  });

  return {
    attemptId: doc.id,
    userId: data.userId,
    quizId: data.quizId,
    courseId: data.courseId,
    answers: data.answers,
    correctCount: data.correctCount,
    totalQuestions: data.totalQuestions,
    score: data.score,
    passed: data.passed,
    xpEarned: data.xpEarned,
    resultStatus: data.resultStatus,
    incorrectQuestionIds: data.incorrectQuestionIds || [],
    recommendedLessonIds: data.recommendedLessonIds || [],
    submittedAt: data.submittedAt?.toDate?.() ? data.submittedAt.toDate().toISOString() : data.submittedAt,
    review,
  };
}

export async function getUserQuizAttempts(uid: string, quizId?: string) {
  let query: FirebaseFirestore.Query = adminDb.collection("quizAttempts").where("userId", "==", uid);
  if (quizId) {
    query = query.where("quizId", "==", quizId);
  }
  const snap = await query.get();
  const attempts = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      attemptId: doc.id,
      userId: data.userId,
      quizId: data.quizId,
      courseId: data.courseId,
      answers: data.answers,
      correctCount: data.correctCount,
      totalQuestions: data.totalQuestions,
      score: data.score,
      passed: data.passed,
      xpEarned: data.xpEarned,
      resultStatus: data.resultStatus,
      incorrectQuestionIds: data.incorrectQuestionIds || [],
      recommendedLessonIds: data.recommendedLessonIds || [],
      submittedAt: data.submittedAt?.toDate?.() ? data.submittedAt.toDate().toISOString() : data.submittedAt,
    };
  });

  return attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getQuizSummary(uid: string, quizId: string) {
  const summaryRef = adminDb.collection("quizSummaries").doc(`${uid}__quiz__${quizId}`);
  const doc = await summaryRef.get();
  if (!doc.exists) {
    return {
      userId: uid,
      quizId,
      attemptCount: 0,
      bestScore: 0,
      passed: false,
      firstPassedAt: null,
      lastAttemptAt: null,
    };
  }
  const data = doc.data()!;
  return {
    userId: data.userId,
    quizId: data.quizId,
    courseId: data.courseId,
    attemptCount: data.attemptCount,
    bestScore: data.bestScore,
    passed: data.passed,
    firstPassedAt: data.firstPassedAt?.toDate?.() ? data.firstPassedAt.toDate().toISOString() : data.firstPassedAt,
    lastAttemptAt: data.lastAttemptAt?.toDate?.() ? data.lastAttemptAt.toDate().toISOString() : data.lastAttemptAt,
  };
}

// Admin Quiz & Question CRUD
export async function getAdminQuizzes(filters: { courseId?: string; status?: string }) {
  let query: FirebaseFirestore.Query = adminDb.collection("quizzes");
  if (filters.courseId) {
    query = query.where("courseId", "==", filters.courseId);
  }
  if (filters.status && filters.status !== "all") {
    query = query.where("status", "==", filters.status);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => formatDoc(doc)!);
}

export async function getAdminQuizById(quizId: string) {
  const doc = await adminDb.collection("quizzes").doc(quizId).get();
  return formatDoc(doc);
}

export async function createQuiz(adminUid: string, payload: any) {
  const courseId = payload.courseId;
  const courseDoc = await adminDb.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) {
    throw new ApiError(400, "Course parent tidak ditemukan.");
  }

  return adminDb.runTransaction(async (transaction) => {
    const existingQuizQuery = adminDb
      .collection("quizzes")
      .where("courseId", "==", courseId)
      .where("status", "in", ["published", "draft"]);
    const existingSnap = await transaction.get(existingQuizQuery);
    if (!existingSnap.empty) {
      throw new ApiError(409, "Course ini sudah memiliki kuis aktif atau draft.");
    }

    const docRef = adminDb.collection("quizzes").doc();
    const newQuiz = {
      courseId,
      title: payload.title,
      description: payload.description || "",
      passingScore: payload.passingScore ?? 70,
      xpReward: payload.xpReward ?? 30,
      questionCount: 0,
      status: payload.status || "draft",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      updatedBy: adminUid,
    };

    transaction.set(docRef, newQuiz);
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "create",
      entityType: "quiz",
      entityId: docRef.id,
      safeSummary: `Membuat kuis ${payload.title}`,
      changedFields: Object.keys(payload),
    });
    return { id: docRef.id, ...newQuiz };
  });
}

export async function updateQuiz(adminUid: string, quizId: string, payload: any) {
  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("quizzes").doc(quizId);
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new ApiError(404, "Kuis tidak ditemukan.");
    }

    const nextCourseId = payload.courseId || doc.data()!.courseId;
    const courseRef = adminDb.collection("courses").doc(nextCourseId);
    const courseSnap = await transaction.get(courseRef);
    if (!courseSnap.exists) {
      throw new ApiError(400, "Course parent tidak ditemukan.");
    }
    if (nextCourseId !== doc.data()!.courseId) {
      const duplicateQuery = adminDb
        .collection("quizzes")
        .where("courseId", "==", nextCourseId)
        .where("status", "in", ["published", "draft"]);
      const duplicateSnap = await transaction.get(duplicateQuery);
      if (duplicateSnap.docs.some((item) => item.id !== quizId)) {
        throw new ApiError(409, "Course tujuan sudah memiliki kuis aktif.");
      }
    }

    const updates = { ...payload, updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid };
    delete updates.id;
    delete updates.createdAt;
    delete updates.createdBy;

    transaction.update(docRef, updates);
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: payload.status === "published" ? "publish" : payload.status === "archived" ? "archive" : "update",
      entityType: "quiz",
      entityId: quizId,
      safeSummary: "Memperbarui kuis",
      changedFields: Object.keys(payload),
    });
    return { id: quizId, ...doc.data(), ...updates };
  });
}

export async function deleteQuiz(adminUid: string, quizId: string) {
  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("quizzes").doc(quizId);
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new ApiError(404, "Kuis tidak ditemukan.");
    }

    const attemptsQuery = adminDb.collection("quizAttempts").where("quizId", "==", quizId).limit(1);
    const questionsQuery = adminDb.collection("questions").where("quizId", "==", quizId);
    const attemptsSnap = await transaction.get(attemptsQuery);
    const questionsSnap = await transaction.get(questionsQuery);
    if (!attemptsSnap.empty) {
      transaction.update(docRef, { status: "archived", updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid });
      writeAuditLogInTransaction(transaction, {
        actorUid: adminUid,
        action: "archive",
        entityType: "quiz",
        entityId: quizId,
        safeSummary: "Mengarsipkan kuis yang memiliki riwayat attempt",
      });
      return { success: true, archived: true, message: "Kuis memiliki riwayat attempt, sehingga diarsipkan secara aman." };
    }

    questionsSnap.docs.forEach((qDoc) => {
      transaction.delete(qDoc.ref);
    });

    transaction.delete(docRef);
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "delete",
      entityType: "quiz",
      entityId: quizId,
      safeSummary: "Menghapus kuis tanpa riwayat attempt",
    });
    return { success: true, deletedId: quizId };
  });
}

export async function getAdminQuestions(quizId?: string) {
  let query: FirebaseFirestore.Query = adminDb.collection("questions");
  if (quizId) {
    query = query.where("quizId", "==", quizId);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => formatDoc(doc)!);
}

export async function getAdminQuestionById(questionId: string) {
  const doc = await adminDb.collection("questions").doc(questionId).get();
  return formatDoc(doc);
}

export async function createQuestion(adminUid: string, payload: any) {
  const quizId = payload.quizId;
  const courseId = payload.courseId;

  const options = payload.options || [];
  if (options.length < 2 || options.length > 6) {
    throw new ApiError(400, "Opsi jawaban harus berjumlah antara 2 sampai 6.");
  }
  const optionIds = new Set(options.map((o: any) => o.id));
  if (optionIds.size !== options.length) {
    throw new ApiError(400, "ID opsi jawaban harus unik.");
  }
  if (!optionIds.has(payload.correctOptionId)) {
    throw new ApiError(400, "correctOptionId harus cocok dengan salah satu ID opsi.");
  }

  return adminDb.runTransaction(async (transaction) => {
    const quizRef = adminDb.collection("quizzes").doc(quizId);
    const quizSnap = await transaction.get(quizRef);
    if (!quizSnap.exists) {
      throw new ApiError(400, "Quiz parent tidak ditemukan.");
    }
    const quizData = quizSnap.data()!;
    if (quizData.courseId !== courseId) {
      throw new ApiError(400, "Course ID pertanyaan tidak cocok dengan course ID quiz.");
    }
    const sameOrderQuery = adminDb
      .collection("questions")
      .where("quizId", "==", quizId)
      .where("order", "==", payload.order ?? 1);
    const sameOrderSnap = await transaction.get(sameOrderQuery);
    if (!sameOrderSnap.empty) {
      throw new ApiError(409, "Urutan pertanyaan sudah digunakan dalam kuis ini.");
    }

    const docRef = adminDb.collection("questions").doc();
    const newQuestion = {
      quizId,
      courseId,
      questionText: payload.questionText,
      options,
      correctOptionId: payload.correctOptionId,
      explanation: payload.explanation,
      recommendedLessonId: payload.recommendedLessonId || null,
      order: payload.order ?? 1,
      status: payload.status || "draft",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      updatedBy: adminUid,
    };

    transaction.set(docRef, newQuestion);

    const currentCount = quizData.questionCount || 0;
    transaction.update(quizRef, {
      questionCount: currentCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    });
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "create",
      entityType: "question",
      entityId: docRef.id,
      safeSummary: "Menambahkan pertanyaan kuis",
      changedFields: Object.keys(payload),
    });

    return { id: docRef.id, ...newQuestion };
  });
}

export async function updateQuestion(adminUid: string, questionId: string, payload: any) {
  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("questions").doc(questionId);
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new ApiError(404, "Pertanyaan tidak ditemukan.");
    }

    const existing = doc.data()!;
    const nextOptions = payload.options || existing.options || [];
    const nextCorrectOptionId = payload.correctOptionId || existing.correctOptionId;
    if (nextOptions.length < 2 || nextOptions.length > 6) {
      throw new ApiError(400, "Opsi jawaban harus berjumlah antara 2 sampai 6.");
    }
    const optionIds = new Set(nextOptions.map((option: any) => option.id));
    if (optionIds.size !== nextOptions.length) {
      throw new ApiError(400, "ID opsi jawaban harus unik.");
    }
    if (!optionIds.has(nextCorrectOptionId)) {
      throw new ApiError(400, "correctOptionId harus cocok dengan salah satu ID opsi.");
    }
    if (payload.order !== undefined && payload.order !== existing.order) {
      const sameOrderQuery = adminDb
        .collection("questions")
        .where("quizId", "==", existing.quizId)
        .where("order", "==", payload.order);
      const sameOrderSnap = await transaction.get(sameOrderQuery);
      if (sameOrderSnap.docs.some((item) => item.id !== questionId)) {
        throw new ApiError(409, "Urutan pertanyaan sudah digunakan dalam kuis ini.");
      }
    }

    const updates = { ...payload, updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid };
    delete updates.id;
    delete updates.createdAt;
    delete updates.createdBy;

    transaction.update(docRef, updates);
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: payload.status === "published" ? "publish" : payload.status === "archived" ? "archive" : "update",
      entityType: "question",
      entityId: questionId,
      safeSummary: "Memperbarui pertanyaan kuis",
      changedFields: Object.keys(payload),
    });
    return { id: questionId, ...doc.data(), ...updates };
  });
}

export async function deleteQuestion(adminUid: string, questionId: string) {
  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("questions").doc(questionId);
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new ApiError(404, "Pertanyaan tidak ditemukan.");
    }

    const data = doc.data()!;
    const quizRef = adminDb.collection("quizzes").doc(data.quizId);
    const quizSnap = await transaction.get(quizRef);

    if (quizSnap.exists) {
      const currentCount = quizSnap.data()!.questionCount || 0;
      transaction.update(quizRef, {
        questionCount: Math.max(0, currentCount - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(docRef);
    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "delete",
      entityType: "question",
      entityId: questionId,
      safeSummary: "Menghapus pertanyaan kuis",
    });
    return { success: true, deletedId: questionId };
  });
}

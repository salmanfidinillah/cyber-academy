import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";
import { ApiError } from "./contentService";
import { calculateLevel, calculateNewStreak, getAsiaJakartaDateString } from "./learningStateService";
import { writeAuditLogInTransaction } from "./auditService";
import { getServerSimulation, SERVER_SIMULATIONS } from "../simulationDefinitions";

const CORRECT_CLASSIFICATION = "Phishing";
const CORRECT_INDICATORS = [
  "domain pengirim tidak resmi",
  "bahasa mendesak",
  "ancaman pemblokiran akun",
  "meminta klik tautan",
  "meminta informasi sensitif",
];

export function scorePhishingSimulation(
  classification: "Aman" | "Mencurigakan" | "Phishing",
  selectedIndicators: string[],
  passingScore = 80
) {
  const uniqueIndicators = [...new Set(selectedIndicators)];
  const correctCount = uniqueIndicators.filter((value) => CORRECT_INDICATORS.includes(value)).length;
  const classificationCorrect = classification === CORRECT_CLASSIFICATION;
  const score = Math.round((classificationCorrect ? 50 : 0) + (correctCount / CORRECT_INDICATORS.length) * 50);
  return {
    uniqueIndicators,
    score,
    passed: score >= passingScore,
    correctClassification: CORRECT_CLASSIFICATION,
    correctIndicators: [...CORRECT_INDICATORS],
  };
}

export function scoreSimulationAnswers(simulationId: string, answers: Record<string, string>, passingScore?: number) {
  const definition = getServerSimulation(simulationId);
  if (!definition) throw new ApiError(404, "Definisi simulasi tidak ditemukan.");
  const answerEntries = Object.entries(definition.answers);
  const review = answerEntries.map(([scenarioId, key]) => {
    const selectedActionId = answers[scenarioId] || "";
    return {
      scenarioId,
      selectedActionId,
      correctActionId: key.correctActionId,
      isCorrect: selectedActionId === key.correctActionId,
      explanation: key.explanation,
      risk: key.risk,
      tip: key.tip,
    };
  });
  const correctCount = review.filter((item) => item.isCorrect).length;
  const totalQuestions = review.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const threshold = Number(passingScore ?? definition.passingScore);
  return { score, correctCount, totalQuestions, passed: score >= threshold, review };
}

export function checkSimulationAnswer(simulationId: string, scenarioId: string, actionId: string) {
  const definition = getServerSimulation(simulationId);
  const key = definition?.answers[scenarioId];
  if (!definition || !key) throw new ApiError(404, "Tahap simulasi tidak ditemukan.");
  return {
    scenarioId,
    selectedActionId: actionId,
    correctActionId: key.correctActionId,
    isCorrect: actionId === key.correctActionId,
    explanation: key.explanation,
    risk: key.risk,
    tip: key.tip,
  };
}

export function getSimulationRewardTransactionId(uid: string, simulationId: string) {
  return `${uid}__simulation__${simulationId}`;
}

function iso(value: any): string {
  if (!value) return "";
  return typeof value.toDate === "function" ? value.toDate().toISOString() : String(value);
}

async function ensureDefaultSimulations() {
  const refs = SERVER_SIMULATIONS.map((item) => adminDb.collection("simulations").doc(item.simulationId));
  const snapshots = await Promise.all(refs.map((ref) => ref.get()));
  const batch = adminDb.batch();
  let writes = 0;
  SERVER_SIMULATIONS.forEach((item, index) => {
    if (snapshots[index].exists) return;
    const { answers: _answers, ...safeDefinition } = item;
    batch.set(refs[index], {
      ...safeDefinition,
      scenarioCount: Object.keys(item.answers).length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    writes += 1;
  });
  if (writes > 0) await batch.commit();
}

export async function listSimulations(includeInactive = false) {
  await ensureDefaultSimulations();
  const snapshot = await adminDb.collection("simulations").get();
  return snapshot.docs
    .map((doc) => ({
      ...doc.data(),
      id: doc.id,
      simulationId: doc.id,
      createdAt: iso(doc.data().createdAt),
      updatedAt: iso(doc.data().updatedAt),
    }))
    .filter((item: any) => includeInactive || item.status === "published")
    .sort((a: any, b: any) => {
      const order = SERVER_SIMULATIONS.map((item) => item.simulationId);
      return order.indexOf(a.simulationId) - order.indexOf(b.simulationId);
    });
}

export async function listSimulationAttempts(uid: string, simulationId?: string) {
  let query: FirebaseFirestore.Query = adminDb.collection("simulationAttempts").where("userId", "==", uid);
  if (simulationId) query = query.where("simulationId", "==", simulationId);
  const snapshot = await query.get();
  return snapshot.docs
    .map((doc) => ({ ...doc.data(), attemptId: doc.id, submittedAt: iso(doc.data().submittedAt) }))
    .sort((a: any, b: any) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function submitSimulation(
  uid: string,
  simulationId: string,
  answersOrClassification: Record<string, string> | "Aman" | "Mencurigakan" | "Phishing",
  selectedIndicatorsOrElapsed: string[] | number = 0
) {
  await ensureDefaultSimulations();
  const definition = getServerSimulation(simulationId);
  if (!definition) throw new ApiError(404, "Simulasi tidak ditemukan.");

  const [simulationDoc, profileDoc] = await Promise.all([
    adminDb.collection("simulations").doc(simulationId).get(),
    adminDb.collection("users").doc(uid).get(),
  ]);
  if (!simulationDoc.exists || simulationDoc.data()?.status !== "published") {
    throw new ApiError(404, "Simulasi tidak ditemukan atau belum dipublikasikan.");
  }
  if (!profileDoc.exists || profileDoc.data()?.accountStatus !== "active") {
    throw new ApiError(403, "Profil pengguna tidak aktif atau tidak ditemukan.");
  }

  const isLegacy = typeof answersOrClassification === "string";
  const legacy = isLegacy
    ? scorePhishingSimulation(
        answersOrClassification,
        Array.isArray(selectedIndicatorsOrElapsed) ? selectedIndicatorsOrElapsed : [],
        Number(simulationDoc.data()?.passingScore || 80)
      )
    : null;
  const scored = isLegacy
    ? {
        score: legacy!.score,
        correctCount: legacy!.correctIndicators.filter((item) => legacy!.uniqueIndicators.includes(item)).length,
        totalQuestions: legacy!.correctIndicators.length,
        passed: legacy!.passed,
        review: [],
      }
    : scoreSimulationAnswers(
        simulationId,
        answersOrClassification,
        Number(simulationDoc.data()?.passingScore || definition.passingScore)
      );
  const answers = isLegacy ? {} : answersOrClassification;
  const elapsedSeconds = typeof selectedIndicatorsOrElapsed === "number" ? selectedIndicatorsOrElapsed : 0;
  const attemptRef = adminDb.collection("simulationAttempts").doc();
  const rewardRef = adminDb
    .collection("xpTransactions")
    .doc(getSimulationRewardTransactionId(uid, simulationId));
  const userRef = adminDb.collection("users").doc(uid);
  const progressRef = adminDb.collection("userProgress").doc(`${uid}__simulation__${simulationId}`);

  let xpEarned = 0;
  let totalXp = Number(profileDoc.data()?.totalXp || 0);
  let currentLevel = calculateLevel(totalXp);
  let learningStreak = Number(profileDoc.data()?.learningStreak || 0);
  let alreadyRewarded = false;
  let bestScore = scored.score;
  let attemptsCount = 1;

  await adminDb.runTransaction(async (transaction) => {
    const [freshProfile, rewardDoc, progressDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(rewardRef),
      transaction.get(progressRef),
    ]);
    if (!freshProfile.exists || freshProfile.data()?.accountStatus !== "active") {
      throw new ApiError(403, "Profil pengguna tidak aktif atau tidak ditemukan.");
    }

    const profile = freshProfile.data()!;
    const previousProgress = progressDoc.data() || {};
    totalXp = Number(profile.totalXp || 0);
    learningStreak = Number(profile.learningStreak || 0);
    alreadyRewarded = rewardDoc.exists;
    bestScore = Math.max(Number(previousProgress.bestScore || 0), scored.score);
    attemptsCount = Number(previousProgress.attempts || 0) + 1;

    if (scored.passed && !alreadyRewarded) {
      xpEarned = Number(simulationDoc.data()?.xpReward || definition.xpReward);
      totalXp += xpEarned;
      const today = getAsiaJakartaDateString();
      learningStreak = calculateNewStreak(profile.lastLearningDate, today, learningStreak);
      transaction.create(rewardRef, {
        transactionId: rewardRef.id,
        userId: uid,
        sourceType: "simulation_completion",
        sourceId: simulationId,
        amount: xpEarned,
        reason: `Menyelesaikan simulasi ${simulationDoc.data()?.title || simulationId}`,
        idempotencyKey: `simulation_completion:${uid}:${simulationId}`,
        createdAt: Timestamp.now(),
      });
      transaction.update(userRef, {
        totalXp,
        currentLevel: calculateLevel(totalXp),
        learningStreak,
        lastLearningDate: today,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    currentLevel = calculateLevel(totalXp);
    transaction.set(
      progressRef,
      {
        progressId: progressRef.id,
        userId: uid,
        contentType: "simulation",
        contentId: simulationId,
        simulationId,
        status: scored.passed ? "completed" : "in_progress",
        currentStep: definition.answers ? Object.keys(definition.answers).length : 0,
        progressPercent: 100,
        score: scored.score,
        bestScore,
        attempts: attemptsCount,
        xpAwarded: alreadyRewarded || xpEarned > 0,
        startedAt: progressDoc.exists ? previousProgress.startedAt || Timestamp.now() : Timestamp.now(),
        completedAt: scored.passed ? Timestamp.now() : previousProgress.completedAt || null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    const attemptData: Record<string, unknown> = {
      attemptId: attemptRef.id,
      userId: uid,
      simulationId,
      answers,
      correctCount: scored.correctCount,
      totalQuestions: scored.totalQuestions,
      score: scored.score,
      passed: scored.passed,
      xpEarned,
      elapsedSeconds,
      submittedAt: Timestamp.now(),
    };
    if (isLegacy) {
      attemptData.classification = answersOrClassification;
      attemptData.selectedIndicators = legacy!.uniqueIndicators;
    }
    transaction.create(attemptRef, attemptData);
  });

  return {
    attempt: {
      attemptId: attemptRef.id,
      userId: uid,
      simulationId,
      answers,
      score: scored.score,
      bestScore,
      attempts: attemptsCount,
      correctCount: scored.correctCount,
      totalQuestions: scored.totalQuestions,
      passed: scored.passed,
      xpEarned,
      elapsedSeconds,
      submittedAt: new Date().toISOString(),
    },
    review: scored.review,
    passed: scored.passed,
    xpEarned,
    levelUp: currentLevel > Number(profileDoc.data()?.currentLevel || 1),
    currentLevel,
    totalXp,
    learningStreak,
    alreadyRewarded,
    bestScore,
    attemptsCount,
    ...(isLegacy
      ? { correctClassification: CORRECT_CLASSIFICATION, correctIndicators: CORRECT_INDICATORS }
      : {}),
  };
}

export async function updateSimulation(actorUid: string, simulationId: string, payload: Record<string, unknown>) {
  const ref = adminDb.collection("simulations").doc(simulationId);
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new ApiError(404, "Simulasi tidak ditemukan.");
    transaction.update(ref, { ...payload, updatedAt: FieldValue.serverTimestamp() });
    writeAuditLogInTransaction(transaction, {
      actorUid,
      action: "update",
      entityType: "simulation",
      entityId: simulationId,
      safeSummary: `Memperbarui simulasi ${simulationId}`,
      changedFields: Object.keys(payload),
    });
  });
  const snapshot = await ref.get();
  return { ...snapshot.data(), id: snapshot.id, simulationId: snapshot.id };
}

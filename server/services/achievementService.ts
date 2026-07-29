import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../firebaseAdmin";
import { SERVER_SIMULATIONS } from "../simulationDefinitions";
import { ApiError } from "./contentService";
import { writeAuditLogInTransaction } from "./auditService";
import {
  ACTIVE_BADGE_DEFINITIONS,
  ACTIVE_BADGE_IDS,
  getActiveBadgeDefinition,
  isActiveBadgeId,
  toActiveBadgeDocument,
} from "./badgeDefinitions";
import {
  BadgeEligibilityInput,
  calculateBadgeEligibility,
} from "./badgeEligibility";

function iso(value: any): string {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function serializeDoc(doc: FirebaseFirestore.DocumentSnapshot): any {
  const data = doc.data() || {};
  return {
    ...data,
    id: doc.id,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    issuedAt: iso(data.issuedAt),
    awardedAt: iso(data.awardedAt),
    revokedAt: data.revokedAt ? iso(data.revokedAt) : null,
  };
}

function hasCanonicalBadgeData(current: Record<string, any>, expected: Record<string, any>) {
  return Object.entries(expected).every(([key, value]) =>
    Array.isArray(value)
      ? JSON.stringify(current[key] || []) === JSON.stringify(value)
      : current[key] === value
  );
}

export async function ensureBadgeDefinitions(): Promise<void> {
  const refs = ACTIVE_BADGE_DEFINITIONS.map((definition) =>
    adminDb.collection("badges").doc(definition.badgeId)
  );
  const [snapshots, allBadgesSnapshot] = await Promise.all([
    Promise.all(refs.map((ref) => ref.get())),
    adminDb.collection("badges").get(),
  ]);
  const batch = adminDb.batch();
  let writes = 0;

  ACTIVE_BADGE_DEFINITIONS.forEach((definition, index) => {
    const expected = toActiveBadgeDocument(definition);
    const current = snapshots[index].data() || {};
    if (snapshots[index].exists && hasCanonicalBadgeData(current, expected)) return;
    batch.set(
      refs[index],
      snapshots[index].exists
        ? { ...expected, updatedAt: FieldValue.serverTimestamp() }
        : {
            ...expected,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
      { merge: true }
    );
    writes += 1;
  });

  allBadgesSnapshot.docs.forEach((snapshot) => {
    if (ACTIVE_BADGE_IDS.has(snapshot.id)) return;
    const current = snapshot.data();
    if (current.status === "inactive" && current.deprecated === true) return;
    batch.set(
      snapshot.ref,
      {
        status: "inactive",
        deprecated: true,
        deprecatedAt: current.deprecatedAt || FieldValue.serverTimestamp(),
        replacementBadgeId: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    writes += 1;
  });

  if (writes > 0) await batch.commit();
}

export async function listBadges(includeInactive = false) {
  await ensureBadgeDefinitions();
  const snapshot = await adminDb.collection("badges").get();
  return snapshot.docs
    .map((doc) => {
      const serialized = serializeDoc(doc);
      return { ...serialized, badgeId: serialized.badgeId || doc.id };
    })
    .filter((badge: any) =>
      includeInactive
        ? true
        : ACTIVE_BADGE_IDS.has(badge.badgeId) && badge.status === "active"
    )
    .map((badge: any) => ({
      ...badge,
      isLegacy: !ACTIVE_BADGE_IDS.has(badge.badgeId),
    }))
    .sort((a: any, b: any) => {
      if (a.isLegacy !== b.isLegacy) return a.isLegacy ? 1 : -1;
      return (a.order || 0) - (b.order || 0) || a.badgeId.localeCompare(b.badgeId);
    });
}

export async function listUserBadges(uid: string) {
  const snapshot = await adminDb.collection("userBadges").where("userId", "==", uid).get();
  return snapshot.docs
    .map(serializeDoc)
    .filter((award: any) => ACTIVE_BADGE_IDS.has(award.badgeId))
    .map((award: any) => {
      const definition = getActiveBadgeDefinition(award.badgeId);
      return {
        ...award,
        badgeSlug: definition?.slug || award.badgeSlug,
      };
    })
    .sort((a: any, b: any) => b.awardedAt.localeCompare(a.awardedAt));
}

async function loadBadgeEligibilityInput(uid: string): Promise<BadgeEligibilityInput> {
  const configuredSimulationIds = new Set(
    SERVER_SIMULATIONS.map((simulation) => simulation.simulationId)
  );
  const pathRefs = ACTIVE_BADGE_DEFINITIONS.filter(
    (badge) => badge.requirementType === "learning_path_completion"
  ).map((badge) => adminDb.collection("learningPaths").doc(badge.requirementValue));
  const [
    pathSnapshots,
    coursesSnap,
    lessonsSnap,
    quizzesCatalogSnap,
    simulationsCatalogSnap,
    progressSnap,
    quizSnap,
    simulationSnap,
  ] = await Promise.all([
    Promise.all(pathRefs.map((ref) => ref.get())),
    adminDb.collection("courses").where("status", "==", "published").get(),
    adminDb.collection("lessons").where("status", "==", "published").get(),
    adminDb.collection("quizzes").where("status", "==", "published").get(),
    adminDb.collection("simulations").where("status", "==", "published").get(),
    adminDb.collection("userProgress").where("userId", "==", uid).get(),
    adminDb.collection("quizSummaries").where("userId", "==", uid).get(),
    adminDb.collection("simulationAttempts").where("userId", "==", uid).get(),
  ]);

  return {
    paths: pathSnapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => ({
        id: snapshot.id,
        status: String(snapshot.data()?.status || ""),
      })),
    courses: coursesSnap.docs.map((doc) => ({
      id: doc.id,
      learningPathId: String(doc.data().learningPathId || ""),
      status: String(doc.data().status || ""),
    })),
    lessons: lessonsSnap.docs.map((doc) => ({
      id: doc.id,
      courseId: String(doc.data().courseId || ""),
      status: String(doc.data().status || ""),
    })),
    quizzes: quizzesCatalogSnap.docs.map((doc) => ({
      id: doc.id,
      courseId: String(doc.data().courseId || ""),
      status: String(doc.data().status || ""),
    })),
    simulations: simulationsCatalogSnap.docs
      .filter((doc) => configuredSimulationIds.has(doc.id))
      .map((doc) => ({
        simulationId: doc.id,
        status: String(doc.data().status || ""),
      })),
    progress: progressSnap.docs.map((doc) => ({
      contentType: String(doc.data().contentType || ""),
      contentId: String(doc.data().contentId || ""),
      status: String(doc.data().status || ""),
    })),
    quizSummaries: quizSnap.docs.map((doc) => ({
      quizId: doc.data().quizId ? String(doc.data().quizId) : undefined,
      courseId: doc.data().courseId ? String(doc.data().courseId) : undefined,
      passed: doc.data().passed === true,
    })),
    simulationAttempts: simulationSnap.docs.map((doc) => ({
      simulationId: String(doc.data().simulationId || ""),
      passed: doc.data().passed === true,
    })),
  };
}

export async function getUserBadgeProgress(uid: string) {
  await ensureBadgeDefinitions();
  return calculateBadgeEligibility(await loadBadgeEligibilityInput(uid));
}

export async function evaluateUserBadgeState(uid: string) {
  await ensureBadgeDefinitions();
  const progress = calculateBadgeEligibility(await loadBadgeEligibilityInput(uid));
  const eligible = progress.filter((item) => item.isEligible);

  if (eligible.length > 0) {
    await adminDb.runTransaction(async (transaction) => {
      const refs = eligible.map((item) =>
        adminDb.collection("userBadges").doc(`${uid}__badge__${item.badgeId}`)
      );
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      eligible.forEach((item, index) => {
        if (snapshots[index].exists) return;
        const definition = getActiveBadgeDefinition(item.badgeId)!;
        const awardId = `${uid}__badge__${item.badgeId}`;
        transaction.create(
          refs[index],
          {
            userBadgeId: awardId,
            userId: uid,
            badgeId: item.badgeId,
            badgeSlug: definition.slug,
            sourceType: definition.requirementType,
            sourceId: definition.requirementValue,
            awardedAt: FieldValue.serverTimestamp(),
            idempotencyKey: `badge_award:${uid}:${definition.slug}`,
          }
        );
        writeAuditLogInTransaction(transaction, {
          actorUid: uid,
          action: "create",
          entityType: "badge",
          entityId: item.badgeId,
          safeSummary: `Memberikan badge milestone ${definition.title}`,
          changedFields: ["userBadges"],
        });
      });
    });
  }

  return {
    userBadges: await listUserBadges(uid),
    progress,
  };
}

export async function evaluateUserBadges(uid: string) {
  return (await evaluateUserBadgeState(uid)).userBadges;
}

export async function getCertificateEligibility(uid: string, learningPathId: string) {
  const [pathDoc, coursesSnap, progressSnap, quizSnap] = await Promise.all([
    adminDb.collection("learningPaths").doc(learningPathId).get(),
    adminDb.collection("courses").where("learningPathId", "==", learningPathId).where("status", "==", "published").get(),
    adminDb.collection("userProgress").where("userId", "==", uid).get(),
    adminDb.collection("quizSummaries").where("userId", "==", uid).get(),
  ]);

  if (!pathDoc.exists || pathDoc.data()?.status !== "published") {
    throw new ApiError(404, "Learning path tidak ditemukan atau belum dipublikasikan.");
  }

  const courses = coursesSnap.docs;
  const progress = progressSnap.docs.map((doc) => doc.data());
  const summaries = quizSnap.docs.map((doc) => doc.data());
  const pathProgress = progress.find((p) => p.contentType === "path" && p.contentId === learningPathId);
  const completedCourseIds = new Set(
    progress.filter((p) => p.contentType === "course" && p.status === "completed").map((p) => p.contentId)
  );
  const passedCourseIds = new Set(summaries.filter((q) => q.passed === true).map((q) => q.courseId));
  const lessonProgress = progress.filter(
    (p) => p.contentType === "lesson" && p.learningPathId === learningPathId && p.status === "completed"
  );
  const totalLessons = courses.reduce((sum, doc) => sum + Number(doc.data().lessonCount || 0), 0);

  return {
    learningPathId,
    learningPathTitle: pathDoc.data()?.title || "Learning Path Cyber Academy",
    lessonsCompleted: lessonProgress.length,
    totalLessons,
    coursesCompleted: courses.filter((doc) => completedCourseIds.has(doc.id)).length,
    totalCourses: courses.length,
    quizzesPassed: courses.filter((doc) => passedCourseIds.has(doc.id)).length,
    totalQuizzes: courses.length,
    isEligible:
      pathProgress?.status === "completed" &&
      courses.length > 0 &&
      courses.every((doc) => completedCourseIds.has(doc.id) && passedCourseIds.has(doc.id)),
  };
}

export async function listUserCertificates(uid: string) {
  const snapshot = await adminDb.collection("certificates").where("userId", "==", uid).get();
  return snapshot.docs.map(serializeDoc).sort((a: any, b: any) => b.issuedAt.localeCompare(a.issuedAt));
}

function createCertificateCode() {
  return `CYBER-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase()}`;
}

export async function generateCertificate(uid: string, learningPathId: string, recipientName?: string) {
  const eligibility = await getCertificateEligibility(uid, learningPathId);
  if (!eligibility.isEligible) {
    throw new ApiError(409, "Persyaratan belum terpenuhi. Selesaikan seluruh course dan lulus semua kuis.");
  }

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.accountStatus !== "active") {
    throw new ApiError(403, "Profil pengguna tidak aktif atau tidak ditemukan.");
  }

  let authName = "";
  try {
    authName = (await adminAuth.getUser(uid)).displayName || "";
  } catch {
    authName = "";
  }
  const safeName = String(recipientName || authName || userDoc.data()?.displayName || "Peserta Cyber Academy")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 100);
  if (safeName.length < 2) throw new ApiError(400, "Nama penerima minimal 2 karakter.");

  const certificateId = `${uid}__path__${learningPathId}`;
  const certificateRef = adminDb.collection("certificates").doc(certificateId);
  let alreadyGenerated = false;

  await adminDb.runTransaction(async (transaction) => {
    const existing = await transaction.get(certificateRef);
    if (existing.exists) {
      alreadyGenerated = true;
      if (existing.data()?.status === "revoked") {
        throw new ApiError(409, "Sertifikat untuk learning path ini pernah dicabut. Hubungi administrator.");
      }
      transaction.update(certificateRef, {
        recipientName: safeName,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const now = Timestamp.now();
    const certificateCode = createCertificateCode();
    transaction.create(certificateRef, {
      certificateId,
      certificateCode,
      userId: uid,
      recipientName: safeName,
      learningPathId,
      learningPathTitle: eligibility.learningPathTitle,
      issuedAt: now,
      status: "active",
      verificationHash: crypto
        .createHash("sha256")
        .update(`${uid}:${learningPathId}:${certificateCode}:${now.toMillis()}`)
        .digest("hex"),
      pdfPath: `/api/certificates/download/${certificateCode}`,
      createdAt: now,
      updatedAt: now,
    });
  });

  const result = await certificateRef.get();
  return { ...serializeDoc(result), alreadyGenerated };
}

export async function findCertificateByCode(code: string): Promise<any | null> {
  const snapshot = await adminDb.collection("certificates").where("certificateCode", "==", code.toUpperCase()).limit(1).get();
  return snapshot.empty ? null : serializeDoc(snapshot.docs[0]);
}

export async function listAllCertificates() {
  const snapshot = await adminDb.collection("certificates").get();
  return snapshot.docs.map(serializeDoc).sort((a: any, b: any) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function updateBadge(actorUid: string, badgeId: string, payload: Record<string, unknown>) {
  const requestedStatus = payload.status;
  if (isActiveBadgeId(badgeId) && requestedStatus && requestedStatus !== "active") {
    throw new ApiError(409, "Empat badge milestone utama wajib tetap aktif.");
  }
  if (isActiveBadgeId(badgeId)) {
    const definition = getActiveBadgeDefinition(badgeId)!;
    const canonicalValues: Record<string, unknown> = {
      title: definition.title,
      description: definition.description,
      order: definition.order,
      status: definition.status,
    };
    const changesCanonicalMetadata = Object.entries(payload).some(
      ([key, value]) => canonicalValues[key] !== value
    );
    if (changesCanonicalMetadata) {
      throw new ApiError(409, "Metadata empat badge milestone dikunci oleh definisi sistem.");
    }
  }
  if (!isActiveBadgeId(badgeId) && requestedStatus === "active") {
    throw new ApiError(409, "Badge legacy tidak dapat diaktifkan kembali.");
  }

  const ref = adminDb.collection("badges").doc(badgeId);
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new ApiError(404, "Badge tidak ditemukan.");
    transaction.update(ref, { ...payload, updatedAt: FieldValue.serverTimestamp() });
    writeAuditLogInTransaction(transaction, {
      actorUid,
      action: "update",
      entityType: "badge",
      entityId: badgeId,
      safeSummary: `Memperbarui badge ${badgeId}`,
      changedFields: Object.keys(payload),
    });
  });
  return serializeDoc(await ref.get());
}

export async function setCertificateStatus(actorUid: string, certificateId: string, status: "active" | "revoked") {
  const ref = adminDb.collection("certificates").doc(certificateId);
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new ApiError(404, "Sertifikat tidak ditemukan.");
    transaction.update(ref, {
      status,
      revokedAt: status === "revoked" ? FieldValue.serverTimestamp() : null,
      revokedBy: status === "revoked" ? actorUid : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    writeAuditLogInTransaction(transaction, {
      actorUid,
      action: "update",
      entityType: "certificate",
      entityId: certificateId,
      safeSummary: `${status === "revoked" ? "Mencabut" : "Mengaktifkan"} sertifikat`,
      changedFields: ["status"],
    });
  });
  return serializeDoc(await ref.get());
}

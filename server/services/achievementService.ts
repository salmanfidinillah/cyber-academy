import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../firebaseAdmin";
import { ApiError } from "./contentService";
import { writeAuditLogInTransaction } from "./auditService";

const DEFAULT_BADGES = [
  ["badge-cyber-defender", "Beginner Cyber Defender", "cyber-defender", "Menyelesaikan seluruh jalur Beginner dan lulus semua kuis wajib.", "trophy", "Beginner", "path_completion", "beginner-path"],
  ["badge-intermediate-defender", "Intermediate Defender", "intermediate-defender", "Menyelesaikan seluruh jalur Intermediate: Deteksi & Pertahanan Aktif.", "shield-check", "Intermediate", "path_completion", "intermediate-path"],
  ["badge-advanced-specialist", "Advanced Security Specialist", "advanced-security-specialist", "Menyelesaikan seluruh jalur Advanced: Pengamanan Sistem Mendalam.", "shield", "Advanced", "path_completion", "advanced-path"],
  ["badge-simulation-analyst", "Simulation Master", "simulation-analyst", "Lulus keempat simulasi keamanan defensif.", "scan", "Practical", "simulation_completion", "4"],
] as const;
const LEGACY_BADGE_IDS = new Set([
  "badge-first-step",
  "badge-password-guard",
  "badge-phishing-hunter",
  "badge-privacy-protector",
]);

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

async function ensureDefaultBadges(): Promise<void> {
  const refs = DEFAULT_BADGES.map((item) => adminDb.collection("badges").doc(item[0]));
  const legacyRefs = [...LEGACY_BADGE_IDS].map((badgeId) => adminDb.collection("badges").doc(badgeId));
  const [snapshots, legacySnapshots] = await Promise.all([
    Promise.all(refs.map((ref) => ref.get())),
    Promise.all(legacyRefs.map((ref) => ref.get())),
  ]);
  const batch = adminDb.batch();
  let writes = 0;
  DEFAULT_BADGES.forEach((item, index) => {
    const [badgeId, title, slug, description, icon, category, requirementType, requirementValue] = item;
    const defaultData = {
      badgeId,
      title,
      slug,
      description,
      icon,
      category,
      requirementType,
      requirementValue,
      order: index + 1,
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    };
    const current = snapshots[index].data();
    const needsUpdate =
      !snapshots[index].exists ||
      current?.title !== title ||
      current?.slug !== slug ||
      current?.description !== description ||
      current?.icon !== icon ||
      current?.category !== category ||
      current?.requirementType !== requirementType ||
      String(current?.requirementValue || "") !== requirementValue ||
      current?.order !== index + 1 ||
      current?.status !== "active";
    if (!needsUpdate) return;
    batch.set(
      refs[index],
      snapshots[index].exists
        ? defaultData
        : { ...defaultData, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    writes += 1;
  });
  legacySnapshots.forEach((snapshot, index) => {
    if (!snapshot.exists || snapshot.data()?.status === "inactive") return;
    batch.set(legacyRefs[index], { status: "inactive", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    writes += 1;
  });
  if (writes > 0) await batch.commit();
}

export async function listBadges(includeInactive = false) {
  await ensureDefaultBadges();
  const snapshot = await adminDb.collection("badges").get();
  return snapshot.docs
    .map(serializeDoc)
    .filter((badge: any) => includeInactive || badge.status === "active")
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

export async function listUserBadges(uid: string) {
  const snapshot = await adminDb.collection("userBadges").where("userId", "==", uid).get();
  return snapshot.docs
    .map(serializeDoc)
    .filter((award: any) => !LEGACY_BADGE_IDS.has(award.badgeId))
    .sort((a: any, b: any) => b.awardedAt.localeCompare(a.awardedAt));
}

export async function evaluateUserBadges(uid: string) {
  await ensureDefaultBadges();
  const [progressSnap, quizSnap, simulationSnap, badges] = await Promise.all([
    adminDb.collection("userProgress").where("userId", "==", uid).get(),
    adminDb.collection("quizSummaries").where("userId", "==", uid).get(),
    adminDb.collection("simulationAttempts").where("userId", "==", uid).get(),
    listBadges(false),
  ]);

  const progress = progressSnap.docs.map((doc) => doc.data());
  const quizzes = quizSnap.docs.map((doc) => doc.data());
  const simulations = simulationSnap.docs.map((doc) => doc.data());
  const completedLessons = progress.filter((p) => p.contentType === "lesson" && p.status === "completed");
  const completedCourses = new Set(
    progress.filter((p) => p.contentType === "course" && p.status === "completed").map((p) => p.contentId)
  );
  const completedPaths = new Set(
    progress.filter((p) => p.contentType === "path" && p.status === "completed").map((p) => p.contentId)
  );
  const passedCourses = new Set(
    quizzes.filter((q) => q.passed === true).map((q) => q.courseId)
  );
  const passedSimulationIds = new Set(
    simulations.filter((attempt) => attempt.passed === true).map((attempt) => attempt.simulationId)
  );

  const eligible = badges.filter((badge: any) => {
    if (badge.requirementType === "lesson_count") {
      return completedLessons.length >= Number(badge.requirementValue || 1);
    }
    if (badge.requirementType === "course_completion") {
      return completedCourses.has(badge.requirementValue) && passedCourses.has(badge.requirementValue);
    }
    if (badge.requirementType === "simulation_completion") {
      return passedSimulationIds.size >= Number(badge.requirementValue || 1);
    }
    if (badge.requirementType === "path_completion") {
      return completedPaths.has(badge.requirementValue);
    }
    return false;
  });

  if (eligible.length > 0) {
    await adminDb.runTransaction(async (transaction) => {
      const refs = eligible.map((badge: any) =>
        adminDb.collection("userBadges").doc(`${uid}__badge__${badge.badgeId}`)
      );
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      eligible.forEach((badge: any, index: number) => {
        if (snapshots[index].exists) return;
      const awardId = `${uid}__badge__${badge.badgeId}`;
        transaction.create(
          refs[index],
        {
          userBadgeId: awardId,
          userId: uid,
          badgeId: badge.badgeId,
          badgeSlug: badge.slug,
          sourceType: badge.requirementType,
          sourceId: badge.requirementValue,
          awardedAt: FieldValue.serverTimestamp(),
          idempotencyKey: `badge_award:${uid}:${badge.slug}`,
          }
        );
      });
    });
  }

  return listUserBadges(uid);
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

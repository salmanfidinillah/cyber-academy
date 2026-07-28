import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../firebaseAdmin";
import { ApiError } from "./contentService";
import { logAdminAction } from "./auditService";

function iso(value: any): string {
  if (!value) return "";
  return typeof value.toDate === "function" ? value.toDate().toISOString() : String(value);
}

export async function listUsers(maxResults = 100) {
  const authResult = await adminAuth.listUsers(Math.min(Math.max(maxResults, 1), 500));
  const profileRefs = authResult.users.map((user) => adminDb.collection("users").doc(user.uid));
  const profiles = profileRefs.length ? await adminDb.getAll(...profileRefs) : [];
  const profileMap = new Map(profiles.map((doc) => [doc.id, doc.data() || {}]));

  return authResult.users.map((user) => {
    const profile = profileMap.get(user.uid) || {};
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: profile.displayName || user.displayName || "",
      role: user.customClaims?.admin === true ? "admin" : profile.role || "user",
      accountStatus: user.disabled || profile.accountStatus === "disabled" ? "disabled" : "active",
      totalXp: Number(profile.totalXp || 0),
      currentLevel: Number(profile.currentLevel || 1),
      createdAt: user.metadata.creationTime || iso(profile.createdAt),
      lastSignInAt: user.metadata.lastSignInTime || "",
    };
  });
}

export async function updateUserAccess(
  actorUid: string,
  targetUid: string,
  payload: { role?: "user" | "admin"; accountStatus?: "active" | "disabled" }
) {
  if (actorUid === targetUid && (payload.role === "user" || payload.accountStatus === "disabled")) {
    throw new ApiError(409, "Admin tidak dapat menurunkan role atau menonaktifkan akunnya sendiri.");
  }
  const target = await adminAuth.getUser(targetUid).catch(() => null);
  if (!target) throw new ApiError(404, "Pengguna tidak ditemukan.");

  if (payload.accountStatus) {
    await adminAuth.updateUser(targetUid, { disabled: payload.accountStatus === "disabled" });
  }
  if (payload.role) {
    await adminAuth.setCustomUserClaims(targetUid, {
      ...(target.customClaims || {}),
      admin: payload.role === "admin",
    });
  }
  await adminDb.collection("users").doc(targetUid).set({
    ...(payload.role ? { role: payload.role } : {}),
    ...(payload.accountStatus ? { accountStatus: payload.accountStatus } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await logAdminAction({
    actorUid,
    action: "update",
    entityType: "user",
    entityId: targetUid,
    safeSummary: "Memperbarui akses pengguna",
    changedFields: Object.keys(payload),
  });
  return (await listUsers(500)).find((user) => user.uid === targetUid);
}

export async function listAuditLogs(limit = 50) {
  const snapshot = await adminDb.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(Math.min(limit, 100)).get();
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    logId: doc.id,
    createdAt: iso(doc.data().createdAt),
  }));
}

export async function getAdminDashboardStats() {
  const [paths, courses, lessons, quizzes, simulationAttempts, certificates] = await Promise.all([
    adminDb.collection("learningPaths").count().get(),
    adminDb.collection("courses").where("status", "==", "published").count().get(),
    adminDb.collection("lessons").where("status", "==", "published").count().get(),
    adminDb.collection("quizzes").count().get(),
    adminDb.collection("simulationAttempts").count().get(),
    adminDb.collection("certificates").where("status", "==", "active").count().get(),
  ]);
  return {
    learningPaths: paths.data().count,
    coursesPublished: courses.data().count,
    lessonsPublished: lessons.data().count,
    quizzesCount: quizzes.data().count,
    simulationAttempts: simulationAttempts.data().count,
    activeCertificates: certificates.data().count,
  };
}

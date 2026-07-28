import { FieldValue, Transaction, WriteBatch } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";

export interface AuditLogData {
  actorUid: string;
  action: "create" | "update" | "delete" | "publish" | "archive";
  entityType: "learning_path" | "course" | "lesson" | "quiz" | "question" | "badge" | "certificate" | "simulation" | "user";
  entityId: string;
  safeSummary: string;
  changedFields?: string[];
}

export function writeAuditLogInTransaction(
  transaction: Transaction,
  data: AuditLogData
): void {
  const logRef = adminDb.collection("adminAuditLogs").doc();
  const safeFields = Array.isArray(data.changedFields)
    ? data.changedFields.filter((f) => typeof f === "string")
    : null;

  transaction.set(logRef, {
    logId: logRef.id,
    actorUid: data.actorUid,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    safeSummary: data.safeSummary,
    changedFields: safeFields,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function writeAuditLogInBatch(
  batch: WriteBatch,
  data: AuditLogData
): void {
  const logRef = adminDb.collection("adminAuditLogs").doc();
  const safeFields = Array.isArray(data.changedFields)
    ? data.changedFields.filter((f) => typeof f === "string")
    : null;

  batch.set(logRef, {
    logId: logRef.id,
    actorUid: data.actorUid,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    safeSummary: data.safeSummary,
    changedFields: safeFields,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function logAdminAction(data: AuditLogData): Promise<void> {
  const logRef = adminDb.collection("adminAuditLogs").doc();
  const safeFields = Array.isArray(data.changedFields)
    ? data.changedFields.filter((f) => typeof f === "string")
    : null;

  await logRef.set({
    logId: logRef.id,
    actorUid: data.actorUid,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    safeSummary: data.safeSummary,
    changedFields: safeFields,
    createdAt: FieldValue.serverTimestamp(),
  });
}

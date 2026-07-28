import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { adminDb } from "../firebaseAdmin";
import { ApiError } from "./contentService";

function iso(value: any): string {
  if (!value) return "";
  return typeof value.toDate === "function" ? value.toDate().toISOString() : String(value);
}

function serialize(doc: FirebaseFirestore.DocumentSnapshot): Record<string, any> {
  const data = doc.data() || {};
  return { ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt), lastMessageAt: iso(data.lastMessageAt) };
}

export async function createConversation(uid: string, payload: any) {
  const ref = adminDb.collection("aiConversations").doc();
  const now = Timestamp.now();
  await ref.set({
    conversationId: ref.id,
    userId: uid,
    title: payload.title,
    contextType: payload.contextType,
    learningPathId: payload.learningPathId || null,
    courseId: payload.courseId || null,
    lessonId: payload.lessonId || null,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  });
  return serialize(await ref.get());
}

export async function listConversations(uid: string) {
  const snapshot = await adminDb.collection("aiConversations").where("userId", "==", uid).get();
  return snapshot.docs.map(serialize).sort((a: any, b: any) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

async function ownedConversation(uid: string, conversationId: string) {
  const ref = adminDb.collection("aiConversations").doc(conversationId);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== uid) throw new ApiError(404, "Percakapan tidak ditemukan.");
  return ref;
}

export async function listMessages(uid: string, conversationId: string): Promise<Array<Record<string, any>>> {
  await ownedConversation(uid, conversationId);
  const snapshot = await adminDb.collection("aiMessages")
    .where("conversationId", "==", conversationId)
    .where("userId", "==", uid)
    .get();
  return snapshot.docs.map((doc): Record<string, any> => ({ ...serialize(doc), messageId: doc.id }))
    .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveExchange(
  uid: string,
  conversationId: string,
  userContent: string,
  assistantContent: string,
  safetyStatus: string,
  requestId?: string
) {
  const conversationRef = await ownedConversation(uid, conversationId);
  const exchangeKey = requestId
    ? createHash("sha256").update(`${uid}:${conversationId}:${requestId}`).digest("hex").slice(0, 48)
    : undefined;
  const userRef = exchangeKey
    ? adminDb.collection("aiMessages").doc(`${exchangeKey}-user`)
    : adminDb.collection("aiMessages").doc();
  const assistantRef = exchangeKey
    ? adminDb.collection("aiMessages").doc(`${exchangeKey}-assistant`)
    : adminDb.collection("aiMessages").doc();
  const batch = adminDb.batch();
  const now = Timestamp.now();
  batch.create(userRef, {
    messageId: userRef.id,
    conversationId,
    userId: uid,
    role: "user",
    content: userContent,
    safetyStatus: "safe",
    createdAt: now,
  });
  batch.create(assistantRef, {
    messageId: assistantRef.id,
    conversationId,
    userId: uid,
    role: "assistant",
    content: assistantContent,
    safetyStatus,
    createdAt: Timestamp.fromMillis(now.toMillis() + 1),
  });
  batch.update(conversationRef, {
    updatedAt: FieldValue.serverTimestamp(),
    lastMessageAt: FieldValue.serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (error: any) {
    const alreadyExists =
      requestId &&
      (error?.code === 6 ||
        error?.code === "already-exists" ||
        String(error?.message || "").toLowerCase().includes("already exists"));
    if (!alreadyExists) throw error;

    const [existingUser, existingAssistant] = await Promise.all([userRef.get(), assistantRef.get()]);
    const matchesExchange = [existingUser, existingAssistant].every(
      (doc) => doc.exists && doc.data()?.userId === uid && doc.data()?.conversationId === conversationId
    );
    if (!matchesExchange) {
      throw new ApiError(409, "Idempotency key percakapan bertabrakan.");
    }
  }
}

export async function deleteConversation(uid: string, conversationId: string) {
  const ref = await ownedConversation(uid, conversationId);
  const messages = await adminDb.collection("aiMessages").where("conversationId", "==", conversationId).get();
  if (messages.size > 450) throw new ApiError(409, "Percakapan terlalu besar untuk dihapus sekaligus.");
  const batch = adminDb.batch();
  messages.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ref);
  await batch.commit();
}

import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";
import { writeAuditLogInTransaction } from "./auditService";
import { normalizeSlug } from "../validation/contentSchemas";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
  if (!doc.exists) return null;
  const data = doc.data()!;
  const formatted: Record<string, any> = { id: doc.id };

  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object" && typeof val.toDate === "function") {
      formatted[key] = val.toDate().toISOString();
    } else {
      formatted[key] = val;
    }
  }
  return formatted;
}

export function sanitizeCatalogItem(item: Record<string, any>) {
  const sanitized = { ...item };
  delete sanitized.createdBy;
  delete sanitized.updatedBy;
  delete sanitized.searchTitle;
  return sanitized;
}

// -------------------------------------------------------------
// LEARNING PATHS (ADMIN)
// -------------------------------------------------------------

export async function getAdminLearningPaths(filters: {
  status?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  const limitNum = Math.min(Math.max(1, filters.limit || 20), 50);
  let query: FirebaseFirestore.Query = adminDb.collection("learningPaths");

  if (filters.status && filters.status !== "all") {
    if (!["draft", "published", "archived"].includes(filters.status)) {
      throw new ApiError(400, "Filter status tidak valid.");
    }
    query = query.where("status", "==", filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    query = query
      .where("searchTitle", ">=", s)
      .where("searchTitle", "<=", s + "\uf8ff")
      .orderBy("searchTitle", "asc");
  } else {
    query = query.orderBy("order", "asc");
  }

  query = query.orderBy(FieldPath.documentId(), "asc");

  if (filters.cursor) {
    const cursorDoc = await adminDb.collection("learningPaths").doc(filters.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  query = query.limit(limitNum + 1);

  const snapshot = await query.get();
  let docs = snapshot.docs;
  const hasNext = docs.length > limitNum;
  if (hasNext) {
    docs = docs.slice(0, limitNum);
  }

  const items = docs.map((doc) => formatDoc(doc)!);
  const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function getLearningPathById(id: string) {
  const doc = await adminDb.collection("learningPaths").doc(id).get();
  if (!doc.exists) return null;
  return formatDoc(doc);
}

export async function createLearningPath(adminUid: string, payload: any) {
  const title = payload.title;
  const rawSlug = payload.slug || title;
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new ApiError(400, "Slug tidak valid.");
  }

  return adminDb.runTransaction(async (transaction) => {
    // READ: Check duplicate slug
    const slugCheckQuery = adminDb
      .collection("learningPaths")
      .where("slug", "==", slug)
      .limit(1);
    const slugCheck = await transaction.get(slugCheckQuery);

    if (!slugCheck.empty) {
      throw new ApiError(409, `Learning path dengan slug '${slug}' sudah ada.`);
    }

    // Auto-generate Firestore Document ID
    const docRef = adminDb.collection("learningPaths").doc();

    const newDoc = {
      title,
      searchTitle: title.toLowerCase(),
      slug,
      description: payload.description || "",
      shortDescription: payload.shortDescription || payload.description?.substring(0, 300) || "",
      level: payload.level || "Beginner",
      estimatedDuration: payload.estimatedDuration ?? 60,
      thumbnailURL: payload.thumbnailURL || "",
      status: payload.status || "draft",
      order: payload.order ?? 0,
      xpReward: payload.xpReward ?? 300,
      badgeName: payload.badgeName || "",
      bgColor: payload.bgColor || "bg-pastel-mint",
      courseCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      updatedBy: adminUid,
    };

    // WRITES:
    transaction.set(docRef, newDoc);

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "create",
      entityType: "learning_path",
      entityId: docRef.id,
      safeSummary: `Admin membuat learning path: ${title}`,
      changedFields: Object.keys(newDoc).filter(
        (k) => !["createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k)
      ),
    });

    return { id: docRef.id, ...newDoc };
  });
}

export async function updateLearningPath(adminUid: string, id: string, payload: any) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "Payload update tidak boleh kosong.");
  }

  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("learningPaths").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Learning path tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;
    const updateData: Record<string, any> = { ...payload };

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    if (payload.title) {
      updateData.searchTitle = payload.title.toLowerCase();
    }

    if (payload.slug && payload.slug !== existingData.slug) {
      const slug = normalizeSlug(payload.slug);
      const slugCheckQuery = adminDb
        .collection("learningPaths")
        .where("slug", "==", slug)
        .limit(1);
      const slugCheck = await transaction.get(slugCheckQuery);

      if (!slugCheck.empty && slugCheck.docs[0].id !== id) {
        throw new ApiError(409, `Learning path dengan slug '${slug}' sudah ada.`);
      }
      updateData.slug = slug;
    }

    // ALL READS COMPLETE. WRITES:
    updateData.updatedAt = FieldValue.serverTimestamp();
    updateData.updatedBy = adminUid;

    transaction.update(docRef, updateData);

    const action =
      payload.status === "published"
        ? "publish"
        : payload.status === "archived"
        ? "archive"
        : "update";

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action,
      entityType: "learning_path",
      entityId: id,
      safeSummary: `Admin mengupdate learning path: ${existingData.title}`,
      changedFields: Object.keys(updateData).filter(
        (k) => !["updatedAt", "updatedBy"].includes(k)
      ),
    });

    return { id, ...existingData, ...updateData };
  });
}

export async function deleteLearningPath(adminUid: string, id: string) {
  return adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection("learningPaths").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Learning path tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;

    // READ: Check child courses
    const childCoursesQuery = adminDb
      .collection("courses")
      .where("learningPathId", "==", id)
      .limit(1);
    const childCourses = await transaction.get(childCoursesQuery);

    if (!childCourses.empty) {
      throw new ApiError(
        409,
        "Learning path tidak dapat dihapus karena masih memiliki course terkait."
      );
    }

    // WRITES:
    transaction.delete(docRef);

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "delete",
      entityType: "learning_path",
      entityId: id,
      safeSummary: `Admin menghapus learning path: ${existingData.title}`,
    });

    return { success: true, deletedId: id };
  });
}

// -------------------------------------------------------------
// COURSES (ADMIN)
// -------------------------------------------------------------

export async function getAdminCourses(filters: {
  learningPathId?: string;
  status?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  const limitNum = Math.min(Math.max(1, filters.limit || 20), 50);
  let query: FirebaseFirestore.Query = adminDb.collection("courses");

  if (filters.learningPathId) {
    query = query.where("learningPathId", "==", filters.learningPathId);
  }

  if (filters.status && filters.status !== "all") {
    if (!["draft", "published", "archived"].includes(filters.status)) {
      throw new ApiError(400, "Filter status tidak valid.");
    }
    query = query.where("status", "==", filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    query = query
      .where("searchTitle", ">=", s)
      .where("searchTitle", "<=", s + "\uf8ff")
      .orderBy("searchTitle", "asc");
  } else {
    query = query.orderBy("order", "asc");
  }

  query = query.orderBy(FieldPath.documentId(), "asc");

  if (filters.cursor) {
    const cursorDoc = await adminDb.collection("courses").doc(filters.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  query = query.limit(limitNum + 1);

  const snapshot = await query.get();
  let docs = snapshot.docs;
  const hasNext = docs.length > limitNum;
  if (hasNext) {
    docs = docs.slice(0, limitNum);
  }

  const items = docs.map((doc) => formatDoc(doc)!);
  const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function getCourseById(id: string) {
  const doc = await adminDb.collection("courses").doc(id).get();
  if (!doc.exists) return null;
  return formatDoc(doc);
}

export async function createCourse(adminUid: string, payload: any) {
  const title = payload.title;
  const rawSlug = payload.slug || title;
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new ApiError(400, "Slug tidak valid.");
  }

  return adminDb.runTransaction(async (transaction) => {
    // READ 1: Check parent learning path existence
    const parentRef = adminDb.collection("learningPaths").doc(payload.learningPathId);
    const parentDoc = await transaction.get(parentRef);
    if (!parentDoc.exists) {
      throw new ApiError(400, "Learning path parent tidak ditemukan.");
    }

    // READ 2: Check duplicate slug globally across courses
    const slugCheckQuery = adminDb
      .collection("courses")
      .where("slug", "==", slug)
      .limit(1);
    const slugCheck = await transaction.get(slugCheckQuery);

    if (!slugCheck.empty) {
      throw new ApiError(409, `Course dengan slug '${slug}' sudah ada.`);
    }

    // Auto-generate Document ID
    const docRef = adminDb.collection("courses").doc();

    const newDoc = {
      learningPathId: payload.learningPathId,
      title,
      searchTitle: title.toLowerCase(),
      slug,
      description: payload.description || "",
      shortDescription: payload.shortDescription || payload.description?.substring(0, 300) || "",
      category: payload.category || "General",
      level: payload.level || "beginner",
      estimatedDuration: payload.estimatedDuration ?? 30,
      thumbnailURL: payload.thumbnailURL || "",
      status: payload.status || "draft",
      order: payload.order ?? 0,
      xpReward: payload.xpReward ?? 50,
      learningOutcomes: payload.learningOutcomes || [],
      lessonCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      updatedBy: adminUid,
    };

    // WRITES:
    transaction.set(docRef, newDoc);

    const currentCourseCount = parentDoc.data()?.courseCount || 0;
    transaction.update(parentRef, {
      courseCount: currentCourseCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "create",
      entityType: "course",
      entityId: docRef.id,
      safeSummary: `Admin membuat course: ${title}`,
      changedFields: Object.keys(newDoc).filter(
        (k) => !["createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k)
      ),
    });

    return { id: docRef.id, ...newDoc };
  });
}

export async function updateCourse(adminUid: string, id: string, payload: any) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "Payload update tidak boleh kosong.");
  }

  return adminDb.runTransaction(async (transaction) => {
    // READ 1: existing course
    const docRef = adminDb.collection("courses").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Course tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;
    const updateData: Record<string, any> = { ...payload };

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    if (payload.title) {
      updateData.searchTitle = payload.title.toLowerCase();
    }

    // READ 2: new and old parent learning path (if learningPathId changed)
    let oldPathRef: FirebaseFirestore.DocumentReference | null = null;
    let oldPathDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let newPathRef: FirebaseFirestore.DocumentReference | null = null;
    let newPathDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    if (payload.learningPathId && payload.learningPathId !== existingData.learningPathId) {
      newPathRef = adminDb.collection("learningPaths").doc(payload.learningPathId);
      newPathDoc = await transaction.get(newPathRef);
      if (!newPathDoc.exists) {
        throw new ApiError(400, "Learning path parent baru tidak ditemukan.");
      }
      oldPathRef = adminDb.collection("learningPaths").doc(existingData.learningPathId);
      oldPathDoc = await transaction.get(oldPathRef);
    }

    // READ 3: slug check (global)
    if (payload.slug && payload.slug !== existingData.slug) {
      const slug = normalizeSlug(payload.slug);
      const slugCheckQuery = adminDb
        .collection("courses")
        .where("slug", "==", slug)
        .limit(1);
      const slugCheck = await transaction.get(slugCheckQuery);

      if (!slugCheck.empty && slugCheck.docs[0].id !== id) {
        throw new ApiError(409, `Course dengan slug '${slug}' sudah ada.`);
      }
      updateData.slug = slug;
    }

    // READ 4: child lessons (if learningPathId changed)
    let childLessonsSnapshot: FirebaseFirestore.QuerySnapshot | null = null;
    if (payload.learningPathId && payload.learningPathId !== existingData.learningPathId) {
      const lessonsQuery = adminDb.collection("lessons").where("courseId", "==", id);
      childLessonsSnapshot = await transaction.get(lessonsQuery);
    }

    // ALL READS COMPLETE. WRITES:
    if (oldPathDoc && oldPathDoc.exists && oldPathRef) {
      const oldVal = oldPathDoc.data()!.courseCount || 0;
      transaction.update(oldPathRef, {
        courseCount: Math.max(0, oldVal - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (newPathDoc && newPathDoc.exists && newPathRef) {
      const newVal = newPathDoc.data()!.courseCount || 0;
      transaction.update(newPathRef, {
        courseCount: newVal + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    updateData.updatedAt = FieldValue.serverTimestamp();
    updateData.updatedBy = adminUid;

    transaction.update(docRef, updateData);

    if (childLessonsSnapshot && !childLessonsSnapshot.empty) {
      childLessonsSnapshot.docs.forEach((lDoc) => {
        transaction.update(lDoc.ref, { learningPathId: payload.learningPathId });
      });
    }

    const action =
      payload.status === "published"
        ? "publish"
        : payload.status === "archived"
        ? "archive"
        : "update";

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action,
      entityType: "course",
      entityId: id,
      safeSummary: `Admin mengupdate course: ${existingData.title}`,
      changedFields: Object.keys(updateData).filter(
        (k) => !["updatedAt", "updatedBy"].includes(k)
      ),
    });

    return { id, ...existingData, ...updateData };
  });
}

export async function deleteCourse(adminUid: string, id: string) {
  return adminDb.runTransaction(async (transaction) => {
    // READ 1: existing course
    const docRef = adminDb.collection("courses").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Course tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;

    // READ 2: child lessons check
    const childLessonsQuery = adminDb
      .collection("lessons")
      .where("courseId", "==", id)
      .limit(1);
    const childLessons = await transaction.get(childLessonsQuery);

    if (!childLessons.empty) {
      throw new ApiError(
        409,
        "Course tidak dapat dihapus karena masih memiliki lesson terkait."
      );
    }

    // READ 3: parent learning path check
    const parentPathRef = adminDb.collection("learningPaths").doc(existingData.learningPathId);
    const parentPathDoc = await transaction.get(parentPathRef);

    // ALL READS COMPLETE. WRITES:
    if (parentPathDoc.exists) {
      const currentVal = parentPathDoc.data()!.courseCount || 0;
      transaction.update(parentPathRef, {
        courseCount: Math.max(0, currentVal - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(docRef);

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "delete",
      entityType: "course",
      entityId: id,
      safeSummary: `Admin menghapus course: ${existingData.title}`,
    });

    return { success: true, deletedId: id };
  });
}

// -------------------------------------------------------------
// LESSONS (ADMIN)
// -------------------------------------------------------------

export async function getAdminLessons(filters: {
  courseId?: string;
  status?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  const limitNum = Math.min(Math.max(1, filters.limit || 20), 50);
  let query: FirebaseFirestore.Query = adminDb.collection("lessons");

  if (filters.courseId) {
    query = query.where("courseId", "==", filters.courseId);
  }

  if (filters.status && filters.status !== "all") {
    if (!["draft", "published", "archived"].includes(filters.status)) {
      throw new ApiError(400, "Filter status tidak valid.");
    }
    query = query.where("status", "==", filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    query = query
      .where("searchTitle", ">=", s)
      .where("searchTitle", "<=", s + "\uf8ff")
      .orderBy("searchTitle", "asc");
  } else {
    query = query.orderBy("order", "asc");
  }

  query = query.orderBy(FieldPath.documentId(), "asc");

  if (filters.cursor) {
    const cursorDoc = await adminDb.collection("lessons").doc(filters.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  query = query.limit(limitNum + 1);

  const snapshot = await query.get();
  let docs = snapshot.docs;
  const hasNext = docs.length > limitNum;
  if (hasNext) {
    docs = docs.slice(0, limitNum);
  }

  const items = docs.map((doc) => formatDoc(doc)!);
  const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function getLessonById(id: string) {
  const doc = await adminDb.collection("lessons").doc(id).get();
  if (!doc.exists) return null;
  return formatDoc(doc);
}

export async function createLesson(adminUid: string, payload: any) {
  const title = payload.title;
  const rawSlug = payload.slug || title;
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new ApiError(400, "Slug tidak valid.");
  }

  return adminDb.runTransaction(async (transaction) => {
    // READ 1: Check parent course existence
    const parentCourseRef = adminDb.collection("courses").doc(payload.courseId);
    const parentCourseDoc = await transaction.get(parentCourseRef);

    if (!parentCourseDoc.exists) {
      throw new ApiError(400, "Course parent tidak ditemukan.");
    }

    const parentCourseData = parentCourseDoc.data()!;
    const learningPathId = parentCourseData.learningPathId;

    // READ 2: Check duplicate slug within course
    const slugCheckQuery = adminDb
      .collection("lessons")
      .where("courseId", "==", payload.courseId)
      .where("slug", "==", slug)
      .limit(1);
    const slugCheck = await transaction.get(slugCheckQuery);

    if (!slugCheck.empty) {
      throw new ApiError(409, `Lesson dengan slug '${slug}' sudah ada pada course ini.`);
    }

    // Auto-generate Document ID
    const docRef = adminDb.collection("lessons").doc();

    const newDoc = {
      courseId: payload.courseId,
      learningPathId,
      title,
      searchTitle: title.toLowerCase(),
      slug,
      summary: payload.summary || payload.objective || "",
      objective: payload.objective || payload.summary || "",
      content: payload.content || "",
      contentType: payload.contentType || "text",
      estimatedDuration: payload.estimatedDuration ?? 10,
      status: payload.status || "draft",
      order: payload.order ?? 0,
      xpReward: payload.xpReward ?? 15,
      exampleCase: payload.exampleCase || null,
      securityTips: payload.securityTips || [],
      keyTakeaways: payload.keyTakeaways || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      updatedBy: adminUid,
    };

    // WRITES:
    transaction.set(docRef, newDoc);

    const currentCount = parentCourseData.lessonCount || 0;
    transaction.update(parentCourseRef, {
      lessonCount: currentCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "create",
      entityType: "lesson",
      entityId: docRef.id,
      safeSummary: `Admin membuat lesson: ${title}`,
      changedFields: Object.keys(newDoc).filter(
        (k) => !["createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k)
      ),
    });

    return { id: docRef.id, ...newDoc };
  });
}

export async function updateLesson(adminUid: string, id: string, payload: any) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "Payload update tidak boleh kosong.");
  }

  return adminDb.runTransaction(async (transaction) => {
    // READ 1: existing lesson
    const docRef = adminDb.collection("lessons").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Lesson tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;
    const updateData: Record<string, any> = { ...payload };

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.learningPathId; // Client cannot specify learningPathId directly

    if (payload.title) {
      updateData.searchTitle = payload.title.toLowerCase();
    }

    let targetCourseId = existingData.courseId;
    let oldCourseDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let newParentCourseDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    let oldCourseRef: FirebaseFirestore.DocumentReference | null = null;
    let newParentCourseRef: FirebaseFirestore.DocumentReference | null = null;

    // READ 2 & 3: parent course docs if courseId changed
    if (payload.courseId && payload.courseId !== existingData.courseId) {
      newParentCourseRef = adminDb.collection("courses").doc(payload.courseId);
      newParentCourseDoc = await transaction.get(newParentCourseRef);
      if (!newParentCourseDoc.exists) {
        throw new ApiError(400, "Course parent baru tidak ditemukan.");
      }
      targetCourseId = payload.courseId;
      updateData.learningPathId = newParentCourseDoc.data()!.learningPathId;

      oldCourseRef = adminDb.collection("courses").doc(existingData.courseId);
      oldCourseDoc = await transaction.get(oldCourseRef);
    }

    // READ 4: slug check query if slug or courseId changed
    if ((payload.slug && payload.slug !== existingData.slug) || (payload.courseId && payload.courseId !== existingData.courseId)) {
      const slug = normalizeSlug(payload.slug || existingData.slug);
      const slugCheckQuery = adminDb
        .collection("lessons")
        .where("courseId", "==", targetCourseId)
        .where("slug", "==", slug)
        .limit(1);
      const slugCheck = await transaction.get(slugCheckQuery);

      if (!slugCheck.empty && slugCheck.docs[0].id !== id) {
        throw new ApiError(409, `Lesson dengan slug '${slug}' sudah ada pada course ini.`);
      }
      if (payload.slug) {
        updateData.slug = slug;
      }
    }

    // ALL READS COMPLETE. WRITES:
    if (oldCourseDoc && oldCourseDoc.exists && oldCourseRef) {
      const oldVal = oldCourseDoc.data()!.lessonCount || 0;
      transaction.update(oldCourseRef, {
        lessonCount: Math.max(0, oldVal - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (newParentCourseDoc && newParentCourseDoc.exists && newParentCourseRef) {
      const newVal = newParentCourseDoc.data()!.lessonCount || 0;
      transaction.update(newParentCourseRef, {
        lessonCount: newVal + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    updateData.updatedAt = FieldValue.serverTimestamp();
    updateData.updatedBy = adminUid;

    transaction.update(docRef, updateData);

    const action =
      payload.status === "published"
        ? "publish"
        : payload.status === "archived"
        ? "archive"
        : "update";

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action,
      entityType: "lesson",
      entityId: id,
      safeSummary: `Admin mengupdate lesson: ${existingData.title}`,
      changedFields: Object.keys(updateData).filter(
        (k) => !["updatedAt", "updatedBy"].includes(k)
      ),
    });

    return { id, ...existingData, ...updateData };
  });
}

export async function deleteLesson(adminUid: string, id: string) {
  return adminDb.runTransaction(async (transaction) => {
    // READ 1: existing lesson
    const docRef = adminDb.collection("lessons").doc(id);
    const existingDoc = await transaction.get(docRef);

    if (!existingDoc.exists) {
      throw new ApiError(404, "Lesson tidak ditemukan.");
    }

    const existingData = existingDoc.data()!;

    // READ 2: parent course doc
    const parentCourseRef = adminDb.collection("courses").doc(existingData.courseId);
    const parentCourseDoc = await transaction.get(parentCourseRef);

    // ALL READS COMPLETE. WRITES:
    if (parentCourseDoc.exists) {
      const currentVal = parentCourseDoc.data()!.lessonCount || 0;
      transaction.update(parentCourseRef, {
        lessonCount: Math.max(0, currentVal - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(docRef);

    writeAuditLogInTransaction(transaction, {
      actorUid: adminUid,
      action: "delete",
      entityType: "lesson",
      entityId: id,
      safeSummary: `Admin menghapus lesson: ${existingData.title}`,
    });

    return { success: true, deletedId: id };
  });
}

// -------------------------------------------------------------
// PUBLIC CATALOG READ-ONLY (EXCLUSIVELY CLOUD FIRESTORE)
// -------------------------------------------------------------

export async function getCatalogLearningPaths() {
  const [snapshot, coursesSnapshot] = await Promise.all([
    adminDb.collection("learningPaths").where("status", "==", "published").get(),
    adminDb.collection("courses").where("status", "==", "published").get(),
  ]);

  if (snapshot.empty) {
    return [];
  }

  const courseStats = new Map<string, { count: number; duration: number }>();
  coursesSnapshot.docs.forEach((courseDoc) => {
    const course = courseDoc.data();
    const pathId = String(course.learningPathId || "");
    if (!pathId) return;
    const current = courseStats.get(pathId) || { count: 0, duration: 0 };
    current.count += 1;
    current.duration += Number(course.estimatedDuration || 0);
    courseStats.set(pathId, current);
  });

  return snapshot.docs
    .map((doc) => {
      const item = sanitizeCatalogItem(formatDoc(doc)!);
      const stats = courseStats.get(doc.id) || { count: 0, duration: 0 };
      return {
        ...item,
        courseCount: stats.count,
        estimatedDuration: stats.duration || Number(item.estimatedDuration || 0),
      };
    })
    .sort((a: Record<string, any>, b: Record<string, any>) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getCatalogLearningPathById(id: string) {
  const [doc, coursesSnapshot] = await Promise.all([
    adminDb.collection("learningPaths").doc(id).get(),
    adminDb.collection("courses").where("learningPathId", "==", id).where("status", "==", "published").get(),
  ]);
  if (!doc.exists) return null;
  const item = formatDoc(doc)!;
  if (item.status !== "published") return null;
  const courses = coursesSnapshot.docs.map((courseDoc) => courseDoc.data());
  return {
    ...sanitizeCatalogItem(item),
    courseCount: courses.length,
    estimatedDuration:
      courses.reduce((total, course) => total + Number(course.estimatedDuration || 0), 0) ||
      Number(item.estimatedDuration || 0),
  };
}

export async function getCatalogCoursesForPath(learningPathId: string) {
  const parentPath = await getCatalogLearningPathById(learningPathId);
  if (!parentPath) return [];

  const snapshot = await adminDb
    .collection("courses")
    .where("learningPathId", "==", learningPathId)
    .where("status", "==", "published")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((doc) => sanitizeCatalogItem(formatDoc(doc)!))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getCatalogCourseById(id: string) {
  const doc = await adminDb.collection("courses").doc(id).get();
  if (!doc.exists) return null;
  const item = formatDoc(doc)!;
  if (item.status !== "published") return null;

  // Verify parent learning path is also published
  const parentPath = await getCatalogLearningPathById(item.learningPathId);
  if (!parentPath) return null;

  return sanitizeCatalogItem(item);
}

export async function getCatalogCourseBySlug(slug: string) {
  const snapshot = await adminDb
    .collection("courses")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const item = formatDoc(snapshot.docs[0])!;

  // Verify parent learning path is also published
  const parentPath = await getCatalogLearningPathById(item.learningPathId);
  if (!parentPath) return null;

  return sanitizeCatalogItem(item);
}

export async function getCatalogLessonsForCourse(courseId: string) {
  // Verify parent course is published
  const parentCourse = await getCatalogCourseById(courseId);
  if (!parentCourse) return [];

  const snapshot = await adminDb
    .collection("lessons")
    .where("courseId", "==", courseId)
    .where("status", "==", "published")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs
    .map((doc) => sanitizeCatalogItem(formatDoc(doc)!))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getCatalogLessonById(id: string) {
  const doc = await adminDb.collection("lessons").doc(id).get();
  if (!doc.exists) return null;
  const item = formatDoc(doc)!;
  if (item.status !== "published") return null;

  // Verify parent course is published
  const parentCourse = await getCatalogCourseById(item.courseId);
  if (!parentCourse) return null;

  return sanitizeCatalogItem(item);
}

export async function getCatalogLessonByCourseAndLessonSlug(courseSlug: string, lessonSlug: string) {
  const parentCourse = await getCatalogCourseBySlug(courseSlug);
  if (!parentCourse) return null;

  const snapshot = await adminDb
    .collection("lessons")
    .where("courseId", "==", parentCourse.id)
    .where("slug", "==", lessonSlug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const item = formatDoc(snapshot.docs[0])!;
  return sanitizeCatalogItem(item);
}

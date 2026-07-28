import { authenticatedFetch } from "./apiClient";

export async function fetchAdminLearningPaths(filters?: { status?: string; search?: string; limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.cursor) params.set("cursor", filters.cursor);

  const res = await authenticatedFetch(`/api/admin/learning-paths?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil daftar learning path.");
  }
  return res.json();
}

export async function fetchAdminLearningPathById(id: string) {
  const res = await authenticatedFetch(`/api/admin/learning-paths/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil detail learning path.");
  }
  return res.json();
}

export async function createAdminLearningPath(data: any) {
  const res = await authenticatedFetch("/api/admin/learning-paths", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat learning path baru.");
  }
  return res.json();
}

export async function updateAdminLearningPath(id: string, data: any) {
  const res = await authenticatedFetch(`/api/admin/learning-paths/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal memperbarui learning path.");
  }
  return res.json();
}

export async function deleteAdminLearningPath(id: string) {
  const res = await authenticatedFetch(`/api/admin/learning-paths/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menghapus learning path.");
  }
  return res.json();
}

// ---------------- COURSES ----------------

export async function fetchAdminCourses(filters?: { learningPathId?: string; status?: string; search?: string; limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filters?.learningPathId) params.set("learningPathId", filters.learningPathId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.cursor) params.set("cursor", filters.cursor);

  const res = await authenticatedFetch(`/api/admin/courses?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil daftar course.");
  }
  return res.json();
}

export async function fetchAdminCourseById(id: string) {
  const res = await authenticatedFetch(`/api/admin/courses/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil detail course.");
  }
  return res.json();
}

export async function createAdminCourse(data: any) {
  const res = await authenticatedFetch("/api/admin/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat course baru.");
  }
  return res.json();
}

export async function updateAdminCourse(id: string, data: any) {
  const res = await authenticatedFetch(`/api/admin/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal memperbarui course.");
  }
  return res.json();
}

export async function deleteAdminCourse(id: string) {
  const res = await authenticatedFetch(`/api/admin/courses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menghapus course.");
  }
  return res.json();
}

// ---------------- LESSONS ----------------

export async function fetchAdminLessons(filters?: { courseId?: string; status?: string; search?: string; limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filters?.courseId) params.set("courseId", filters.courseId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.cursor) params.set("cursor", filters.cursor);

  const res = await authenticatedFetch(`/api/admin/lessons?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil daftar lesson.");
  }
  return res.json();
}

export async function fetchAdminLessonById(id: string) {
  const res = await authenticatedFetch(`/api/admin/lessons/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil detail lesson.");
  }
  return res.json();
}

export async function createAdminLesson(data: any) {
  const res = await authenticatedFetch("/api/admin/lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat lesson baru.");
  }
  return res.json();
}

export async function updateAdminLesson(id: string, data: any) {
  const res = await authenticatedFetch(`/api/admin/lessons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal memperbarui lesson.");
  }
  return res.json();
}

export async function deleteAdminLesson(id: string) {
  const res = await authenticatedFetch(`/api/admin/lessons/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menghapus lesson.");
  }
  return res.json();
}

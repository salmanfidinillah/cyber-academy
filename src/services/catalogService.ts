import { LearningPath, Course, Lesson } from "../types";

export async function fetchCatalogLearningPaths(): Promise<LearningPath[]> {
  const res = await fetch("/api/catalog/learning-paths");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil catalog learning paths.");
  }
  return res.json();
}

export async function fetchCatalogLearningPathById(id: string): Promise<LearningPath> {
  const res = await fetch(`/api/catalog/learning-paths/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data learning path.");
  }
  return res.json();
}

export async function fetchCatalogCoursesForPath(pathId: string): Promise<Course[]> {
  const res = await fetch(`/api/catalog/learning-paths/${pathId}/courses`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil daftar course untuk learning path ini.");
  }
  return res.json();
}

export async function fetchCatalogCourseBySlug(slug: string): Promise<Course> {
  const res = await fetch(`/api/catalog/course-by-slug/${slug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data course berdasarkan slug.");
  }
  return res.json();
}

export async function fetchCatalogCourseById(id: string): Promise<Course> {
  const res = await fetch(`/api/catalog/courses/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data course.");
  }
  return res.json();
}

export async function fetchCatalogLessonsForCourse(courseId: string): Promise<Lesson[]> {
  const res = await fetch(`/api/catalog/courses/${courseId}/lessons`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil daftar lesson untuk course ini.");
  }
  return res.json();
}

export async function fetchCatalogLessonBySlug(slug: string): Promise<Lesson> {
  const res = await fetch(`/api/catalog/lesson-by-slug/${slug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data lesson berdasarkan slug.");
  }
  return res.json();
}

export async function fetchCatalogLessonByCourseAndLessonSlug(courseSlug: string, lessonSlug: string): Promise<Lesson> {
  const res = await fetch(`/api/catalog/courses/by-slug/${courseSlug}/lessons/${lessonSlug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data lesson.");
  }
  return res.json();
}

export async function fetchCatalogLessonById(id: string): Promise<Lesson> {
  const res = await fetch(`/api/catalog/lessons/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data lesson.");
  }
  return res.json();
}

import { authenticatedFetch } from "./apiClient";
import { Quiz, Question, QuizAttempt, QuizSummary } from "../types";

export async function fetchQuizForCourse(courseId: string): Promise<Quiz | null> {
  try {
    const res = await fetch(`/api/quizzes/course/${courseId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Gagal mengambil data kuis.");
    }
    return await res.json();
  } catch (err) {
    console.error("fetchQuizForCourse error:", err);
    return null;
  }
}

export async function fetchQuizQuestions(quizId: string): Promise<Question[]> {
  try {
    const res = await fetch(`/api/quizzes/${quizId}/questions`);
    if (!res.ok) {
      throw new Error("Gagal mengambil soal kuis.");
    }
    return await res.json();
  } catch (err) {
    console.error("fetchQuizQuestions error:", err);
    return [];
  }
}

export async function submitQuizAttemptApi(quizId: string, answers: Record<string, string>): Promise<QuizAttempt> {
  const res = await authenticatedFetch(`/api/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal mengirimkan jawaban kuis.");
  }
  return data;
}

export async function fetchQuizAttempt(attemptId: string): Promise<QuizAttempt> {
  const res = await authenticatedFetch(`/api/me/quiz-attempts/${attemptId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal mengambil hasil attempt kuis.");
  }
  return data;
}

export async function fetchMyQuizAttempts(quizId?: string): Promise<QuizAttempt[]> {
  const query = quizId ? `?quizId=${encodeURIComponent(quizId)}` : "";
  const res = await authenticatedFetch(`/api/me/quiz-attempts${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal mengambil riwayat kuis.");
  }
  return data;
}

export async function fetchQuizSummary(quizId: string): Promise<QuizSummary | null> {
  try {
    const res = await authenticatedFetch(`/api/me/quiz-summaries/${quizId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("fetchQuizSummary error:", err);
    return null;
  }
}

// Admin Quiz Services
export async function getAdminQuizzesApi(courseId?: string): Promise<Quiz[]> {
  const url = courseId ? `/api/admin/quizzes?courseId=${courseId}` : `/api/admin/quizzes`;
  const res = await authenticatedFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil kuis admin.");
  return data.items || data;
}

export async function getAdminQuizApi(quizId: string): Promise<Quiz> {
  const res = await authenticatedFetch(`/api/admin/quizzes/${quizId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil detail kuis.");
  return data;
}

export async function createAdminQuizApi(payload: any): Promise<Quiz> {
  const res = await authenticatedFetch(`/api/admin/quizzes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal membuat kuis.");
  return data;
}

export async function updateAdminQuizApi(quizId: string, payload: any): Promise<Quiz> {
  const res = await authenticatedFetch(`/api/admin/quizzes/${quizId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengupdate kuis.");
  return data;
}

export async function deleteAdminQuizApi(quizId: string): Promise<any> {
  const res = await authenticatedFetch(`/api/admin/quizzes/${quizId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus kuis.");
  return data;
}

export async function getAdminQuestionsApi(quizId?: string): Promise<Question[]> {
  const url = quizId ? `/api/admin/questions?quizId=${quizId}` : `/api/admin/questions`;
  const res = await authenticatedFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil pertanyaan admin.");
  return data.items || data;
}

export async function getAdminQuestionApi(questionId: string): Promise<Question> {
  const res = await authenticatedFetch(`/api/admin/questions/${questionId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil detail pertanyaan.");
  return data;
}

export async function createAdminQuestionApi(payload: any): Promise<Question> {
  const res = await authenticatedFetch(`/api/admin/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal membuat pertanyaan.");
  return data;
}

export async function updateAdminQuestionApi(questionId: string, payload: any): Promise<Question> {
  const res = await authenticatedFetch(`/api/admin/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengupdate pertanyaan.");
  return data;
}

export async function deleteAdminQuestionApi(questionId: string): Promise<any> {
  const res = await authenticatedFetch(`/api/admin/questions/${questionId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus pertanyaan.");
  return data;
}

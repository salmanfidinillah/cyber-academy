import { authenticatedFetch } from "./apiClient";
import { UserProgress, XpTransaction } from "../types";

export interface CompleteLessonResponse {
  lessonProgress: UserProgress;
  courseProgress: UserProgress;
  pathProgress: UserProgress;
  xpEarned: number;
  alreadyCompleted: boolean;
  totalXp: number;
  currentLevel: number;
  levelUp: boolean;
  learningStreak: number;
}

export interface XpTransactionsResponse {
  transactions: XpTransaction[];
  nextCursor: string | null;
}

export async function fetchMyProgress(): Promise<UserProgress[]> {
  const response = await authenticatedFetch("/api/me/progress");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengambil data progres belajar.");
  }
  const data = await response.json();
  return data.progress || [];
}

export async function fetchMyXpTransactions(
  limitNum: number = 20,
  cursor?: string
): Promise<XpTransactionsResponse> {
  const params = new URLSearchParams();
  if (limitNum) params.append("limit", limitNum.toString());
  if (cursor) params.append("cursor", cursor);

  const url = `/api/me/xp-transactions${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await authenticatedFetch(url);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengambil data riwayat XP.");
  }
  return await response.json();
}

export async function completeMyLesson(lessonId: string): Promise<CompleteLessonResponse> {
  if (!lessonId || !lessonId.trim()) {
    throw new Error("Lesson ID tidak boleh kosong.");
  }
  const response = await authenticatedFetch(`/api/me/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menyelesaikan materi.");
  }

  return await response.json();
}

export async function resetMyLearningState(
  confirmation: string
): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch("/api/me/learning-state/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirmation }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mereset progres belajar.");
  }

  return await response.json();
}

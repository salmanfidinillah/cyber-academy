import { Badge, BadgeProgress, Certificate, UserBadge } from "../types";
import { authenticatedFetch } from "./apiClient";

async function parse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallback);
  return data as T;
}

export async function fetchBadges(): Promise<Badge[]> {
  return parse<Badge[]>(await fetch("/api/badges"), "Gagal mengambil daftar badge.");
}

export async function fetchMyBadges(): Promise<UserBadge[]> {
  return parse<UserBadge[]>(await authenticatedFetch("/api/me/badges"), "Gagal mengambil badge pengguna.");
}

export async function evaluateMyBadges(): Promise<UserBadge[]> {
  const result = await evaluateMyBadgeState();
  return result.userBadges;
}

export interface MyBadgeState {
  userBadges: UserBadge[];
  progress: BadgeProgress[];
}

export async function evaluateMyBadgeState(): Promise<MyBadgeState> {
  const result = await parse<MyBadgeState>(
    await authenticatedFetch("/api/me/badges/evaluate", {
      method: "POST",
      body: JSON.stringify({}),
    }),
    "Gagal mengevaluasi badge."
  );
  return result;
}

export async function fetchMyBadgeProgress(): Promise<BadgeProgress[]> {
  return parse<BadgeProgress[]>(
    await authenticatedFetch("/api/me/badges/progress"),
    "Gagal mengambil progress badge."
  );
}

export interface CertificateEligibility {
  learningPathId: string;
  learningPathTitle: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  coursesCompleted: number;
  totalCourses: number;
  isEligible: boolean;
}

export async function fetchCertificateEligibility(learningPathId: string): Promise<CertificateEligibility> {
  return parse<CertificateEligibility>(
    await authenticatedFetch(`/api/me/certificates/eligibility/${encodeURIComponent(learningPathId)}`),
    "Gagal memeriksa kelayakan sertifikat."
  );
}

export async function fetchMyCertificates(): Promise<Certificate[]> {
  return parse<Certificate[]>(
    await authenticatedFetch("/api/me/certificates"),
    "Gagal mengambil sertifikat."
  );
}

export async function createMyCertificate(learningPathId: string, recipientName?: string): Promise<Certificate> {
  const result = await parse<{ certificate: Certificate }>(
    await authenticatedFetch("/api/me/certificates", {
      method: "POST",
      body: JSON.stringify({ learningPathId, recipientName }),
    }),
    "Gagal menerbitkan sertifikat."
  );
  return result.certificate;
}

export async function fetchAdminBadges(): Promise<Badge[]> {
  return parse<Badge[]>(await authenticatedFetch("/api/admin/badges"), "Gagal mengambil badge admin.");
}

export async function updateAdminBadge(badgeId: string, payload: Partial<Pick<Badge, "title" | "description" | "status" | "order">>): Promise<Badge> {
  return parse<Badge>(
    await authenticatedFetch(`/api/admin/badges/${encodeURIComponent(badgeId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    "Gagal memperbarui badge."
  );
}

export async function fetchAdminCertificates(): Promise<Certificate[]> {
  return parse<Certificate[]>(
    await authenticatedFetch("/api/admin/certificates"),
    "Gagal mengambil sertifikat admin."
  );
}

export async function updateCertificateStatus(certificateId: string, status: "active" | "revoked"): Promise<Certificate> {
  return parse<Certificate>(
    await authenticatedFetch(`/api/admin/certificates/${encodeURIComponent(certificateId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    "Gagal memperbarui status sertifikat."
  );
}

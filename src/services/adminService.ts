import { authenticatedFetch } from "./apiClient";

async function json<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallback);
  return data as T;
}

export async function fetchAdminSimulations(): Promise<any[]> {
  return json(await authenticatedFetch("/api/admin/simulations"), "Gagal mengambil simulasi.");
}

export async function updateAdminSimulation(simulationId: string, payload: Record<string, unknown>): Promise<any> {
  return json(
    await authenticatedFetch(`/api/admin/simulations/${encodeURIComponent(simulationId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    "Gagal memperbarui simulasi."
  );
}

export async function fetchAdminUsers(): Promise<any[]> {
  return json(await authenticatedFetch("/api/admin/users?limit=200"), "Gagal mengambil pengguna.");
}

export async function updateAdminUser(uid: string, payload: { role?: "user" | "admin"; accountStatus?: "active" | "disabled" }): Promise<any> {
  return json(
    await authenticatedFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    "Gagal memperbarui pengguna."
  );
}

export async function fetchAdminAuditLogs(limit = 50): Promise<any[]> {
  return json(await authenticatedFetch(`/api/admin/audit-logs?limit=${limit}`), "Gagal mengambil audit log.");
}

export async function fetchAdminDashboardStats(): Promise<{
  learningPaths: number;
  coursesPublished: number;
  lessonsPublished: number;
  quizzesCount: number;
  simulationAttempts: number;
  activeCertificates: number;
}> {
  return json(await authenticatedFetch("/api/admin/stats"), "Gagal mengambil statistik admin.");
}

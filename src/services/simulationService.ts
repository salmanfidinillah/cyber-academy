import { authenticatedFetch } from "./apiClient";

export interface SimulationAttemptSummary {
  attemptId: string;
  simulationId: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  submittedAt: string;
}

export interface SimulationAnswerFeedback {
  scenarioId: string;
  selectedActionId: string;
  correctActionId: string;
  isCorrect: boolean;
  explanation: string;
  risk: string;
  tip: string;
}

async function parse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallback);
  return data as T;
}

export async function fetchSimulations(): Promise<any[]> {
  return parse<any[]>(await fetch("/api/simulations"), "Gagal memuat daftar simulasi.");
}

export async function fetchMySimulationAttempts(simulationId?: string): Promise<SimulationAttemptSummary[]> {
  const query = simulationId ? `?simulationId=${encodeURIComponent(simulationId)}` : "";
  return parse<SimulationAttemptSummary[]>(
    await authenticatedFetch(`/api/me/simulation-attempts${query}`),
    "Gagal memuat progres simulasi."
  );
}

export async function checkMySimulationAnswer(
  simulationId: string,
  scenarioId: string,
  actionId: string
): Promise<SimulationAnswerFeedback> {
  return parse<SimulationAnswerFeedback>(
    await authenticatedFetch(`/api/simulations/${encodeURIComponent(simulationId)}/check`, {
      method: "POST",
      body: JSON.stringify({ scenarioId, actionId }),
    }),
    "Gagal memeriksa jawaban."
  );
}

export async function submitMySimulation(
  simulationId: string,
  answers: Record<string, string>,
  elapsedSeconds: number
): Promise<any> {
  return parse<any>(
    await authenticatedFetch(`/api/simulations/${encodeURIComponent(simulationId)}/attempts`, {
      method: "POST",
      body: JSON.stringify({ answers, elapsedSeconds }),
    }),
    "Gagal menyimpan hasil simulasi."
  );
}

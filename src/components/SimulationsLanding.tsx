import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  PhoneCall,
  Play,
  RefreshCw,
  ShieldCheck,
  Target,
  Terminal,
} from "lucide-react";
import { User } from "../types";
import { SIMULATION_CATALOG } from "../simulationCatalog";
import { fetchMySimulationAttempts, fetchSimulations } from "../services/simulationService";

interface SimulationsLandingProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

const ICONS = {
  mail: Mail,
  message: MessageSquare,
  phone: PhoneCall,
  terminal: Terminal,
};

export const SimulationsLanding = ({ currentUser, onNavigate }: SimulationsLandingProps) => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, history] = await Promise.all([fetchSimulations(), fetchMySimulationAttempts()]);
      setPublishedIds(new Set(catalog.map((item) => item.simulationId)));
      setAttempts(history);
    } catch (err: any) {
      setError(err.message || "Gagal memuat ruang simulasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser.uid]);

  const progressBySimulation = useMemo(() => {
    const output = new Map<string, { attempts: number; bestScore: number; completed: boolean }>();
    attempts.forEach((attempt) => {
      const previous = output.get(attempt.simulationId) || { attempts: 0, bestScore: 0, completed: false };
      output.set(attempt.simulationId, {
        attempts: previous.attempts + 1,
        bestScore: Math.max(previous.bestScore, Number(attempt.score || 0)),
        completed: previous.completed || attempt.passed === true,
      });
    });
    return output;
  }, [attempts]);

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl py-6 text-brand-text animate-fadeIn sm:py-8">
      <section className="bg-pastel-blue border-3 border-black rounded-[28px] p-6 sm:p-8 neo-shadow relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-pastel-yellow border-3 border-black rounded-full opacity-70" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-white border-2 border-black rounded-full px-3 py-1 text-xs font-extrabold uppercase">
            <ShieldCheck className="w-4 h-4" /> Laboratorium defensif
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl mt-4">Ruang Simulasi Interaktif</h1>
          <p className="mt-3 font-semibold leading-relaxed">
            Latih kewaspadaan menghadapi email phishing, scam chat, vishing, dan laporan malware secara aman.
            Semua skenario fiktif, feedback edukatif, dan reward divalidasi server.
          </p>
        </div>
      </section>

      {error && (
        <section className="mt-6 bg-pastel-peach border-3 border-black rounded-xl p-4 neo-shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" role="alert">
          <p className="font-bold flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>
          <button className="neo-button bg-white shrink-0" onClick={load}><RefreshCw className="w-4 h-4" />Coba Lagi</button>
        </section>
      )}

      <div className="mt-9 flex flex-wrap items-end justify-between gap-3 border-b-3 border-black pb-3">
        <div>
          <span className="font-mono text-xs font-bold uppercase">4 latihan nyata</span>
          <h2 className="font-heading font-extrabold text-2xl">Simulasi Aktif</h2>
        </div>
        <span className="bg-pastel-mint border-2 border-black rounded-full px-3 py-1 text-xs font-extrabold">
          {progressBySimulation.size} / 4 pernah dicoba
        </span>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-80 rounded-2xl border-3 border-black bg-white animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {SIMULATION_CATALOG.map((simulation) => {
            const Icon = ICONS[simulation.icon];
            const progress = progressBySimulation.get(simulation.simulationId);
            const published = publishedIds.has(simulation.simulationId);
            return (
              <article
                key={simulation.simulationId}
                className={`${simulation.color} border-3 border-black rounded-2xl p-5 sm:p-6 neo-shadow flex flex-col min-h-[340px]`}
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="w-12 h-12 bg-white border-2 border-black rounded-xl neo-shadow-sm flex items-center justify-center">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className={`border-2 border-black rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${progress?.completed ? "bg-white" : "bg-pastel-mint"}`}>
                    {progress?.completed ? "Selesai" : published ? "Aktif" : "Tidak tersedia"}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-xl mt-5">{simulation.title}</h3>
                <p className="text-sm font-semibold leading-relaxed mt-2">{simulation.shortDescription}</p>

                <div className="mt-5 grid grid-cols-1 gap-2 text-xs font-extrabold min-[360px]:grid-cols-3">
                  <span className="bg-white/80 border border-black rounded-lg p-2 flex items-center gap-1"><Target className="w-3 h-3" />{simulation.difficulty}</span>
                  <span className="bg-white/80 border border-black rounded-lg p-2 flex items-center gap-1"><Clock3 className="w-3 h-3" />{simulation.estimatedMinutes} menit</span>
                  <span className="bg-white/80 border border-black rounded-lg p-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />+{simulation.xpReward} XP</span>
                </div>

                <div className="mt-auto pt-5 border-t border-black/20">
                  <div className="flex flex-wrap gap-2 justify-between items-center mb-3 text-xs font-bold">
                    <span>{simulation.scenarios.length} tahap</span>
                    <span>{progress ? `Skor terbaik ${progress.bestScore}%` : "Belum dimainkan"}</span>
                  </div>
                  {progress?.completed && (
                    <p className="mb-3 flex items-center gap-2 text-xs font-bold"><CheckCircle2 className="w-4 h-4" />XP hanya diberikan pada kelulusan pertama.</p>
                  )}
                  <button
                    className="neo-button bg-white w-full"
                    disabled={!published}
                    onClick={() => onNavigate(`/simulations/${simulation.simulationId}`)}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {progress ? "Lanjut / Ulangi Simulasi" : "Mulai Simulasi"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

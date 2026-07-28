import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import { User } from "../types";
import { getSimulationDefinition } from "../simulationCatalog";
import {
  checkMySimulationAnswer,
  fetchMySimulationAttempts,
  SimulationAnswerFeedback,
  submitMySimulation,
} from "../services/simulationService";
import { useUser } from "../contexts/UserContext";

interface SimulationPlayerProps {
  currentUser: User;
  simulationId: string;
  onNavigate: (route: string) => void;
}

type Phase = "loading" | "intro" | "tutorial" | "active" | "result" | "error";

export function SimulationPlayer({ currentUser, simulationId, onNavigate }: SimulationPlayerProps) {
  const definition = useMemo(() => getSimulationDefinition(simulationId), [simulationId]);
  const { refreshUserProfile } = useUser();
  const [phase, setPhase] = useState<Phase>(definition ? "loading" : "error");
  const [step, setStep] = useState(0);
  const [selectedAction, setSelectedAction] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<SimulationAnswerFeedback | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());

  const loadHistory = async () => {
    if (!definition) return;
    setPhase("loading");
    setError("");
    try {
      setHistory(await fetchMySimulationAttempts(definition.simulationId));
      setPhase("intro");
    } catch (err: any) {
      setError(err.message || "Gagal memuat simulasi.");
      setPhase("error");
    }
  };

  useEffect(() => {
    loadHistory();
  }, [definition?.simulationId, currentUser.uid]);

  useEffect(() => {
    if (phase !== "active") return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [phase]);

  if (!definition) {
    return (
      <main className="max-w-xl mx-auto p-4 py-12">
        <section className="bg-pastel-peach border-3 border-black rounded-2xl p-6 neo-shadow text-center">
          <XCircle className="w-12 h-12 mx-auto mb-3" aria-hidden="true" />
          <h1 className="font-heading font-extrabold text-2xl">Simulasi tidak ditemukan</h1>
          <p className="mt-2 text-sm font-semibold">Alamat simulasi tidak valid atau simulasi sudah dipindahkan.</p>
          <button className="mt-5 neo-button bg-white" onClick={() => onNavigate("/simulations")}>
            Kembali ke Daftar Simulasi
          </button>
        </section>
      </main>
    );
  }

  const bestScore = history.reduce((best, attempt) => Math.max(best, Number(attempt.score || 0)), 0);
  const completedBefore = history.some((attempt) => attempt.passed);
  const scenario = definition.scenarios[step];
  const progress = Math.round(((step + (feedback ? 1 : 0)) / definition.scenarios.length) * 100);

  const exitSimulation = () => {
    if (phase === "active" && !window.confirm("Keluar dari simulasi sekarang? Jawaban percobaan ini belum disimpan.")) return;
    onNavigate("/simulations");
  };

  const startSimulation = () => {
    setStep(0);
    setAnswers({});
    setSelectedAction("");
    setFeedback(null);
    setResult(null);
    setError("");
    startedAt.current = Date.now();
    setPhase("tutorial");
  };

  const confirmAnswer = async () => {
    if (!scenario || !selectedAction) {
      setError("Pilih satu tindakan sebelum mengonfirmasi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const checked = await checkMySimulationAnswer(definition.simulationId, scenario.id, selectedAction);
      setAnswers((current) => ({ ...current, [scenario.id]: selectedAction }));
      setFeedback(checked);
    } catch (err: any) {
      setError(err.message || "Jawaban belum dapat diperiksa.");
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (step < definition.scenarios.length - 1) {
      setStep((value) => value + 1);
      setSelectedAction("");
      setFeedback(null);
      setError("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      const submitted = await submitMySimulation(definition.simulationId, answers, elapsedSeconds);
      setResult(submitted);
      await refreshUserProfile();
      setHistory(await fetchMySimulationAttempts(definition.simulationId));
      setPhase("result");
    } catch (err: any) {
      setError(err.message || "Hasil belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") {
    return <div className="max-w-4xl mx-auto p-8 font-bold animate-pulse">Memuat ruang simulasi…</div>;
  }

  if (phase === "error") {
    return (
      <main className="max-w-xl mx-auto p-4 py-12">
        <section className="bg-pastel-peach border-3 border-black rounded-2xl p-6 neo-shadow text-center" role="alert">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-heading font-extrabold text-2xl">Simulasi gagal dimuat</h1>
          <p className="mt-2 text-sm font-semibold">{error}</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button className="neo-button bg-white" onClick={() => onNavigate("/simulations")}>Kembali</button>
            <button className="neo-button bg-pastel-mint" onClick={loadHistory}>Coba Lagi</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10 text-brand-text overflow-x-hidden">
      <button
        className="mb-5 inline-flex items-center gap-2 font-extrabold hover:underline focus-visible:outline-4 focus-visible:outline-blue-500"
        onClick={exitSimulation}
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Simulasi
      </button>

      {phase === "intro" && (
        <section className={`${definition.color} border-3 border-black rounded-[28px] p-5 sm:p-8 neo-shadow relative overflow-hidden`}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-3 border-black/20 bg-white/30" aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex border-2 border-black bg-white rounded-full px-3 py-1 text-xs font-extrabold">
              {definition.difficulty} · {definition.scenarios.length} tahap
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl mt-4 max-w-3xl">{definition.title}</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-relaxed">{definition.shortDescription}</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {[
                [Clock3, `${definition.estimatedMinutes} menit`],
                [Target, `${definition.scenarios.length} tahap`],
                [ShieldCheck, `+${definition.xpReward} XP`],
                [BookOpenCheck, bestScore ? `Skor terbaik ${bestScore}` : "Belum dimainkan"],
              ].map(([Icon, label]: any) => (
                <div key={label} className="bg-white border-2 border-black rounded-xl p-3 font-extrabold flex items-center gap-2">
                  <Icon className="w-5 h-5 shrink-0" /> <span className="text-xs sm:text-sm">{label}</span>
                </div>
              ))}
            </div>

            {completedBefore && (
              <div className="mt-5 bg-white border-2 border-black rounded-xl p-3 font-bold flex gap-2 items-center">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
                Sudah pernah diselesaikan. Pengulangan menyimpan skor terbaik tanpa XP ganda.
              </div>
            )}

            <div className="mt-6 grid lg:grid-cols-2 gap-4">
              <div className="bg-white/80 border-2 border-black rounded-2xl p-4">
                <h2 className="font-heading font-extrabold text-lg">Tujuan pembelajaran</h2>
                <ul className="mt-2 space-y-2 text-sm font-semibold">
                  {definition.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{objective}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-pastel-yellow/80 border-2 border-black rounded-2xl p-4">
                <h2 className="font-heading font-extrabold text-lg">Cara bermain</h2>
                <p className="mt-2 text-sm font-semibold">Baca konteks dan bukti, pilih tindakan, konfirmasi, lalu pelajari feedback sebelum melanjutkan.</p>
                <p className="mt-3 text-xs font-bold flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{definition.warning}</p>
              </div>
            </div>
            <button className="neo-button bg-white w-full sm:w-auto mt-6 text-base" onClick={startSimulation}>
              {completedBefore ? "Ulangi Simulasi" : "Mulai Simulasi"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {phase === "tutorial" && (
        <section>
          <div className="bg-pastel-blue border-3 border-black rounded-2xl p-5 sm:p-7 neo-shadow">
            <span className="font-mono text-xs font-bold uppercase">Tutorial singkat</span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl mt-2">Kenali konsep sebelum bertindak</h1>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {definition.tutorial.map((item, index) => (
                <article key={item.title} className="bg-white border-2 border-black rounded-xl p-4 neo-shadow-sm">
                  <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-pastel-yellow border-2 border-black font-extrabold">
                    {index + 1}
                  </span>
                  <h2 className="font-heading font-extrabold mt-3">{item.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed">{item.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 bg-pastel-mint border-2 border-black rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">Checklist: verifikasi sumber, tahan rasa panik, lindungi data rahasia, dan gunakan kanal resmi.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button className="neo-button bg-white" onClick={() => setPhase("intro")}>Kembali</button>
              <button className="neo-button bg-pastel-mint flex-1" onClick={() => setPhase("active")}>
                Saya Mengerti — Lanjut ke Simulasi
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "active" && scenario && (
        <section>
          <div className="sticky top-2 z-20 bg-white border-2 border-black rounded-xl p-3 neo-shadow-sm mb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
              <span>Tahap {step + 1} dari {definition.scenarios.length}</span>
              <span>Skor sementara: {Object.keys(answers).length} jawaban diperiksa</span>
            </div>
            <div className="h-3 bg-white border-2 border-black rounded-full mt-2 overflow-hidden" aria-label={`Progres ${progress}%`}>
              <div className="h-full bg-pastel-mint transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] gap-5 items-start">
            <article className={`${definition.color} border-3 border-black rounded-2xl p-5 sm:p-7 neo-shadow min-w-0`}>
              <span className="font-mono text-xs font-bold uppercase">Skenario {step + 1}</span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl mt-2">{scenario.title}</h1>
              <p className="mt-3 font-semibold leading-relaxed">{scenario.context}</p>
              <h2 className="font-heading font-extrabold mt-6">Informasi yang harus diperiksa</h2>
              <div className="mt-3 grid gap-2">
                {scenario.evidence.map((item) => (
                  <div key={item} className="bg-white border-2 border-black rounded-lg p-3 text-sm font-mono font-semibold break-words">{item}</div>
                ))}
              </div>
            </article>

            <aside className="bg-white border-3 border-black rounded-2xl p-5 neo-shadow min-w-0">
              <h2 className="font-heading font-extrabold text-xl">Pilih tindakan terbaik</h2>
              <div className="mt-4 space-y-3" role="radiogroup" aria-label="Pilihan tindakan">
                {scenario.choices.map((choice) => (
                  <button
                    key={choice.id}
                    role="radio"
                    aria-checked={selectedAction === choice.id}
                    disabled={Boolean(feedback)}
                    onClick={() => { setSelectedAction(choice.id); setError(""); }}
                    className={`w-full text-left border-2 border-black rounded-xl p-3 transition-all focus-visible:outline-4 focus-visible:outline-blue-500 ${
                      selectedAction === choice.id ? "bg-pastel-yellow neo-shadow-sm" : "bg-white hover:bg-brand-surface"
                    } disabled:cursor-default`}
                  >
                    <span className="font-extrabold block">{choice.label}</span>
                    <span className="text-xs font-semibold text-brand-muted block mt-1">{choice.detail}</span>
                  </button>
                ))}
              </div>

              {error && <p className="mt-3 bg-red-100 border-2 border-red-500 rounded-lg p-3 text-sm font-bold text-red-800" role="alert">{error}</p>}

              {!feedback ? (
                <button className="neo-button bg-pastel-mint w-full mt-4" disabled={busy || !selectedAction} onClick={confirmAnswer}>
                  {busy ? "Memeriksa…" : "Konfirmasi Tindakan"}
                </button>
              ) : (
                <div className={`mt-4 border-2 border-black rounded-xl p-4 ${feedback.isCorrect ? "bg-pastel-mint" : "bg-pastel-peach"}`} aria-live="polite">
                  <h3 className="font-heading font-extrabold flex items-center gap-2">
                    {feedback.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {feedback.isCorrect ? "Tindakanmu tepat" : "Tindakanmu belum tepat"}
                  </h3>
                  <p className="text-sm font-semibold mt-2">{feedback.explanation}</p>
                  <p className="text-xs font-bold mt-3"><strong>Risiko:</strong> {feedback.risk}</p>
                  <p className="text-xs font-bold mt-2"><strong>Ingat:</strong> {feedback.tip}</p>
                  <button className="neo-button bg-white w-full mt-4" disabled={busy} onClick={goNext}>
                    {busy ? "Menyimpan…" : step === definition.scenarios.length - 1 ? "Lihat Hasil" : "Langkah Berikutnya"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      {phase === "result" && result && (
        <section className={`${result.passed ? "bg-pastel-mint" : "bg-pastel-yellow"} border-3 border-black rounded-[28px] p-5 sm:p-8 neo-shadow`}>
          <div className="text-center">
            {result.passed ? <ShieldCheck className="w-16 h-16 mx-auto" /> : <BookOpenCheck className="w-16 h-16 mx-auto" />}
            <span className="inline-block bg-white border-2 border-black rounded-full px-3 py-1 text-xs font-extrabold mt-3">
              {result.attempt.score >= 90 ? "Sangat Waspada" : result.attempt.score >= 75 ? "Cukup Siap" : result.attempt.score >= 60 ? "Perlu Lebih Teliti" : "Pelajari Kembali Materinya"}
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl mt-3">Skor {result.attempt.score}%</h1>
            <p className="font-bold mt-2">
              {result.attempt.correctCount} benar · {result.attempt.totalQuestions - result.attempt.correctCount} perlu dipelajari
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              ["Status", result.passed ? "Lulus" : "Ulangi"],
              ["XP diperoleh", result.xpEarned > 0 ? `+${result.xpEarned} XP` : result.alreadyRewarded ? "Sudah diberikan" : "0 XP"],
              ["Skor terbaik", `${result.bestScore}%`],
              ["Percobaan", String(result.attemptsCount)],
            ].map(([label, value]) => (
              <div key={label} className="bg-white border-2 border-black rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-brand-muted block">{label}</span>
                <span className="font-heading font-extrabold text-lg block mt-1">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white border-2 border-black rounded-xl p-4">
            <h2 className="font-heading font-extrabold text-xl">Ringkasan pembelajaran</h2>
            <p className="text-sm font-semibold mt-2">
              {result.passed
                ? "Kamu sudah mengenali mayoritas indikator dan memilih respons defensif yang tepat."
                : "Pelajari kembali tahap yang keliru. Simulasi dapat diulang dan skor terbaik tetap tersimpan."}
            </p>
            <ul className="mt-3 space-y-2 text-xs font-semibold">
              {result.review.filter((item: any) => !item.isCorrect).map((item: any) => (
                <li key={item.scenarioId} className="bg-pastel-peach border border-black rounded-lg p-2">
                  {item.explanation} <strong>Tips:</strong> {item.tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button className="neo-button bg-white" onClick={() => onNavigate("/simulations")}>Daftar Simulasi</button>
            <button className="neo-button bg-pastel-yellow flex-1" onClick={startSimulation}><RotateCcw className="w-4 h-4" /> Ulangi Simulasi</button>
            <button className="neo-button bg-pastel-blue flex-1" onClick={() => onNavigate("/learn/paths")}>Lanjut ke Materi</button>
          </div>
        </section>
      )}
    </main>
  );
}

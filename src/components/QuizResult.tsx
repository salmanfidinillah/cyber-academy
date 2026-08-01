import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, HelpCircle, BookOpen, Clock, AlertTriangle, History, RefreshCw } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import { User, Course, Lesson, QuizAttempt, QuizSummary } from "../types";
import { fetchCatalogCourseBySlug, fetchCatalogLessonsForCourse } from "../services/catalogService";
import { fetchMyQuizAttempts, fetchQuizAttempt, fetchQuizForCourse, fetchQuizSummary } from "../services/quizService";
import { createAiConversation } from "../lib/learningStore";

interface QuizResultProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  courseSlug: string;
  attemptId: string;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  currentUser,
  onNavigate,
  courseSlug,
  attemptId
}) => {
  const [matchedCourse, setMatchedCourse] = useState<Course | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const handleStartRemedialAi = async () => {
    if (!matchedCourse || !attempt) return;
    try {
      const conv = await createAiConversation(
        currentUser.uid,
        "remedial",
        matchedCourse.learningPathId,
        matchedCourse.id,
        undefined,
        `Remedial Kuis: ${matchedCourse.title}`
      );
      onNavigate(`/ai-tutor/${conv.conversationId}`);
    } catch (err) {
      console.error("Gagal memulai bimbingan AI:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const course = await fetchCatalogCourseBySlug(courseSlug);
      if (!course) {
        setLoading(false);
        return;
      }
      setMatchedCourse(course);

      const quiz = await fetchQuizForCourse(course.id);
      if (!quiz) throw new Error("Kuis tidak ditemukan.");

      const [att, lessonsList, sumRes, attemptsList] = await Promise.all([
        fetchQuizAttempt(attemptId),
        fetchCatalogLessonsForCourse(course.id),
        fetchQuizSummary(quiz.id),
        fetchMyQuizAttempts(quiz.id),
      ]);

      setAttempt(att);
      setCourseLessons(lessonsList);
      setSummary(sumRes);

      setAllAttempts(attemptsList);
    } catch (err) {
      console.error("Error loading quiz result data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [attemptId, courseSlug, currentUser.uid]);

  const handleViewRecommendation = (lessonSlug: string) => {
    if (!matchedCourse) return;
    onNavigate(`/learn/courses/${courseSlug}/lessons/${lessonSlug}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] font-sans">
        <RefreshCw className="w-8 h-8 text-pastel-mint animate-spin mb-2" />
        <p className="text-xs text-brand-muted font-bold">Sedang memproses evaluasi Anda...</p>
      </div>
    );
  }

  if (!matchedCourse || !attempt) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center font-sans">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h2 className="text-xl font-heading font-bold">Riwayat Tidak Ditemukan</h2>
          <p className="text-xs text-brand-muted">Maaf, rincian hasil pengerjaan kuis ini tidak dapat ditemukan.</p>
          <NeoButton variant="secondary" onClick={() => onNavigate("/learn/paths")}>
            Kembali ke Jalur Belajar
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  const { score, passed, resultStatus, correctCount, totalQuestions, recommendedLessonIds } = attempt;
  const recommendedLessons = courseLessons.filter(l => recommendedLessonIds.includes(l.id));

  return (
    <div className="mx-auto my-6 w-full min-w-0 max-w-3xl px-0 font-sans text-brand-text animate-fadeIn sm:my-8 sm:px-4">
      <div className="mb-6 flex min-w-0 flex-col items-start gap-2 text-xs font-bold text-brand-muted sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => onNavigate(`/learn/courses/${courseSlug}`)}
          className="flex items-center space-x-1 font-bold hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Kelas</span>
        </button>
        <span className="max-w-full break-all font-mono text-xs uppercase text-brand-muted">ID: {attempt.attemptId}</span>
      </div>

      <NeoCard bgColor="bg-white" className="p-6 sm:p-8 text-center space-y-6 mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-extrabold tracking-tight">Hasil Evaluasi Kelas</h2>
          <p className="text-xs font-bold text-brand-muted uppercase">Modul: {matchedCourse.title}</p>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-3 border-brand-border bg-pastel-yellow neo-shadow-sm rotate-[-3deg]">
            <div className="text-center">
              <span className="text-4xl font-heading font-extrabold">{score}</span>
              <span className="text-lg font-heading font-extrabold">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {resultStatus === "passed" && (
              <NeoBadge bgColor="bg-pastel-mint">LULUS KELAS</NeoBadge>
            )}
            {resultStatus === "almost_passed" && (
              <NeoBadge bgColor="bg-pastel-yellow">HAMPIR LULUS</NeoBadge>
            )}
            {resultStatus === "remedial_required" && (
              <NeoBadge bgColor="bg-pastel-peach">REMEDIAL DIPERLUKAN</NeoBadge>
            )}
          </div>
        </div>

        {resultStatus === "passed" && (
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-xs sm:text-sm text-brand-muted font-semibold leading-relaxed">
              Luar biasa! Kamu berhasil menjawab <strong className="text-brand-text">{correctCount}</strong> dari <strong className="text-brand-text">{totalQuestions}</strong> pertanyaan dengan benar. Akses ke kelas berikutnya kini telah terbuka!
            </p>
            {attempt.xpEarned > 0 && (
              <div className="bg-pastel-yellow border-2 border-brand-border rounded-xl p-3 max-w-xs mx-auto text-xs font-bold animate-pulse">
                🎉 Bonus Kelulusan Pertama: +{attempt.xpEarned} XP diperoleh!
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <NeoButton variant="primary" onClick={() => onNavigate("/learn/paths")} className="w-full sm:w-auto text-xs font-bold">
                Kembali ke Jalur Belajar
              </NeoButton>
            </div>
          </div>
        )}

        {resultStatus === "almost_passed" && (
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-xs sm:text-sm text-brand-muted font-semibold leading-relaxed">
              Skor kamu <strong className="text-brand-text">{score}%</strong>. Sedikit lagi kamu lulus! Nilai kelulusan minimal adalah <strong className="text-brand-text">70%</strong>. Yuk ulas jawabanmu di bawah ini dan coba lagi seketika!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <NeoButton variant="secondary" onClick={() => onNavigate(`/learn/courses/${courseSlug}`)} className="text-xs font-bold">
                Kembali ke Materi
              </NeoButton>
              <NeoButton variant="mint" onClick={handleStartRemedialAi} className="text-xs font-bold flex items-center justify-center">
                <span>💬 Tanya AI Tutor</span>
              </NeoButton>
              <NeoButton variant="primary" onClick={() => onNavigate(`/learn/courses/${courseSlug}/quiz`)} className="text-xs font-bold flex items-center justify-center space-x-1">
                <RefreshCw className="w-4 h-4 mr-1" />
                <span>Ulangi Kuis Sekarang</span>
              </NeoButton>
            </div>
          </div>
        )}

        {resultStatus === "remedial_required" && (
          <div className="max-w-lg mx-auto space-y-4 text-left border-2 border-brand-border bg-pastel-peach/10 p-5 rounded-2xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-pastel-peach shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-extrabold text-sm text-brand-text">Bimbingan Remedial Diperlukan</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Kamu mendapat nilai <strong className="text-brand-text">{score}%</strong>. Kamu perlu mengulas kembali bagian materi pelajaran yang belum dipahami di bawah ini.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {recommendedLessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => handleViewRecommendation(lesson.slug)}
                  className="group flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border-2 border-brand-border bg-white p-3.5 text-left transition-all hover:bg-brand-surface/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border-2 border-brand-border bg-pastel-blue flex items-center justify-center font-bold text-xs shrink-0">
                      📖
                    </div>
                    <div className="min-w-0">
                      <h5 className="break-words text-xs font-bold text-brand-text group-hover:underline [overflow-wrap:anywhere]">{lesson.title}</h5>
                      <p className="mt-0.5 break-words text-[10px] text-brand-muted [overflow-wrap:anywhere]">{lesson.objective.substring(0, 75)}...</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-brand-border/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="text-[10px] text-brand-muted font-bold">
                <span>Pelajari rekomendasi di atas sebelum mencoba kembali</span>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:flex sm:w-auto">
                <NeoButton
                  variant="mint"
                  onClick={handleStartRemedialAi}
                  className="w-full sm:w-auto text-xs font-bold py-2 px-4"
                >
                  💬 Tanya AI Tutor
                </NeoButton>
                <NeoButton
                  variant="primary"
                  onClick={() => onNavigate(`/learn/courses/${courseSlug}/quiz`)}
                  className="w-full sm:w-auto text-xs font-bold py-2 px-4"
                >
                  Ulangi Kuis
                </NeoButton>
              </div>
            </div>
          </div>
        )}
      </NeoCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <NeoCard bgColor="bg-pastel-yellow/15" className="p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Statistik Pribadi</span>
            <h3 className="font-heading font-extrabold text-sm">Skor Terbaik Kuis</h3>
          </div>
          <div className="py-2">
            <div className="text-3xl font-heading font-extrabold">{summary?.bestScore || 0}%</div>
            <p className="text-[10px] text-brand-muted font-bold mt-1">
              Percobaan: {summary?.attemptCount || 0}x • Status: {summary?.passed ? "Lulus" : "Belum Lulus"}
            </p>
          </div>
        </NeoCard>

        <NeoCard bgColor="bg-white" className="p-5 md:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-2">
            <h3 className="font-heading font-extrabold text-sm flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Riwayat Percobaan Kuis</span>
            </h3>
            <span className="text-[10px] text-brand-muted font-mono">{allAttempts.length} Total</span>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {allAttempts.map((att, i) => (
              <div
                key={att.attemptId}
                onClick={() => {
                  if (att.attemptId !== attemptId) {
                    onNavigate(`/learn/courses/${courseSlug}/quiz/results/${att.attemptId}`);
                  }
                }}
                className={`p-2 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-colors ${
                  att.attemptId === attemptId
                    ? "bg-brand-surface border-brand-border font-bold"
                    : "bg-white border-brand-border/10 hover:border-brand-border"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-brand-muted">#{allAttempts.length - i}</span>
                  <span className="font-heading font-extrabold">{att.score}%</span>
                  <NeoBadge
                    size="sm"
                    bgColor={
                      att.resultStatus === "passed"
                        ? "bg-pastel-mint"
                        : att.resultStatus === "almost_passed"
                        ? "bg-pastel-yellow"
                        : "bg-pastel-peach"
                    }
                    className="py-0 px-2 text-[8px]"
                  >
                    {att.resultStatus === "passed" ? "Pass" : att.resultStatus === "almost_passed" ? "Almost" : "Remedial"}
                  </NeoBadge>
                </div>
                <div className="text-[9px] text-brand-muted">
                  {new Date(att.submittedAt).toLocaleDateString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
            ))}
          </div>
        </NeoCard>
      </div>

      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-lg border-b border-brand-border/10 pb-2 mb-4 flex items-center space-x-2">
          <span>📖 Pembahasan Soal</span>
        </h3>

        {(attempt.review || []).map((rev: any, idx: number) => (
          <NeoCard key={rev.questionId} bgColor="bg-white" className="p-5 sm:p-6 space-y-4 border-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg border-2 border-brand-border bg-pastel-yellow flex items-center justify-center font-heading font-bold text-xs shrink-0">
                  {idx + 1}
                </span>
                <span className="text-[10px] text-brand-muted uppercase font-bold">Butir Soal</span>
              </div>
              <div className="flex items-center gap-1.5">
                {rev.isCorrect ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pastel-mint/30 text-emerald-800 border-2 border-emerald-300">
                    Benar
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pastel-peach/30 text-rose-800 border-2 border-rose-300">
                    Salah
                  </span>
                )}
              </div>
            </div>

            <div className="bg-pastel-blue/10 border-2 border-brand-border/20 p-4 rounded-xl text-xs font-medium leading-relaxed space-y-1">
              <span className="font-heading font-extrabold text-xs text-brand-text flex items-center space-x-1 mb-1">
                <span>💡 Penjelasan Keamanan Siber:</span>
              </span>
              <p className="text-brand-muted leading-relaxed">{rev.explanation}</p>
            </div>
          </NeoCard>
        ))}
      </div>
    </div>
  );
};

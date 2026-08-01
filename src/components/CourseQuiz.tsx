import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, HelpCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import { User, Course, Question } from "../types";
import { fetchCatalogCourseBySlug } from "../services/catalogService";
import { fetchQuizForCourse, fetchQuizQuestions, submitQuizAttemptApi, fetchQuizSummary } from "../services/quizService";
import { useUser } from "../contexts/UserContext";

interface CourseQuizProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  courseSlug: string;
}

export const CourseQuiz: React.FC<CourseQuizProps> = ({
  currentUser,
  onNavigate,
  courseSlug
}) => {
  const { refreshUserProfile } = useUser();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchedCourse, setMatchedCourse] = useState<Course | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestIdx, setCurrentQuestIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const tempStorageKey = `cyber_academy_temp_answers_${currentUser.uid}_${matchedCourse?.id || courseSlug}`;

  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      try {
        const course = await fetchCatalogCourseBySlug(courseSlug);
        if (!course) {
          setErrorMsg("Kelas tidak ditemukan.");
          setLoading(false);
          return;
        }
        setMatchedCourse(course);

        const quiz = await fetchQuizForCourse(course.id);
        if (!quiz) {
          throw new Error("Kuis untuk kelas ini belum dipublikasikan.");
        }
        setQuizId(quiz.id);
        const strippedQuestions = await fetchQuizQuestions(quiz.id);
        setQuestions(strippedQuestions);

        const savedTempAnswers = localStorage.getItem(`cyber_academy_temp_answers_${currentUser.uid}_${course.id}`);
        if (savedTempAnswers) {
          try {
            setAnswers(JSON.parse(savedTempAnswers));
          } catch (e) {
            console.error("Failed to parse temp answers:", e);
          }
        }

        const summary = await fetchQuizSummary(quiz.id);
        if (summary) {
          setBestScore(summary.bestScore);
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setErrorMsg("Gagal memuat kuis.");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [courseSlug, currentUser.uid]);

  const saveTempAnswer = (questionId: string, optionId: string) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    setAnswers(updatedAnswers);
    if (matchedCourse) {
      localStorage.setItem(`cyber_academy_temp_answers_${currentUser.uid}_${matchedCourse.id}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleBackToCourse = () => {
    onNavigate(`/learn/courses/${courseSlug}`);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    saveTempAnswer(questionId, optionId);
  };

  const handleNext = () => {
    if (currentQuestIdx < questions.length - 1) {
      setCurrentQuestIdx((prev) => prev + 1);
    } else {
      setShowConfirmSubmit(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestIdx > 0) {
      setCurrentQuestIdx((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!matchedCourse || !quizId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await submitQuizAttemptApi(quizId, answers);
      
      localStorage.removeItem(`cyber_academy_temp_answers_${currentUser.uid}_${matchedCourse.id}`);

      await refreshUserProfile();

      onNavigate(`/learn/courses/${courseSlug}/quiz/results/${result.attemptId}`);
    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat mengirimkan jawaban kuis.");
      setShowConfirmSubmit(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (errorMsg && !showConfirmSubmit) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center font-sans text-brand-text">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4 p-6">
          <h2 className="text-xl font-heading font-extrabold text-brand-text">Gagal Memuat / Mengirim Kuis</h2>
          <p className="text-xs text-brand-muted font-bold">{errorMsg}</p>
          <div className="flex gap-3 justify-center pt-2">
            <NeoButton variant="secondary" onClick={() => { setErrorMsg(null); }} className="text-xs font-bold px-4 py-2">
              Kembali
            </NeoButton>
            <NeoButton variant="primary" onClick={() => { setErrorMsg(null); }} className="text-xs font-bold px-4 py-2">
              Coba Lagi
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] font-sans">
        <RefreshCw className="w-8 h-8 text-pastel-mint animate-spin mb-2" />
        <p className="text-xs text-brand-muted font-bold">Menyiapkan lembar ujian kuis...</p>
      </div>
    );
  }

  if (!matchedCourse || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center font-sans">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h2 className="text-xl font-heading font-bold">Kuis Tidak Tersedia</h2>
          <p className="text-xs text-brand-muted">Maaf, kuis untuk modul ini sedang mengalami pemeliharaan atau belum memiliki soal.</p>
          <NeoButton variant="secondary" onClick={handleBackToCourse}>
            Kembali ke Kelas
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestIdx];
  const isSelected = answers[currentQuestion.id] !== undefined;
  const progressPercent = Math.round(((currentQuestIdx + 1) / questions.length) * 100);
  const unansweredCount = questions.length - Object.keys(answers).length;

  if (showConfirmSubmit) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 animate-fadeIn font-sans text-brand-text">
        <NeoCard bgColor="bg-white" shadowSize="lg" className="p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full border-3 border-brand-border mx-auto flex items-center justify-center text-3xl shadow-md rotate-[-2deg] bg-pastel-yellow">
            📝
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-extrabold tracking-tight">Kumpulkan Jawaban?</h2>
            <p className="text-xs text-brand-muted font-bold">Modul: {matchedCourse.title}</p>
          </div>

          <div className="bg-[#FFFDF8] border-3 border-brand-border rounded-[24px] p-5 max-w-sm mx-auto space-y-3 neo-shadow-sm text-left">
            <h4 className="font-heading font-extrabold text-sm text-brand-text border-b border-brand-border/10 pb-2 mb-2">
              Ringkasan Pengerjaan:
            </h4>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-brand-muted">Total Soal:</span>
              <span>{questions.length} Butir</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-brand-muted">Jawaban Terisi:</span>
              <span>{Object.keys(answers).length} / {questions.length}</span>
            </div>
            {unansweredCount > 0 ? (
              <div className="bg-pastel-peach/20 border border-pastel-peach text-rose-800 text-[10px] p-2.5 rounded-lg flex items-center space-x-1.5 font-bold mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Perhatian: Ada {unansweredCount} pertanyaan yang belum Anda jawab!</span>
              </div>
            ) : (
              <div className="bg-pastel-mint/20 border border-pastel-mint text-emerald-800 text-[10px] p-2.5 rounded-lg flex items-center space-x-1.5 font-bold mt-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sempurna! Semua pertanyaan telah Anda jawab dengan baik.</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-semibold max-w-sm mx-auto">
            Apakah Anda sudah yakin ingin menyerahkan lembar jawaban ini? Setelah dikirim, Anda akan langsung menerima pembahasan lengkap dan evaluasi tingkat kelulusan.
          </p>

          <div className="pt-4 border-t border-brand-border/10 flex flex-col sm:flex-row gap-3">
            <NeoButton
              variant="secondary"
              disabled={submitting}
              onClick={() => { setShowConfirmSubmit(false); setErrorMsg(null); }}
              className="w-full font-bold py-3 text-xs"
            >
              Kembali Periksa
            </NeoButton>
            <NeoButton
              variant="primary"
              disabled={submitting}
              onClick={handleSubmitQuiz}
              className="w-full font-bold py-3 text-xs flex items-center justify-center space-x-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Sedang Menilai...</span>
                </>
              ) : (
                <>
                  <span>Kirim & Lihat Hasil</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="mx-auto my-6 w-full min-w-0 max-w-2xl px-0 font-sans text-brand-text animate-fadeIn sm:my-12 sm:px-4">
      <div className="mb-5 flex min-w-0 flex-col items-start gap-3 text-xs font-bold text-brand-muted sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handleBackToCourse}
          className="flex items-center space-x-1 font-bold hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar Kuis</span>
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
          {bestScore !== null && (
            <span className="bg-pastel-yellow/30 border border-brand-border/35 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-brand-text">
              Terbaik: {bestScore}%
            </span>
          )}
          <span>Pertanyaan {currentQuestIdx + 1} dari {questions.length}</span>
        </div>
      </div>

      <div className="w-full bg-[#EBEBEB] h-3.5 rounded-full border-2 border-brand-border mb-6 overflow-hidden relative">
        <div
          className="bg-pastel-mint h-full border-r-2 border-brand-border transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <NeoCard bgColor="bg-white" className="p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-xs text-brand-muted font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-brand-text" />
            <span>Kuis Kelulusan Modul</span>
          </div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-text leading-snug">
            {currentQuestion.questionText}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option: any) => {
            const isUserSelected = answers[currentQuestion.id] === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                className={`flex w-full min-w-0 items-center justify-between rounded-xl border-2 p-4 text-left text-xs font-semibold transition-all sm:text-sm ${
                  isUserSelected
                    ? "bg-[#111111] text-white border-[#111111] neo-shadow-sm translate-y-[-2px]"
                    : "bg-white text-brand-text border-brand-border/40 hover:bg-brand-surface/30 hover:border-brand-border"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-heading font-extrabold text-xs ${
                      isUserSelected ? "bg-pastel-yellow text-brand-text border-brand-border" : "bg-brand-surface border-brand-border"
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 items-center gap-2 border-t border-brand-border/10 pt-4 sm:flex sm:justify-between">
          <NeoButton
            variant="secondary"
            size="sm"
            disabled={currentQuestIdx === 0}
            onClick={handlePrev}
            className="w-full px-3 py-2 text-xs font-bold sm:w-auto sm:px-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </NeoButton>

          <div className="order-3 col-span-2 text-center text-[10px] font-bold text-brand-muted sm:order-none sm:col-span-1">
            {isSelected ? (
              <span className="text-emerald-700 flex items-center space-x-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Sudah Dijawab</span>
              </span>
            ) : (
              <span className="text-rose-700 font-bold">Belum Dijawab</span>
            )}
          </div>

          <NeoButton
            variant="primary"
            size="sm"
            disabled={!isSelected}
            onClick={handleNext}
            className="w-full px-3 py-2 text-xs font-bold sm:w-auto sm:px-4"
          >
            <span>{currentQuestIdx === questions.length - 1 ? "Lihat Selesai" : "Berikutnya"}</span>
            <ChevronRight className="w-4 h-4" />
          </NeoButton>
        </div>
      </NeoCard>
    </div>
  );
};

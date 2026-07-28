import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Clock, Shield, CheckCircle, ChevronRight, Send, Lock as LockIcon, Sparkles, RefreshCw } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import { User, Course, Lesson } from "../types";
import { fetchCatalogLessonByCourseAndLessonSlug, fetchCatalogCourseById, fetchCatalogLessonsForCourse } from "../services/catalogService";
import { recordRemedialLessonView, createAiConversation } from "../lib/learningStore";
import { useUser } from "../contexts/UserContext";
import { authenticatedFetch } from "../services/apiClient";
import { fetchMyProgress, completeMyLesson } from "../services/learningStateService";
import { deriveLessonCompletionFlags } from "../lib/learningProgressHelpers";

const formatText = (text: string): React.ReactNode[] => {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    if (line.trim() === "") {
      return <div key={lineIdx} className="h-2" />;
    }

    const boldParts = line.split("**");
    const renderedLine = boldParts.map((part, partIdx) => {
      const isBold = partIdx % 2 !== 0;
      const codeParts = part.split("`");
      const renderedCodeParts = codeParts.map((subPart, subPartIdx) => {
        const isCode = subPartIdx % 2 !== 0;
        if (isCode) {
          return (
            <code key={subPartIdx} className="bg-brand-surface border border-brand-border/30 px-1 py-0.5 rounded text-xs font-mono text-brand-text">
              {subPart}
            </code>
          );
        }
        return subPart;
      });

      if (isBold) {
        return <strong key={partIdx} className="font-extrabold text-brand-text">{renderedCodeParts}</strong>;
      }
      return <span key={partIdx}>{renderedCodeParts}</span>;
    });

    return (
      <p key={lineIdx} className="leading-relaxed">
        {renderedLine}
      </p>
    );
  });
};

interface LessonDetailProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  courseSlug: string;
  lessonSlug: string;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({
  currentUser,
  onNavigate,
  courseSlug,
  lessonSlug
}) => {
  const { refreshUserProfile } = useUser();
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const [didFinishAllLessons, setDidFinishAllLessons] = useState(false);
  const [didCourseComplete, setDidCourseComplete] = useState(false);

  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Halo! Saya AI Tutor Cyber Academy Anda. Ada bagian materi pelajaran ini yang kurang dipahami? Silakan tanyakan di bawah ini!"
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [completeError, setCompleteError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoadingData(true);
    setErrorMsg(null);
    setCompleteError(null);
    try {
      const lesson = await fetchCatalogLessonByCourseAndLessonSlug(courseSlug, lessonSlug);
      if (!lesson) {
        setErrorMsg("Materi pelajaran tidak ditemukan atau belum dipublikasikan.");
        return;
      }
      setCurrentLesson(lesson);

      const course = await fetchCatalogCourseById(lesson.courseId);
      setCurrentCourse(course);

      const [allLessons, progressList] = await Promise.all([
        fetchCatalogLessonsForCourse(lesson.courseId),
        fetchMyProgress()
      ]);
      setCourseLessons(allLessons);

      // Convert progressList to userProgress record map
      const progressMap: Record<string, any> = {};
      progressList.forEach((p) => {
        if (p.contentType === "course") {
          progressMap[`${currentUser.uid}_course_${p.contentId}`] = p;
        } else if (p.contentType === "lesson") {
          progressMap[`${currentUser.uid}_lesson_${p.contentId}`] = p;
        } else if (p.contentType === "path") {
          progressMap[`${currentUser.uid}_path_${p.contentId}`] = p;
        }
      });
      setUserProgress(progressMap);

      recordRemedialLessonView(currentUser.uid, lesson.id).catch(console.error);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat materi pelajaran.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();

    setShowCelebration(false);
    setDidLevelUp(false);
    setDidFinishAllLessons(false);
    setDidCourseComplete(false);
  }, [lessonSlug, courseSlug, currentUser.uid]);

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-block animate-spin text-brand-text">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-brand-muted">Memuat materi pelajaran...</p>
      </div>
    );
  }

  if (errorMsg || !currentCourse || !currentLesson) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-brand-text">Materi Tidak Ditemukan</h2>
          <p className="text-xs text-brand-muted">{errorMsg || "Maaf, materi pelajaran tidak tersedia."}</p>
          <div className="flex gap-2 justify-center">
            <NeoButton variant="secondary" onClick={() => onNavigate(`/learn/courses/${courseSlug}`)}>
              Kembali ke Detail Kelas
            </NeoButton>
            <NeoButton variant="primary" onClick={loadData}>
              Coba Lagi
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    );
  }

  const lessonIdx = courseLessons.findIndex(l => l.id === currentLesson.id);
  const nextLesson = lessonIdx !== -1 && lessonIdx < courseLessons.length - 1 ? courseLessons[lessonIdx + 1] : null;
  const prevLesson = lessonIdx > 0 ? courseLessons[lessonIdx - 1] : null;

  const isCompleted = userProgress[`${currentUser.uid}_lesson_${currentLesson.id}`]?.status === "completed";

  const handleBackToCourse = () => {
    onNavigate(`/learn/courses/${currentCourse.slug}`);
  };

  const handleComplete = async () => {
    if (!currentLesson) return;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const result = await completeMyLesson(currentLesson.id);

      const progressList = await fetchMyProgress();
      const progressMap: Record<string, any> = {};
      progressList.forEach((p) => {
        if (p.contentType === "course") {
          progressMap[`${currentUser.uid}_course_${p.contentId}`] = p;
        } else if (p.contentType === "lesson") {
          progressMap[`${currentUser.uid}_lesson_${p.contentId}`] = p;
        } else if (p.contentType === "path") {
          progressMap[`${currentUser.uid}_path_${p.contentId}`] = p;
        }
      });
      setUserProgress(progressMap);

      await refreshUserProfile();

      setGainedXp(result.xpEarned);
      setDidLevelUp(result.levelUp);
      
      const { didCourseComplete, didFinishAllLessons } = deriveLessonCompletionFlags(result.courseProgress);
      setDidCourseComplete(didCourseComplete);
      setDidFinishAllLessons(didFinishAllLessons);
      
      setShowCelebration(true);
    } catch (err: any) {
      setCompleteError(err.message || "Gagal menyimpan progres belajar.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNextAction = () => {
    setShowCelebration(false);
    if (nextLesson) {
      onNavigate(`/learn/courses/${currentCourse.slug}/lessons/${nextLesson.slug}`);
    } else {
      onNavigate(`/learn/courses/${currentCourse.slug}`);
    }
  };

  const handleOpenFullScreenAi = async () => {
    if (!currentCourse || !currentLesson) return;
    try {
      const conv = await createAiConversation(
        currentUser.uid,
        "lesson",
        currentCourse.learningPathId,
        currentCourse.id,
        currentLesson.id,
        `Tutor Lesson: ${currentLesson.title}`
      );
      onNavigate(`/ai-tutor/${conv.conversationId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || !currentCourse || !currentLesson) return;

    const userText = aiQuery;
    setAiAnswers(prev => [...prev, { role: "user", text: userText }]);
    setAiQuery("");
    setIsAiLoading(true);

    try {
      const response = await authenticatedFetch("/api/ai/tutor", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          contextType: "lesson",
          learningPathTitle: "Beginner Path",
          courseTitle: currentCourse.title,
          lessonTitle: currentLesson.title,
          lessonSummary: currentLesson.content || "Materi teori dasar siber defensif.",
          requestId: crypto.randomUUID(),
          history: aiAnswers.map(ans => ({
            role: ans.role === "user" ? "user" : "assistant",
            content: ans.text
          }))
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghubungi AI Tutor.");
      }

      const data = await response.json();
      setAiAnswers(prev => [...prev, { role: "ai", text: data.answer }]);
    } catch (err: any) {
      setAiAnswers(prev => [
        ...prev,
        { role: "ai", text: err.message || "Maaf, AI Tutor sedang offline atau tidak dapat dijangkau. Mohon coba sesaat lagi." }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fadeIn font-sans">
      <div className="flex items-center justify-between border-b-3 border-brand-border pb-4 mb-6">
        <NeoButton variant="secondary" size="sm" onClick={handleBackToCourse} className="font-bold flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Kelas</span>
        </NeoButton>
        <span className="text-xs font-mono font-bold text-brand-muted hidden sm:inline-block">
          {currentCourse.title} / Materi {lessonIdx + 1} dari {courseLessons.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 space-y-4 hidden lg:block">
          <NeoCard bgColor="bg-white" className="p-4 space-y-3">
            <h3 className="font-heading font-extrabold text-sm text-brand-text flex items-center space-x-1.5">
              <BookOpen className="w-4.5 h-4.5" />
              <span>Daftar Materi</span>
            </h3>
            
            <div className="space-y-1.5 text-xs font-bold">
              {courseLessons.map((l, index) => {
                const isActive = l.id === currentLesson.id;
                const isLCompleted = userProgress[`${currentUser.uid}_lesson_${l.id}`]?.status === "completed";
                const isLLocked = index > 0 && !userProgress[`${currentUser.uid}_lesson_${courseLessons[index - 1].id}`];

                return (
                  <button
                    key={l.id}
                    disabled={isLLocked}
                    onClick={() => onNavigate(`/learn/courses/${currentCourse.slug}/lessons/${l.slug}`)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-[#111111] text-pastel-mint border-[#111111]"
                        : isLCompleted
                        ? "bg-pastel-mint/15 text-brand-text border-brand-border/40 hover:bg-pastel-mint/30"
                        : isLLocked
                        ? "bg-brand-surface/10 text-brand-muted border-transparent cursor-not-allowed"
                        : "bg-white text-brand-text border-brand-border/30 hover:bg-brand-surface/50"
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{index + 1}. {l.title}</span>
                    {isLCompleted ? (
                      <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0 fill-brand-text" />
                    ) : isLLocked ? (
                      <LockIcon className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </NeoCard>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <NeoCard bgColor="bg-white" className="p-6 sm:p-8 space-y-6 leading-relaxed">
            <div className="flex items-center justify-between">
              <NeoBadge bgColor="bg-pastel-blue">Materi {currentLesson.order}</NeoBadge>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-muted">
                <Clock className="w-4 h-4" />
                <span>Membaca: {currentLesson.estimatedDuration} Menit</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-text leading-tight">
              {currentLesson.title}
            </h1>

            {currentLesson.objective && (
              <div className="bg-pastel-blue/15 border-2 border-brand-border p-4 rounded-2xl text-xs font-semibold leading-relaxed flex items-start space-x-2">
                <Shield className="w-4.5 h-4.5 text-brand-text shrink-0 mt-0.5" />
                <span>
                  <strong>Tujuan Pembelajaran:</strong> {currentLesson.objective}
                </span>
              </div>
            )}

            <div className="text-sm sm:text-base text-brand-text/90 font-medium space-y-4">
              {formatText(currentLesson.content)}
            </div>

            {currentLesson.exampleCase && (
              <div className="bg-pastel-peach/15 border-3 border-brand-border rounded-2xl p-5 sm:p-6 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#111111] opacity-5 rounded-full translate-x-4 -translate-y-4" />
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-brand-text uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🚨 Studi Kasus Dunia Nyata</span>
                </h4>
                <div className="space-y-1">
                  <h5 className="font-heading font-bold text-xs sm:text-sm text-brand-text underline decoration-pastel-peach decoration-2">
                    {currentLesson.exampleCase.title}
                  </h5>
                  <p className="text-xs sm:text-sm text-brand-muted font-medium leading-relaxed">
                    {currentLesson.exampleCase.description}
                  </p>
                </div>
              </div>
            )}

            {currentLesson.securityTips && currentLesson.securityTips.length > 0 && (
              <div className="bg-pastel-mint/15 border-3 border-brand-border rounded-2xl p-5 space-y-3">
                <h4 className="font-heading font-extrabold text-xs sm:text-sm text-brand-text uppercase tracking-wider">
                  💡 Tips Pertahanan Mandiri (Defensive)
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm font-semibold text-brand-text">
                  {currentLesson.securityTips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start space-x-2">
                      <span className="text-pastel-mint">🛡️</span>
                      <span className="leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
              <div className="border-t-2 border-brand-border/10 pt-5 space-y-3">
                <h4 className="font-heading font-extrabold text-xs sm:text-sm text-brand-text uppercase tracking-wider">
                  🔑 Poin Penting (Key Takeaways)
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm font-semibold text-brand-muted">
                  {currentLesson.keyTakeaways.map((takeaway, tkIdx) => (
                    <li key={tkIdx} className="flex items-start space-x-2">
                      <span className="text-[#111111] mt-0.5">•</span>
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t-2 border-brand-border/20 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {prevLesson ? (
                  <button
                    onClick={() => onNavigate(`/learn/courses/${currentCourse.slug}/lessons/${prevLesson.slug}`)}
                    className="font-heading text-xs sm:text-sm font-extrabold text-brand-muted hover:text-brand-text flex items-center space-x-1 py-1"
                  >
                    <span>← Materi Sebelumnya</span>
                  </button>
                ) : (
                  <div className="text-xs font-bold text-brand-muted select-none">Materi Pertama</div>
                )}
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-2">
                {completeError && (
                  <div className="text-xs font-bold text-pastel-peach-dark bg-pastel-peach/20 px-3 py-1.5 rounded-xl border border-brand-border/40 text-center">
                    {completeError}
                  </div>
                )}
                {isCompleted ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className="text-xs font-bold text-[#111111] bg-pastel-mint/40 py-2.5 px-4 rounded-xl border-2 border-brand-border text-center flex items-center justify-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 text-pastel-mint fill-brand-text shrink-0" />
                      <span>Selesai Dibaca</span>
                    </span>
                    {nextLesson && (
                      <NeoButton
                        variant="primary"
                        size="sm"
                        onClick={() => onNavigate(`/learn/courses/${currentCourse.slug}/lessons/${nextLesson.slug}`)}
                        className="font-bold flex items-center justify-center space-x-1"
                      >
                        <span>Materi Selanjutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </NeoButton>
                    )}
                  </div>
                ) : (
                  <NeoButton
                    variant="primary"
                    size="sm"
                    disabled={isCompleting}
                    onClick={handleComplete}
                    className="font-bold flex items-center justify-center space-x-1.5 w-full sm:w-auto"
                  >
                    <span>{isCompleting ? "Menyimpan..." : "Tandai Selesai & Klaim XP"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </NeoButton>
                )}
              </div>
            </div>
          </NeoCard>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <NeoCard bgColor="bg-pastel-blue/15" className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/20 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4.5 h-4.5 text-brand-text fill-white shrink-0 animate-pulse" />
                <h4 className="font-heading font-extrabold text-xs sm:text-sm text-brand-text">AI Tutor Materi</h4>
              </div>
              <button
                type="button"
                onClick={handleOpenFullScreenAi}
                className="text-[10px] font-heading font-bold bg-white px-2 py-0.5 rounded border border-brand-border hover:bg-pastel-mint neo-shadow-sm hover:translate-y-[-1px] transition-all"
                title="Buka obrolan penuh"
              >
                Layar Penuh ↗
              </button>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto text-xs p-1">
              {aiAnswers.map((answer, index) => {
                const isUser = answer.role === "user";
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-2xl border-2 border-brand-border max-w-[90%] leading-relaxed ${
                      isUser
                        ? "bg-pastel-blue/30 ml-auto border-brand-border text-right font-semibold"
                        : "bg-white mr-auto border-brand-border/60 text-left"
                    }`}
                  >
                    <p className="whitespace-pre-line">{answer.text}</p>
                  </div>
                );
              })}
              {isAiLoading && (
                <div className="bg-white border-2 border-dashed border-brand-border/40 p-3 rounded-2xl text-left italic text-brand-muted animate-pulse">
                  AI sedang merumuskan saran aman...
                </div>
              )}
            </div>

            <form onSubmit={handleAskAi} className="flex items-stretch gap-1.5 pt-2 border-t border-brand-border/20">
              <input
                type="text"
                disabled={isAiLoading}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Tanyakan materi..."
                className="flex-grow px-2.5 py-1.5 bg-white neo-border rounded-xl text-xs font-semibold focus-neo outline-none"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="px-2.5 bg-pastel-blue neo-border rounded-xl flex items-center justify-center hover:translate-y-[-1px] active:translate-y-0 text-brand-text transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </NeoCard>
        </div>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-[#111111]/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <NeoCard bgColor="bg-brand-surface" shadowSize="lg" className="max-w-md w-full text-center space-y-6 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-pastel-mint rounded-full border-3 border-brand-border mx-auto flex items-center justify-center text-3xl shadow-md rotate-[-3deg]">
              🎉
            </div>
            
            <div className="space-y-2">
              <h3 className="text-1xl sm:text-2xl font-heading font-extrabold text-brand-text leading-tight">
                Materi Selesai!
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted font-semibold leading-relaxed">
                Hebat! Pemahamanmu bertambah, dan setahap demi setahap kamu membangun tameng pertahanan dirimu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pastel-yellow p-3 rounded-2xl border-2 border-brand-border neo-shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">Klaim Skor</span>
                <span className="text-lg font-heading font-extrabold text-brand-text">+{gainedXp} XP</span>
              </div>
              <div className="bg-pastel-blue p-3 rounded-2xl border-2 border-brand-border neo-shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">Status</span>
                <span className="text-xs font-extrabold text-brand-text uppercase leading-none mt-1">Selesai</span>
              </div>
            </div>

            {didLevelUp && (
              <div className="bg-pastel-lavender/50 border-2 border-brand-border p-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 animate-bounce">
                <span>🌟 LEVEL UP! Sekarang kamu Level {currentUser.currentLevel}!</span>
              </div>
            )}

            {didCourseComplete && (
              <div className="bg-pastel-mint border-2 border-brand-border p-3 rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-1.5 text-brand-text">
                <span>🏆 KELAS SELESAI/LULUS!</span>
              </div>
            )}

            {didFinishAllLessons && (
              <div className="bg-pastel-yellow border-2 border-brand-border p-3 rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-1.5 text-brand-text">
                <span>✅ SELURUH MATERI SELESAI! Kuis Akhir kini terbuka.</span>
              </div>
            )}

            <div className="pt-2">
              <NeoButton variant="primary" onClick={handleNextAction} className="w-full font-bold flex items-center justify-center space-x-1.5 py-3">
                <span>{nextLesson ? "Lanjut ke Materi Berikutnya" : "Kembali ke Kelas & Ambil Kuis"}</span>
                <ChevronRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { User, Course, Lesson } from "../types";
import {
  fetchCatalogCourseById,
  fetchCatalogLessonByCourseAndLessonSlug,
  fetchCatalogLessonsForCourse,
} from "../services/catalogService";
import { createAiConversation, recordRemedialLessonView } from "../lib/learningStore";
import { useUser } from "../contexts/UserContext";
import { authenticatedFetch } from "../services/apiClient";
import { completeMyLesson, fetchMyProgress } from "../services/learningStateService";
import { deriveLessonCompletionFlags } from "../lib/learningProgressHelpers";
import { LessonAiPanel } from "./lesson/LessonAiPanel";
import { LessonMaterialDrawer } from "./lesson/LessonMaterialDrawer";
import { LessonReader } from "./lesson/LessonReader";

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
  lessonSlug,
}) => {
  const { refreshUserProfile } = useUser();
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const completionInFlightRef = useRef(false);
  const completionScrollPendingRef = useRef(false);
  const completionActionRef = useRef<HTMLElement>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const [didFinishAllLessons, setDidFinishAllLessons] = useState(false);
  const [didCourseComplete, setDidCourseComplete] = useState(false);

  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswers, setAiAnswers] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Halo! Saya AI Tutor Cyber Academy Anda. Ada bagian materi pelajaran ini yang kurang dipahami? Silakan tanyakan di bawah ini!",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [isMaterialDrawerOpen, setIsMaterialDrawerOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const closeMaterialDrawer = useCallback(() => setIsMaterialDrawerOpen(false), []);
  const closeAiPanel = useCallback(() => setIsAiPanelOpen(false), []);

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
        fetchMyProgress(),
      ]);
      setCourseLessons(allLessons);

      const progressMap: Record<string, any> = {};
      progressList.forEach((progress) => {
        if (progress.contentType === "course") {
          progressMap[`${currentUser.uid}_course_${progress.contentId}`] = progress;
        } else if (progress.contentType === "lesson") {
          progressMap[`${currentUser.uid}_lesson_${progress.contentId}`] = progress;
        } else if (progress.contentType === "path") {
          progressMap[`${currentUser.uid}_path_${progress.contentId}`] = progress;
        }
      });
      setUserProgress(progressMap);

      recordRemedialLessonView(currentUser.uid, lesson.id).catch(console.error);
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal memuat materi pelajaran.");
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

  useEffect(() => {
    closeMaterialDrawer();
    closeAiPanel();
  }, [lessonSlug, courseSlug, closeMaterialDrawer, closeAiPanel]);

  useEffect(() => {
    if (!showCelebration || !completionScrollPendingRef.current || !currentLesson) return;
    const completedLesson =
      userProgress[`${currentUser.uid}_lesson_${currentLesson.id}`]?.status === "completed";
    if (!completedLesson) return;

    const completionAction = completionActionRef.current;
    if (!completionAction || typeof completionAction.scrollIntoView !== "function") return;

    completionScrollPendingRef.current = false;
    completionAction.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentLesson, currentUser.uid, showCelebration, userProgress]);

  if (isLoadingData) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12 text-center sm:py-16" role="status">
        <RefreshCw className="mx-auto size-8 animate-spin text-brand-text motion-reduce:animate-none" aria-hidden="true" />
        <p className="text-sm font-bold text-brand-muted">Memuat materi pelajaran...</p>
      </div>
    );
  }

  if (errorMsg || !currentCourse || !currentLesson) {
    return (
      <div className="mx-auto my-8 max-w-md p-4 text-center sm:my-12">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h1 className="font-heading text-xl font-bold text-brand-text">Materi Tidak Ditemukan</h1>
          <p className="text-sm text-brand-muted" role="alert">
            {errorMsg || "Maaf, materi pelajaran tidak tersedia."}
          </p>
          <NeoButton type="button" variant="primary" onClick={loadData}>
            Coba Lagi
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  const lessonIdx = courseLessons.findIndex((lesson) => lesson.id === currentLesson.id);
  const nextLesson =
    lessonIdx !== -1 && lessonIdx < courseLessons.length - 1
      ? courseLessons[lessonIdx + 1]
      : null;
  const prevLesson = lessonIdx > 0 ? courseLessons[lessonIdx - 1] : null;
  const isCompleted =
    userProgress[`${currentUser.uid}_lesson_${currentLesson.id}`]?.status === "completed";
  const completedLessonCount = courseLessons.filter(
    (lesson) => userProgress[`${currentUser.uid}_lesson_${lesson.id}`]?.status === "completed",
  ).length;

  const handleComplete = async () => {
    if (!currentLesson || completionInFlightRef.current) return;
    completionInFlightRef.current = true;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const result = await completeMyLesson(currentLesson.id);

      const progressList = await fetchMyProgress();
      const progressMap: Record<string, any> = {};
      progressList.forEach((progress) => {
        if (progress.contentType === "course") {
          progressMap[`${currentUser.uid}_course_${progress.contentId}`] = progress;
        } else if (progress.contentType === "lesson") {
          progressMap[`${currentUser.uid}_lesson_${progress.contentId}`] = progress;
        } else if (progress.contentType === "path") {
          progressMap[`${currentUser.uid}_path_${progress.contentId}`] = progress;
        }
      });
      setUserProgress(progressMap);

      await refreshUserProfile();

      setGainedXp(result.xpEarned);
      setDidLevelUp(result.levelUp);

      const completionFlags = deriveLessonCompletionFlags(result.courseProgress);
      setDidCourseComplete(completionFlags.didCourseComplete);
      setDidFinishAllLessons(completionFlags.didFinishAllLessons);
      completionScrollPendingRef.current = true;
      setShowCelebration(true);
    } catch (error: any) {
      setCompleteError(error.message || "Gagal menyimpan progres belajar.");
    } finally {
      completionInFlightRef.current = false;
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
      const conversation = await createAiConversation(
        currentUser.uid,
        "lesson",
        currentCourse.learningPathId,
        currentCourse.id,
        currentLesson.id,
        `Tutor Lesson: ${currentLesson.title}`,
      );
      onNavigate(`/ai-tutor/${conversation.conversationId}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAskAi = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!aiQuery.trim() || !currentCourse || !currentLesson) return;

    const userText = aiQuery;
    setAiAnswers((previous) => [...previous, { role: "user", text: userText }]);
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
          history: aiAnswers.map((answer) => ({
            role: answer.role === "user" ? "user" : "assistant",
            content: answer.text,
          })),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Gagal menghubungi AI Tutor.");
      }

      const data = await response.json();
      setAiAnswers((previous) => [...previous, { role: "ai", text: data.answer }]);
    } catch (error: any) {
      setAiAnswers((previous) => [
        ...previous,
        {
          role: "ai",
          text:
            error.message ||
            "Maaf, AI Tutor sedang offline atau tidak dapat dijangkau. Mohon coba sesaat lagi.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-w-0 max-w-full py-2 font-sans animate-fadeIn sm:py-4">
      <div className="mx-auto mb-5 flex w-full max-w-[52rem] flex-col gap-3 rounded-2xl border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#111111] sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <p className="text-center text-xs font-bold text-brand-muted sm:text-left">
          Baca dengan fokus. Buka bantuan hanya ketika dibutuhkan.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <NeoButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsAiPanelOpen(false);
              setIsMaterialDrawerOpen(true);
            }}
            aria-expanded={isMaterialDrawerOpen}
            aria-controls="lesson-material-drawer"
            className="min-w-0 gap-1.5 px-3"
          >
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />
            <span>Daftar Materi</span>
          </NeoButton>
          <NeoButton
            type="button"
            variant="yellow"
            size="sm"
            onClick={() => {
              setIsMaterialDrawerOpen(false);
              setIsAiPanelOpen(true);
            }}
            aria-expanded={isAiPanelOpen}
            aria-controls="lesson-ai-panel"
            className="min-w-0 gap-1.5 px-3"
          >
            <Sparkles className="size-4 shrink-0" aria-hidden="true" />
            <span>Tanya AI Tutor</span>
          </NeoButton>
        </div>
      </div>

      <LessonReader
        course={currentCourse}
        lesson={currentLesson}
        lessonIndex={lessonIdx}
        lessonCount={courseLessons.length}
        completedLessonCount={completedLessonCount}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completeError={completeError}
        previousLesson={prevLesson}
        nextLesson={nextLesson}
        completionActionRef={completionActionRef}
        centerCompletionAction={showCelebration}
        onNavigate={onNavigate}
        onComplete={handleComplete}
      />

      <LessonMaterialDrawer
        isOpen={isMaterialDrawerOpen}
        onClose={closeMaterialDrawer}
        lessons={courseLessons}
        currentLesson={currentLesson}
        courseSlug={currentCourse.slug}
        currentUserId={currentUser.uid}
        userProgress={userProgress}
        onNavigate={onNavigate}
      />

      <LessonAiPanel
        isOpen={isAiPanelOpen}
        onClose={closeAiPanel}
        lessonTitle={currentLesson.title}
        aiQuery={aiQuery}
        onQueryChange={setAiQuery}
        aiAnswers={aiAnswers}
        isAiLoading={isAiLoading}
        onSubmit={handleAskAi}
        onOpenFullScreen={handleOpenFullScreenAi}
      />

      {showCelebration && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#111111]/45 p-3 animate-in fade-in duration-200 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-complete-title"
        >
          <NeoCard
            bgColor="bg-brand-surface"
            shadowSize="lg"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain p-5 text-center animate-in zoom-in-95 duration-200 sm:space-y-6 sm:p-8"
          >
            <div className="mx-auto flex size-16 rotate-[-3deg] items-center justify-center rounded-full border-3 border-brand-border bg-pastel-mint text-3xl shadow-md" aria-hidden="true">
              🎉
            </div>

            <div className="space-y-2">
              <h2 id="lesson-complete-title" className="font-heading text-xl font-extrabold leading-tight text-brand-text sm:text-2xl">
                Materi Selesai!
              </h2>
              <p className="text-sm font-semibold leading-relaxed text-brand-muted">
                Hebat! Pemahamanmu bertambah, dan setahap demi setahap kamu membangun
                tameng pertahanan dirimu.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4">
              <div className="flex flex-col justify-center rounded-2xl border-2 border-brand-border bg-pastel-yellow p-3 neo-shadow-sm">
                <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Klaim Skor
                </span>
                <span className="font-heading text-lg font-extrabold text-brand-text">
                  +{gainedXp} XP
                </span>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border-2 border-brand-border bg-pastel-blue p-3 neo-shadow-sm">
                <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Status
                </span>
                <span className="mt-1 text-xs font-extrabold uppercase leading-none text-brand-text">
                  Selesai
                </span>
              </div>
            </div>

            {didLevelUp && (
              <div className="rounded-2xl border-2 border-brand-border bg-pastel-lavender/50 p-3 text-xs font-bold">
                🌟 LEVEL UP! Sekarang kamu Level {currentUser.currentLevel}!
              </div>
            )}

            {didCourseComplete && (
              <div className="rounded-2xl border-2 border-brand-border bg-pastel-mint p-3 text-xs font-extrabold text-brand-text">
                🏆 KELAS SELESAI/LULUS!
              </div>
            )}

            {didFinishAllLessons && (
              <div className="rounded-2xl border-2 border-brand-border bg-pastel-yellow p-3 text-xs font-extrabold text-brand-text">
                ✅ SELURUH MATERI SELESAI! Kuis Akhir kini terbuka.
              </div>
            )}

            <NeoButton
              type="button"
              variant="primary"
              onClick={handleNextAction}
              className="w-full gap-1.5 py-3 font-bold"
            >
              <span>
                {nextLesson ? "Lanjut ke Materi Berikutnya" : "Kembali ke Kelas & Ambil Kuis"}
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </NeoButton>
          </NeoCard>
        </div>,
        document.body,
      )}
    </div>
  );
};

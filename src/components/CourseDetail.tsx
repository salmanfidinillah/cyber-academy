import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Clock, Award, Shield, CheckCircle, Lock as LockIcon, Play, ChevronRight, RefreshCw } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import { User, Course, Lesson } from "../types";
import { fetchCatalogCourseBySlug, fetchCatalogLessonsForCourse, fetchCatalogCoursesForPath, fetchCatalogLearningPaths } from "../services/catalogService";
import { fetchMyProgress } from "../services/learningStateService";
import { fetchMyQuizAttempts, fetchQuizForCourse, fetchQuizSummary } from "../services/quizService";

interface CourseDetailProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  courseSlug: string;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  currentUser,
  onNavigate,
  courseSlug
}) => {
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [latestAttemptId, setLatestAttemptId] = useState<string | null>(null);
  const [isCourseLocked, setIsCourseLocked] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCourseData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const course = await fetchCatalogCourseBySlug(courseSlug);
      if (!course) {
        setErrorMsg("Kelas siber tidak ditemukan atau belum dipublikasikan.");
        setCurrentCourse(null);
        return;
      }

      setCurrentCourse(course);

      const [lessons, progressList, quiz, learningPaths] = await Promise.all([
        fetchCatalogLessonsForCourse(course.id),
        fetchMyProgress(),
        fetchQuizForCourse(course.id),
        fetchCatalogLearningPaths(),
      ]);

      setCourseLessons(lessons);

      if (quiz) {
        const summary = await fetchQuizSummary(quiz.id);
        if (summary?.passed) {
          const attempts = await fetchMyQuizAttempts(quiz.id);
          const passedAttempt = attempts.find((item) => item.passed);
          setLatestAttemptId(passedAttempt?.attemptId || null);
        }
      }

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

      // Compute course lock state
      if (course.learningPathId) {
        const orderedPaths = [...learningPaths].sort((a, b) => {
          const levels = { Beginner: 1, Intermediate: 2, Advanced: 3 };
          return levels[a.level] - levels[b.level];
        });
        const pathIndex = orderedPaths.findIndex((path) => path.id === course.learningPathId);
        const prerequisitePath = pathIndex > 0 ? orderedPaths[pathIndex - 1] : null;
        const prerequisiteCompleted = !prerequisitePath || progressList.some(
          (progress) =>
            progress.contentType === "path" &&
            progress.contentId === prerequisitePath.id &&
            progress.status === "completed"
        );
        const pathCourses = await fetchCatalogCoursesForPath(course.learningPathId);
        pathCourses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const targetIndex = pathCourses.findIndex(c => c.id === course.id);
        if (targetIndex > 0) {
          const prevCourse = pathCourses[targetIndex - 1];
          const prevCourseProgress = progressList.find(p => p.contentType === "course" && p.contentId === prevCourse.id);
          const isPrevCompleted = prevCourseProgress?.status === "completed";
          setIsCourseLocked(!prerequisiteCompleted || !isPrevCompleted);
        } else {
          setIsCourseLocked(!prerequisiteCompleted);
        }
      } else {
        setIsCourseLocked(false);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat detail kelas siber.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseSlug, currentUser.uid]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-block animate-spin text-brand-text">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-brand-muted">Memuat detail kelas siber...</p>
      </div>
    );
  }

  if (errorMsg || !currentCourse) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-brand-text">Kelas Tidak Ditemukan</h2>
          <p className="text-xs text-brand-muted">{errorMsg || "Maaf, kelas siber dengan alamat tersebut tidak tersedia."}</p>
          <div className="flex gap-2 justify-center">
            <NeoButton variant="secondary" onClick={() => onNavigate("/learn/paths")}>
              Kembali ke Jalur Belajar
            </NeoButton>
            <NeoButton variant="primary" onClick={loadCourseData}>
              Coba Lagi
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    );
  }

  const courseProgressKey = `${currentUser.uid}_course_${currentCourse.id}`;
  const progressRecord = userProgress[courseProgressKey];
  const progressPercent = progressRecord ? progressRecord.progressPercent : 0;
  const isCourseCompleted = progressRecord?.status === "completed";

  const handleBackToPath = () => {
    if (currentCourse?.learningPathId) {
      onNavigate(`/learn/paths/${currentCourse.learningPathId}`);
    } else {
      onNavigate("/learn/paths");
    }
  };

  const handleStartLesson = (lesson: Lesson, isLocked: boolean) => {
    if (isCourseLocked) {
      alert("Kelas siber ini masih terkunci! Selesaikan kelas siber sebelumnya di jalur belajar Anda.");
      return;
    }
    if (isLocked) {
      alert("Materi ini terkunci! Silakan baca materi sebelumnya terlebih dahulu.");
      return;
    }
    onNavigate(`/learn/courses/${currentCourse.slug}/lessons/${lesson.slug}`);
  };

  const handleStartQuiz = (isQuizLocked: boolean) => {
    if (isQuizLocked) {
      alert("Kuis Akhir terkunci! Harap selesaikan seluruh materi pelajaran terlebih dahulu.");
      return;
    }
    onNavigate(`/learn/courses/${currentCourse.slug}/quiz`);
  };

  const getLessonLockedState = (index: number) => {
    if (index === 0) return false;
    const prevLesson = courseLessons[index - 1];
    if (!prevLesson) return false;
    const prevProgressKey = `${currentUser.uid}_lesson_${prevLesson.id}`;
    return userProgress[prevProgressKey]?.status !== "completed";
  };

  const allLessonsCompleted =
    courseLessons.length > 0 &&
    courseLessons.every((l) => userProgress[`${currentUser.uid}_lesson_${l.id}`]?.status === "completed");

  const isQuizLocked = !allLessonsCompleted || isCourseLocked;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 py-6 font-sans animate-fadeIn sm:py-12">
      <div className="flex items-center space-x-2">
        <NeoButton variant="secondary" size="sm" onClick={handleBackToPath} className="font-bold flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Jalur Belajar</span>
        </NeoButton>
      </div>

      <NeoCard bgColor="bg-pastel-yellow" className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <NeoBadge bgColor="bg-white">Tingkat: {currentCourse.level}</NeoBadge>
          <NeoBadge bgColor="bg-pastel-blue">{currentCourse.category}</NeoBadge>
          {isCourseCompleted && (
            <NeoBadge bgColor="bg-pastel-mint">✔ Lulus Kelas</NeoBadge>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-text">
            {currentCourse.title}
          </h1>
          <p className="text-sm sm:text-base text-brand-text/90 font-medium max-w-3xl leading-relaxed">
            {currentCourse.description}
          </p>
        </div>

        {currentCourse.learningOutcomes && currentCourse.learningOutcomes.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
              Capaian Pembelajaran:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-brand-text">
              {currentCourse.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-white/70 p-2 rounded-lg border border-brand-border/30">
                  <span className="text-pastel-mint font-bold shrink-0">✓</span>
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t-2 border-brand-border/20 text-xs font-bold text-brand-text">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Estimasi: {currentCourse.estimatedDuration} Menit</span>
            </span>
            <span className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{courseLessons.length} Pelajaran</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Progres Kelas:</span>
            <div className="w-24 bg-white h-4 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-brand-text rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </NeoCard>

      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b-3 border-brand-border pb-2">
          <BookOpen className="w-5 h-5 text-brand-text" />
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-brand-text">
            Materi Pelajaran Interaktif
          </h2>
        </div>

        {courseLessons.length === 0 ? (
          <div className="text-center py-8 text-brand-muted font-bold text-sm">
            Belum ada materi pelajaran publik untuk kelas ini.
          </div>
        ) : (
          <div className="space-y-4">
            {courseLessons.map((lesson, index) => {
              const lessonProgressKey = `${currentUser.uid}_lesson_${lesson.id}`;
              const lessonProgress = userProgress[lessonProgressKey];
              const isCompleted = lessonProgress?.status === "completed";
              const isLocked = getLessonLockedState(index);

              return (
                <NeoCard
                  key={lesson.id}
                  bgColor={isCompleted ? "bg-pastel-mint/20" : isLocked ? "bg-brand-surface/10 opacity-60" : "bg-white"}
                  className="p-4 sm:p-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5 flex-grow">
                      <span className="w-7 h-7 rounded-full border-2 border-brand-border bg-brand-text text-white font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-heading font-bold text-base text-brand-text">
                            {lesson.title}
                          </h3>
                          {isCompleted ? (
                            <span className="text-[10px] font-extrabold text-brand-text bg-pastel-mint px-2 py-0.5 rounded-full border border-brand-border">
                              Selesai
                            </span>
                          ) : isLocked ? (
                            <span className="text-[10px] font-extrabold text-brand-muted bg-gray-200 px-2 py-0.5 rounded-full border border-brand-border flex items-center space-x-1">
                              <LockIcon className="w-3 h-3" />
                              <span>Terkunci</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-brand-muted line-clamp-2">
                          {lesson.objective}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] font-bold text-brand-muted pt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{lesson.estimatedDuration} Menit</span>
                          </span>
                          <span>•</span>
                          <span className="text-brand-text bg-pastel-blue/20 px-1.5 py-0.5 rounded">+{lesson.xpReward} XP</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                      {!isCourseLocked && (
                        <NeoButton
                          variant={isCompleted ? "secondary" : isLocked ? "secondary" : "primary"}
                          size="sm"
                          disabled={isLocked}
                          className="w-full sm:w-auto font-bold flex items-center justify-center space-x-1.5"
                          onClick={() => handleStartLesson(lesson, isLocked)}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Baca Ulang</span>
                            </>
                          ) : isLocked ? (
                            <>
                              <LockIcon className="w-3.5 h-3.5" />
                              <span>Terkunci</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Mulai Baca</span>
                            </>
                          )}
                        </NeoButton>
                      )}
                    </div>
                  </div>
                </NeoCard>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-6 border-t-3 border-brand-border">
        <NeoCard bgColor={allLessonsCompleted ? "bg-pastel-pink" : "bg-gray-100"} className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-brand-text" />
                <h3 className="text-xl font-heading font-extrabold text-brand-text">
                  Kuis Evaluation & Kelulusan Kelas
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-brand-text/90 font-medium max-w-xl">
                Uji pemahamanmu dengan menjawab soal kuis pilihan ganda. Dapatkan skor minimal 70 untuk lulus dan meraih sertifikat serta XP bonus!
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <NeoButton
                variant={allLessonsCompleted ? "primary" : "secondary"}
                disabled={isQuizLocked}
                className="w-full sm:w-auto py-3 font-extrabold flex items-center justify-center space-x-2"
                onClick={() => handleStartQuiz(isQuizLocked)}
              >
                {isQuizLocked ? (
                  <>
                    <LockIcon className="w-4 h-4" />
                    <span>Selesaikan Semua Materi</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>{latestAttemptId ? "Ulangi Kuis" : "Mulai Kuis Kelas"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </NeoButton>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Clock, Award, Shield, Lock as LockIcon, CheckCircle, ChevronRight, Play, RefreshCw } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import { User, Course, LearningPath } from "../types";
import { fetchCatalogLearningPaths, fetchCatalogCoursesForPath } from "../services/catalogService";
import { fetchMyProgress } from "../services/learningStateService";

export function calculateCourseLocks(
  orderedCourses: Course[],
  serverProgressMap: Record<string, any>
): Record<string, boolean> {
  const locks: Record<string, boolean> = {};
  if (orderedCourses.length === 0) return locks;

  // Course pertama selalu unlocked
  locks[orderedCourses[0].id] = false;

  for (let i = 1; i < orderedCourses.length; i++) {
    const currentCourse = orderedCourses[i];
    const prevCourse = orderedCourses[i - 1];
    const prevProgress = serverProgressMap[`course_${prevCourse.id}`];
    const isPrevCompleted = prevProgress?.status === "completed";
    locks[currentCourse.id] = !isPrevCompleted;
  }

  return locks;
}

export function calculatePathLocks(
  orderedPaths: LearningPath[],
  serverProgressMap: Record<string, any>
): Record<string, boolean> {
  const locks: Record<string, boolean> = {};
  orderedPaths.forEach((path, index) => {
    if (index === 0) {
      locks[path.id] = false;
      return;
    }
    locks[path.id] = serverProgressMap[`path_${orderedPaths[index - 1].id}`]?.status !== "completed";
  });
  return locks;
}

interface LearningPathsProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  pathSlug?: string | null;
}

export const LearningPaths: React.FC<LearningPathsProps> = ({
  currentUser,
  onNavigate,
  pathSlug = null
}) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(pathSlug);
  const [pathsList, setPathsList] = useState<LearningPath[]>([]);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [courseLocks, setCourseLocks] = useState<Record<string, boolean>>({});
  const [pathLocks, setPathLocks] = useState<Record<string, boolean>>({});
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Fetch catalog learning paths on load
  const loadPaths = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [paths, progressList] = await Promise.all([
        fetchCatalogLearningPaths(),
        fetchMyProgress(),
      ]);
      const orderedPaths = [...paths].sort((a, b) => {
        const levels = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return levels[a.level] - levels[b.level];
      });
      const progressMap: Record<string, any> = {};
      progressList.forEach((progress) => {
        progressMap[`${progress.contentType}_${progress.contentId}`] = progress;
      });
      setPathsList(orderedPaths);
      setUserProgress(progressMap);
      setPathLocks(calculatePathLocks(orderedPaths, progressMap));
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat katalog Jalur Belajar.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  useEffect(() => {
    if (pathSlug !== undefined) {
      setSelectedPath(pathSlug);
    }
  }, [pathSlug]);

  const loadCoursesAndProgress = async () => {
    if (!selectedPath) return;
    setIsCoursesLoading(true);
    setCoursesError(null);
    try {
      const [fetchedCourses, progressList] = await Promise.all([
        fetchCatalogCoursesForPath(selectedPath),
        fetchMyProgress()
      ]);

      const ordered = [...fetchedCourses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setActiveCourses(ordered);

      const progressMap: Record<string, any> = {};
      progressList.forEach((p) => {
        progressMap[`${p.contentType}_${p.contentId}`] = p;
      });
      setUserProgress(progressMap);

      const isPathLocked = pathLocks[selectedPath] ?? false;
      const locks = isPathLocked
        ? Object.fromEntries(ordered.map((course) => [course.id, true]))
        : calculateCourseLocks(ordered, progressMap);
      setCourseLocks(locks);
    } catch (err: any) {
      console.error("Gagal memuat kurikulum atau progress:", err);
      setCoursesError(err.message || "Gagal memuat kurikulum dan progres belajar Anda.");
    } finally {
      setIsCoursesLoading(false);
    }
  };

  useEffect(() => {
    loadCoursesAndProgress();
  }, [selectedPath, currentUser.uid, pathLocks[selectedPath || ""]]);

  const handleBackToList = () => {
    setSelectedPath(null);
    onNavigate("/learn/paths");
  };

  const handleSelectPath = (id: string) => {
    if (pathLocks[id]) {
      const pathIndex = pathsList.findIndex((path) => path.id === id);
      const prerequisite = pathIndex > 0 ? pathsList[pathIndex - 1].title : "jalur sebelumnya";
      alert(`Jalur ini masih terkunci. Selesaikan ${prerequisite} terlebih dahulu.`);
      return;
    }
    setSelectedPath(id);
    onNavigate(`/learn/paths/${id}`);
  };

  const handleOpenCourse = (course: Course) => {
    const isLocked = courseLocks[course.id] ?? false;
    if (isLocked) {
      alert(`Kelas ini terkunci! Harap selesaikan kelas sebelumnya terlebih dahulu.`);
      return;
    }
    onNavigate(`/learn/courses/${course.slug}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-block animate-spin text-brand-text">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-brand-muted">Memuat katalog Jalur Belajar...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center">
        <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-brand-text">Gagal Memuat Katalog</h2>
          <p className="text-xs text-brand-muted">{errorMsg}</p>
          <NeoButton variant="primary" onClick={loadPaths} className="font-bold">
            Coba Lagi
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  const activePathData = selectedPath
    ? pathsList.find(p => p.id === selectedPath || p.slug === selectedPath) || {
        id: selectedPath,
        title: "Jalur Belajar",
        description: "Jalur pembelajaran keamanan siber.",
        level: "Beginner",
        bgColor: "bg-pastel-mint",
        courseCount: 0,
        durationMinutes: 0,
        xpReward: 0,
        badgeName: "Cyber Defender",
        courses: [],
      }
    : null;

  // 1. RENDER DETAILED PATH VIEW
  if (selectedPath && activePathData) {
    if (isCoursesLoading) {
      return (
        <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="inline-block animate-spin text-brand-text">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-brand-muted">Memuat kurikulum dan progres...</p>
        </div>
      );
    }

    if (coursesError) {
      return (
        <div className="max-w-md mx-auto my-12 p-4 text-center">
          <NeoCard bgColor="bg-pastel-peach" className="space-y-4">
            <h2 className="text-xl font-heading font-bold text-brand-text">Gagal Memuat Kurikulum</h2>
            <p className="text-xs text-brand-muted">{coursesError}</p>
            <NeoButton variant="primary" onClick={loadCoursesAndProgress} className="font-bold">
              Coba Lagi
            </NeoButton>
          </NeoCard>
        </div>
      );
    }

    const pathProgressKey = `path_${activePathData.id}`;
    const pathProgress = userProgress[pathProgressKey];
    const pathPercent = pathProgress ? pathProgress.progressPercent : 0;
    const isActivePathLocked = pathLocks[activePathData.id] ?? false;
    const pathBadgeName =
      activePathData.id === "intermediate-path"
        ? "Intermediate Defender"
        : activePathData.id === "advanced-path"
        ? "Advanced Specialist"
        : activePathData.badgeName || "Cyber Defender";

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fadeIn font-sans">
        <div className="flex items-center space-x-2">
          <NeoButton variant="secondary" size="sm" onClick={handleBackToList} className="font-bold flex items-center space-x-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Jalur Belajar</span>
          </NeoButton>
        </div>

        <NeoCard bgColor={activePathData.bgColor || "bg-pastel-mint"} className="p-6 sm:p-8 space-y-4 animate-fadeIn">
          <div className="flex flex-wrap gap-2">
            <NeoBadge bgColor="bg-pastel-yellow">Tingkat: {activePathData.level || "Pemula"}</NeoBadge>
            <NeoBadge bgColor="bg-pastel-blue">{activeCourses.length} Kelas Aktif</NeoBadge>
            <NeoBadge bgColor="bg-pastel-mint">Hingga +{activePathData.xpReward ?? 0} XP</NeoBadge>
            <NeoBadge bgColor="bg-pastel-lavender">Badge: {pathBadgeName}</NeoBadge>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-text">
              {activePathData.title}
            </h1>
            <p className="text-sm sm:text-base text-brand-text/90 font-medium max-w-3xl leading-relaxed">
              {activePathData.description}
            </p>
          </div>

          {isActivePathLocked && (
            <div className="rounded-xl border-3 border-black bg-white px-4 py-3 font-bold text-sm shadow-[3px_3px_0_0_#000]">
              🔒 Prasyarat belum selesai. Tuntaskan jalur sebelumnya untuk membuka seluruh kelas pada jalur ini.
            </div>
          )}

          <div className="pt-4 space-y-2 border-t-2 border-brand-border/20">
            <div className="flex justify-between items-center text-xs font-bold text-brand-text uppercase">
              <span>Progres Jalur Belajar</span>
              <span>{pathPercent}% Selesai</span>
            </div>
            <div className="w-full bg-white h-5 border-3 border-brand-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-brand-text rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pathPercent}%` }}
              />
            </div>
          </div>
        </NeoCard>

        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b-3 border-brand-border pb-2">
            <BookOpen className="w-5 h-5 text-brand-text" />
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-brand-text">
              Kurikulum Kelas Pembelajaran
            </h2>
          </div>

          {activeCourses.length === 0 ? (
            <div className="text-center py-8 text-brand-muted font-bold text-sm">
              Belum ada kelas publik untuk jalur pembelajaran ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeCourses.map((course, index) => {
                const cProgressKey = `course_${course.id}`;
                const cProgress = userProgress[cProgressKey];
                const cPercent = cProgress ? cProgress.progressPercent : 0;
                const isCompleted = cProgress?.status === "completed";
                const isLocked = courseLocks[course.id] ?? (index > 0);

                return (
                  <NeoCard
                    key={course.id}
                    bgColor={isCompleted ? "bg-white/80" : isLocked ? "bg-brand-surface/10 opacity-70" : "bg-white"}
                    className="p-5 sm:p-6 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3 flex-grow max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-8 h-8 rounded-full border-2 border-brand-border bg-[#111111] text-pastel-mint font-heading font-extrabold flex items-center justify-center text-sm shadow-sm">
                            {index + 1}
                          </span>
                          <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-text">
                            {course.title}
                          </h3>
                          {isCompleted ? (
                            <span className="flex items-center space-x-1 text-xs font-bold text-brand-text bg-pastel-mint px-2 py-0.5 rounded-full border border-brand-border shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5 fill-white" />
                              <span>Selesai</span>
                            </span>
                          ) : isLocked ? (
                            <span className="flex items-center space-x-1 text-xs font-bold text-brand-muted bg-pastel-gray px-2 py-0.5 rounded-full border border-brand-border">
                              <LockIcon className="w-3.5 h-3.5" />
                              <span>Belum Dibuka</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-brand-text bg-pastel-yellow px-2 py-0.5 rounded-full border border-brand-border">
                              {cProgress?.lessonsCompleted
                                ? "Quiz Belum Lulus"
                                : cPercent > 0
                                ? "Sedang Dipelajari"
                                : "Siap Dipelajari"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-brand-muted font-medium leading-relaxed">
                          {course.description}
                        </p>

                        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-brand-text/90 font-semibold pt-1">
                            {course.learningOutcomes.map((outcome, oIdx) => (
                              <div key={oIdx} className="flex items-start space-x-1.5">
                                <span className="text-pastel-mint shrink-0 mt-0.5">✔</span>
                                <span className="leading-snug">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-brand-muted pt-2">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-brand-text" />
                            <span>Durasi: {course.estimatedDuration} Menit</span>
                          </span>
                          <span>•</span>
                          <span>{course.lessonCount || 0} Materi Interaktif</span>
                          <span>•</span>
                          <span className="text-brand-text bg-pastel-blue/30 px-2 py-0.5 rounded border border-brand-border">+{course.xpReward || 50} XP</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-center gap-3 shrink-0">
                        {!isLocked && (
                          <div className="text-center sm:text-left md:text-right space-y-1">
                            <span className="text-xs font-bold text-brand-muted uppercase">Progres Kelas</span>
                            <div className="w-24 sm:w-28 bg-brand-surface h-3.5 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
                              <div
                                className="h-full bg-pastel-mint rounded-full border border-brand-border"
                                style={{ width: `${cPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold text-brand-text block">{cPercent}% Selesai</span>
                          </div>
                        )}

                        <div className="w-full">
                          {isCompleted ? (
                            <NeoButton
                              variant="secondary"
                              size="sm"
                              className="w-full font-bold flex items-center justify-center space-x-1"
                              onClick={() => handleOpenCourse(course)}
                            >
                              <span>Tinjau Ulang</span>
                            </NeoButton>
                          ) : isLocked ? (
                            <div className="text-xs font-bold text-brand-muted bg-brand-surface p-2.5 rounded-xl border-2 border-dashed border-brand-border/40 text-center">
                              {isActivePathLocked
                                ? "Selesaikan jalur sebelumnya untuk membuka"
                                : `Selesaikan kelas ${index} untuk membuka`}
                            </div>
                          ) : (
                            <NeoButton
                              variant={cPercent > 0 ? "yellow" : "primary"}
                              size="sm"
                              className="w-full font-bold flex items-center justify-center space-x-2"
                              onClick={() => handleOpenCourse(course)}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{cPercent > 0 ? "Lanjutkan" : "Mulai Belajar"}</span>
                            </NeoButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </NeoCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. RENDER PATHS LIST
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 animate-fadeIn font-sans">
      <div className="space-y-2 border-b-4 border-brand-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text">
          Pilih Jalur Pembelajaran Anda
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted font-bold">
          Kami mendesain akademi siber ini bertahap dari dasar hingga pengamanan sistem mendalam.
        </p>
      </div>

      {pathsList.length === 0 ? (
        <div className="text-center py-12 text-brand-muted font-bold">
          Belum ada jalur pembelajaran yang dipublikasikan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {pathsList.map((path) => {
            const pathProgress = userProgress[`path_${path.id}`];
            const isFinished = pathProgress?.status === "completed";
            const isPathLocked = pathLocks[path.id] ?? false;
            const pathPercent = pathProgress?.progressPercent ?? 0;
            const completedCourses = Math.min(
              path.courseCount ?? 0,
              Math.round(((path.courseCount ?? 0) * pathPercent) / 100)
            );

            return (
              <NeoCard
                key={path.id}
                bgColor={path.bgColor || "bg-pastel-mint"}
                onClick={() => handleSelectPath(path.id)}
                className={`flex flex-col justify-between p-6 sm:p-8 space-y-6 transition-all ${
                  isPathLocked ? "opacity-70" : "cursor-pointer hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-y-0 active:shadow-none"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <NeoBadge bgColor="bg-pastel-yellow">
                      {isFinished ? "🏆 Selesai" : isPathLocked ? "🔒 Belum Dibuka" : path.level || "Beginner"}
                    </NeoBadge>
                    <div className="w-10 h-10 bg-white rounded-full border-2 border-brand-border flex items-center justify-center shadow-sm">
                      <Shield className="w-5 h-5 text-brand-text" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold leading-tight text-brand-text">
                      {path.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-brand-text/80">
                      {path.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-bold pt-2 border-t border-brand-border/10 text-brand-text/90">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Total: {path.courseCount ?? 0} Kelas Utama</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Estimasi Durasi: {path.estimatedDuration ?? 60} Menit</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 shrink-0" />
                      <span>Total XP Jalur: hingga +{path.xpReward ?? 300} XP</span>
                    </div>
                    {!isPathLocked && (
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between gap-2">
                          <span>{completedCourses} dari {path.courseCount ?? 0} kelas selesai</span>
                          <span>{pathPercent}%</span>
                        </div>
                        <div className="h-3 rounded-full border-2 border-black bg-white overflow-hidden">
                          <div className="h-full bg-pastel-mint" style={{ width: `${pathPercent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <NeoButton
                    variant="primary"
                    className="w-full py-3 font-bold flex items-center justify-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPath(path.id);
                    }}
                    disabled={isPathLocked}
                  >
                    <span>
                      {isPathLocked
                        ? path.level === "Intermediate"
                          ? "Selesaikan Beginner Terlebih Dahulu"
                          : "Selesaikan Intermediate Terlebih Dahulu"
                        : "Buka Jalur Belajar"}
                    </span>
                    {isPathLocked ? <LockIcon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </NeoButton>
                </div>
              </NeoCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

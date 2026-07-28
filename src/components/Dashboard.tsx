import React, { useEffect, useState, useRef, useCallback } from "react";
import { Shield, Sparkles, BookOpen, Flame, Award, ChevronRight, CheckCircle, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { NeoBadge } from "./NeoBadge";
import { User } from "../types";
import { fetchMyBadges, fetchMyCertificates } from "../services/achievementService";
import { useUser } from "../contexts/UserContext";
import { fetchCatalogLearningPaths, fetchCatalogCoursesForPath, fetchCatalogLessonsForCourse } from "../services/catalogService";
import { fetchMyProgress } from "../services/learningStateService";

interface DashboardProps {
  currentUser?: User;
  onLogout: () => void;
  onNavigate: (route: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser: propUser, onNavigate }) => {
  const { currentUser: contextUser } = useUser();
  const currentUser = contextUser || propUser;
  const userId = currentUser?.uid;

  // 1. ALL HOOKS MUST BE DECLARED AT TOP LEVEL IN FIXED ORDER
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [earnedBadgesCount, setEarnedBadgesCount] = useState<number>(0);
  const [hasCert, setHasCert] = useState<boolean>(false);
  const [catalogPaths, setCatalogPaths] = useState<any[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [catalogLessons, setCatalogLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const paths = await fetchCatalogLearningPaths();
      const sortedPaths = (paths || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      const coursesNested = await Promise.all(
        sortedPaths.map((p) => fetchCatalogCoursesForPath(p.id))
      );
      const loadedCourses = coursesNested.flat();

      const lessonsNested = await Promise.all(
        loadedCourses.map((c) => fetchCatalogLessonsForCourse(c.id))
      );
      const loadedLessons = lessonsNested.flat();

      if (isMountedRef.current) {
        setCatalogPaths(sortedPaths);
        setCatalogCourses(loadedCourses);
        setCatalogLessons(loadedLessons);
      }
    } catch (err: any) {
      console.error("Gagal memuat katalog dashboard:", err);
      if (isMountedRef.current) {
        setError(err.message || "Gagal memuat data katalog dari Firestore.");
        setCatalogPaths([]);
        setCatalogCourses([]);
        setCatalogLessons([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (userId) {
      fetchMyProgress()
        .then((progressList) => {
          if (!isMountedRef.current) return;
          const progressMap: Record<string, any> = {};
          progressList.forEach((p) => {
            const key = `${p.userId}_${p.contentType}_${p.contentId}`;
            progressMap[key] = p;
          });
          setUserProgress(progressMap);
        })
        .catch((err) => {
          console.error("Gagal memuat progress di Dashboard:", err);
        });

      Promise.all([fetchMyBadges(), fetchMyCertificates()])
        .then(([badges, certificates]) => {
          if (!isMountedRef.current) return;
          setEarnedBadgesCount(badges.length);
          setHasCert(certificates.some((certificate) => certificate.status === "active"));
        })
        .catch((err) => console.error("Gagal memuat pencapaian Dashboard:", err));
      loadCatalog();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [userId, loadCatalog]);

  // Determine active path dynamically based on progress in_progress > published order
  const activePath = (() => {
    if (catalogPaths.length === 0) return null;
    if (userId) {
      const inProgressPath = catalogPaths.find((p) => {
        const key = `${userId}_path_${p.id}`;
        return userProgress[key]?.status === "in_progress";
      });
      if (inProgressPath) return inProgressPath;
    }
    return catalogPaths[0];
  })();

  // Determine Continue Target considering path & course order
  const getContinueTarget = () => {
    if (!activePath || !userId) return null;

    const otherPaths = catalogPaths.filter((p) => p.id !== activePath.id);
    const orderedPaths = [activePath, ...otherPaths];

    for (const path of orderedPaths) {
      const pathCourses = catalogCourses
        .filter((c) => c.learningPathId === path.id && c.status === "published")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      for (const course of pathCourses) {
        const courseLessons = catalogLessons
          .filter((l) => l.courseId === course.id && l.status === "published")
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        for (const lesson of courseLessons) {
          const key = `${userId}_lesson_${lesson.id}`;
          if (!userProgress[key] || userProgress[key].status !== "completed") {
            return { path, course, lesson };
          }
        }
      }
    }
    return null;
  };

  const continueTarget = getContinueTarget();

  const handleContinueLearning = () => {
    if (continueTarget) {
      onNavigate(`/learn/courses/${continueTarget.course.slug}/lessons/${continueTarget.lesson.slug}`);
    } else if (activePath) {
      onNavigate(`/learn/paths/${activePath.id}`);
    } else {
      onNavigate("/learn/paths");
    }
  };

  // 2. SAFE CONDITIONAL RENDER AFTER ALL HOOKS HAVE BEEN EXECUTED
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] font-sans">
        <TrendingUp className="w-8 h-8 text-pastel-mint animate-spin mb-2" />
        <p className="text-xs text-brand-muted font-bold">Memuat profil Anda...</p>
      </div>
    );
  }

  const activePathProgress = (userId && activePath)
    ? (userProgress[`${userId}_path_${activePath.id}`]?.progressPercent || 0)
    : 0;

  const activePathCoursesProgress = activePath
    ? catalogCourses
        .filter((c) => c.learningPathId === activePath.id && c.status === "published")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((c) => {
          const key = `${userId}_course_${c.id}`;
          return {
            ...c,
            completed: userProgress[key]?.status === "completed",
            percent: userProgress[key]?.progressPercent || 0,
            lessonCount: c.lessonCount || catalogLessons.filter((l) => l.courseId === c.id).length,
          };
        })
    : [];

  const levelProgressXp = currentUser.totalXp % 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 animate-fadeIn font-sans text-brand-text">
      
      {/* 1. WELCOME BANNER & STATS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Profile Card */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-pastel-mint border-4 border-brand-border rounded-[24px] p-6 sm:p-8 neo-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full translate-x-10 -translate-y-10 border-4 border-brand-border" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <img
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                alt={currentUser.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-3 border-brand-border rounded-2xl neo-shadow-sm flex-shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-brand-text">
                    Halo, {currentUser.displayName}!
                  </h1>
                  <NeoBadge bgColor="bg-pastel-yellow">Taruna Siber</NeoBadge>
                </div>
                <p className="text-xs sm:text-sm text-brand-muted font-semibold">
                  Misi: <span className="text-brand-text font-bold">
                    {currentUser.learningGoal === "protect_self" ? "Melindungi Akun & Data Pribadi" :
                     currentUser.learningGoal === "career" ? "Persiapan Karir Profesional" : "Akademik & Kompetisi"}
                  </span>
                </p>
                <div className="flex items-center space-x-2 text-xs text-brand-muted font-bold pt-0.5">
                  <Clock className="w-4 h-4 text-brand-text" />
                  <span>Komitmen Harian: {currentUser.studyTime === "5min" ? "5 Menit (Santai)" : currentUser.studyTime === "30min" ? "30 Menit (Intensif)" : "15 Menit (Fokus)"}</span>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-brand-text/80 font-medium leading-relaxed max-w-xl">
              {continueTarget ? (
                <span>
                  Hari ini Anda disarankan melanjutkan ke materi <span className="font-heading font-bold underline decoration-pastel-yellow decoration-3">{continueTarget.lesson.title}</span> pada kelas <span className="font-bold">{continueTarget.course.title}</span> untuk memperkuat pemahaman siber defensif Anda.
                </span>
              ) : activePath ? (
                <span>
                  Selamat! Anda telah menyelesaikan seluruh materi pelajaran yang tersedia di Jalur Pembelajaran <span className="font-bold underline">{activePath.title}</span>. Ambil kuis kelulusan di dalam modul kelas untuk melengkapi pencapaianmu!
                </span>
              ) : (
                <span>Katalog materi pembelajaran dari Cloud Firestore belum dimuat.</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 relative z-10 border-t-2 border-brand-border/20 mt-6">
            <NeoButton variant="primary" size="sm" onClick={handleContinueLearning} className="font-bold flex items-center space-x-2">
              <span>{continueTarget ? "Lanjutkan Belajar" : "Tinjau Jalur Belajar"}</span>
              <ChevronRight className="w-4 h-4" />
            </NeoButton>
            <NeoButton variant="secondary" size="sm" onClick={() => onNavigate("/progress")} className="font-bold flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Analitik Progres</span>
            </NeoButton>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-4">
          {/* Level Card */}
          <div className="bg-pastel-yellow border-3 border-brand-border rounded-2xl p-4 flex flex-col justify-between neo-shadow-sm select-none">
            <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Level Aktif</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text">Lvl {currentUser.currentLevel}</span>
              <span className="text-xs font-bold text-brand-muted">/ 10</span>
            </div>
            <div className="w-full bg-white h-2.5 border-2 border-brand-border rounded-full overflow-hidden p-0.5 mt-2">
              <div className="h-full bg-brand-text rounded-full transition-all duration-300" style={{ width: `${levelProgressXp}%` }} />
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-pastel-blue border-3 border-brand-border rounded-2xl p-4 flex flex-col justify-between neo-shadow-sm select-none">
            <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Total XP</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text">{currentUser.totalXp}</span>
              <span className="text-xs font-bold text-brand-muted">XP</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-brand-muted mt-2 block">Pencapaian belajar terkumpul</span>
          </div>

          {/* Streak Card */}
          <div className="bg-[#FFFDF8] border-3 border-brand-border rounded-2xl p-4 flex flex-col justify-between neo-shadow-sm select-none">
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4 text-brand-text fill-pastel-yellow" />
              <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Streak</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text">{currentUser.learningStreak}</span>
              <span className="text-xs font-bold text-brand-muted">Hari</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-brand-muted mt-2 block">Jaga nyala api belajarmu!</span>
          </div>
        </div>
      </section>

      {/* 2. CORE PATHWAY (INTEGRATED ROADMAP) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b-3 border-brand-border pb-3">
            <div className="flex items-center space-x-2.5">
              <BookOpen className="w-5 h-5 text-brand-text" />
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-brand-text">Misi Pembelajaran Aktif</h2>
            </div>
            <NeoBadge bgColor="bg-pastel-mint">Rekomendasi Kurikulum</NeoBadge>
          </div>

          {loading ? (
            <NeoCard bgColor="bg-white" className="p-8 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-muted" />
              <p className="text-xs text-brand-muted font-bold">Memuat katalog dari Cloud Firestore...</p>
            </NeoCard>
          ) : error || !activePath ? (
            <NeoCard bgColor="bg-pastel-peach/30" className="p-6 text-center space-y-4">
              <h3 className="font-heading font-extrabold text-lg text-brand-text">Katalog Pembelajaran Belum Tersedia</h3>
              <p className="text-xs text-brand-muted font-medium max-w-md mx-auto">
                {error || "Belum ada Learning Path yang dipublikasikan di Firestore."}
              </p>
              <div className="flex justify-center gap-3">
                <NeoButton variant="secondary" size="sm" onClick={loadCatalog} className="font-bold flex items-center space-x-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </NeoButton>
                <NeoButton variant="primary" size="sm" onClick={() => onNavigate("/learn/paths")} className="font-bold">
                  Jelajahi Katalog
                </NeoButton>
              </div>
            </NeoCard>
          ) : (
            <div className="space-y-4">
              <NeoCard bgColor="bg-white" className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/10 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🛡️</span>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-text">
                        {activePath.title}
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted font-semibold max-w-lg">
                      {activePath.shortDescription || activePath.description || "Tingkat pembelajaran siber defensif."}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <NeoButton variant="primary" size="sm" onClick={() => onNavigate(`/learn/paths/${activePath.id}`)} className="text-xs font-bold font-heading">
                      Buka Jalur Belajar
                    </NeoButton>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-brand-muted">Progres Keseluruhan Jalur</span>
                    <span>{activePathProgress}% Selesai</span>
                  </div>
                  <div className="w-full bg-brand-surface h-3.5 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-pastel-mint rounded-full transition-all duration-300" style={{ width: `${activePathProgress}%` }} />
                  </div>
                </div>

                {/* Courses list overview inside path */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activePathCoursesProgress.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => onNavigate(`/learn/courses/${course.slug}`)}
                      className={`p-3 rounded-xl border-2 border-brand-border text-left cursor-pointer transition-all select-none flex items-center justify-between ${course.completed ? "bg-pastel-mint/10 hover:bg-pastel-mint/20" : "bg-[#FFFDF8] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#111111]"}`}
                    >
                      <div className="truncate max-w-[80%] pr-1">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-text truncate">{course.title}</h4>
                        <p className="text-[10px] text-brand-muted font-bold">{course.percent}% selesai • {course.lessonCount} materi</p>
                      </div>
                      {course.completed ? (
                        <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0 fill-brand-text" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </NeoCard>
            </div>
          )}
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* AI Tutor Widget */}
          <NeoCard bgColor="bg-pastel-mint/20" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-brand-text fill-pastel-mint" />
                <h3 className="font-heading font-bold text-base text-brand-text">Asisten AI Tutor</h3>
              </div>
              <NeoBadge bgColor="bg-pastel-mint" size="sm">Online</NeoBadge>
            </div>
            <p className="text-xs text-brand-muted font-semibold leading-relaxed">
              Diskusikan materi pelajaran, cari tahu cara menghindari phishing, atau mintalah asisten remedial siber defenfif kapan saja.
            </p>
            <NeoButton variant="mint" size="sm" onClick={() => onNavigate("/ai-tutor")} className="w-full text-xs font-bold">
              Buka AI Tutor
            </NeoButton>
          </NeoCard>

          {/* AI Learning Insight Widget */}
          <NeoCard bgColor="bg-pastel-peach/10" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <TrendingUp className="w-5 h-5 text-brand-text" />
                <h3 className="font-heading font-bold text-base text-brand-text">AI Learning Insight</h3>
              </div>
              <NeoBadge bgColor="bg-pastel-peach" size="sm">Analisis</NeoBadge>
            </div>
            <p className="text-xs text-brand-muted font-semibold leading-relaxed">
              Analisis cerdas berdasarkan riwayat kuis dan aktivitas simulasi untuk menemukan area penguasaan dan rekomendasi belajar.
            </p>
            <NeoButton variant="secondary" size="sm" onClick={() => onNavigate("/progress/insight")} className="w-full text-xs font-bold">
              Lihat Insight Belajar
            </NeoButton>
          </NeoCard>

          {/* Achievement Widget */}
          <NeoCard bgColor="bg-[#FFFDF8]" className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-brand-text" />
              <h3 className="font-heading font-bold text-base text-brand-text">Lencana Pertahanan</h3>
            </div>
            <p className="text-xs text-brand-muted font-semibold">
              Anda telah meraih <span className="font-bold text-black">{earnedBadgesCount} / 6</span> lencana siber defensif yang dievaluasi secara aman di server.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center space-x-1 bg-[#B4E0FA] border-2 border-brand-border px-2.5 py-1 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000000] rotate-[-1deg]">
                <span>🛡️ First Step</span>
              </div>
              <div className={`flex items-center space-x-1 border-2 px-2.5 py-1 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000000] ${earnedBadgesCount > 1 ? "bg-[#FFE696] border-brand-border" : "bg-gray-100 border-gray-300 opacity-45"}`}>
                <span>🔐 Guard</span>
              </div>
              <div className={`flex items-center space-x-1 border-2 px-2.5 py-1 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000000] ${earnedBadgesCount > 4 ? "bg-[#B4F0D2] border-brand-border" : "bg-gray-100 border-gray-300 opacity-45"}`}>
                <span>🎣 Hunter</span>
              </div>
            </div>
            <NeoButton variant="secondary" size="sm" onClick={() => onNavigate("/badges")} className="w-full text-xs font-bold">
              Buka Galeri Lencana
            </NeoButton>
          </NeoCard>
        </div>
      </section>

      {/* 3. SIMULATIONS & CERTIFICATE OVERVIEWS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Phishing Simulation */}
        <NeoCard bgColor="bg-pastel-yellow/30" className="flex flex-col justify-between space-y-4 border-3">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-pastel-yellow px-2.5 py-0.5 rounded-full border-2 border-brand-border text-xs font-bold">
              <span>Simulasi Praktis</span>
            </div>
            <h3 className="font-heading font-extrabold text-lg text-brand-text">
              Phishing Sandbox Simulator
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted font-medium leading-relaxed">
              Latih refleks pertahanan digitalmu dengan membedakan email resmi dan email penipuan secara interaktif, tanpa menanggung risiko kehilangan data dunia nyata!
            </p>
          </div>
          <div className="pt-4 border-t border-brand-border/20 flex justify-between items-center">
            <span className="text-xs text-brand-muted font-bold">Tingkat: Pemula (Gratis)</span>
            <NeoButton variant="primary" size="sm" onClick={() => onNavigate("/simulations")} className="text-xs font-bold">
              Mulai Simulasi
            </NeoButton>
          </div>
        </NeoCard>

        {/* Smart Certificates */}
        <NeoCard bgColor="bg-pastel-blue/20" className="flex flex-col justify-between space-y-4 border-3">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-pastel-blue px-2.5 py-0.5 rounded-full border-2 border-brand-border text-xs font-bold">
              <span>Sertifikasi Resmi</span>
            </div>
            <h3 className="font-heading font-extrabold text-lg text-brand-text">
              Sertifikat Kelulusan Siber
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted font-medium leading-relaxed">
              Setelah menyelesaikan seluruh materi pelajaran dan melampaui skor minimal kuis akhir, dapatkan sertifikat digital terverifikasi untuk profil profesional Anda.
            </p>
          </div>
          <div className="pt-4 border-t border-brand-border/20 flex justify-between items-center">
            <span className="text-xs text-brand-muted font-bold">{hasCert ? "Sertifikasi Aktif" : "Belum Tersedia"}</span>
            <NeoButton
              variant="primary"
              size="sm"
              onClick={() => onNavigate("/certificates")}
              className="text-xs font-bold"
            >
              {hasCert ? "Tinjau Sertifikat" : "Cek Kelayakan"}
            </NeoButton>
          </div>
        </NeoCard>
      </section>
    </div>
  );
};

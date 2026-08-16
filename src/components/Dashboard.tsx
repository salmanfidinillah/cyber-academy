import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Medal,
  RefreshCw,
  Route,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
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

interface DashboardStatCardProps {
  accentClass: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  accentClass,
  icon,
  label,
  value,
  helper,
}) => (
  <article
    className={`${accentClass} group min-w-0 rounded-2xl border-3 border-brand-border p-3.5 shadow-[3px_3px_0_0_#111111] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#111111] motion-reduce:transform-none motion-reduce:transition-none sm:p-4`}
  >
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0 text-[11px] font-extrabold uppercase tracking-[0.1em] text-brand-muted sm:text-xs">
        {label}
      </span>
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border bg-white/80"
        aria-hidden="true"
      >
        {icon}
      </span>
    </div>
    <div className="mt-3 break-words font-heading text-2xl font-extrabold leading-none text-brand-text sm:text-3xl">
      {value}
    </div>
    <p className="mt-2 text-[11px] font-bold leading-snug text-brand-muted sm:text-xs">{helper}</p>
  </article>
);

interface DashboardProgressBarProps {
  label: string;
  value: number;
  colorClass?: string;
}

const DashboardProgressBar: React.FC<DashboardProgressBarProps> = ({
  label,
  value,
  colorClass = "bg-pastel-mint",
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3 text-xs font-bold sm:text-sm">
      <span className="min-w-0 break-words text-brand-text">{label}</span>
      <span className="shrink-0 rounded-full border-2 border-brand-border bg-white px-2 py-0.5 text-[11px]">
        {value}%
      </span>
    </div>
    <div
      className="h-3.5 w-full overflow-hidden rounded-full border-2 border-brand-border bg-white p-0.5"
      role="progressbar"
      aria-label={`Progres ${label}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full max-w-full rounded-full ${colorClass} transition-[width] duration-500 ease-out motion-reduce:transition-none`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ currentUser: propUser, onNavigate }) => {
  const { currentUser: contextUser } = useUser();
  const currentUser = contextUser || propUser;
  const userId = currentUser?.uid;

  // 1. ALL HOOKS MUST BE DECLARED AT TOP LEVEL IN FIXED ORDER
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [earnedBadgesCount, setEarnedBadgesCount] = useState<number>(0);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
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
          setEarnedBadgeIds(new Set(badges.map((badge) => badge.badgeId)));
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
      <div
        className="mx-auto w-full max-w-[1500px] space-y-4 py-6 font-sans"
        role="status"
        aria-live="polite"
        aria-label="Memuat profil dan Dashboard"
      >
        <div className="rounded-[24px] border-4 border-brand-border bg-pastel-blue p-5 shadow-[5px_5px_0_0_#111111] sm:p-7">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl border-3 border-brand-border bg-white/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-2/3 max-w-sm rounded-lg bg-white/80" />
              <div className="h-3.5 w-1/2 max-w-xs rounded-lg bg-white/60" />
            </div>
          </div>
          <p className="mt-5 text-sm font-extrabold text-brand-muted">Menyiapkan Dashboard Anda...</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-28 rounded-2xl border-3 border-brand-border bg-white/80 shadow-[3px_3px_0_0_#111111]"
            />
          ))}
        </div>
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
  const isMaxLevel = currentUser.currentLevel >= 5;
  const pathProgressSummaries = catalogPaths.map((path) => ({
    id: path.id,
    title: path.title,
    progress: userId ? (userProgress[`${userId}_path_${path.id}`]?.progressPercent || 0) : 0,
  }));

  return (
    <div className="mx-auto w-full max-w-[1500px] min-w-0 space-y-7 pb-8 pt-4 font-sans text-brand-text sm:space-y-9 sm:pb-10 sm:pt-6">
      <section
        className="relative isolate overflow-hidden rounded-[24px] border-4 border-brand-border bg-pastel-blue p-5 shadow-[5px_5px_0_0_#111111] animate-[fadeIn_420ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none sm:p-7 lg:p-8"
        aria-labelledby="dashboard-welcome-title"
      >
        <div className="absolute -right-9 -top-10 size-32 rounded-full border-4 border-brand-border bg-pastel-yellow/80 sm:size-40" aria-hidden="true" />
        <div className="absolute bottom-5 right-24 hidden size-12 rotate-12 rounded-xl border-3 border-brand-border bg-pastel-lavender lg:block" aria-hidden="true" />
        <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                alt={`Foto profil ${currentUser.displayName}`}
                className="size-14 shrink-0 rounded-2xl border-3 border-brand-border bg-white object-cover shadow-[3px_3px_0_0_#111111] sm:size-16"
              />
              <div className="min-w-0">
                <NeoBadge bgColor="bg-white" className="mb-1.5">Dashboard Taruna</NeoBadge>
                <h1 id="dashboard-welcome-title" className="break-words font-heading text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                  Selamat datang kembali, {currentUser.displayName}
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-brand-muted sm:text-base">
              Lanjutkan perjalanan belajarmu dan tingkatkan kesiapan keamanan siber melalui langkah kecil yang konsisten.
            </p>

            <div className="mt-4 max-w-2xl rounded-2xl border-2 border-brand-border bg-white/80 p-3.5 text-sm font-semibold leading-relaxed shadow-[2px_2px_0_0_#111111]">
              <span className="font-heading font-extrabold">Rekomendasi berikutnya: </span>
              {continueTarget ? (
                <span>
                  lanjutkan “{continueTarget.lesson.title}” di kelas {continueTarget.course.title}.
                </span>
              ) : activePath ? (
                <span>
                  tinjau jalur {activePath.title} dan selesaikan kuis kelulusan yang tersedia.
                </span>
              ) : (
                <span>mulai dari jalur belajar yang paling sesuai dengan tujuanmu.</span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <NeoButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleContinueLearning}
                className="w-full gap-2 sm:w-auto"
              >
                <BookOpen className="size-4" aria-hidden="true" />
                <span>{continueTarget ? "Lanjutkan Belajar" : "Tinjau Jalur Belajar"}</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </NeoButton>
              <NeoButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onNavigate("/progress")}
                className="w-full gap-2 sm:w-auto"
              >
                <TrendingUp className="size-4" aria-hidden="true" />
                <span>Lihat Progress</span>
              </NeoButton>
            </div>
          </div>

          <div className="hidden rounded-[20px] border-3 border-brand-border bg-pastel-mint p-5 shadow-[4px_4px_0_0_#111111] lg:block">
            <div className="flex items-center justify-between">
              <Shield className="size-10" aria-hidden="true" />
              <NeoBadge bgColor="bg-pastel-yellow" size="sm">Misi Aktif</NeoBadge>
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-muted">Fokus belajar</p>
            <p className="mt-1 font-heading text-lg font-extrabold">
              {currentUser.learningGoal === "protect_self"
                ? "Lindungi akun & data"
                : currentUser.learningGoal === "career"
                  ? "Siapkan karier siber"
                  : "Akademik & kompetisi"}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t-2 border-brand-border/20 pt-3 text-xs font-bold">
              <Clock className="size-4" aria-hidden="true" />
              <span>
                {currentUser.studyTime === "5min"
                  ? "5 menit per hari"
                  : currentUser.studyTime === "30min"
                    ? "30 menit per hari"
                    : "15 menit per hari"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="animate-[fadeIn_460ms_80ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"
        aria-labelledby="dashboard-stats-title"
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Ringkasan hari ini</p>
            <h2 id="dashboard-stats-title" className="font-heading text-xl font-extrabold sm:text-2xl">Progress dalam sekali lihat</h2>
          </div>
          <p className="text-xs font-bold text-brand-muted">Seluruh angka berasal dari data akunmu.</p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          <DashboardStatCard
            accentClass="bg-pastel-blue"
            icon={<Trophy className="size-4" />}
            label="Total XP"
            value={<>{currentUser.totalXp}<span className="ml-1 text-sm">XP</span></>}
            helper="XP terkumpul"
          />
          <DashboardStatCard
            accentClass="bg-pastel-yellow"
            icon={<TrendingUp className="size-4" />}
            label="Level"
            value={`Lvl ${currentUser.currentLevel}`}
            helper={isMaxLevel ? "Level maksimal tercapai" : `${levelProgressXp}% ke level berikutnya`}
          />
          <DashboardStatCard
            accentClass="bg-pastel-yellow/60"
            icon={<Flame className="size-4 fill-pastel-peach" />}
            label="Streak"
            value={<>{currentUser.learningStreak}<span className="ml-1 text-sm">hari</span></>}
            helper="Jaga konsistensi"
          />
          <DashboardStatCard
            accentClass="bg-pastel-mint"
            icon={<Route className="size-4" />}
            label="Jalur aktif"
            value={`${activePathProgress}%`}
            helper={activePath?.title || "Belum dimulai"}
          />
          <DashboardStatCard
            accentClass="bg-pastel-lavender"
            icon={<Medal className="size-4" />}
            label="Badge"
            value={`${earnedBadgesCount}/4`}
            helper="Milestone diraih"
          />
          <DashboardStatCard
            accentClass="bg-pastel-peach"
            icon={<GraduationCap className="size-4" />}
            label="Sertifikat"
            value={hasCert ? "Aktif" : "Belum"}
            helper={hasCert ? "Siap ditinjau" : "Selesaikan jalur"}
          />
        </div>
      </section>

      <section
        className="grid min-w-0 gap-6 animate-[fadeIn_500ms_140ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]"
        aria-labelledby="dashboard-learning-title"
      >
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Lanjutkan pembelajaran</p>
              <h2 id="dashboard-learning-title" className="font-heading text-xl font-extrabold sm:text-2xl">Misi pembelajaran aktif</h2>
            </div>
            <NeoBadge bgColor="bg-pastel-mint">Rekomendasi Kurikulum</NeoBadge>
          </div>

          {loading ? (
            <NeoCard
              bgColor="bg-white"
              className="space-y-5"
              role="status"
              aria-live="polite"
              aria-label="Memuat katalog pembelajaran"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <p className="font-heading font-extrabold">Menyiapkan misi belajarmu...</p>
              </div>
              <div className="h-5 w-2/3 rounded-lg bg-pastel-blue/70" />
              <div className="h-3.5 w-full rounded-full bg-pastel-gray/80" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-16 rounded-xl border-2 border-brand-border bg-brand-surface" />
                <div className="h-16 rounded-xl border-2 border-brand-border bg-brand-surface" />
              </div>
            </NeoCard>
          ) : error ? (
            <NeoCard bgColor="bg-pastel-red/35" className="space-y-4 text-center" role="alert">
              <div className="mx-auto flex size-11 items-center justify-center rounded-2xl border-2 border-brand-border bg-white">
                <RefreshCw className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-extrabold">Katalog belum berhasil dimuat</h3>
                <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-brand-muted">{error}</p>
              </div>
              <NeoButton type="button" variant="secondary" size="sm" onClick={loadCatalog}>
                Coba Lagi
              </NeoButton>
            </NeoCard>
          ) : !activePath ? (
            <NeoCard bgColor="bg-pastel-yellow/35" className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border-2 border-brand-border bg-white shadow-[2px_2px_0_0_#111111]">
                <BookOpen className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-extrabold">Mulai perjalanan siber pertamamu</h3>
                <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-brand-muted">
                  Belum ada jalur aktif di Dashboard. Jelajahi katalog untuk memilih langkah pertama.
                </p>
              </div>
              <NeoButton type="button" variant="primary" size="sm" onClick={() => onNavigate("/learn/paths")}>
                Jelajahi Jalur Belajar
              </NeoButton>
            </NeoCard>
          ) : (
            <NeoCard bgColor="bg-white" className="min-w-0 space-y-5">
              <div className="flex min-w-0 flex-col gap-4 border-b-2 border-brand-border/15 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border bg-pastel-mint" aria-hidden="true">
                      <Shield className="size-5" />
                    </span>
                    <h3 className="min-w-0 break-words font-heading text-lg font-extrabold sm:text-xl">{activePath.title}</h3>
                  </div>
                  <p className="mt-2 max-w-2xl break-words text-sm font-semibold leading-relaxed text-brand-muted">
                    {activePath.shortDescription || activePath.description || "Tingkat pembelajaran siber defensif."}
                  </p>
                </div>
                <NeoButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate(`/learn/paths/${activePath.id}`)}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Buka Jalur
                </NeoButton>
              </div>

              <DashboardProgressBar label={`Jalur ${activePath.title}`} value={activePathProgress} />

              {activePathCoursesProgress.length > 0 ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  {activePathCoursesProgress.map((course) => (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => onNavigate(`/learn/courses/${course.slug}`)}
                      className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-brand-border p-3 text-left outline-none transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#111111] focus-visible:ring-4 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none ${
                        course.completed ? "bg-pastel-mint/30" : "bg-brand-surface"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block break-words font-heading text-sm font-extrabold">{course.title}</span>
                        <span className="mt-1 block text-xs font-bold text-brand-muted">
                          {course.percent}% selesai · {course.lessonCount} materi
                        </span>
                      </span>
                      {course.completed ? (
                        <CheckCircle className="size-5 shrink-0 fill-pastel-mint" aria-label="Selesai" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-brand-border bg-pastel-yellow/25 p-4 text-center">
                  <p className="text-sm font-bold">Materi pada jalur ini belum tersedia.</p>
                  <p className="mt-1 text-xs font-semibold text-brand-muted">Cek kembali katalog pembelajaran secara berkala.</p>
                </div>
              )}
            </NeoCard>
          )}
        </div>

        <aside className="min-w-0 space-y-4" aria-label="Bantuan belajar">
          <NeoCard
            bgColor="bg-pastel-lavender"
            className="space-y-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border bg-white" aria-hidden="true">
                <BrainCircuit className="size-5" />
              </span>
              <NeoBadge bgColor="bg-white" size="sm">AI Insight</NeoBadge>
            </div>
            <div>
              <h3 className="font-heading text-lg font-extrabold">Pahami pola belajarmu</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-brand-muted">
                Lihat analisis riwayat kuis dan simulasi untuk menemukan fokus belajar berikutnya.
              </p>
            </div>
            <NeoButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onNavigate("/progress/insight")}
              className="w-full"
            >
              Lihat Insight Belajar
            </NeoButton>
          </NeoCard>

          <NeoCard
            bgColor="bg-pastel-mint/55"
            className="space-y-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border bg-white" aria-hidden="true">
                <Sparkles className="size-5" />
              </span>
              <div>
                <NeoBadge bgColor="bg-pastel-mint" size="sm">Online</NeoBadge>
                <h3 className="mt-1 font-heading text-lg font-extrabold">AI Tutor</h3>
              </div>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-brand-muted">
              Tanyakan materi yang belum jelas dan lanjutkan diskusi belajarmu kapan saja.
            </p>
            <NeoButton type="button" variant="mint" size="sm" onClick={() => onNavigate("/ai-tutor")} className="w-full">
              Buka AI Tutor
            </NeoButton>
          </NeoCard>
        </aside>
      </section>

      <section
        className="grid min-w-0 gap-6 animate-[fadeIn_520ms_200ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none lg:grid-cols-2"
        aria-labelledby="dashboard-path-progress-title"
      >
        <NeoCard bgColor="bg-pastel-mint/25" className="min-w-0 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Peta perkembangan</p>
              <h2 id="dashboard-path-progress-title" className="font-heading text-xl font-extrabold">Progress jalur belajar</h2>
            </div>
            <Route className="size-6 shrink-0" aria-hidden="true" />
          </div>
          {loading ? (
            <div className="space-y-4" role="status" aria-label="Memuat progress jalur">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-4 w-1/3 rounded bg-pastel-gray/80" />
                  <div className="h-3.5 w-full rounded-full bg-white/80" />
                </div>
              ))}
            </div>
          ) : pathProgressSummaries.length > 0 ? (
            <div className="space-y-4">
              {pathProgressSummaries.map((path, index) => (
                <DashboardProgressBar
                  key={path.id}
                  label={path.title}
                  value={path.progress}
                  colorClass={["bg-pastel-mint", "bg-pastel-blue", "bg-pastel-lavender"][index % 3]}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-brand-border bg-white p-4 text-center">
              <p className="font-heading font-extrabold">Belum ada progress untuk ditampilkan</p>
              <p className="mt-1 text-sm font-semibold text-brand-muted">Mulai satu materi untuk melihat perkembanganmu di sini.</p>
              <NeoButton type="button" variant="primary" size="sm" onClick={() => onNavigate("/learn/paths")} className="mt-4">
                Mulai Belajar
              </NeoButton>
            </div>
          )}
        </NeoCard>

        <NeoCard bgColor="bg-pastel-yellow/35" className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Tantangan berikutnya</p>
                <h2 className="font-heading text-xl font-extrabold">Phishing Sandbox Simulator</h2>
              </div>
              <Target className="size-7 shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-muted">
              Latih refleks pertahanan digital dengan membedakan email resmi dan pesan penipuan dalam lingkungan aman.
            </p>
          </div>
          <div className="flex flex-col gap-3 border-t-2 border-brand-border/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-extrabold text-brand-muted">Latihan praktis tersedia</span>
            <NeoButton type="button" variant="yellow" size="sm" onClick={() => onNavigate("/simulations")} className="w-full sm:w-auto">
              Mulai Simulasi
            </NeoButton>
          </div>
        </NeoCard>
      </section>

      <section
        className="grid min-w-0 gap-6 animate-[fadeIn_540ms_260ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        aria-labelledby="dashboard-achievement-title"
      >
        <NeoCard bgColor="bg-white" className="min-w-0 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Milestone utama</p>
              <h2 id="dashboard-achievement-title" className="font-heading text-xl font-extrabold">Badge pertahananmu</h2>
            </div>
            <NeoBadge bgColor="bg-pastel-lavender">{earnedBadgesCount} dari 4 diraih</NeoBadge>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {[
              ["badge-cyber-defender", "Beginner Master", "bg-pastel-yellow"],
              ["badge-intermediate-defender", "Intermediate Master", "bg-pastel-blue"],
              ["badge-advanced-specialist", "Advanced Master", "bg-pastel-lavender"],
              ["badge-simulation-analyst", "Simulation Defender", "bg-pastel-mint"],
            ].map(([badgeId, label, color]) => {
              const isEarned = earnedBadgeIds.has(badgeId);
              return (
                <div
                  key={badgeId}
                  className={`flex min-w-0 items-center gap-3 rounded-xl border-2 border-brand-border p-3 ${
                    isEarned ? `${color} shadow-[2px_2px_0_0_#111111]` : "bg-brand-surface"
                  }`}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border ${isEarned ? "bg-white" : "bg-pastel-gray"}`} aria-hidden="true">
                    {isEarned ? <Award className="size-5" /> : <Medal className="size-5 text-brand-muted" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words font-heading text-sm font-extrabold">{label}</span>
                    <span className="block text-xs font-bold text-brand-muted">{isEarned ? "Sudah diraih" : "Belum diraih"}</span>
                  </span>
                </div>
              );
            })}
          </div>
          {earnedBadgesCount === 0 && (
            <div className="rounded-xl border-2 border-dashed border-brand-border bg-pastel-lavender/20 p-3 text-sm font-semibold text-brand-muted">
              Selesaikan milestone jalur atau simulasi pertamamu untuk membuka badge.
            </div>
          )}
          <NeoButton type="button" variant="secondary" size="sm" onClick={() => onNavigate("/badges")} className="w-full sm:w-auto">
            Buka Galeri Badge
          </NeoButton>
        </NeoCard>

        <NeoCard bgColor="bg-pastel-peach/40" className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <span className="flex size-11 items-center justify-center rounded-2xl border-2 border-brand-border bg-white shadow-[2px_2px_0_0_#111111]" aria-hidden="true">
              <GraduationCap className="size-6" />
            </span>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-muted">Sertifikasi</p>
            <h2 className="font-heading text-xl font-extrabold">Sertifikat kelulusan siber</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-muted">
              {hasCert
                ? "Sertifikat aktifmu siap ditinjau dan digunakan untuk menunjukkan pencapaian belajar."
                : "Selesaikan materi dan kuis akhir jalur untuk membuka sertifikat digital terverifikasi."}
            </p>
          </div>
          <NeoButton type="button" variant="peach" size="sm" onClick={() => onNavigate("/certificates")} className="w-full">
            {hasCert ? "Tinjau Sertifikat" : "Cek Kelayakan Sertifikat"}
          </NeoButton>
        </NeoCard>
      </section>
    </div>
  );
};

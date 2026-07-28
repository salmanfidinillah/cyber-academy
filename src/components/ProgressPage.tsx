import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, Award, CheckCircle, Clock, Shield, Sparkles, TrendingUp, History, Flame, RefreshCw } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { User, XpTransaction } from "../types";
import {
  getLevelProgressPercent,
  getXpNeededForNextLevel
} from "../lib/learningStore";
import { useUser } from "../contexts/UserContext";
import { fetchCatalogLearningPaths, fetchCatalogCoursesForPath, fetchCatalogLessonsForCourse } from "../services/catalogService";
import {
  fetchMyProgress,
  fetchMyXpTransactions,
  resetMyLearningState
} from "../services/learningStateService";

interface ProgressPageProps {
  currentUser?: User;
  onNavigate: (route: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  currentUser: propUser,
  onNavigate
}) => {
  const { currentUser: contextUser, refreshUserProfile } = useUser();
  const currentUser = contextUser || propUser;
  const userId = currentUser?.uid;

  // 1. DECLARE ALL HOOKS FIRST
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [catalogLessons, setCatalogLessons] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const loadCatalogData = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const paths = await fetchCatalogLearningPaths();
      const coursesNested = await Promise.all(
        (paths || []).map((p) => fetchCatalogCoursesForPath(p.id))
      );
      const loadedCourses = coursesNested.flat();

      const lessonsNested = await Promise.all(
        loadedCourses.map((c) => fetchCatalogLessonsForCourse(c.id))
      );
      const loadedLessons = lessonsNested.flat();

      if (isMountedRef.current) {
        setCatalogCourses(loadedCourses);
        setCatalogLessons(loadedLessons);
      }
    } catch (err: any) {
      console.error("Gagal memuat catalog data pada ProgressPage:", err);
      if (isMountedRef.current) {
        setCatalogError(err.message || "Gagal memuat data katalog dari server.");
        setCatalogCourses([]);
        setCatalogLessons([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingCatalog(false);
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
          console.error("Gagal memuat user progress di ProgressPage:", err);
        });

      fetchMyXpTransactions(20)
        .then((res) => {
          if (isMountedRef.current) setTransactions(res?.transactions || []);
        })
        .catch((err) => {
          console.error("Gagal memuat transaksi XP di ProgressPage:", err);
        });

      loadCatalogData();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [userId, refreshKey, loadCatalogData]);

  // 2. SAFE CONDITIONAL RETURN AFTER HOOKS
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] font-sans">
        <TrendingUp className="w-8 h-8 text-pastel-mint animate-spin mb-2" />
        <p className="text-xs text-brand-muted font-bold">Memuat analisis progres Anda...</p>
      </div>
    );
  }

  const handleBackToDashboard = () => {
    onNavigate("/dashboard");
  };

  const handleResetProgress = async () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang seluruh progres belajar Anda? Seluruh XP, level, dan penyelesaian materi akan dihapus.")) {
      try {
        await resetMyLearningState("RESET_MY_PROGRESS");
        await refreshUserProfile();
        setRefreshKey(prev => prev + 1);
        alert("Progres berhasil disetel ulang!");
        onNavigate("/dashboard");
      } catch (err: any) {
        alert(err.message || "Gagal mereset progres.");
      }
    }
  };

  // Compute calculated metrics
  const totalLessons = catalogLessons.filter(l => l.status === "published" || !l.status).length;
  const completedLessonsCount = catalogLessons.filter((l) => {
    const key = `${currentUser.uid}_lesson_${l.id}`;
    return userProgress[key] && userProgress[key].status === "completed";
  }).length;

  const totalCourses = catalogCourses.length;
  const completedCoursesCount = catalogCourses.filter((c) => {
    const key = `${currentUser.uid}_course_${c.id}`;
    return userProgress[key] && userProgress[key].status === "completed";
  }).length;

  const lessonPercent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  const coursePercent = totalCourses > 0 ? Math.round((completedCoursesCount / totalCourses) * 100) : 0;

  const currentLvl = currentUser.currentLevel || 1;
  const levelProgressPercent = getLevelProgressPercent(currentUser.totalXp || 0);
  const xpNeeded = getXpNeededForNextLevel(currentUser.totalXp || 0);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 animate-fadeIn font-sans text-brand-text">
      
      {/* Page Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-border pb-4">
        <div className="space-y-1">
          <NeoButton variant="secondary" size="sm" onClick={handleBackToDashboard} className="font-bold flex items-center space-x-1.5 mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </NeoButton>
          <h1 className="text-3xl font-heading font-extrabold">Evaluasi & Progres Siber</h1>
          <p className="text-xs text-brand-muted font-bold">Lacak rekam jejak, sejarah transaksi XP, dan pencapaian lencanamu.</p>
        </div>

        <div>
          <NeoButton
            variant="secondary"
            size="sm"
            onClick={handleResetProgress}
            className="text-pastel-red font-bold flex items-center space-x-1.5 text-xs py-2 px-3 border-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Setel Ulang Progres Belajar</span>
          </NeoButton>
        </div>
      </div>

      {/* Catalog Error State Banner */}
      {catalogError && (
        <NeoCard bgColor="bg-pastel-peach/30" className="p-6 text-center space-y-3">
          <h3 className="font-heading font-extrabold text-base text-brand-text">Gagal Memuat Data Katalog</h3>
          <p className="text-xs text-brand-muted font-medium">{catalogError}</p>
          <div className="flex justify-center">
            <NeoButton variant="secondary" size="sm" onClick={loadCatalogData} className="font-bold flex items-center space-x-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi (Retry)</span>
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core level status */}
        <NeoCard bgColor="bg-pastel-yellow" className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Level Ketahanan</span>
              <Award className="w-6 h-6 text-brand-text shrink-0" />
            </div>
            <div className="text-4xl font-heading font-extrabold">Level {currentLvl}</div>
            <p className="text-xs text-brand-text/90 font-semibold leading-relaxed">
              Tingkat kematangan siber defensif Anda saat ini. Setiap 100 XP menaikkan level Anda setingkat lebih aman.
            </p>
          </div>

          <div className="space-y-2 border-t border-brand-border/20 pt-4">
            <div className="flex justify-between text-xs font-bold">
              <span>{currentUser.totalXp} XP Terkumpul</span>
              <span>Sisa {xpNeeded} XP ke Lvl {currentLvl + 1}</span>
            </div>
            <div className="w-full bg-white h-4 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-brand-text rounded-full transition-all duration-300"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
          </div>
        </NeoCard>

        {/* Lesson summary counter */}
        <NeoCard bgColor="bg-pastel-blue" className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Penyelesaian Materi</span>
              <CheckCircle className="w-6 h-6 text-brand-text shrink-0" />
            </div>
            <div className="text-4xl font-heading font-extrabold">{completedLessonsCount} / {totalLessons}</div>
            <p className="text-xs text-brand-text/90 font-semibold leading-relaxed">
              Jumlah unit pelajaran interaktif yang telah kamu baca dan pahami secara defensif dari keseluruhan kurikulum.
            </p>
          </div>

          <div className="space-y-2 border-t border-brand-border/20 pt-4">
            <div className="flex justify-between text-xs font-bold">
              <span>Materi Diselesaikan</span>
              <span>{lessonPercent}%</span>
            </div>
            <div className="w-full bg-white h-4 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-brand-text rounded-full transition-all duration-300"
                style={{ width: `${lessonPercent}%` }}
              />
            </div>
          </div>
        </NeoCard>

        {/* Course completed counter */}
        <NeoCard bgColor="bg-pastel-mint" className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-heading font-extrabold uppercase text-brand-muted tracking-wider">Kelulusan Kelas</span>
              <Shield className="w-6 h-6 text-brand-text shrink-0" />
            </div>
            <div className="text-4xl font-heading font-extrabold">{completedCoursesCount} / {totalCourses}</div>
            <p className="text-xs text-brand-text/90 font-semibold leading-relaxed">
              Misi kelas siber bersertifikasi yang telah sukses diselesaikan dengan kelulusan kuis siber.
            </p>
          </div>

          <div className="space-y-2 border-t border-brand-border/20 pt-4">
            <div className="flex justify-between text-xs font-bold">
              <span>Kelas Dilalui</span>
              <span>{coursePercent}%</span>
            </div>
            <div className="w-full bg-white h-4 border-2 border-brand-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-brand-text rounded-full transition-all duration-300"
                style={{ width: `${coursePercent}%` }}
              />
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Two Column Layout: Achievements and History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Achievements / Badges Showcase */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-brand-border pb-2">
            <Award className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg">Lemari Lencana</h3>
          </div>

          <NeoCard bgColor="bg-white" className="p-5 space-y-4">
            <p className="text-xs text-brand-muted font-bold">
              Lencana otomatis diraih setelah kamu melulusi kelas-kelas siber terkait.
            </p>

            <div className="grid grid-cols-1 gap-3.5">
              <div className="flex items-center space-x-3 bg-pastel-mint/20 border-2 border-brand-border p-3 rounded-2xl">
                <div className="w-12 h-12 bg-pastel-mint rounded-xl border-2 border-brand-border flex items-center justify-center text-2xl shadow-sm rotate-[-2deg]">
                  🛡️
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-text">First Step</h4>
                  <p className="text-[11px] text-brand-muted font-semibold">Telah lulus kelas Fondasi Keamanan Siber.</p>
                </div>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-2xl border-2 ${userProgress[`${currentUser.uid}_course_cyber-passwords`]?.status === "completed" ? "bg-pastel-yellow/20 border-brand-border" : "bg-brand-surface/10 border-brand-border/20 opacity-40"}`}>
                <div className="w-12 h-12 bg-pastel-yellow rounded-xl border-2 border-brand-border flex items-center justify-center text-2xl shadow-sm">
                  🔐
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-text">Key Master</h4>
                  <p className="text-[11px] text-brand-muted font-semibold">Telah lulus kelas Sandi & Keamanan Akun.</p>
                </div>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-2xl border-2 ${userProgress[`${currentUser.uid}_course_cyber-phishing`]?.status === "completed" ? "bg-pastel-blue/20 border-brand-border" : "bg-brand-surface/10 border-brand-border/20 opacity-40"}`}>
                <div className="w-12 h-12 bg-pastel-blue rounded-xl border-2 border-brand-border flex items-center justify-center text-2xl shadow-sm">
                  🎣
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-text">Phish Hunter</h4>
                  <p className="text-[11px] text-brand-muted font-semibold">Telah lulus kuis Phishing & Penipuan.</p>
                </div>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* XP Logs Transaction List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-brand-border pb-2">
            <History className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg">Histori Aktivitas Belajar & XP</h3>
          </div>

          <div className="space-y-3">
            {safeTransactions.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-[24px] border-3 border-dashed border-brand-border/40 font-bold text-brand-muted text-sm">
                Belum ada transaksi belajar terekam. Ayo baca materi pertama Anda!
              </div>
            ) : (
              safeTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="bg-white border-2 border-brand-border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:translate-y-[-1px] transition-all"
                >
                  <div className="flex items-center space-x-3.5 pr-2">
                    <span className="w-9 h-9 rounded-xl bg-pastel-blue/20 border-2 border-brand-border flex items-center justify-center text-lg shadow-sm shrink-0">
                      📝
                    </span>
                    <div>
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-text leading-tight">
                        {tx.reason}
                      </h4>
                      <span className="text-[10px] text-brand-muted font-bold font-mono">
                        ID: {tx.transactionId.substring(0, 8).toUpperCase()} • {new Date(tx.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs sm:text-sm font-heading font-extrabold text-brand-text bg-pastel-mint px-3 py-1 rounded-full border border-brand-border shadow-sm shrink-0">
                    +{tx.amount} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

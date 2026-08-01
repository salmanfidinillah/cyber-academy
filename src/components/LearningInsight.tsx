import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import {
  getAiLearningInsight
} from "../lib/learningStore";
import { fetchMyProgress } from "../services/learningStateService";
import { fetchMyQuizAttempts } from "../services/quizService";
import { authenticatedFetch } from "../services/apiClient";
import { User, LearningInsight } from "../types";
import {
  getLearningInsightErrorView,
  LearningInsightErrorView,
} from "./learningInsightError";

interface LearningInsightPageProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const LearningInsightPage: React.FC<LearningInsightPageProps> = ({
  currentUser,
  onNavigate
}) => {
  const [insight, setInsight] = useState<LearningInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<LearningInsightErrorView | null>(null);

  // Statistics states
  const [stats, setStats] = useState({
    completedLessons: 0,
    averageQuizScore: 0,
    completedSimulations: 0,
    overallProgress: 0
  });

  const loadUserDataAndInsight = async (forceRefresh = false) => {
    setLoading(true);
    setErrorState(null);
    try {
      const [userProgress, userQuizzes, simulationResponse] = await Promise.all([
        fetchMyProgress(),
        fetchMyQuizAttempts(),
        authenticatedFetch("/api/me/simulation-attempts"),
      ]);
      const userSims = await simulationResponse.json();
      if (!simulationResponse.ok) throw new Error(userSims.error || "Gagal mengambil riwayat simulasi.");

      const completedLessons = userProgress.filter((progress) =>
        progress.contentType === "lesson" && progress.status === "completed"
      ).length;
      let totalLessons = 12; // Standard beginner lessons count

      const overallProgress = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

      // Quiz Scores
      const quizScores = userQuizzes.map((q: any) => ({
        courseId: q.courseId,
        score: q.score,
        passed: q.passed,
        incorrectTopics: q.incorrectQuestions?.map((iq: any) => iq.topic || "Konsep Keamanan") || []
      }));

      const averageQuizScore = userQuizzes.length > 0
        ? Math.round(userQuizzes.reduce((acc, curr: any) => acc + curr.score, 0) / userQuizzes.length)
        : 0;

      // Simulations
      const completedSimulations = userSims.length;

      setStats({
        completedLessons,
        averageQuizScore,
        completedSimulations,
        overallProgress
      });

      // 2. Load personalized insight from API
      const result = await getAiLearningInsight(
        currentUser.uid,
        completedLessons,
        quizScores,
        userSims,
        overallProgress,
        forceRefresh
      );

      setInsight(result);
    } catch (err: any) {
      console.error("Gagal memuat learning insight:", err);
      setErrorState(getLearningInsightErrorView(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDataAndInsight();
  }, [currentUser]);

  const handleRecommendationClick = (rec: any) => {
    if (rec.type === "lesson") {
      // Navigate to learning paths or specific course if ID matches courseId:lessonId
      onNavigate("/learn/paths");
    } else if (rec.type === "quiz") {
      onNavigate("/learn/paths");
    } else if (rec.type === "simulation") {
      onNavigate("/simulations");
    } else {
      onNavigate("/dashboard");
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl py-4 font-sans sm:py-8">
      
      {/* Header and Back navigation button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-brand-text">
              AI Learning Insight
            </h1>
            <NeoBadge bgColor="bg-pastel-mint">Personalized</NeoBadge>
          </div>
          <p className="text-xs sm:text-sm text-brand-muted font-bold leading-relaxed">
            Analisis kecerdasan buatan berbasis progres aktivitas belajarmu untuk merekomendasikan strategi pertahanan siber terbaik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NeoButton
            variant="secondary"
            onClick={() => loadUserDataAndInsight(true)}
            disabled={loading}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Perbarui Analisis
          </NeoButton>
          <NeoButton variant="secondary" onClick={() => onNavigate("/dashboard")} className="text-xs py-2 px-3">
            Dashboard
          </NeoButton>
        </div>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-4">
        <NeoCard className="p-4 sm:p-5 flex flex-col gap-1.5 bg-pastel-mint/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold text-brand-muted uppercase">
              Progres Umum
            </span>
            <Award className="w-4 h-4 text-brand-text shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-brand-text">{stats.overallProgress}%</p>
          <div className="w-full bg-brand-border/10 h-2 rounded-full overflow-hidden border border-brand-text mt-1">
            <div className="bg-pastel-mint h-full border-r border-brand-text" style={{ width: `${stats.overallProgress}%` }}></div>
          </div>
        </NeoCard>

        <NeoCard className="p-4 sm:p-5 flex flex-col gap-1.5 bg-pastel-lavender/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold text-brand-muted uppercase">
              Lesson Selesai
            </span>
            <BookOpen className="w-4 h-4 text-brand-text shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-brand-text">{stats.completedLessons}</p>
          <p className="text-[10px] text-brand-muted font-bold">Materi teori dasar siber</p>
        </NeoCard>

        <NeoCard className="p-4 sm:p-5 flex flex-col gap-1.5 bg-pastel-yellow/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold text-brand-muted uppercase">
              Rerata Skor Kuis
            </span>
            <CheckCircle2 className="w-4 h-4 text-brand-text shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-brand-text">{stats.averageQuizScore}</p>
          <p className="text-[10px] text-brand-muted font-bold">Passing score standard: 70</p>
        </NeoCard>

        <NeoCard className="p-4 sm:p-5 flex flex-col gap-1.5 bg-pastel-peach/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold text-brand-muted uppercase">
              Simulasi Berhasil
            </span>
            <ShieldCheck className="w-4 h-4 text-brand-text shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-brand-text">{stats.completedSimulations}</p>
          <p className="text-[10px] text-brand-muted font-bold">Latihan phishing interaktif</p>
        </NeoCard>
      </div>

      {/* Main Analysis and Recommendation Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-brand-text shadow-[4px_4px_0px_#111]">
          <Sparkles className="w-10 h-10 text-pastel-mint animate-spin mb-3" />
          <h3 className="font-heading font-extrabold text-base text-brand-text mb-1">
            Menganalisis Progres Belajar Anda...
          </h3>
          <p className="text-xs text-brand-muted max-w-sm text-center font-bold">
            Mesin analisis AI kami sedang mengompilasi riwayat kuis dan simulasi Anda untuk merumuskan saran belajar terarah.
          </p>
        </div>
      ) : errorState ? (
        <div className="p-6 bg-pastel-peach border-2 border-brand-text rounded-3xl shadow-[4px_4px_0px_#111] text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-12 h-12 text-pastel-red mx-auto" />
          <h3 className="font-heading font-extrabold text-base text-brand-text">{errorState.title}</h3>
          <p className="text-xs text-brand-muted font-bold">
            {errorState.message}
          </p>
          <NeoButton variant="secondary" size="sm" onClick={() => loadUserDataAndInsight()} className="text-xs">
            Coba Lagi
          </NeoButton>
        </div>
      ) : insight ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Summary & Topics Block (2 Columns wide on Desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General AI Summary Card */}
            <NeoCard className="p-6 bg-white flex items-start gap-4">
              <Sparkles className="w-10 h-10 text-pastel-mint shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-base text-brand-text">Analisis Perkembangan Siber Anda</h3>
                <p className="text-sm text-brand-text leading-relaxed font-medium">
                  {insight.summary}
                </p>
              </div>
            </NeoCard>

            {/* Strengths & Weaknesses Split Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Strong Topics List */}
              <NeoCard className="p-5 sm:p-6 bg-white space-y-4">
                <div className="flex items-center gap-2 border-b border-brand-text pb-2.5">
                  <TrendingUp className="w-5 h-5 text-[#10b981]" />
                  <h4 className="font-heading font-extrabold text-sm text-brand-text">Area yang Anda Kuasai</h4>
                </div>
                <div className="space-y-3.5">
                  {insight.strongTopics && insight.strongTopics.length > 0 ? (
                    insight.strongTopics.map((topic, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-xs font-heading font-extrabold text-brand-text">💡 {topic.topic}</p>
                        <p className="text-[11px] text-brand-muted font-bold leading-relaxed pl-4">{topic.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-brand-muted font-bold italic">Selesaikan kuis pertama Anda untuk memetakan kekuatan siber.</p>
                  )}
                </div>
              </NeoCard>

              {/* Improvement Topics List */}
              <NeoCard className="p-5 sm:p-6 bg-white space-y-4">
                <div className="flex items-center gap-2 border-b border-brand-text pb-2.5">
                  <AlertTriangle className="w-5 h-5 text-pastel-peach" />
                  <h4 className="font-heading font-extrabold text-sm text-brand-text">Perlu Peningkatan</h4>
                </div>
                <div className="space-y-3.5">
                  {insight.improvementTopics && insight.improvementTopics.length > 0 ? (
                    insight.improvementTopics.map((topic, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-xs font-heading font-extrabold text-brand-text">⚠️ {topic.topic}</p>
                        <p className="text-[11px] text-brand-muted font-bold leading-relaxed pl-4">{topic.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-brand-muted font-bold italic">Bagus! Belum terdeteksi adanya topik dengan kesulitan kritis.</p>
                  )}
                </div>
              </NeoCard>

            </div>

            {/* Study Tip Card */}
            {insight.studyTip && (
              <NeoCard className="p-5 bg-pastel-yellow/15 flex items-start gap-3.5">
                <Lightbulb className="w-5 h-5 text-pastel-yellow shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-heading font-extrabold text-brand-text uppercase tracking-wide">Tips Belajar Hari Ini</h4>
                  <p className="text-xs text-brand-text font-semibold leading-relaxed">
                    {insight.studyTip}
                  </p>
                </div>
              </NeoCard>
            )}

          </div>

          {/* Actionable Recommendations Sidebar (1 Column wide on Desktop) */}
          <div className="col-span-1 space-y-6">
            <NeoCard className="p-5 sm:p-6 bg-white h-full flex flex-col">
              <div className="flex items-center gap-2 border-b border-brand-text pb-2.5 mb-4">
                <Sparkles className="w-4.5 h-4.5 text-brand-text" />
                <h3 className="font-heading font-extrabold text-sm text-brand-text">Rekomendasi Terarah</h3>
              </div>

              <div className="space-y-3 flex-grow">
                {insight.recommendations && insight.recommendations.length > 0 ? (
                  insight.recommendations.map((rec, idx) => {
                    let typeBadgeColor = "bg-pastel-lavender";
                    let typeText = "Materi";
                    if (rec.type === "quiz") {
                      typeBadgeColor = "bg-pastel-yellow";
                      typeText = "Evaluasi";
                    } else if (rec.type === "simulation") {
                      typeBadgeColor = "bg-pastel-peach";
                      typeText = "Simulasi";
                    }

                    return (
                      <div key={idx} className="p-4 rounded-xl border border-brand-text space-y-2 bg-brand-surface/40">
                        <div className="flex items-center justify-between gap-2">
                          <NeoBadge bgColor={typeBadgeColor} size="sm">
                            {typeText}
                          </NeoBadge>
                        </div>
                        <h4 className="text-xs font-heading font-extrabold text-brand-text leading-tight">
                          {rec.title}
                        </h4>
                        <p className="text-[10px] text-brand-muted font-semibold leading-relaxed">
                          {rec.reason}
                        </p>
                        <button
                          onClick={() => handleRecommendationClick(rec)}
                          className="text-[10px] font-heading font-bold text-brand-text hover:underline flex items-center gap-1 transition-all"
                        >
                          Laksanakan Rekomendasi
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-brand-muted font-bold italic text-center py-12">Belum ada saran rekomendasi.</p>
                )}
              </div>

              {/* Confidence status */}
              {insight.confidence && (
                <div className="mt-4 pt-3 border-t border-brand-text flex items-center justify-between text-xs font-bold text-brand-muted">
                  <span>Tingkat Keyakinan AI:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-heading font-black border border-brand-text ${
                    insight.confidence === "high" ? "bg-pastel-mint text-brand-text" : "bg-pastel-yellow text-brand-text"
                  }`}>
                    {insight.confidence === "high" ? "Sangat Tinggi" : "Sedang"}
                  </span>
                </div>
              )}
            </NeoCard>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 text-brand-muted font-bold">
          Tidak ada data aktivitas pembelajaran untuk meluncurkan analisis.
        </div>
      )}

    </div>
  );
};

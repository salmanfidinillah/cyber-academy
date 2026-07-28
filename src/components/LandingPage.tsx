import React, { useState } from "react";
import { Shield, BookOpen, Bot, Award, Lock as LockIcon, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Sparkles, AlertCircle, HelpCircle, Flame, ExternalLink } from "lucide-react";
import { features, problemsAndSolutions, learningPaths, steps, faqs } from "../data";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import {
  HeroIllustration,
  PhishingSimulationPreviewIllustration,
  AiTutorPreviewIllustration,
  GamificationPreviewIllustration,
  Sparkle
} from "./Illustrations";

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Phishing simulation preview highlights state
  const [activePhishingAlert, setActivePhishingAlert] = useState<string | null>(null);

  // Interactive AI Tutor state
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Halo! Aku AI Tutor keamanan sibermu. Di sini kamu bisa bertanya seputar ancaman digital dengan aman. Coba klik pertanyaan rekomendasi di bawah ini!" }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const mockQuestions = [
    {
      q: "Bagaimana cara membuat kata sandi yang tangguh?",
      a: "Gunakan metode 'passphrase'! Gabungkan 4 kata acak yang mudah kamu ingat tapi sulit ditebak komputer (contoh: 'kucing-tidur-di-genteng-kuning'). Hindari nama panggilan atau tanggal lahir ya!"
    },
    {
      q: "Apa bahaya terbesar Wi-Fi publik gratisan?",
      a: "Wi-Fi publik gratisan berisiko tinggi terkena serangan 'Man-in-the-Middle'. Penyerang bisa menyusup di antara HP-mu dan router untuk menyadap password yang kamu masukkan. Selalu gunakan VPN jika terpaksa!"
    },
    {
      q: "Kenapa pelaku phishing suka mengirim link darurat?",
      a: "Taktik itu disebut 'Urgency' atau manipulasi psikologis. Pelaku memicu kepanikan (seperti ancaman blokir akun) agar kamu terburu-buru mengklik tautan tanpa memeriksa keaslian alamat web terlebih dahulu!"
    }
  ];

  const handleAiQuestionClick = (question: string, answer: string) => {
    if (isAiTyping) return;

    // Add user message
    setAiChatHistory((prev) => [...prev, { sender: "user", text: question }]);
    setIsAiTyping(true);

    // Simulate AI thinking and replying
    setTimeout(() => {
      setAiChatHistory((prev) => [...prev, { sender: "ai", text: answer }]);
      setIsAiTyping(false);
    }, 850000 / 1000000 + 400); // 400ms delay for ultra-snappy natural experience
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="space-y-20 pb-12 font-sans overflow-x-hidden">
      {/* 1. HERO SECTION (TWO-COLUMN WITH MANDATORY ALIGNMENT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* LEFT COLUMN: HERO ILLUSTRATION (Smartphone, Shield, Lock, AI Tutor) - Renders on top in mobile */}
          <div className="md:col-span-5 order-first flex justify-center">
            <HeroIllustration />
          </div>

          {/* RIGHT COLUMN: HEADINGS & CTAs */}
          <div className="md:col-span-7 text-center md:text-left space-y-6">
            <div className="inline-flex items-center space-x-2 bg-pastel-yellow px-3 py-1 rounded-full border-2 border-brand-border shadow-sm rotate-[-1deg]">
              <Sparkles className="w-4 h-4 text-brand-text fill-pastel-yellow" />
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-brand-text">
                Platform Edukasi Cybersecurity Modern #1
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight tracking-tight text-brand-text">
              Belajar Cybersecurity, <br className="hidden sm:inline" />
              <span className="bg-pastel-mint px-2 py-1 rounded-lg border-3 border-brand-border inline-block rotate-[1deg] mt-1">
                Lindungi Dunia Digitalmu
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-brand-muted leading-relaxed font-semibold max-w-xl mx-auto md:mx-0">
              Ubah materi siber yang rumit menjadi petualangan interaktif. Hadapi kuis seru, kuasai simulasi phishing, dan dipandu asisten AI personal tanpa takut bosan. 100% gratis dan ramah pemula!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
              <NeoButton
                variant="mint"
                size="lg"
                onClick={() => onNavigate("/register")}
                className="w-full sm:w-auto"
              >
                Mulai Belajar dengan Google
              </NeoButton>
              <button
                onClick={() => {
                  document.getElementById("paths-sec")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center space-x-1.5 font-heading font-bold text-sm sm:text-base text-brand-text hover:underline"
              >
                <span>Lihat Jalur Belajar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE FEATURE CARDS */}
      <section id="features-sec" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold">Cara Menyenangkan Menguasai Pertahanan Digital</h2>
          <p className="text-sm sm:text-base text-brand-muted font-semibold">
            Tiga pilar utama pembelajaran siber yang disiapkan khusus untuk pelajar, mahasiswa, dan masyarakat umum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((feat) => {
            let iconComponent = <BookOpen className="w-6 h-6" />;
            if (feat.id === "simulasi-ancaman") {
              iconComponent = <Shield className="w-6 h-6" />;
            } else if (feat.id === "ai-tutor") {
              iconComponent = <Bot className="w-6 h-6" />;
            }

            return (
              <NeoCard
                key={feat.id}
                bgColor={feat.bgColor}
                interactive={true}
                className="flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Icon Frame */}
                  <div className="w-12 h-12 bg-white rounded-full neo-border flex items-center justify-center shadow-sm">
                    {iconComponent}
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-brand-muted font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={() => onNavigate(feat.id === "ai-tutor" ? "/ai-tutor" : feat.id === "simulasi-ancaman" ? "/simulations" : "/learn/paths")}
                    className="text-xs font-heading font-bold flex items-center space-x-1 hover:underline"
                  >
                    <span>Coba Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </NeoCard>
            );
          })}
        </div>
      </section>

      {/* 3. PROBLEM & SOLUTION SECTION */}
      <section className="bg-brand-surface border-y-4 border-brand-border py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">Kenapa Cyber Academy AI Berbeda?</h2>
            <p className="text-sm sm:text-base text-brand-muted font-semibold">
              Kami memecahkan masalah metode belajar tradisional dengan pendekatan modern yang ramah pemula.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problemsAndSolutions.map((ps) => (
              <NeoCard key={ps.id} bgColor={ps.bgColor} className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#111111] text-pastel-red flex items-center justify-center font-bold text-xs">
                    ⚠️
                  </div>
                  <h3 className="text-sm sm:text-base font-heading font-bold">Tantangan Umum Belajar Siber</h3>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border-2 border-brand-border">
                  <p className="text-xs sm:text-sm font-semibold text-brand-muted italic leading-relaxed">
                    "{ps.problem}"
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-[#111111] text-pastel-mint flex items-center justify-center font-bold text-xs">
                    💡
                  </div>
                  <h3 className="text-sm sm:text-base font-heading font-bold">Solusi Cyber Academy AI</h3>
                </div>
                <div className="bg-pastel-mint/20 p-4 rounded-xl border-2 border-[#111111]">
                  <p className="text-xs sm:text-sm font-bold text-brand-text leading-relaxed">
                    {ps.solution}
                  </p>
                </div>
              </NeoCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CARA KERJA (HOW IT WORKS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold">Langkah Sederhana Mulai Belajar</h2>
          <p className="text-sm sm:text-base text-brand-muted font-semibold">
            Ikuti 4 langkah terstruktur untuk meningkatkan kewaspadaan siber dan meraih pencapaianmu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.stepNumber} className="relative group">
              <NeoCard bgColor={step.bgColor} className="h-full space-y-4 relative z-10">
                <div className="text-3xl sm:text-4xl font-heading font-bold text-brand-text opacity-40">
                  {step.stepNumber}
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold leading-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-brand-muted font-medium leading-relaxed">
                  {step.description}
                </p>
              </NeoCard>
              {/* Decorative shadow effect */}
              <div className="absolute inset-0 bg-[#111111] rounded-[20px] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. PHISHING SIMULATION PREVIEW (INTERACTIVE PREVIEW) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left: Text detail */}
          <div className="md:col-span-6 space-y-5 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-pastel-peach px-3 py-1 rounded-full border-2 border-brand-border">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider">Simulasi Interaktif</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-text">
              Latih Naluri Keamanan dengan Simulasi Phishing
            </h2>
            <p className="text-sm text-brand-muted font-semibold leading-relaxed">
              Phishing adalah penyebab nomor satu pencurian akun digital. Melalui modul simulasi kami, kamu akan ditantang untuk menguji kecurigaanmu pada email, chat wa palsu, atau web tiruan yang diduplikasi secara aman.
            </p>
            <div className="space-y-2 text-xs font-semibold text-brand-text text-left max-w-md mx-auto md:mx-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Belajar menandai alamat pengirim palsu</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Deteksi taktik manipulasi psikologis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Analisis URL jebakan tanpa risiko komputer rusak</span>
              </div>
            </div>

            <div className="pt-2">
              <NeoButton variant="peach" onClick={() => onNavigate("/simulations")}>
                Coba Simulasi Phishing Lengkap
              </NeoButton>
            </div>
          </div>

          {/* Right: Interactive illustration card */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            {/* Click to analyze instructions */}
            <div className="mb-3 bg-white border-2 border-brand-border px-3 py-1.5 rounded-xl neo-shadow-sm text-xs font-heading font-bold text-brand-text flex items-center space-x-1.5 rotate-[-1deg]">
              <Sparkle />
              <span>Preview Simulasi Email Phishing Pasif</span>
            </div>
            <PhishingSimulationPreviewIllustration />
          </div>
        </div>
      </section>

      {/* 6. AI TUTOR PREVIEW (INTERACTIVE CHAT SIMULATION) */}
      <section className="bg-brand-surface border-y-4 border-brand-border py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* Left: Chat Simulation Interface */}
            <div className="md:col-span-6 flex flex-col items-center justify-center order-last md:order-first">
              <div className="w-full max-w-[480px] bg-[#FFFDF8] neo-border rounded-[20px] neo-shadow p-4 space-y-4">
                {/* Header info */}
                <div className="flex items-center space-x-2 pb-3 border-b-2 border-brand-border">
                  <div className="w-10 h-10 bg-pastel-mint rounded-full border-2 border-brand-border flex items-center justify-center">
                    <Bot className="w-5 h-5 text-brand-text" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm leading-tight">AI Tutor Pembelajaran</h4>
                    <span className="text-[10px] text-brand-muted">Keamanan Siber Defensif</span>
                  </div>
                </div>

                {/* Simulated messages log */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto p-1">
                  {aiChatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex ${chat.sender === "user" ? "justify-end animate-in slide-in-from-right-2" : "justify-start animate-in slide-in-from-left-2"} duration-150`}
                    >
                      <div
                        className={`p-3 rounded-[16px] max-w-[85%] text-xs neo-border ${
                          chat.sender === "user" ? "bg-pastel-blue rounded-tr-none" : "bg-pastel-mint rounded-tl-none"
                        }`}
                      >
                        <p className="font-bold text-[10px] mb-0.5 text-brand-muted">
                          {chat.sender === "user" ? "Kamu" : "AI Tutor"}
                        </p>
                        <p className="font-sans leading-relaxed text-brand-text">{chat.text}</p>
                      </div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="p-3 bg-pastel-mint rounded-[16px] rounded-tl-none text-xs neo-border animate-pulse">
                        <span className="font-bold">AI Tutor sedang mengetik...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mock suggested questions chips */}
                <div className="space-y-1.5 pt-2 border-t border-brand-border">
                  <p className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider">
                    Pilih Pertanyaan Rekomendasi:
                  </p>
                  <div className="flex flex-col space-y-1.5">
                    {mockQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        disabled={isAiTyping}
                        onClick={() => handleAiQuestionClick(q.q, q.a)}
                        className="text-left text-xs bg-white hover:bg-pastel-mint/10 border-2 border-brand-border rounded-lg p-2 font-semibold transition-colors disabled:opacity-50"
                      >
                        💬 {q.q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text Information */}
            <div className="md:col-span-6 space-y-5 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-pastel-mint px-3 py-1 rounded-full border-2 border-brand-border">
                <Bot className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider">Asisten Belajar Cerdas</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-text">
                Pendamping Belajar 24/7 Berbasis AI
              </h2>
              <p className="text-sm text-brand-muted font-semibold leading-relaxed">
                Bingung dengan istilah teknis? Ingin menanyakan studi kasus tertentu? AI Tutor kami dirancang khusus menggunakan model AI canggih untuk memberikan penjelasan yang terarah secara defensif, edukatif, dan bebas dari muatan merusak.
              </p>
              <div className="space-y-2 text-xs font-semibold text-brand-text text-left max-w-md mx-auto md:mx-0">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                  <span>Dapatkan jawaban real-time seputar ancaman siber</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                  <span>Bahasa santai, bersahabat, dan mudah dimengerti</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                  <span>Guardrail keamanan ketat (menolak panduan hack jahat)</span>
                </div>
              </div>

              <div className="pt-2">
                <NeoButton variant="mint" onClick={() => onNavigate("/ai-tutor")}>
                  Mulai Obrolan dengan AI Tutor
                </NeoButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. JALUR BELAJAR (LEARNING PATH PREVIEW) */}
      <section id="paths-sec" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold">Jalur Pembelajaran Terstruktur</h2>
          <p className="text-sm sm:text-base text-brand-muted font-semibold">
            Materi disusun rapi berjenjang berdasarkan tingkat kesulitan untuk memudahkan proses belajarmu.
          </p>
        </div>

        <div className="space-y-12">
          {learningPaths.map((path) => (
            <NeoCard key={path.id} bgColor={path.bgColor} className="space-y-6">
              {/* Path Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-brand-border pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <NeoBadge bgColor={path.level === "Beginner" ? "bg-pastel-mint" : path.level === "Intermediate" ? "bg-pastel-blue" : "bg-pastel-lavender"}>
                      {path.level}
                    </NeoBadge>
                    {path.level !== "Beginner" && (
                      <span className="flex items-center space-x-1 text-xs font-bold text-brand-muted">
                        <LockIcon className="w-3 h-3 text-brand-text" />
                        <span>Terkunci</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-brand-text">
                    {path.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-muted font-medium max-w-2xl">
                    {path.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-brand-border text-center">
                    <div className="text-[10px] font-mono font-bold text-brand-muted leading-none uppercase">KURSUS</div>
                    <div className="text-sm font-heading font-bold mt-0.5">{path.courseCount} Modul</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-brand-border text-center">
                    <div className="text-[10px] font-mono font-bold text-brand-muted leading-none uppercase">DURASI</div>
                    <div className="text-sm font-heading font-bold mt-0.5">{path.durationMinutes} Menit</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-brand-border text-center">
                    <div className="text-[10px] font-mono font-bold text-brand-muted leading-none uppercase">REWARD</div>
                    <div className="text-sm font-heading font-bold text-orange-600 mt-0.5">+{path.xpReward} XP</div>
                  </div>
                </div>
              </div>

              {/* Course list row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {path.courses.map((course, cIdx) => (
                  <div
                    key={cIdx}
                    className={`p-4 bg-white rounded-xl border-2 border-brand-border flex flex-col justify-between h-full relative ${
                      path.level !== "Beginner" ? "opacity-65" : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-heading bg-pastel-gray px-1.5 py-0.5 rounded border border-brand-border font-bold">
                          Modul 0{cIdx + 1}
                        </span>
                        {path.level !== "Beginner" && (
                          <LockIcon className="w-3.5 h-3.5 text-brand-muted" />
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-heading font-bold text-brand-text leading-tight">
                        {course.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed font-medium">
                        {course.description}
                      </p>
                    </div>
                    <div className="border-t border-brand-border/20 pt-3 mt-4 text-[10px] sm:text-xs text-brand-muted font-bold flex items-center justify-between">
                      <span>📖 {course.lessonsCount} Materi Belajar</span>
                      {path.level === "Beginner" && (
                        <span className="text-pastel-mint font-bold uppercase tracking-wider text-[10px] bg-[#111111] px-1.5 py-0.2 rounded">Tersedia</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlock badge info & button */}
              <div className="bg-white/50 p-4 rounded-xl border-2 border-dashed border-brand-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full neo-border flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5 text-[#111111]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Hadiah Lencana Kelulusan:</div>
                    <div className="text-xs font-heading font-bold text-purple-700">{path.badgeName}</div>
                  </div>
                </div>

                <NeoButton
                  variant={path.level === "Beginner" ? "primary" : "secondary"}
                  size="md"
                  onClick={() => onNavigate(path.level === "Beginner" ? "/learn/paths" : "/dashboard")}
                  className={path.level !== "Beginner" ? "cursor-not-allowed" : ""}
                >
                  {path.level === "Beginner" ? "Mulai Belajar Sekarang" : "Buka Setelah Jalur Beginner"}
                </NeoButton>
              </div>
            </NeoCard>
          ))}
        </div>
      </section>

      {/* 8. XP, LEVEL, BADGE, & CERTIFICATE PREVIEW (GAMIFICATION PREVIEW) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left: Gamification graphics representation */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            <div className="mb-3 bg-white border-2 border-brand-border px-3 py-1.5 rounded-xl neo-shadow-sm text-xs font-heading font-bold text-brand-text flex items-center space-x-1.5 rotate-[1deg]">
              <Flame className="w-4 h-4 text-pastel-peach" />
              <span>Preview Sistem Gamifikasi Akun</span>
            </div>
            <GamificationPreviewIllustration />
          </div>

          {/* Right: Text detail */}
          <div className="md:col-span-6 space-y-5 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-pastel-lavender px-3 py-1 rounded-full border-2 border-brand-border">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider">Sistem Gamifikasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-text">
              Kumpulkan Skor XP, Naikkan Level, dan Raih Lencana Keren
            </h2>
            <p className="text-sm text-brand-muted font-semibold leading-relaxed">
              Belajar tidak harus membosankan. Di Cyber Academy AI, setiap aktivitas belajar berharga. Menyelesaikan materi, lulus kuis, atau menyelesaikan tantangan harian akan memberikan poin XP yang menaikkan level akunmu serta membuka badge eksklusif.
            </p>
            <div className="space-y-2 text-xs font-semibold text-brand-text text-left max-w-md mx-auto md:mx-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Naik Level 1 hingga Level 5 secara konsisten</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Buka lencana keren seperti "Phishing Hunter" & "Password Guardian"</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-pastel-mint shrink-0" />
                <span>Bandingkan peringkatmu di Leaderboard mingguan yang sehat</span>
              </div>
            </div>

            <div className="pt-2">
              <NeoButton variant="lavender" onClick={() => onNavigate("/badges")}>
                Lihat Lencana & Progres Profil
              </NeoButton>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section id="faq-sec" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="text-center mb-10 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-sm sm:text-base text-brand-muted font-semibold">
            Jawaban cepat untuk memahami cara kerja, manfaat, serta kepatuhan Cyber Academy AI.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-brand-surface border-3 border-brand-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-heading font-bold text-sm sm:text-base text-brand-text hover:bg-pastel-yellow/20 transition-colors select-none"
                >
                  <div className="flex items-center space-x-3 pr-4">
                    <HelpCircle className="w-5 h-5 text-brand-text shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-brand-muted leading-relaxed font-semibold border-t-2 border-brand-border bg-white animate-in slide-in-from-top-1 duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-pastel-mint neo-border rounded-[24px] neo-shadow-lg p-8 sm:p-12 text-center space-y-6">
          {/* Abstract sparkles inside callout */}
          <div className="absolute top-4 left-6 animate-pulse hidden sm:block">
            <Sparkle />
          </div>
          <div className="absolute bottom-6 right-8 animate-bounce hidden sm:block">
            <Sparkle className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold leading-tight max-w-2xl mx-auto">
            Siap Lindungi Identitas dan Data Pribadimu?
          </h2>

          <p className="text-sm sm:text-base text-brand-text font-bold max-w-xl mx-auto leading-relaxed">
            Bergabunglah sekarang bersama ribuan pelajar, mahasiswa, dan masyarakat umum lainnya yang telah meningkatkan kewaspadaan digital di Cyber Academy AI. Gratis selamanya!
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <NeoButton variant="secondary" size="lg" onClick={() => onNavigate("/register")}>
              Mulai Belajar dengan Google
            </NeoButton>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-sm sm:text-base font-heading font-bold text-brand-text hover:underline"
            >
              Kembali ke Atas ↑
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

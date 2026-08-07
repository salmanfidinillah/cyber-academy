import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle,
  ChevronDown,
  Flame,
  HelpCircle,
  Lock as LockIcon,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { faqs, features, learningPaths, problemsAndSolutions, steps } from "../data";
import { GamificationPreviewIllustration, HeroIllustration, PhishingSimulationPreviewIllustration } from "./Illustrations";
import { NeoBadge } from "./NeoBadge";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import "./LandingPage.css";

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  const supportsViewportReveal = typeof window !== "undefined" && "IntersectionObserver" in window;

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion || !supportsViewportReveal ? false : { opacity: 0, y: 24 }}
      animate={!supportsViewportReveal ? { opacity: 1, y: 0 } : undefined}
      whileInView={supportsViewportReveal ? { opacity: 1, y: 0 } : undefined}
      viewport={supportsViewportReveal ? { once: true, amount: 0.16 } : undefined}
      transition={{ duration: shouldReduceMotion ? 0 : 0.48, delay: shouldReduceMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Halo! Aku AI Tutor keamanan sibermu. Di sini kamu bisa bertanya seputar ancaman digital dengan aman. Coba klik pertanyaan rekomendasi di bawah ini!",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const replyTimerRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    };
  }, []);

  const mockQuestions = [
    {
      q: "Bagaimana cara membuat kata sandi yang tangguh?",
      a: "Gunakan metode 'passphrase'! Gabungkan 4 kata acak yang mudah kamu ingat tapi sulit ditebak komputer (contoh: 'kucing-tidur-di-genteng-kuning'). Hindari nama panggilan atau tanggal lahir ya!",
    },
    {
      q: "Apa bahaya terbesar Wi-Fi publik gratisan?",
      a: "Wi-Fi publik gratisan berisiko tinggi terkena serangan 'Man-in-the-Middle'. Penyerang bisa menyusup di antara HP-mu dan router untuk menyadap password yang kamu masukkan. Selalu gunakan VPN jika terpaksa!",
    },
    {
      q: "Kenapa pelaku phishing suka mengirim link darurat?",
      a: "Taktik itu disebut 'Urgency' atau manipulasi psikologis. Pelaku memicu kepanikan (seperti ancaman blokir akun) agar kamu terburu-buru mengklik tautan tanpa memeriksa keaslian alamat web terlebih dahulu!",
    },
  ];

  const handleAiQuestionClick = (question: string, answer: string) => {
    if (isAiTyping) return;

    setAiChatHistory((previous) => [...previous, { sender: "user", text: question }]);
    setIsAiTyping(true);
    replyTimerRef.current = window.setTimeout(() => {
      setAiChatHistory((previous) => [...previous, { sender: "ai", text: answer }]);
      setIsAiTyping(false);
    }, 400);
  };

  const scrollToPaths = () => {
    document.getElementById("paths-sec")?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const heroItem = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="landing-page overflow-x-clip pb-12 font-sans">
      <section className="landing-hero relative isolate overflow-hidden border-b-4 border-brand-border" aria-labelledby="landing-title">
        <div className="landing-grid-pattern absolute inset-0 -z-20" aria-hidden="true" />
        <motion.div
          className="landing-shape landing-shape-blue"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [0, -8, 0], rotate: [-6, -3, -6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="landing-shape landing-shape-yellow"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [0, 6, 0], rotate: [8, 12, 8] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="mx-auto grid min-h-[min(780px,calc(100svh-76px))] w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <motion.div
            className="relative z-10 text-center lg:col-span-7 lg:text-left"
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } } }}
          >
            <motion.div variants={heroItem} transition={{ duration: 0.42 }}>
              <span className="landing-kicker inline-flex max-w-full items-center gap-2 rounded-full border-2 border-brand-border bg-pastel-yellow px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.08em] shadow-[3px_3px_0_#111111] sm:text-xs">
                <Sparkles className="size-4 shrink-0" aria-hidden="true" />
                Platform Edukasi Cybersecurity Modern #1
              </span>
            </motion.div>

            <motion.h1
              id="landing-title"
              className="mt-6 text-[clamp(2.55rem,8.8vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.045em] text-brand-text"
              variants={heroItem}
              transition={{ duration: 0.48 }}
            >
              Belajar Cybersecurity,
              <span className="landing-title-highlight mt-2 block w-fit max-w-full rounded-2xl border-[3px] border-brand-border bg-pastel-mint px-3 py-2 shadow-[5px_5px_0_#111111] lg:-rotate-1">
                Lindungi Dunia Digitalmu
              </span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-2xl text-sm font-semibold leading-relaxed text-brand-muted sm:text-base lg:mx-0 lg:text-lg"
              variants={heroItem}
              transition={{ duration: 0.48 }}
            >
              Ubah materi siber yang rumit menjadi petualangan interaktif. Hadapi kuis seru, kuasai simulasi phishing, dan dipandu asisten AI personal tanpa takut bosan. 100% gratis dan ramah pemula!
            </motion.p>

            <motion.div
              className="mt-7 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center lg:justify-start"
              variants={heroItem}
              transition={{ duration: 0.48 }}
            >
              <NeoButton variant="mint" size="lg" onClick={() => onNavigate("/register")} className="landing-primary-cta w-full sm:w-auto">
                Mulai Belajar dengan Google
                <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
              </NeoButton>
              <button type="button" onClick={scrollToPaths} className="landing-secondary-cta group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-heading text-sm font-bold text-brand-text sm:text-base">
                Lihat Jalur Belajar
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </motion.div>

            <motion.ul className="mt-7 flex flex-wrap justify-center gap-2.5 text-xs font-bold lg:justify-start" variants={heroItem} transition={{ duration: 0.48 }} aria-label="Keunggulan utama">
              <li className="landing-proof-chip bg-white"><CheckCircle className="size-4 text-emerald-700" aria-hidden="true" />Ramah pemula</li>
              <li className="landing-proof-chip bg-pastel-blue"><Bot className="size-4" aria-hidden="true" />Didukung AI</li>
              <li className="landing-proof-chip bg-pastel-yellow"><Shield className="size-4" aria-hidden="true" />Praktik aman</li>
            </motion.ul>
          </motion.div>

          <motion.div
            className="relative mx-auto flex w-full max-w-[520px] justify-center lg:col-span-5"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.62, delay: shouldReduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-hero-illustration-shell w-full">
              <span
                className="pointer-events-none absolute left-1/2 top-0.5 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap bg-[var(--landing-blue-soft)] px-1 text-[10px] font-bold tracking-[0.06em] sm:top-5 sm:bg-transparent sm:px-0 sm:text-xs"
                aria-hidden="true"
              >
                <Shield className="size-4" /> Belajar • Praktik • Aman
              </span>
              <HeroIllustration />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features-sec" className="landing-section scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="features-title">
        <div className="mx-auto max-w-7xl">
          <Reveal className="landing-section-heading mx-auto max-w-3xl text-center">
            <span className="landing-eyebrow bg-pastel-blue"><BookOpen className="size-4" aria-hidden="true" />Belajar tanpa terasa kaku</span>
            <h2 id="features-title">Cara Menyenangkan Menguasai Pertahanan Digital</h2>
            <p>Tiga pilar utama pembelajaran siber yang disiapkan khusus untuk pelajar, mahasiswa, dan masyarakat umum.</p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.id === "simulasi-ancaman" ? Shield : feature.id === "ai-tutor" ? Bot : BookOpen;
              const route = feature.id === "ai-tutor" ? "/ai-tutor" : feature.id === "simulasi-ancaman" ? "/simulations" : "/learn/paths";
              const backgrounds = ["bg-pastel-blue", "bg-pastel-yellow", "bg-pastel-mint"];

              return (
                <Reveal key={feature.id} delay={index * 0.07} className={index === 2 ? "sm:col-span-2 lg:col-span-1" : ""}>
                  <article className={`landing-feature-card ${backgrounds[index % backgrounds.length]} flex h-full min-w-0 flex-col rounded-[22px] border-[3px] border-brand-border p-6 shadow-[6px_6px_0_#111111]`}>
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-brand-border bg-white shadow-[3px_3px_0_#111111]">
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs font-black opacity-60">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold sm:text-2xl">{feature.title}</h3>
                    <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-brand-muted">{feature.description}</p>
                    <button type="button" onClick={() => onNavigate(route)} className="landing-card-link mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 font-heading text-sm font-bold">
                      Coba Sekarang <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section landing-blue-band border-y-4 border-brand-border px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="difference-title">
        <div className="mx-auto max-w-7xl">
          <Reveal className="landing-section-heading mx-auto max-w-3xl text-center">
            <span className="landing-eyebrow bg-white"><Sparkles className="size-4" aria-hidden="true" />Lebih dekat dengan pemula</span>
            <h2 id="difference-title">Kenapa Cyber Academy AI Berbeda?</h2>
            <p>Kami memecahkan masalah metode belajar tradisional dengan pendekatan modern yang ramah pemula.</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2">
            {problemsAndSolutions.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.08}>
                <article className={`landing-comparison-card ${index === 0 ? "bg-pastel-yellow" : "bg-pastel-lavender"} h-full rounded-[22px] border-[3px] border-brand-border p-5 shadow-[6px_6px_0_#111111] sm:p-6`}>
                  <div className="rounded-xl border-2 border-brand-border bg-white p-4">
                    <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-brand-text text-sm text-pastel-peach" aria-hidden="true">!</span><h3 className="text-base font-bold">Tantangan Umum Belajar Siber</h3></div>
                    <p className="mt-3 text-sm font-semibold italic leading-relaxed text-brand-muted">“{item.problem}”</p>
                  </div>
                  <div className="mx-auto flex h-10 w-10 -my-1 items-center justify-center rounded-full border-2 border-brand-border bg-pastel-mint font-bold" aria-hidden="true">↓</div>
                  <div className="rounded-xl border-2 border-brand-border bg-white p-4">
                    <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-brand-text text-sm text-pastel-mint" aria-hidden="true">✓</span><h3 className="text-base font-bold">Solusi Cyber Academy AI</h3></div>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-brand-text">{item.solution}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="steps-title">
        <div className="mx-auto max-w-7xl">
          <Reveal className="landing-section-heading mx-auto max-w-3xl text-center">
            <span className="landing-eyebrow bg-pastel-mint"><ArrowRight className="size-4" aria-hidden="true" />Mulai dengan langkah kecil</span>
            <h2 id="steps-title">Langkah Sederhana Mulai Belajar</h2>
            <p>Ikuti 4 langkah terstruktur untuk meningkatkan kewaspadaan siber dan meraih pencapaianmu.</p>
          </Reveal>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const colors = ["bg-pastel-mint", "bg-pastel-blue", "bg-pastel-yellow", "bg-pastel-peach"];
              return (
                <Reveal key={step.stepNumber} delay={index * 0.06}>
                  <li className={`landing-step-card ${colors[index % colors.length]} relative h-full rounded-[20px] border-[3px] border-brand-border p-5 shadow-[5px_5px_0_#111111]`}>
                    <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-brand-border bg-white font-heading text-lg font-bold">{step.stepNumber}</span>
                    <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-muted">{step.description}</p>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="landing-section px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="simulation-title">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <div className="text-center lg:text-left">
              <span className="landing-eyebrow bg-pastel-peach"><Shield className="size-4" aria-hidden="true" />Simulasi Interaktif</span>
              <h2 id="simulation-title" className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">Latih Naluri Keamanan dengan Simulasi Phishing</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-brand-muted sm:text-base">Phishing adalah penyebab nomor satu pencurian akun digital. Melalui modul simulasi kami, kamu akan ditantang untuk menguji kecurigaanmu pada email, chat wa palsu, atau web tiruan yang diduplikasi secara aman.</p>
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm font-semibold lg:mx-0">
                {["Belajar menandai alamat pengirim palsu", "Deteksi taktik manipulasi psikologis", "Analisis URL jebakan tanpa risiko komputer rusak"].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />{item}</li>)}
              </ul>
              <NeoButton variant="peach" onClick={() => onNavigate("/simulations")} className="mt-7 w-full sm:w-auto">Coba Simulasi Phishing Lengkap</NeoButton>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={0.08}>
            <div className="landing-preview-frame bg-pastel-blue/60 p-3 sm:p-6">
              <div className="mb-4 flex w-fit max-w-full items-center gap-2 rounded-xl border-2 border-brand-border bg-white px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#111111]"><Sparkles className="size-4 shrink-0" aria-hidden="true" />Preview Simulasi Email Phishing Pasif</div>
              <PhishingSimulationPreviewIllustration />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="landing-section landing-ai-band border-y-4 border-brand-border px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="ai-title">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="order-2 lg:order-1 lg:col-span-7">
            <div className="landing-chat-window mx-auto w-full max-w-[590px] rounded-[22px] border-[3px] border-brand-border bg-white p-4 shadow-[7px_7px_0_#111111] sm:p-5">
              <div className="flex items-center gap-3 border-b-2 border-brand-border pb-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-brand-border bg-pastel-blue"><Bot className="size-6" aria-hidden="true" /></span>
                <div><h3 className="text-sm font-bold sm:text-base">AI Tutor Pembelajaran</h3><p className="text-xs font-semibold text-brand-muted">Keamanan Siber Defensif</p></div>
                <span className="ml-auto hidden items-center gap-1.5 rounded-full border-2 border-brand-border bg-pastel-mint px-2 py-1 text-[10px] font-bold sm:inline-flex"><span className="size-2 rounded-full bg-emerald-700" />ONLINE</span>
              </div>
              <div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
                {aiChatHistory.map((chat, index) => (
                  <motion.div key={`${chat.sender}-${index}`} initial={shouldReduceMotion ? false : { opacity: 0, x: chat.sender === "user" ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl border-2 border-brand-border p-3 text-xs ${chat.sender === "user" ? "rounded-tr-sm bg-pastel-blue" : "rounded-tl-sm bg-pastel-mint"}`}><p className="mb-1 text-[10px] font-bold text-brand-muted">{chat.sender === "user" ? "Kamu" : "AI Tutor"}</p><p className="font-semibold leading-relaxed">{chat.text}</p></div>
                  </motion.div>
                ))}
                {isAiTyping && <div className="flex justify-start"><div className="rounded-2xl rounded-tl-sm border-2 border-brand-border bg-pastel-mint p-3 text-xs font-bold">AI Tutor sedang mengetik<span className="landing-typing-dots" aria-hidden="true">...</span></div></div>}
              </div>
              <div className="mt-4 border-t-2 border-brand-border pt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">Pilih Pertanyaan Rekomendasi:</p>
                <div className="grid gap-2">
                  {mockQuestions.map((question) => <button key={question.q} type="button" disabled={isAiTyping} onClick={() => handleAiQuestionClick(question.q, question.a)} className="landing-question-button min-h-11 rounded-lg border-2 border-brand-border bg-white p-2.5 text-left text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50">💬 {question.q}</button>)}
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2 lg:col-span-5" delay={0.08}>
            <div className="text-center lg:text-left">
              <span className="landing-eyebrow bg-pastel-mint"><Bot className="size-4" aria-hidden="true" />Asisten Belajar Cerdas</span>
              <h2 id="ai-title" className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">Pendamping Belajar 24/7 Berbasis AI</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-brand-muted sm:text-base">Bingung dengan istilah teknis? Ingin menanyakan studi kasus tertentu? AI Tutor kami dirancang khusus menggunakan model AI canggih untuk memberikan penjelasan yang terarah secara defensif, edukatif, dan bebas dari muatan merusak.</p>
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm font-semibold lg:mx-0">
                {["Dapatkan jawaban real-time seputar ancaman siber", "Bahasa santai, bersahabat, dan mudah dimengerti", "Guardrail keamanan ketat (menolak panduan hack jahat)"].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />{item}</li>)}
              </ul>
              <NeoButton variant="mint" onClick={() => onNavigate("/ai-tutor")} className="mt-7 w-full sm:w-auto">Mulai Obrolan dengan AI Tutor</NeoButton>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="paths-sec" className="landing-section scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="paths-title">
        <div className="mx-auto max-w-7xl">
          <Reveal className="landing-section-heading mx-auto max-w-3xl text-center">
            <span className="landing-eyebrow bg-pastel-yellow"><BookOpen className="size-4" aria-hidden="true" />Dari dasar hingga mahir</span>
            <h2 id="paths-title">Jalur Pembelajaran Terstruktur</h2>
            <p>Materi disusun rapi berjenjang berdasarkan tingkat kesulitan untuk memudahkan proses belajarmu.</p>
          </Reveal>
          <div className="mt-10 grid gap-7">
            {learningPaths.map((path, pathIndex) => {
              const pathColors = ["bg-pastel-mint", "bg-pastel-blue", "bg-pastel-lavender"];
              return (
                <Reveal key={path.id} delay={pathIndex * 0.05}>
                  <NeoCard bgColor={pathColors[pathIndex % pathColors.length]} className="landing-path-card space-y-6">
                    <div className="flex flex-col gap-5 border-b-2 border-brand-border pb-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2.5"><NeoBadge bgColor="bg-white">{path.level}</NeoBadge>{path.level !== "Beginner" && <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-muted"><LockIcon className="size-3.5" aria-hidden="true" />Terkunci</span>}</div>
                        <h3 className="mt-3 text-2xl font-bold">{path.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-muted">{path.description}</p>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[["Kursus", `${path.courseCount} Modul`], ["Durasi", `${path.durationMinutes} Menit`], ["Reward", `+${path.xpReward} XP`]].map(([term, value]) => <div key={term} className="min-w-0 rounded-lg border-2 border-brand-border bg-white px-2 py-2 text-center sm:px-3"><dt className="text-[9px] font-bold uppercase tracking-wide text-brand-muted sm:text-[10px]">{term}</dt><dd className="mt-1 break-words font-heading text-xs font-bold sm:text-sm">{value}</dd></div>)}
                      </dl>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {path.courses.map((course, courseIndex) => <article key={course.title} className={`flex h-full flex-col rounded-xl border-2 border-brand-border bg-white p-4 ${path.level !== "Beginner" ? "opacity-70" : ""}`}><div className="flex items-center justify-between"><span className="rounded border border-brand-border bg-pastel-gray px-2 py-0.5 text-[10px] font-bold">Modul {String(courseIndex + 1).padStart(2, "0")}</span>{path.level !== "Beginner" && <LockIcon className="size-4" aria-hidden="true" />}</div><h4 className="mt-3 text-base font-bold leading-tight">{course.title}</h4><p className="mt-2 flex-1 text-xs font-semibold leading-relaxed text-brand-muted">{course.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-brand-border/20 pt-3 text-xs font-bold"><span>📖 {course.lessonsCount} Materi Belajar</span>{path.level === "Beginner" && <span className="rounded bg-brand-text px-2 py-0.5 text-[10px] uppercase tracking-wider text-pastel-mint">Tersedia</span>}</div></article>)}
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-brand-border bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-border bg-white"><Award className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold">Hadiah Lencana Kelulusan:</p><p className="font-heading text-sm font-bold text-purple-800">{path.badgeName}</p></div></div>
                      <NeoButton variant={path.level === "Beginner" ? "primary" : "secondary"} size="md" onClick={() => onNavigate(path.level === "Beginner" ? "/learn/paths" : "/dashboard")} className={`w-full sm:w-auto ${path.level !== "Beginner" ? "cursor-not-allowed" : ""}`}>{path.level === "Beginner" ? "Mulai Belajar Sekarang" : "Buka Setelah Jalur Beginner"}</NeoButton>
                    </div>
                  </NeoCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="gamification-title">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <div className="landing-preview-frame bg-pastel-yellow/60 p-4 sm:p-6"><div className="mb-4 flex w-fit max-w-full items-center gap-2 rounded-xl border-2 border-brand-border bg-white px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#111111]"><Flame className="size-4 text-orange-700" aria-hidden="true" />Preview Sistem Gamifikasi Akun</div><GamificationPreviewIllustration /></div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.08}>
            <div className="text-center lg:text-left">
              <span className="landing-eyebrow bg-pastel-lavender"><Award className="size-4" aria-hidden="true" />Sistem Gamifikasi</span>
              <h2 id="gamification-title" className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">Kumpulkan Skor XP, Naikkan Level, dan Raih Lencana Keren</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-brand-muted sm:text-base">Belajar tidak harus membosankan. Di Cyber Academy AI, setiap aktivitas belajar berharga. Menyelesaikan materi, lulus kuis, atau menyelesaikan tantangan harian akan memberikan poin XP yang menaikkan level akunmu serta membuka badge eksklusif.</p>
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm font-semibold lg:mx-0">
                {["Naik Level 1 hingga Level 5 secara konsisten", "Buka lencana keren seperti “Phishing Hunter” & “Password Guardian”", "Bandingkan peringkatmu di Leaderboard mingguan yang sehat"].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />{item}</li>)}
              </ul>
              <NeoButton variant="lavender" onClick={() => onNavigate("/badges")} className="mt-7 w-full sm:w-auto">Lihat Lencana &amp; Progres Profil</NeoButton>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="faq-sec" className="landing-section landing-faq-band scroll-mt-24 border-y-4 border-brand-border px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="faq-title">
        <div className="mx-auto max-w-4xl">
          <Reveal className="landing-section-heading mx-auto max-w-3xl text-center"><span className="landing-eyebrow bg-pastel-yellow"><HelpCircle className="size-4" aria-hidden="true" />Jawaban cepat</span><h2 id="faq-title">Pertanyaan yang Sering Diajukan</h2><p>Jawaban cepat untuk memahami cara kerja, manfaat, serta kepatuhan Cyber Academy AI.</p></Reveal>
          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return <Reveal key={faq.question} delay={Math.min(index * 0.04, 0.2)}><article className="landing-faq-item overflow-hidden rounded-xl border-[3px] border-brand-border bg-white shadow-[4px_4px_0_#111111]"><h3><button type="button" onClick={() => setActiveFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left font-heading text-sm font-bold sm:px-5 sm:text-base"><span className="flex items-center gap-3"><HelpCircle className="size-5 shrink-0" aria-hidden="true" />{faq.question}</span><ChevronDown className={`size-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" /></button></h3>{isOpen && <motion.div id={`faq-answer-${index}`} initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: shouldReduceMotion ? 0 : 0.2 }} className="border-t-2 border-brand-border bg-pastel-blue/30 px-4 py-4 text-sm font-semibold leading-relaxed text-brand-muted sm:px-5">{faq.answer}</motion.div>}</article></Reveal>;
            })}
          </div>
        </div>
      </section>

      <section className="landing-section px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="final-cta-title">
        <Reveal className="mx-auto max-w-7xl">
          <div className="landing-final-cta relative isolate overflow-hidden rounded-[26px] border-4 border-brand-border bg-pastel-mint px-5 py-10 text-center shadow-[8px_8px_0_#111111] sm:px-10 sm:py-14">
            <div className="absolute -right-10 -top-14 -z-10 size-44 rotate-12 rounded-[36px] border-[3px] border-brand-border bg-pastel-blue" aria-hidden="true" />
            <div className="absolute -bottom-12 -left-10 -z-10 size-36 rounded-full border-[3px] border-brand-border bg-pastel-yellow" aria-hidden="true" />
            <span className="landing-eyebrow bg-white"><Sparkles className="size-4" aria-hidden="true" />Mulai petualanganmu</span>
            <h2 id="final-cta-title" className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Siap Lindungi Identitas dan Data Pribadimu?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-relaxed sm:text-base">Bergabunglah sekarang bersama ribuan pelajar, mahasiswa, dan masyarakat umum lainnya yang telah meningkatkan kewaspadaan digital di Cyber Academy AI. Gratis selamanya!</p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"><NeoButton variant="secondary" size="lg" onClick={() => onNavigate("/register")} className="w-full sm:w-auto">Mulai Belajar dengan Google</NeoButton><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" })} className="landing-secondary-cta min-h-12 rounded-xl px-4 font-heading text-sm font-bold sm:text-base">Kembali ke Atas ↑</button></div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

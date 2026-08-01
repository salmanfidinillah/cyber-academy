import React, { useState } from "react";
import { Sparkles, Compass, Target, Clock, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { NeoBadge } from "./NeoBadge";
import { completeOwnOnboarding } from "../services/userService";
import { User } from "../types";

interface OnboardingProps {
  currentUser: User;
  onOnboardingComplete: (updatedUser: User) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ currentUser, onOnboardingComplete }) => {
  const [step, setStep] = useState(1);
  const [learningGoal, setLearningGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Goal options
  const goals = [
    { id: "protect_self", label: "Melindungi Akun & Data Pribadi", desc: "Belajar mendeteksi phishing, mengamankan sandi, dan menghindari penipuan." },
    { id: "career", label: "Persiapan Karir Profesional", desc: "Mempelajari fundamental teknis untuk menjadi analis keamanan bersertifikat." },
    { id: "academic", label: "Penunjang Akademik & Kompetisi", desc: "Mempersiapkan materi perkuliahan siber atau perlombaan Capture the Flag." },
  ];

  // Skill level options
  const levels = [
    { id: "beginner", label: "Pemula (Zero-to-Hero)", desc: "Sama sekali belum mengerti dunia jaringan atau enkripsi komputer." },
    { id: "intermediate", label: "Menengah (Familiar)", desc: "Mengerti dasar internet tetapi ingin belajar taktik eksploitasi defensif." },
    { id: "advanced", label: "Mahir (Praktisi)", desc: "Sudah mengerti perintah linux dan ingin mendalami audit kerentanan." },
  ];

  // Interests options
  const interests = [
    { id: "password", label: "Keamanan Sandi & MFA" },
    { id: "phishing", label: "Simulasi Phishing" },
    { id: "web_security", label: "Keamanan Web & Database" },
    { id: "malware", label: "Analisis Malware & Ransomware" },
    { id: "network", label: "Penyadapan & Wi-Fi Sniffing" },
    { id: "defense", label: "Proteksi Firewall Defensif" },
  ];

  // Study times
  const times = [
    { id: "5min", label: "Santai (5 Menit / Hari)", desc: "Sempurna untuk konsistensi di sela kesibukan." },
    { id: "15min", label: "Fokus (15 Menit / Hari)", desc: "Kecepatan optimal untuk memahami materi harian." },
    { id: "30min", label: "Intensif (30 Menit / Hari)", desc: "Menguasai keamanan siber dalam waktu singkat." },
  ];

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await completeOwnOnboarding({
        learningGoal: learningGoal || "protect_self",
        skillLevel: skillLevel || "beginner",
        interests: selectedInterests.length > 0 ? selectedInterests : ["password", "phishing"],
        studyTime: studyTime || "15min",
      });
      onOnboardingComplete(updatedUser);
    } catch (err) {
      console.error("Failed to save onboarding options:", err);
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await completeOwnOnboarding({
        learningGoal: "protect_self",
        skillLevel: "beginner",
        interests: ["password", "phishing"],
        studyTime: "15min",
      });
      onOnboardingComplete(updatedUser);
    } catch (err) {
      console.error("Failed to skip onboarding:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Onboarding Header with Progress Indicator */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-[#111111] text-pastel-mint px-2 py-0.5 rounded-lg text-xs font-heading font-bold">
              Langkah {step} dari 5
            </span>
            <span className="text-xs font-heading font-bold text-brand-muted">
              {step === 1 && "Selamat Datang"}
              {step === 2 && "Tujuan Belajar"}
              {step === 3 && "Tingkat Kemampuan"}
              {step === 4 && "Topik Pilihan"}
              {step === 5 && "Komitmen Waktu"}
            </span>
          </div>
          {step < 5 && (
            <button
              onClick={handleSkip}
              disabled={isSaving}
              className="text-xs font-heading font-bold text-brand-muted hover:text-brand-text hover:underline transition-colors focus:outline-none"
            >
              Lewati Onboarding (Gunakan Setelan Standar)
            </button>
          )}
        </div>

        {/* Outer progress bar */}
        <div className="w-full h-4 bg-white border-3 border-brand-border rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-pastel-mint border-r-3 border-brand-border rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <NeoCard bgColor="bg-[#FFFDF8]" shadowSize="lg" className="space-y-6">
        {/* Step 1: Welcome & Overview */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-pastel-mint rounded-2xl border-3 border-brand-border flex items-center justify-center mx-auto shadow-sm rotate-[-3deg]">
                <Sparkles className="w-8 h-8 text-brand-text fill-white animate-spin-slow" />
              </div>
              <h2 className="text-3xl font-heading font-bold tracking-tight text-brand-text">
                Selamat Datang di Cyber Academy AI!
              </h2>
              <p className="text-sm text-brand-muted font-semibold max-w-lg mx-auto leading-relaxed">
                Halo <span className="text-brand-text font-bold">{currentUser.displayName}</span>, mari luangkan waktu 1 menit untuk menyesuaikan rencana pembelajaran keamanan sibermu agar relevan dan efektif!
              </p>
            </div>

            <div className="bg-white border-3 border-brand-border p-4 rounded-2xl space-y-3 neo-shadow-sm">
              <h3 className="font-heading font-bold text-sm text-brand-text">
                Rencana Onboarding Anda:
              </h3>
              <ul className="space-y-2.5 text-xs text-brand-muted font-bold">
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-pastel-yellow border-2 border-brand-border rounded-full flex items-center justify-center text-[10px] text-brand-text font-bold">1</span>
                  <span>Menentukan misi & fokus utama Anda belajar keamanan siber.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-pastel-blue border-2 border-brand-border rounded-full flex items-center justify-center text-[10px] text-brand-text font-bold">2</span>
                  <span>Mendeteksi level kurikulum yang cocok untuk Anda saat ini.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-pastel-mint border-2 border-brand-border rounded-full flex items-center justify-center text-[10px] text-brand-text font-bold">3</span>
                  <span>Membentuk rekomendasi Course Path yang dipersonalisasi AI.</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <NeoButton
                variant="mint"
                size="md"
                onClick={handleNext}
                className="font-bold flex items-center space-x-2"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        )}

        {/* Step 2: Goal Selection */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-brand-text">
                <Target className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-heading font-bold">Misi Pembelajaran Anda</h2>
              </div>
              <p className="text-xs sm:text-sm text-brand-muted font-semibold">
                Apa tujuan paling penting yang ingin Anda capai di platform kami?
              </p>
            </div>

            <div className="space-y-3">
              {goals.map((g) => {
                const isSelected = learningGoal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setLearningGoal(g.id)}
                    className={`w-full text-left p-4 rounded-2xl border-3 transition-all flex items-start space-x-4 select-none outline-none focus-visible:ring-3 focus-visible:ring-black ${
                      isSelected
                        ? "bg-pastel-mint border-brand-border neo-shadow-sm scale-[1.01]"
                        : "bg-white border-brand-border/30 hover:border-brand-border/100"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 border-brand-border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? "bg-white text-[#111111]" : "bg-brand-bg text-transparent"
                    }`}>
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-brand-text">{g.label}</h4>
                      <p className="text-xs text-brand-muted font-semibold mt-1 leading-relaxed">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <NeoButton variant="secondary" size="md" onClick={handlePrev} className="font-bold">
                Kembali
              </NeoButton>
              <NeoButton
                variant="mint"
                size="md"
                onClick={handleNext}
                disabled={!learningGoal}
                className="font-bold flex items-center space-x-2"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        )}

        {/* Step 3: Skill Level */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-brand-text">
                <Compass className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-heading font-bold">Tingkat Kemampuan Anda</h2>
              </div>
              <p className="text-xs sm:text-sm text-brand-muted font-semibold">
                Seberapa jauh pemahaman Anda tentang konsep jaringan atau keamanan komputer saat ini?
              </p>
            </div>

            <div className="space-y-3">
              {levels.map((l) => {
                const isSelected = skillLevel === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setSkillLevel(l.id)}
                    className={`w-full text-left p-4 rounded-2xl border-3 transition-all flex items-start space-x-4 select-none outline-none focus-visible:ring-3 focus-visible:ring-black ${
                      isSelected
                        ? "bg-pastel-blue border-brand-border neo-shadow-sm scale-[1.01]"
                        : "bg-white border-brand-border/30 hover:border-brand-border/100"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 border-brand-border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? "bg-white text-[#111111]" : "bg-brand-bg text-transparent"
                    }`}>
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-brand-text">{l.label}</h4>
                      <p className="text-xs text-brand-muted font-semibold mt-1 leading-relaxed">{l.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <NeoButton variant="secondary" size="md" onClick={handlePrev} className="font-bold">
                Kembali
              </NeoButton>
              <NeoButton
                variant="mint"
                size="md"
                onClick={handleNext}
                disabled={!skillLevel}
                className="font-bold flex items-center space-x-2"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-brand-text">
                <Compass className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-heading font-bold">Topik Menarik Pilihanmu</h2>
              </div>
              <p className="text-xs sm:text-sm text-brand-muted font-semibold">
                Pilih topik cybersecurity yang ingin Anda kuasai terlebih dahulu (Dapat memilih lebih dari satu).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`text-left p-3.5 rounded-xl border-3 transition-all flex items-center space-x-3 select-none outline-none focus-visible:ring-3 focus-visible:ring-black ${
                      isSelected
                        ? "bg-pastel-yellow border-brand-border neo-shadow-sm font-bold"
                        : "bg-white border-brand-border/30 hover:border-brand-border/100"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 border-brand-border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-[#111111] text-white" : "bg-brand-bg text-transparent"
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <span className="font-heading font-bold text-xs sm:text-sm text-brand-text">{interest.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <NeoButton variant="secondary" size="md" onClick={handlePrev} className="font-bold">
                Kembali
              </NeoButton>
              <NeoButton
                variant="mint"
                size="md"
                onClick={handleNext}
                disabled={selectedInterests.length === 0}
                className="font-bold flex items-center space-x-2"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        )}

        {/* Step 5: Daily Commitment & Recommendation Analysis */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-brand-text">
                <Clock className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-heading font-bold">Komitmen Belajar Harian</h2>
              </div>
              <p className="text-xs sm:text-sm text-brand-muted font-semibold">
                Berapa menit waktu yang bersedia Anda investasikan setiap hari untuk belajar di Cyber Academy AI?
              </p>
            </div>

            <div className="space-y-3">
              {times.map((t) => {
                const isSelected = studyTime === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setStudyTime(t.id)}
                    className={`w-full text-left p-4 rounded-2xl border-3 transition-all flex items-start space-x-4 select-none outline-none focus-visible:ring-3 focus-visible:ring-black ${
                      isSelected
                        ? "bg-pastel-mint border-brand-border neo-shadow-sm scale-[1.01]"
                        : "bg-white border-brand-border/30 hover:border-brand-border/100"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 border-brand-border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? "bg-white text-[#111111]" : "bg-brand-bg text-transparent"
                    }`}>
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-brand-text">{t.label}</h4>
                      <p className="text-xs text-brand-muted font-semibold mt-1 leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Simulated Recommendation Display */}
            {studyTime && (
              <div className="bg-pastel-blue/30 border-3 border-brand-border p-4 rounded-2xl space-y-3 animate-slideInUp">
                <div className="flex items-center space-x-2 text-brand-text">
                  <ShieldCheck className="w-5 h-5 text-brand-text" />
                  <h4 className="font-heading font-bold text-sm">
                    Rekomendasi Jalur Belajarmu:
                  </h4>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-heading font-extrabold text-brand-text">
                      Jalur Belajar Pemula (Beginner Cybersecurity Path)
                    </span>
                    <NeoBadge bgColor="bg-pastel-mint">Rekomendasi Utama</NeoBadge>
                  </div>
                  <p className="text-xs text-brand-muted font-semibold leading-relaxed">
                    Berdasarkan skenario pemula Anda, AI kami menyarankan Anda untuk memulai dari dasar keamanan, menguasai cara mengamankan password, lalu menghadapi simulasi phishing!
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <NeoButton variant="secondary" size="md" onClick={handlePrev} disabled={isSaving} className="font-bold">
                Kembali
              </NeoButton>
              <NeoButton
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={!studyTime || isSaving}
                className="font-bold flex items-center space-x-2"
              >
                <span>{isSaving ? "Menyimpan Preferensi..." : "Simpan & Masuk Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        )}
      </NeoCard>
    </div>
  );
};

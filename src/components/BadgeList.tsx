import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { evaluateMyBadges, fetchBadges } from "../services/achievementService";
import { Badge, UserBadge, User } from "../types";
import { 
  Award, Lock, Share2, X, Check, Calendar, ExternalLink, 
  Footprints, Key, Mail, ShieldAlert, Scan, Shield, Trophy
} from "lucide-react";

interface BadgeListProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

const BADGE_ICONS: Record<string, any> = {
  "footprints": Footprints,
  "key": Key,
  "lock": Lock,
  "mail-warning": Mail,
  "shield-check": Shield,
  "scan": Scan,
  "trophy": Trophy,
};

const PASTEL_BG_MAP: Record<string, string> = {
  "badge-cyber-defender": "bg-[#FFE696]",
  "badge-intermediate-defender": "bg-[#B4E0FA]",
  "badge-advanced-specialist": "bg-[#D6C8FF]",
  "badge-simulation-analyst": "bg-[#B4F0D2]",
};

export function BadgeList({ currentUser, onNavigate }: BadgeListProps) {
  const [systemBadges, setSystemBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    setIsEvaluating(true);
    setLoadError("");
    Promise.all([fetchBadges(), evaluateMyBadges()])
      .then(([badges, awards]) => {
        if (!active) return;
        setSystemBadges(badges);
        setUserBadges(awards);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Gagal memuat badge.");
      })
      .finally(() => {
        if (active) setIsEvaluating(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const isUnlocked = (badgeSlug: string) => {
    return userBadges.some(ub => ub.badgeSlug === badgeSlug);
  };

  const getAwardedDetails = (badgeSlug: string) => {
    return userBadges.find(ub => ub.badgeSlug === badgeSlug);
  };

  const handleShare = (badge: Badge) => {
    const shareText = `Saya berhasil meraih lencana "${badge.title}" di Cyber Academy AI! Pelajari keamanan siber defensif bersama AI Tutor secara gratis!`;
    navigator.clipboard.writeText(shareText);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  const filteredBadges = systemBadges.filter(badge => {
    const unlocked = isUnlocked(badge.slug);
    if (filter === "unlocked") return unlocked;
    if (filter === "locked") return !unlocked;
    return true;
  });

  const getIconComponent = (iconName: string, unlocked: boolean) => {
    const IconComp = BADGE_ICONS[iconName] || Award;
    return <IconComp className={`w-8 h-8 ${unlocked ? 'text-black' : 'text-gray-400'}`} />;
  };

  return (
    <div id="badge-list-container" className="max-w-5xl mx-auto px-4 py-8">
      {/* Header section with clean Friendly Pastel Neo-Brutalist Card */}
      <div className="bg-[#B4F0D2] border-3 border-black p-6 md:p-8 rounded-xl shadow-[4px_4px_0px_0px_#000000] mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-black text-[#B4F0D2] font-mono text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">
            Sistem Pencapaian
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mt-3 mb-2">
            Lencana & Pencapaian Anda
          </h1>
          <p className="text-black font-medium max-w-2xl leading-relaxed text-sm md:text-base">
            Empat lencana utama diberikan setelah menuntaskan jalur Beginner, Intermediate, Advanced, dan seluruh simulasi defensif. Semua syarat dievaluasi aman di server tanpa reward ganda.
          </p>
        </div>
        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
          <Trophy className="w-48 h-48 text-black" />
        </div>
      </div>

      {/* Statistics and Filter bar */}
      {loadError && (
        <div className="mb-6 bg-red-100 border-2 border-red-500 p-4 rounded-xl font-bold text-red-700">
          {loadError}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-[#FFFDF8] border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Sertifikasi & Progres</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-2xl">{userBadges.length}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500 font-medium">{systemBadges.length} Lencana Diraih</span>
            </div>
          </div>
          {isEvaluating && (
            <div className="flex items-center gap-2 bg-[#FFE696] border-2 border-black px-2 py-1 rounded text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              Menyinkronkan...
            </div>
          )}
        </div>

        {/* Filter buttons in Neo-Brutalist pill style */}
        <div className="flex gap-2">
          {(["all", "unlocked", "locked"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                filter === type ? "bg-[#FFE696]" : "bg-white"
              }`}
            >
              {type === "all" ? "Semua" : type === "unlocked" ? "Telah Diraih" : "Belum Diraih"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => {
          const unlocked = isUnlocked(badge.slug);
          const bgClass = unlocked ? PASTEL_BG_MAP[badge.badgeId] || "bg-pastel-mint" : "bg-gray-100 opacity-75";
          const details = getAwardedDetails(badge.slug);

          return (
            <motion.div
              key={badge.badgeId}
              layoutId={badge.badgeId}
              onClick={() => setSelectedBadge(badge)}
              className={`border-3 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_#000000] cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-56 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] ${bgClass}`}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000000] transition-transform group-hover:scale-110`}>
                    {getIconComponent(badge.icon, unlocked)}
                  </div>
                  {unlocked ? (
                    <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]">
                      <Check className="w-3 h-3 text-[#B4F0D2]" /> Diraih
                    </span>
                  ) : (
                    <span className="bg-gray-200 border border-gray-400 text-gray-500 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Terkunci
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-black mt-4 group-hover:underline decoration-2">
                  {badge.title}
                </h3>
                <p className="text-xs text-gray-700 font-medium line-clamp-2 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="border-t border-black/10 pt-3 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-600 font-bold uppercase">
                  {badge.category}
                </span>
                <span className="text-[10px] font-bold underline text-black group-hover:text-black/80 flex items-center gap-1">
                  Detail <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="bg-white border-3 border-black rounded-xl p-12 text-center shadow-[4px_4px_0px_0px_#000000] my-8">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2">Tidak Ada Lencana</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {filter === "unlocked" 
              ? "Anda belum meraih lencana. Tuntaskan satu jalur belajar atau keempat simulasi untuk meraih lencana!" 
              : "Semua lencana Anda telah diraih! Selamat!"}
          </p>
          <button 
            onClick={() => onNavigate("/learn/paths")} 
            className="mt-6 bg-[#FFE696] hover:bg-[#ffe082] text-black font-bold border-2 border-black px-4 py-2 rounded shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-sm"
          >
            Mulai Belajar Sekarang
          </button>
        </div>
      )}

      {/* Badge Detail Modal using clean Motion Animation */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={`border-3 border-black w-full max-w-md rounded-2xl shadow-[6px_6px_0px_0px_#000000] p-6 relative overflow-hidden ${
                isUnlocked(selectedBadge.slug) 
                  ? PASTEL_BG_MAP[selectedBadge.badgeId] || "bg-pastel-mint" 
                  : "bg-white"
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 bg-white border-2 border-black p-1.5 rounded-full hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-black" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="p-5 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] mb-4">
                  {getIconComponent(selectedBadge.icon, isUnlocked(selectedBadge.slug))}
                </div>

                <span className="bg-black text-white font-mono text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full mb-2">
                  {selectedBadge.category}
                </span>

                <h2 className="text-2xl font-black text-black tracking-tight mb-2">
                  {selectedBadge.title}
                </h2>

                <p className="text-sm font-medium text-gray-800 leading-relaxed mb-6 max-w-xs">
                  {selectedBadge.description}
                </p>

                {/* Status-specific box */}
                {isUnlocked(selectedBadge.slug) ? (
                  <div className="bg-white border-2 border-black p-4 rounded-xl w-full text-left shadow-[3px_3px_0px_0px_#000000] mb-6">
                    <h4 className="text-xs font-mono font-bold uppercase text-gray-400 mb-2">Informasi Penerbitan</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-black">
                        <Calendar className="w-4 h-4 text-pastel-blue" />
                        <span>Diraih pada: {new Date(getAwardedDetails(selectedBadge.slug)!.awardedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-black">
                        <Check className="w-4 h-4 text-pastel-mint" />
                        <span>Idempotency Key Terverifikasi</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 border-2 border-black p-4 rounded-xl w-full text-left shadow-[3px_3px_0px_0px_#000000] mb-6">
                    <h4 className="text-xs font-mono font-bold uppercase text-gray-400 mb-2">Syarat Kelulusan</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {selectedBadge.slug === "first-step" && "Selesaikan materi pelajaran (lesson) pertama pada jalur belajar manapun."}
                      {selectedBadge.slug === "password-guard" && "Selesaikan 2 materi pelajaran dasar pada kelas 'Password dan Keamanan Akun' serta lulus ujian kuis dengan nilai minimal 70."}
                      {selectedBadge.slug === "phishing-hunter" && "Selesaikan 3 materi pelajaran dasar pada kelas 'Phishing dan Penipuan Digital' serta lulus ujian kuis dengan nilai minimal 70."}
                      {selectedBadge.slug === "privacy-protector" && "Selesaikan 2 materi pelajaran dasar pada kelas 'Privasi dan Data Pribadi' serta lulus ujian kuis dengan nilai minimal 70."}
                      {selectedBadge.slug === "simulation-analyst" && "Selesaikan Simulasi Deteksi Email Phishing dengan memilih klasifikasi yang benar dan minimal 3 indikator ancaman yang tepat."}
                      {selectedBadge.slug === "cyber-defender" && "Selesaikan seluruh kurikulum Beginner Learning Path: seluruh 9 materi pelajaran selesai dan lulus seluruh 4 ujian kuis dengan nilai >= 70."}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 w-full">
                  {isUnlocked(selectedBadge.slug) ? (
                    <button
                      onClick={() => handleShare(selectedBadge)}
                      className="flex-grow bg-white hover:bg-gray-100 text-black font-bold border-2 border-black py-2.5 px-4 rounded shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      {copiedIndex ? "Berhasil Disalin!" : "Bagikan Pencapaian"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedBadge(null);
                        if (selectedBadge.slug === "simulation-analyst") {
                          onNavigate("/simulations");
                        } else {
                          onNavigate("/learn/paths");
                        }
                      }}
                      className="flex-grow bg-[#FFE696] hover:bg-[#ffe082] text-black font-bold border-2 border-black py-2.5 px-4 rounded shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-sm"
                    >
                      {selectedBadge.slug === "simulation-analyst" ? "Kerjakan Simulasi Sekarang" : "Belajar Sekarang"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from "react";

// Sparkle element for neo-brutalist charm
export const Sparkle: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#FFE28A"
    stroke="#111111"
    strokeWidth="2.5"
    className={`w-6 h-6 inline-block ${className}`}
  >
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

// HeroIllustration: Smartphone, Shield, Lock and Cute AI Tutor
export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center p-6">
      {/* Background abstract brutalist circles and squares */}
      <div className="absolute top-8 left-8 w-32 h-32 bg-pastel-lavender neo-border rounded-full -z-10" />
      <div className="absolute bottom-12 right-6 w-28 h-28 bg-pastel-blue neo-border rounded-2xl rotate-12 -z-10" />
      <div className="absolute top-1/2 left-4 w-12 h-12 bg-pastel-yellow neo-border rounded-lg -rotate-45 -z-10" />

      {/* Main smartphone frame */}
      <div className="relative w-[180px] h-[320px] bg-pastel-gray neo-border rounded-[24px] neo-shadow-lg flex flex-col overflow-hidden">
        {/* Notch */}
        <div className="w-24 h-5 bg-[#111111] mx-auto rounded-b-xl flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-pastel-mint" />
        </div>

        {/* Screen content */}
        <div className="flex-1 p-3 flex flex-col justify-between bg-brand-surface m-2 rounded-[16px] neo-border-thin">
          <div className="space-y-2">
            <div className="h-3 bg-pastel-blue rounded-full neo-border-thin w-3/4" />
            <div className="h-3 bg-pastel-mint rounded-full neo-border-thin w-1/2" />
          </div>

          {/* Locked file image inside phone */}
          <div className="my-auto mx-auto w-16 h-16 bg-pastel-peach rounded-xl neo-border flex items-center justify-center">
            <svg className="w-8 h-8 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="h-6 bg-[#111111] rounded-lg flex items-center justify-center">
            <span className="text-[10px] text-pastel-mint font-bold uppercase tracking-wider font-sans">Aman</span>
          </div>
        </div>
      </div>

      {/* Giant Shield (floating over phone) */}
      <div className="absolute -left-2 top-20 w-[140px] h-[160px] bg-pastel-mint neo-border rounded-b-[40px] rounded-t-[10px] neo-shadow-lg flex flex-col items-center justify-center rotate-[-8deg] hover:rotate-0 transition-transform duration-300">
        <svg className="w-16 h-16 text-[#111111] drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-heading font-bold mt-2 text-[#111111] bg-white px-2 py-0.5 rounded-full neo-border-thin">SHIELD</span>
      </div>

      {/* AI Tutor (Cute Robot floating on the right) */}
      <div className="absolute -right-4 bottom-14 w-[130px] bg-pastel-yellow neo-border rounded-[24px] neo-shadow-lg p-3 rotate-[6deg] hover:rotate-0 transition-transform duration-300 flex flex-col items-center">
        {/* Robot head */}
        <div className="w-14 h-12 bg-white neo-border rounded-xl flex items-center justify-center space-x-1.5 relative">
          {/* Antenna */}
          <div className="absolute -top-3 w-1 h-3 bg-[#111111] flex items-center justify-center">
            <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-pastel-peach neo-border-thin" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#111111] animate-pulse" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#111111] animate-pulse" />
        </div>
        {/* Speech bubble */}
        <div className="mt-2 text-[10px] font-heading text-center text-brand-text bg-white border-2 border-brand-border px-1.5 py-0.5 rounded-md leading-tight">
          "Hai! Aku Tutor Keamananmu"
        </div>
      </div>

      {/* Floating Sparkles and Icons around hero */}
      <div className="absolute top-2 right-12 animate-bounce">
        <Sparkle />
      </div>
      <div className="absolute bottom-4 left-16 animate-pulse">
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-pastel-peach stroke-[#111111] stroke-[2.5]">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    </div>
  );
};

// PhishingSimulationPreviewIllustration: Mock email client with caution warnings
export const PhishingSimulationPreviewIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[480px] bg-brand-surface neo-border rounded-[20px] neo-shadow-lg p-4 font-sans text-brand-text">
      {/* Window Controls */}
      <div className="flex items-center space-x-2 pb-3 border-b-2 border-brand-border">
        <div className="w-3.5 h-3.5 rounded-full bg-pastel-red neo-border-thin" />
        <div className="w-3.5 h-3.5 rounded-full bg-pastel-yellow neo-border-thin" />
        <div className="w-3.5 h-3.5 rounded-full bg-pastel-green neo-border-thin" />
        <span className="text-xs font-mono pl-2 text-brand-muted">Email_Scammer.exe</span>
      </div>

      {/* Email metadata header */}
      <div className="py-2 space-y-1.5 text-xs border-b-2 border-brand-border bg-pastel-gray/20 p-2 rounded-lg mt-2">
        <div><span className="font-bold text-brand-muted">Dari:</span> <span className="bg-pastel-red/30 px-1.5 py-0.5 rounded border border-[#111111] text-[11px] font-mono font-bold text-red-700">security@bank-aman-login.xyz</span></div>
        <div><span className="font-bold text-brand-muted">Kepada:</span> nasabah-setia@email.com</div>
        <div><span className="font-bold text-brand-muted">Subjek:</span> <span className="text-red-600 font-bold">⚠️ AKUN ANDA DIBLOKIR - Verifikasi Segera!</span></div>
      </div>

      {/* Email content */}
      <div className="py-4 space-y-3">
        <p className="text-xs font-bold">Nasabah Yth,</p>
        <p className="text-xs leading-relaxed text-brand-muted">
          Kami mendeteksi aktivitas mencurigakan pada rekening Anda. Jika Anda tidak melakukan verifikasi data diri dalam <span className="font-bold text-red-600 underline">2 jam ke depan</span>, seluruh kartu debit dan saldo Anda akan dibekukan secara permanen!
        </p>

        {/* Big Phishing Link Card */}
        <div className="relative p-3 bg-pastel-peach/40 neo-border rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-red-700 font-bold bg-white px-2 py-0.5 rounded border border-[#111111] w-max">LINK PALSU!</div>
            <div className="text-xs font-bold text-blue-700 underline font-mono break-all">http://verifikasi-bank-aman-cepat.com/rekening-block</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-pastel-peach neo-border flex items-center justify-center animate-bounce">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* User Interaction Trigger */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs font-bold bg-pastel-red px-3 py-1 rounded-full neo-border-thin">🚫 Bahasa Mendesak</span>
          <span className="text-xs font-bold bg-pastel-yellow px-3 py-1 rounded-full neo-border-thin">🔗 URL Mencurigakan</span>
          <span className="text-xs font-bold bg-pastel-mint px-3 py-1 rounded-full neo-border-thin">📧 Pengirim Tidak Resmi</span>
        </div>
      </div>

      <div className="bg-pastel-mint p-2.5 rounded-xl neo-border text-xs text-center font-bold">
        🎯 Tepat Sekali! Kamu berhasil menemukan 3 indikator phishing. (+25 XP)
      </div>
    </div>
  );
};

// GamificationPreviewIllustration: XP, Levels, Badge, and Certificate Showcase
export const GamificationPreviewIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[480px] grid grid-cols-2 gap-4 font-sans text-brand-text">
      {/* Top Left: Level & XP Card */}
      <div className="bg-pastel-lavender neo-border rounded-[20px] p-4 neo-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#111111]">GAMIFIED</span>
          <span className="text-xl">🔥</span>
        </div>
        <div>
          <h4 className="text-2xl font-heading font-bold leading-tight">Level 3</h4>
          <p className="text-xs text-brand-muted mt-1">250 / 500 XP untuk naik tingkat</p>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white neo-border-thin h-4 rounded-full overflow-hidden mt-3">
          <div className="bg-pastel-mint h-full border-r-2 border-brand-border rounded-l-full" style={{ width: "50%" }} />
        </div>
      </div>

      {/* Top Right: Badges Cards */}
      <div className="bg-pastel-yellow neo-border rounded-[20px] p-4 neo-shadow flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-heading font-bold">Lencana Terbaru</h4>
          <span className="text-xl">🏆</span>
        </div>
        <div className="flex items-center space-x-2 mt-2 bg-white p-2 rounded-xl border-2 border-brand-border">
          <div className="w-9 h-9 rounded-full bg-pastel-peach neo-border flex items-center justify-center font-bold text-base">🕵️</div>
          <div>
            <div className="text-[11px] font-heading font-bold leading-tight">Phishing Hunter</div>
            <div className="text-[9px] text-brand-muted">Mendeteksi 5 Email Palsu</div>
          </div>
        </div>
        <p className="text-[10px] text-brand-muted mt-2">Dapatkan badge keren lainnya dari setiap kuis!</p>
      </div>

      {/* Bottom Full: Certificate Preview */}
      <div className="col-span-2 bg-pastel-mint/30 neo-border rounded-[20px] p-4 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="text-[10px] font-bold bg-pastel-mint px-2 py-0.5 rounded border border-[#111111] w-max mx-auto sm:mx-0">SERTIFIKAT KELULUSAN</div>
          <h4 className="text-base font-heading font-bold text-brand-text">Jalur Keamanan Siber Dasar</h4>
          <p className="text-xs text-brand-muted">Verifikasi ID unik: <span className="font-mono bg-white px-1 py-0.2 border border-[#111111] text-[10px]">CERT-2026-BEGINNER</span></p>
        </div>
        {/* Mini Certificate graphical placeholder */}
        <div className="relative w-32 h-20 bg-white border-2 border-brand-border rounded-lg p-1.5 flex flex-col justify-between shadow-sm">
          <div className="border border-pastel-yellow p-0.5 flex flex-col justify-between h-full bg-pastel-yellow/5">
            <div className="text-[6px] font-mono font-bold text-center border-b border-[#111111]">CYBER ACADEMY CERTIFICATE</div>
            <div className="text-[5px] text-center my-0.5">Salman Fidinillah</div>
            <div className="flex justify-between items-center text-[4px] font-mono">
              <span>Verified ID: 9x8a</span>
              <div className="w-3.5 h-3.5 bg-brand-text rounded-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

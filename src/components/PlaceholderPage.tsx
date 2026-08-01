import React, { useState } from "react";
import { Lock as LockIcon, Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";

interface PlaceholderProps {
  pageName: string;
  onNavigate: (route: string) => void;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ pageName, onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // Helper to go back home
  const goHome = () => {
    onNavigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMockAction = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Switch cases for various pages
  switch (pageName) {
    case "login":
      return (
        <div className="max-w-md mx-auto my-12 px-4 font-sans">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="lg" className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-pastel-mint rounded-full neo-border mx-auto flex items-center justify-center shadow-sm">
                <LockIcon className="w-6 h-6 text-brand-text" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-brand-text">Masuk Akun</h2>
              <p className="text-xs text-brand-muted">Akses petualangan belajarmu di Cyber Academy AI</p>
            </div>

            {showAlert && (
              <div className="bg-pastel-yellow p-3 rounded-xl border-2 border-brand-border text-xs font-semibold flex items-start space-x-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
                <span>
                  <strong>Status sistem:</strong> Autentikasi Firebase dan penyimpanan Firestore telah aktif.
                </span>
              </div>
            )}

            <form onSubmit={handleMockAction} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-brand-text font-heading text-sm font-bold">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2.5 bg-white neo-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-brand-text font-heading text-sm font-bold">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3 py-2.5 bg-white neo-border rounded-xl text-xs"
                />
              </div>

              <NeoButton type="submit" variant="mint" className="w-full py-3">
                Masuk ke Akun
              </NeoButton>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-2 border-brand-border"></div>
              <span className="flex-shrink mx-3 text-brand-muted text-[10px] uppercase font-mono font-bold">atau</span>
              <div className="flex-grow border-t-2 border-brand-border"></div>
            </div>

            <NeoButton
              onClick={() => {
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 5000);
              }}
              variant="secondary"
              className="w-full py-3 flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-.1.97-.93 2.11v2.54h1.5a11.5 11.5 0 003.57-6.48z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-1.5-2.54c-1.12.75-2.55 1.2-4.43 1.2-3.41 0-6.3-2.3-7.33-5.4H1.17v2.66A12 12 0 0012 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.67 14.35a7.19 7.19 0 010-4.7V6.99H1.17a12 12 0 000 10.02l3.5-2.66z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A12 12 0 001.17 6.99l3.5 2.66c1.03-3.1 3.92-5.4 7.33-5.4z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </NeoButton>

            <p className="text-center text-[11px] text-brand-muted">
              Belum memiliki akun?{" "}
              <button onClick={() => onNavigate("/register")} className="font-bold underline text-brand-text">
                Daftar sekarang
              </button>
            </p>
          </NeoCard>
        </div>
      );

    case "register":
      return (
        <div className="max-w-md mx-auto my-12 px-4 font-sans">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="lg" className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-pastel-yellow rounded-full neo-border mx-auto flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6 text-brand-text" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-brand-text">Daftar Akun Baru</h2>
              <p className="text-xs text-brand-muted">Buat akun belajar gratis pertamamu</p>
            </div>

            {showAlert && (
              <div className="bg-pastel-yellow p-3 rounded-xl border-2 border-brand-border text-xs font-semibold flex items-start space-x-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
                <span>
                  <strong>Status sistem:</strong> Registrasi pengguna dan profil Firestore telah aktif.
                </span>
              </div>
            )}

            <form onSubmit={handleMockAction} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-brand-text font-heading text-sm font-bold">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkapmu"
                  className="w-full px-3 py-2.5 bg-white neo-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-brand-text font-heading text-sm font-bold">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2.5 bg-white neo-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-brand-text font-heading text-sm font-bold">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3 py-2.5 bg-white neo-border rounded-xl text-xs"
                />
              </div>

              <NeoButton type="submit" variant="yellow" className="w-full py-3">
                Buat Akun Sekarang
              </NeoButton>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-2 border-brand-border"></div>
              <span className="flex-shrink mx-3 text-brand-muted text-[10px] uppercase font-mono font-bold">atau</span>
              <div className="flex-grow border-t-2 border-brand-border"></div>
            </div>

            <NeoButton
              onClick={() => {
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 5000);
              }}
              variant="secondary"
              className="w-full py-3 flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-.1.97-.93 2.11v2.54h1.5a11.5 11.5 0 003.57-6.48z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-1.5-2.54c-1.12.75-2.55 1.2-4.43 1.2-3.41 0-6.3-2.3-7.33-5.4H1.17v2.66A12 12 0 0012 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.67 14.35a7.19 7.19 0 010-4.7V6.99H1.17a12 12 0 000 10.02l3.5-2.66z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A12 12 0 001.17 6.99l3.5 2.66c1.03-3.1 3.92-5.4 7.33-5.4z"
                />
              </svg>
              <span>Daftar dengan Google</span>
            </NeoButton>

            <p className="text-center text-[11px] text-brand-muted">
              Sudah punya akun?{" "}
              <button onClick={() => onNavigate("/login")} className="font-bold underline text-brand-text">
                Masuk di sini
              </button>
            </p>
          </NeoCard>
        </div>
      );

    case "privacy":
      return (
        <div className="max-w-3xl mx-auto my-12 px-4 font-sans text-brand-text">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="md" className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Kebijakan Privasi</h1>
            <p className="text-xs font-mono font-bold text-brand-muted">Pembaruan Terakhir: 19 Juli 2026</p>

            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Selamat datang di Cyber Academy AI. Kami sangat menghargai privasi data belajar Anda. Kebijakan Privasi ini menjelaskan jenis data belajar yang kami peroleh dan bagaimana kami menjaganya.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">1. Informasi yang Kami Kumpulkan</h2>
              <p>
                Untuk keperluan progres belajar, kuis, dan simulasi, kami menyimpan nama tampilan, email, data skor XP, pencapaian badge, serta riwayat interaksi AI Tutor Anda di dalam sistem database cloud Firebase kami yang aman.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">2. Integrasi Kecerdasan Buatan (Google Gemini)</h2>
              <p>
                Setiap chat yang Anda kirimkan ke AI Tutor diteruskan melalui API serverless kami ke Google Gemini secara aman. Kami memastikan tidak ada data pribadi sensitif (seperti password) yang dikirimkan ke model AI.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">3. Penghapusan Akun</h2>
              <p>
                Kami memegang teguh prinsip kedaulatan data Anda. Pengguna dapat dengan mudah mengajukan permohonan penghapusan akun beserta seluruh data riwayat progres belajar di menu pengaturan profil kapan saja.
              </p>
            </div>
          </NeoCard>
        </div>
      );

    case "terms":
      return (
        <div className="max-w-3xl mx-auto my-12 px-4 font-sans text-brand-text">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="md" className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Syarat & Ketentuan</h1>
            <p className="text-xs font-mono font-bold text-brand-muted">Pembaruan Terakhir: 19 Juli 2026</p>

            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Harap membaca Syarat & Ketentuan ini dengan saksama sebelum menggunakan platform Cyber Academy AI.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">1. Penggunaan Platform</h2>
              <p>
                Cyber Academy AI adalah platform edukasi keamanan siber defensif. Pengguna dilarang keras menyalahgunakan informasi atau simulasi di platform ini untuk melakukan tindakan ilegal seperti peretasan tanpa izin, serangan siber, atau manipulasi phishing di luar platform edukasi kami.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">2. Pembatasan Penggunaan AI</h2>
              <p>
                Layanan AI Tutor kami disediakan sebagai asisten belajar pribadi. Pengguna dilarang memaksa AI (melalui jailbreak prompt) untuk membagikan kode eksploit, malware, atau membocorkan data sensitif pihak ketiga.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">3. Validitas Sertifikat</h2>
              <p>
                Sertifikat yang diterbitkan oleh Cyber Academy AI adalah sertifikat kelulusan belajar internal guna meningkatkan motivasi, bukan merupakan sertifikat profesi atau lisensi formal dari asosiasi kepatuhan siber.
              </p>
            </div>
          </NeoCard>
        </div>
      );

    default:
      return (
        <div className="max-w-2xl mx-auto my-16 px-4 text-center font-sans">
          <NeoCard bgColor="bg-pastel-blue" shadowSize="lg" className="space-y-6">
            <div className="w-16 h-16 bg-white rounded-full border-3 border-[#111111] mx-auto flex items-center justify-center text-3xl shadow-sm">
              ✨
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brand-text">
                Fase Proyek: Coming Soon!
              </h1>
              <NeoBadge bgColor="bg-pastel-lavender">Halaman {pageName.toUpperCase()}</NeoBadge>
            </div>

            <p className="text-sm sm:text-base text-brand-text leading-relaxed">
              Halaman <strong>"{pageName.toUpperCase()}"</strong> tidak ditemukan. Gunakan navigasi utama untuk kembali ke fitur Cyber Academy.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <NeoButton variant="secondary" onClick={goHome}>
                Kembali ke Landing Page
              </NeoButton>
              <NeoButton variant="primary" onClick={() => onNavigate("/register")}>
                Mulai Belajar dengan Google
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      );
  }
};

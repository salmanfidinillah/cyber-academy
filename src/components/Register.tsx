import React, { useState } from "react";
import { UserPlus, Mail, Lock as LockIcon, User as UserIcon, ShieldAlert, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { registerWithEmail, loginWithGoogle } from "../services/authService";

interface RegisterProps {
  onNavigate: (route: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Silakan lengkapi seluruh kolom input.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Nama tampilan minimal harus terdiri dari 2 karakter.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Format email tidak valid. Harap periksa kembali.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Kata sandi minimal harus 8 karakter dan mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka (misalnya: Password123).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok. Harap periksa kembali.");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await registerWithEmail(name, normalizedEmail, password);
      setSuccess("email-verification");
      setTimeout(() => {
        onNavigate("/verify-email");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan pendaftaran akun.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      const firebaseUser = await loginWithGoogle();
      if (!firebaseUser) {
        // Redirect in progress
        return;
      }
      setSuccess("Berhasil masuk via Google!");
      setTimeout(() => {
        onNavigate("/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google.");
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <button
        onClick={() => onNavigate("/")}
        className="inline-flex items-center space-x-2 text-brand-text hover:text-brand-muted font-heading font-bold text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Beranda</span>
      </button>

      <NeoCard bgColor="bg-[#FFFDF8]" shadowSize="lg" className="space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-pastel-mint rounded-2xl border-3 border-brand-border flex items-center justify-center mx-auto shadow-sm rotate-[3deg]">
            <UserPlus className="w-6 h-6 text-brand-text" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-brand-text">
            Mulai Belajar Siber
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted font-semibold">
            Daftar sekarang dan bangun pertahanan digital tangguhmu secara interaktif!
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start space-x-3 bg-pastel-red p-4 rounded-xl border-3 border-brand-border neo-shadow-sm text-brand-text text-xs sm:text-sm font-semibold animate-shake">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-brand-text" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start space-x-3 bg-pastel-mint p-4 rounded-xl border-3 border-brand-border neo-shadow-sm text-brand-text text-xs sm:text-sm font-semibold">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-brand-text" />
            {success === "email-verification" ? (
              <div className="space-y-2">
                <p className="font-heading font-bold">Periksa email Anda</p>
                <p>Email verifikasi telah dikirim ke alamat email yang Anda daftarkan.</p>
                <p>Silakan periksa Kotak Masuk, Spam, Promosi, atau Semua Email.</p>
                <p>
                  Jika email masuk ke folder Spam, pilih “Bukan spam” agar email berikutnya lebih
                  mudah masuk ke Kotak Masuk.
                </p>
              </div>
            ) : (
              <span>{success}</span>
            )}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
              Nama Lengkap
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                disabled={isSubmitting || isGoogleSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Salman Fidinillah"
                className="w-full pl-10 pr-4 py-2 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
              Alamat Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                disabled={isSubmitting || isGoogleSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-10 pr-4 py-2 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
                Konfirmasi Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi"
                  className="w-full pl-10 pr-4 py-2 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3 pt-1 select-none">
            <input
              id="agree-terms"
              type="checkbox"
              disabled={isSubmitting || isGoogleSubmitting}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 border-3 border-brand-border bg-white text-pastel-mint rounded-lg focus:ring-2 focus:ring-black cursor-pointer transition-all disabled:opacity-50"
            />
            <label htmlFor="agree-terms" className="text-xs text-brand-muted font-bold cursor-pointer">
              Saya menyetujui <span className="text-brand-text underline">Ketentuan Layanan</span> dan <span className="text-brand-text underline">Kebijakan Privasi</span> platform Cyber Academy AI.
            </label>
          </div>

          <NeoButton
            type="submit"
            variant="mint"
            size="md"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full justify-center text-sm font-bold mt-2"
          >
            {isSubmitting ? "Mendaftarkan Akun..." : "Daftar Akun Baru"}
          </NeoButton>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-brand-border"></div>
          </div>
          <span className="relative bg-[#FFFDF8] px-3 font-heading text-xs font-bold text-brand-muted uppercase tracking-wider">
            Atau
          </span>
        </div>

        {/* Google Sign In */}
        <NeoButton
          type="button"
          variant="yellow"
          size="md"
          disabled={isSubmitting || isGoogleSubmitting}
          onClick={handleGoogleRegister}
          className="w-full justify-center text-sm font-bold flex items-center space-x-2 animate-pulse-slow"
        >
          <Sparkles className="w-4 h-4 fill-brand-text" />
          <span>{isGoogleSubmitting ? "Menghubungkan..." : "Daftar cepat dengan Google"}</span>
        </NeoButton>

        {/* Toggle To Login */}
        <p className="text-center text-xs text-brand-muted font-semibold mt-3">
          Sudah memiliki akun?{" "}
          <button
            type="button"
            onClick={() => onNavigate("/login")}
            disabled={isSubmitting || isGoogleSubmitting}
            className="font-heading font-bold text-brand-text hover:underline focus:outline-none"
          >
            Masuk ke Akun
          </button>
        </p>
      </NeoCard>
    </div>
  );
};

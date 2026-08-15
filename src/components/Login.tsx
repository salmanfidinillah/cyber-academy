import React, { useState } from "react";
import { Mail, Lock as LockIcon, ShieldAlert, CheckCircle, ArrowLeft, LogIn, Sparkles } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { loginWithEmail, loginWithGoogle } from "../services/authService";

interface LoginProps {
  onNavigate: (route: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem("disabled_alert") === "true") {
      setError("Akun Anda dinonaktifkan.");
      localStorage.removeItem("disabled_alert");
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Silakan lengkapi seluruh kolom input.");
      return;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    // Quick validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Format email tidak valid. Periksa kembali email Anda.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithEmail(normalizedEmail, password);
      setSuccess("Selamat datang kembali!");
      setTimeout(() => {
        onNavigate("/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa kembali email atau kata sandi Anda.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
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

      <NeoCard bgColor="bg-[#FFFDF8]" shadowSize="lg" className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-pastel-mint rounded-2xl border-3 border-brand-border flex items-center justify-center mx-auto shadow-sm rotate-[-3deg]">
            <LogIn className="w-6 h-6 text-brand-text" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-brand-text">
            Selamat Datang Kembali
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted font-semibold">
            Masuk untuk melanjutkan pembelajaran cybersecurity interaktif Anda.
          </p>
        </div>

        {/* Feedback Alert States */}
        {error && (
          <div className="flex items-start space-x-3 bg-pastel-red p-4 rounded-xl border-3 border-brand-border neo-shadow-sm text-brand-text text-xs sm:text-sm font-semibold animate-shake">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-brand-text" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start space-x-3 bg-pastel-mint p-4 rounded-xl border-3 border-brand-border neo-shadow-sm text-brand-text text-xs sm:text-sm font-semibold">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-brand-text" />
            <span>{success}</span>
          </div>
        )}

        {/* Custom Input Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
              Alamat Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting || isGoogleSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => onNavigate("/forgot-password")}
                disabled={isSubmitting || isGoogleSubmitting}
                className="text-xs font-heading font-bold text-brand-muted hover:text-brand-text hover:underline"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                <LockIcon className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting || isGoogleSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <NeoButton
            type="submit"
            variant="mint"
            size="md"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full justify-center text-sm font-bold"
          >
            {isSubmitting ? "Sedang Memproses..." : "Masuk dengan Email"}
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
          onClick={handleGoogleLogin}
          className="w-full justify-center text-sm font-bold flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 fill-brand-text" />
          <span>{isGoogleSubmitting ? "Menghubungkan..." : "Masuk dengan Google"}</span>
        </NeoButton>

        {/* Toggle To Register */}
        <p className="text-center text-xs text-brand-muted font-semibold mt-4">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={() => onNavigate("/register")}
            disabled={isSubmitting || isGoogleSubmitting}
            className="font-heading font-bold text-brand-text hover:underline focus:outline-none"
          >
            Daftar Sekarang
          </button>
        </p>
      </NeoCard>
    </div>
  );
};

import React, { useState } from "react";
import { Mail, ShieldAlert, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { sendPasswordReset } from "../services/authService";

interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Silakan isi alamat email Anda terlebih dahulu.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Format email tidak valid. Harap periksa kembali.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await sendPasswordReset(normalizedEmail);
      setSuccess("Jika email tersebut terdaftar, tautan reset password telah dikirim.");
      setEmail("");
      setIsSubmitting(false);
    } catch (err: any) {
      // Rule 8: Hide any specific auth error and show generic success message instead
      setSuccess("Jika email tersebut terdaftar, tautan reset password telah dikirim.");
      setEmail("");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <button
        onClick={() => onNavigate("/login")}
        className="inline-flex items-center space-x-2 text-brand-text hover:text-brand-muted font-heading font-bold text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Halaman Masuk</span>
      </button>

      <NeoCard bgColor="bg-[#FFFDF8]" shadowSize="lg" className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-pastel-yellow rounded-2xl border-3 border-brand-border flex items-center justify-center mx-auto shadow-sm rotate-[-3deg]">
            <Send className="w-5 h-5 text-brand-text" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-brand-text">
            Lupa Kata Sandi?
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted font-semibold">
            Masukkan email terdaftar Anda, kami akan mengirimkan tautan pemulihan dengan aman.
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
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-heading font-bold text-brand-text">
              Alamat Email Terdaftar
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border-3 border-brand-border rounded-xl font-sans font-medium text-brand-text text-sm focus:outline-none focus:ring-4 focus:ring-black/10 focus:border-brand-border disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <NeoButton
            type="submit"
            variant="mint"
            size="md"
            disabled={isSubmitting}
            className="w-full justify-center text-sm font-bold"
          >
            {isSubmitting ? "Mengirim Permintaan..." : "Kirim Tautan Atur Ulang"}
          </NeoButton>
        </form>

        <div className="text-center pt-2 border-t-2 border-brand-border">
          <button
            type="button"
            onClick={() => onNavigate("/login")}
            className="text-xs font-heading font-bold text-brand-text hover:underline focus:outline-none"
          >
            Sudah ingat kata sandi Anda? Silakan Masuk
          </button>
        </div>
      </NeoCard>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw, LogOut, AlertCircle } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { resendVerificationEmail, reloadCurrentAuthUser } from "../services/authService";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";

export const VerifyEmailPage: React.FC = () => {
  const { currentUser, logout, refreshUserProfile } = useUser();
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState<number>(0);
  const [sending, setSending] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setCooldown(60);
      setMessage({
        type: "success",
        text: "Email verifikasi baru telah dikirim. Silakan periksa kotak masuk atau folder spam Anda.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Gagal mengirim ulang email verifikasi. Coba beberapa saat lagi.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (verifying) return;
    setVerifying(true);
    setMessage(null);
    try {
      const updatedUser = await reloadCurrentAuthUser();
      if (updatedUser?.emailVerified) {
        setMessage({
          type: "success",
          text: "Email Anda berhasil diverifikasi! Mengalihkan...",
        });
        
        // Update user state globally in the application
        const latestUser = await refreshUserProfile();
        
        // Redirect directly based on onboardingCompleted state
        if (latestUser) {
          if (!latestUser.onboardingCompleted) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          navigate("/onboarding", { replace: true });
        }
      } else {
        setMessage({
          type: "error",
          text: "Email belum terverifikasi. Harap klik tautan verifikasi yang kami kirimkan ke email Anda terlebih dahulu.",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Gagal memperbarui status verifikasi. Coba lagi.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Gagal keluar:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <NeoCard className="p-8 text-center bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mx-auto w-16 h-16 bg-[#FFF2E0] border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Mail className="w-8 h-8 text-[#FF9F1C]" />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight text-black">
            Verifikasi Email Anda
          </h2>
          <p className="text-[#555] text-sm mb-6">
            Kami telah mengirimkan tautan verifikasi email ke alamat:
            <br />
            <strong className="text-black font-semibold break-all text-base block mt-2">
              {currentUser?.email}
            </strong>
          </p>

          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 mb-6 border-2 border-black text-left flex items-start gap-3 rounded ${
                message.type === "success" 
                  ? "bg-[#E6F4EA] text-[#137333]" 
                  : "bg-[#FCE8E6] text-[#C5221F]"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-medium">{message.text}</span>
            </motion.div>
          )}

          <div className="space-y-3 mb-6">
            <NeoButton
              id="btn-verify-check"
              onClick={handleCheckVerification}
              disabled={verifying}
              className="w-full bg-[#3A86FF] hover:bg-[#2563EB] text-white flex items-center justify-center gap-2 border-2 border-black py-3 rounded font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
              Saya Sudah Memverifikasi
            </NeoButton>

            <NeoButton
              id="btn-verify-resend"
              onClick={handleResend}
              disabled={cooldown > 0 || sending}
              variant="secondary"
              className="w-full bg-white hover:bg-gray-50 text-black border-2 border-black py-3 rounded font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldown > 0 
                ? `Kirim Ulang Email (${cooldown}s)` 
                : sending 
                  ? "Mengirim..." 
                  : "Kirim Ulang Email Verifikasi"
              }
            </NeoButton>
          </div>

          <hr className="border-black mb-6" />

          <button
            id="btn-verify-logout"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Ganti Akun)
          </button>
        </NeoCard>
      </motion.div>
    </div>
  );
};

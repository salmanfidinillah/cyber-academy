import React, { useState } from "react";
import { ShieldAlert, RefreshCw, LogOut } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";

interface AuthProfileErrorStateProps {
  error: string;
  onRetry: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AuthProfileErrorState: React.FC<AuthProfileErrorStateProps> = ({
  error,
  onRetry,
  onLogout,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error("Manual retry failed:", err);
    } finally {
      setRetrying(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } catch (err) {
      console.error("Manual logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFFDF8] px-4 py-8">
      <div className="max-w-md w-full">
        <NeoCard bgColor="bg-[#FFFDF8]" shadowSize="lg" className="space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-pastel-red rounded-2xl border-3 border-brand-border flex items-center justify-center mx-auto shadow-sm rotate-[-3deg]">
              <ShieldAlert className="w-8 h-8 text-brand-text" />
            </div>
            <h2 className="text-2xl font-heading font-bold tracking-tight text-brand-text">
              Gagal Menyinkronkan Sesi
            </h2>
            <p className="text-sm text-brand-muted font-semibold">
              Terjadi masalah saat memproses profil keamanan Anda. Silakan coba memulihkan profil atau keluar.
            </p>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-xl border-3 border-brand-border neo-shadow-sm text-brand-text text-sm font-semibold">
            <span className="block text-xs uppercase text-brand-muted mb-1 font-heading font-bold">Pesan Kesalahan:</span>
            <div className="font-mono text-xs bg-red-50/50 p-2 rounded-lg border border-dashed border-red-200 break-words max-h-36 overflow-y-auto">
              {error}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <NeoButton
              onClick={handleRetry}
              disabled={retrying || loggingOut}
              variant="mint"
              className="w-full font-bold font-heading flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              <span>{retrying ? "Mencoba..." : "Coba Lagi"}</span>
            </NeoButton>

            <NeoButton
              onClick={handleLogout}
              disabled={retrying || loggingOut}
              variant="peach"
              className="w-full font-bold font-heading flex items-center justify-center space-x-2"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? "animate-pulse" : ""}`} />
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </NeoButton>
          </div>
        </NeoCard>
      </div>
    </div>
  );
};

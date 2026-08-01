import React, { useState } from "react";
import { User } from "../types";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { Mail, Shield, AlertCircle, Save, Loader2 } from "lucide-react";
import { updateAccountEmail } from "../services/authService";

interface SettingsAccountProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const SettingsAccount: React.FC<SettingsAccountProps> = ({ currentUser, onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReauth, setShowReauth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const provider = currentUser.providerIds?.[0] || "password";
  const isGoogleProvider = provider === "google.com";

  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      setError("Alamat email baru sama dengan email saat ini.");
      return;
    }
    
    setError(null);
    setShowReauth(true);
  };

  const handleReauthAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Kata sandi diperlukan untuk otentikasi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateAccountEmail(email, password);
      setSuccess("Email berhasil diperbarui. Silakan periksa inbox Anda untuk verifikasi.");
      setShowReauth(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memperbarui email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Pengaturan Akun</h1>
        <p className="text-gray-600">Kelola email dan metode login Anda.</p>
      </div>

      <NeoCard className="p-6">
        <div className="space-y-6">
          
          <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="font-bold text-gray-700 mb-1 text-sm uppercase tracking-wider">Email Saat Ini</h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{currentUser.email}</span>
              {currentUser.emailVerified ? (
                <span className="px-2 py-1 bg-pastel-mint text-xs font-bold neo-border rounded">Terverifikasi</span>
              ) : (
                <span className="px-2 py-1 bg-pastel-yellow text-xs font-bold neo-border rounded">Belum Verifikasi</span>
              )}
            </div>
            
            <h3 className="font-bold text-gray-700 mt-4 mb-1 text-sm uppercase tracking-wider">Metode Masuk</h3>
            <div className="flex items-center">
              <span className="px-3 py-1 bg-white text-sm font-bold neo-border rounded flex items-center">
                {isGoogleProvider ? "Google" : "Email & Password"}
              </span>
            </div>
          </div>

          {isGoogleProvider ? (
            <div className="p-4 bg-pastel-blue/20 text-blue-900 rounded-xl border-2 border-pastel-blue flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Akun Terhubung dengan Google</p>
                <p className="text-sm mt-1">Anda masuk menggunakan layanan Google. Perubahan alamat email dan kata sandi utama harus dilakukan melalui pengaturan akun Google Anda.</p>
              </div>
            </div>
          ) : (
            <div className="border-t-2 border-dashed border-gray-200 pt-6">
              <h3 className="font-bold text-lg mb-4">Ubah Alamat Email</h3>
              
              {error && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-500 font-bold text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg border-2 border-green-500 font-bold text-sm">
                  {success}
                </div>
              )}

              {!showReauth ? (
                <form onSubmit={handleRequestEmailChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Baru</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none"
                      placeholder="Masukkan email baru"
                    />
                  </div>
                  <NeoButton type="submit" variant="primary">
                    Lanjutkan
                  </NeoButton>
                </form>
              ) : (
                <form onSubmit={handleReauthAndSave} className="space-y-4 p-4 bg-pastel-yellow/30 rounded-xl border-2 border-pastel-yellow">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">Verifikasi Keamanan</span>
                  </div>
                  <p className="text-sm text-yellow-800 mb-4">Masukkan kata sandi Anda saat ini untuk mengonfirmasi perubahan email.</p>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi Saat Ini</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-yellow outline-none bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <NeoButton type="button" variant="secondary" onClick={() => setShowReauth(false)} disabled={isSubmitting}>
                      Batal
                    </NeoButton>
                    <NeoButton type="submit" variant="primary" disabled={isSubmitting} className="flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Konfirmasi Perubahan</span>
                    </NeoButton>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </NeoCard>
    </div>
  );
};

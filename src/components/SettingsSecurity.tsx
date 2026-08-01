import React, { useState } from "react";
import { User } from "../types";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { Shield, Save, Loader2, AlertCircle } from "lucide-react";
import { updateAccountPassword } from "../services/authService";

interface SettingsSecurityProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const SettingsSecurity: React.FC<SettingsSecurityProps> = ({ currentUser, onNavigate }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const provider = currentUser.providerIds?.[0] || "password";
  const isGoogleProvider = provider === "google.com";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!currentPassword) {
      setError("Masukkan kata sandi saat ini.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Kata sandi baru harus minimal 8 karakter, mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka (misalnya: Password123).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Kata sandi baru harus berbeda dengan kata sandi lama.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAccountPassword(currentPassword, newPassword);
      setSuccess("Kata sandi berhasil diperbarui.");
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memperbarui kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Keamanan</h1>
        <p className="text-gray-600">Perbarui kata sandi dan amankan akun Anda.</p>
      </div>

      <NeoCard className="p-6">
        {isGoogleProvider ? (
          <div className="p-4 bg-pastel-blue/20 text-blue-900 rounded-xl border-2 border-pastel-blue flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akun Terhubung dengan Google</p>
              <p className="text-sm mt-1">Anda masuk menggunakan layanan Google. Keamanan kata sandi dikelola langsung melalui akun Google Anda.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-2 text-gray-800 mb-4 border-b-2 border-dashed border-gray-200 pb-4">
              <Shield className="w-6 h-6 text-pastel-red" />
              <h3 className="font-bold text-lg">Ubah Kata Sandi</h3>
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg border-2 border-red-500 font-bold text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg border-2 border-green-500 font-bold text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi Saat Ini</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi Baru</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none"
                placeholder="••••••••"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500 mt-1 font-bold">Minimal 8 karakter</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Kata Sandi Baru</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none"
                placeholder="••••••••"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 font-bold">Kata sandi tidak cocok</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t-2 border-dashed border-gray-200">
              <NeoButton 
                type="button" 
                variant="secondary" 
                onClick={() => onNavigate("/settings")}
                disabled={isSubmitting}
              >
                Batal
              </NeoButton>
              <NeoButton 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting}
                className="flex-1 justify-center flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Kata Sandi</span>
              </NeoButton>
            </div>
          </form>
        )}
      </NeoCard>
    </div>
  );
};

import React, { useState, useRef } from "react";
import { User } from "../types";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { Camera, Save, Loader2 } from "lucide-react";
import { updateOwnUserProfile, uploadCurrentUserAvatar } from "../services/userService";

interface SettingsProfileProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const SettingsProfile: React.FC<SettingsProfileProps> = ({ currentUser, onNavigate }) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Hanya file JPG, PNG, atau WEBP yang diizinkan.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Hanya file JPG, PNG, atau WEBP yang diizinkan.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError("Nama pengguna minimal 2 karakter.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let newPhotoUrl = currentUser.photoURL;
      
      if (avatarFile) {
        newPhotoUrl = await uploadCurrentUserAvatar(avatarFile);
      }

      await updateOwnUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: newPhotoUrl,
      });

      setSuccess("Profil berhasil diperbarui.");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Edit Profil</h1>
        <p className="text-gray-600">Sesuaikan informasi publik Anda.</p>
      </div>

      <NeoCard className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg border-2 border-red-500 font-bold text-sm animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg border-2 border-green-500 font-bold text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Foto Profil (Bisa Drag & Drop Gambar Di Sini)</label>
            <div className="flex items-center space-x-4">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group p-1.5 rounded-2xl border-3 border-dashed transition-all ${
                  isDragging 
                    ? "border-brand-border bg-pastel-mint scale-[1.03] neo-shadow-sm" 
                    : "border-brand-border/30 bg-[#FFFDF8]"
                }`}
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                  <img 
                    src={avatarPreview || currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.displayName}`} 
                    alt="Profile Preview" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-xl object-cover bg-white"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div>
                <NeoButton type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                  Pilih Foto
                </NeoButton>
                <p className="text-xs text-gray-500 mt-2">Dukung Drag & Drop. JPG, PNG atau WEBP. Maksimal 2MB.</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pengguna</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none"
              placeholder="Nama lengkap atau panggilan Anda"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Bio Singkat</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl neo-border focus:ring-4 focus:ring-pastel-mint outline-none min-h-[100px]"
              placeholder="Ceritakan sedikit tentang diri Anda..."
              maxLength={150}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {bio.length}/150 karakter
            </div>
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
              <span>Simpan Perubahan</span>
            </NeoButton>
          </div>
        </form>
      </NeoCard>
    </div>
  );
};

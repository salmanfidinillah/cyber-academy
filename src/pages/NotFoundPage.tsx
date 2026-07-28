import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Home, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useUser } from "../contexts/UserContext";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-pastel-peach/30 border-4 border-black rounded-3xl p-8 neo-shadow-md bg-white">
        <div className="w-20 h-20 bg-pastel-peach border-4 border-black rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:rotate-3 transition-transform">
          <AlertCircle className="w-12 h-12 text-black" />
        </div>
        
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-black mb-2 tracking-tight">404</h1>
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        
        <p className="font-sans text-sm sm:text-base text-gray-600 mb-8 leading-relaxed font-semibold">
          Maaf, halaman yang Anda cari tidak ada, telah dihapus, atau sedang dalam pemeliharaan sistem Cyber Academy AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-black rounded-xl font-bold text-sm text-black neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow-md active:translate-y-0 active:neo-shadow-sm transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          {currentUser ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-pastel-mint border-2 border-black rounded-xl font-bold text-sm text-black neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow-md active:translate-y-0 active:neo-shadow-sm transition-all duration-150 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Saya</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-pastel-mint border-2 border-black rounded-xl font-bold text-sm text-black neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow-md active:translate-y-0 active:neo-shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali Ke Beranda</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

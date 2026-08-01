import React, { useState } from "react";
import { Menu, X, Shield, LogIn, LogOut } from "lucide-react";
import { NeoButton } from "./NeoButton";
import { User } from "../types";

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  currentUser = null,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Beranda", id: "home" },
    { label: "Fitur", id: "features-sec" },
    { label: "Jalur Belajar", id: "paths-sec" },
    { label: "FAQ", id: "faq-sec" }
  ];

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    if (id === "home") {
      onNavigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onNavigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFDF8] border-b-4 border-brand-border py-3 sm:py-4 px-4 sm:px-6">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3">
        {/* Logo / Branding */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex min-w-0 items-center gap-2.5 cursor-pointer select-none bg-pastel-mint px-3 py-1.5 rounded-xl neo-border neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow-md transition-all duration-150 sm:px-3.5"
        >
          <div className="w-7 h-7 bg-white rounded-full border-2 border-brand-border flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand-text fill-pastel-mint" />
          </div>
          <span className="min-w-0 truncate font-heading text-sm font-bold tracking-tight min-[360px]:text-base sm:text-lg">
            Cyber Academy <span className="ml-1 rounded bg-[#111111] px-1.5 py-0.2 text-xs text-pastel-mint">AI</span>
          </span>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="font-heading text-sm font-bold text-brand-text hover:text-brand-muted transition-colors px-2 py-1 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111111] hover:after:w-full after:transition-all after:duration-200"
            >
              {item.label}
            </button>
          ))}
          {currentUser && (
            <button
              onClick={() => onNavigate("/dashboard")}
              className={`font-heading text-sm font-bold transition-colors px-2 py-1 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111111] hover:after:w-full after:transition-all after:duration-200 ${
                currentRoute === "/dashboard" ? "text-pastel-mint bg-[#111111] px-2.5 py-1 rounded" : "text-brand-text hover:text-brand-muted"
              }`}
            >
              Dashboard
            </button>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate("/dashboard")}
                className="flex items-center space-x-2.5 cursor-pointer bg-[#FFFDF8] border-3 border-brand-border py-1 px-3.5 rounded-xl neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow-md transition-all duration-150 active:translate-y-0 active:neo-shadow-sm select-none"
              >
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-md border border-brand-border flex-shrink-0 bg-white"
                />
                <span className="font-heading font-extrabold text-xs sm:text-sm text-brand-text">
                  {currentUser.displayName.split(" ")[0]}
                </span>
              </button>
              
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={onLogout}
                className="font-bold flex items-center space-x-1.5 text-pastel-red"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </NeoButton>
            </div>
          ) : (
            <>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => onNavigate("/login")}
                className="flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </NeoButton>
              <NeoButton
                variant="primary"
                size="sm"
                onClick={() => onNavigate("/register")}
              >
                Mulai Belajar dengan Google
              </NeoButton>
            </>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-[#FFFDF8] neo-border rounded-lg neo-shadow-sm text-brand-text active:translate-y-[2px] active:neo-shadow-none transition-all duration-100"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-[100%] max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b-4 border-brand-border bg-[#FFFDF8] p-4 animate-in fade-in slide-in-from-top-4 duration-200 md:hidden sm:p-5">
          <div className="flex flex-col space-y-4">
            {/* Links list */}
            <div className="flex flex-col space-y-2 border-b-2 border-brand-border pb-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="w-full text-left py-2 px-3 font-heading font-bold text-base text-brand-text hover:bg-brand-bg rounded-lg border border-transparent hover:border-[#111111] transition-all"
                >
                  {item.label}
                </button>
              ))}
              {currentUser && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate("/dashboard");
                  }}
                  className="w-full text-left py-2 px-3 font-heading font-extrabold text-base text-pastel-mint bg-[#111111] rounded-lg border-2 border-brand-border transition-all"
                >
                  Dashboard Saya
                </button>
              )}
            </div>

            {/* Actions list */}
            <div className="flex flex-col space-y-3 pt-1">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex min-w-0 items-center gap-3 bg-white border-2 border-brand-border p-3 rounded-xl neo-shadow-sm">
                    <img
                      src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                      alt={currentUser.displayName}
                      className="w-10 h-10 rounded-lg border border-brand-border bg-white"
                    />
                    <div className="min-w-0">
                      <h4 className="break-words font-heading text-sm font-bold text-brand-text [overflow-wrap:anywhere]">{currentUser.displayName}</h4>
                      <p className="break-all text-xs font-semibold text-brand-muted">{currentUser.email}</p>
                    </div>
                  </div>
                  <NeoButton
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full justify-center font-bold text-pastel-red"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar dari Akun
                  </NeoButton>
                </div>
              ) : (
                <>
                  <NeoButton
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate("/login");
                    }}
                    className="w-full justify-center"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk ke Akun
                  </NeoButton>
                  <NeoButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate("/register");
                    }}
                    className="w-full justify-center"
                  >
                    Mulai Belajar dengan Google
                  </NeoButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

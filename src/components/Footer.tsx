import React from "react";
import { Shield, Mail, Heart } from "lucide-react";

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-brand-surface border-t-4 border-brand-border py-12 px-6 mt-16 text-brand-text">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <div
            onClick={() => {
              onNavigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-2.5 cursor-pointer bg-pastel-mint px-4 py-2 rounded-xl neo-border neo-shadow-sm w-max"
          >
            <div className="w-6 h-6 bg-white rounded-full border border-brand-border flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-brand-text" />
            </div>
            <span className="font-heading font-bold text-base tracking-tight">
              Cyber Academy <span className="bg-brand-text text-pastel-mint px-1 rounded ml-1 text-xs">AI</span>
            </span>
          </div>

          <p className="text-sm font-sans text-brand-muted leading-relaxed max-w-sm">
            Platform pembelajaran keamanan siber berbasis kecerdasan buatan untuk meningkatkan kesadaran siber pelajar, mahasiswa, dan masyarakat Indonesia demi dunia digital yang lebih aman.
          </p>

          <div className="flex items-center space-x-3 pt-2">
            <span className="text-xs bg-pastel-peach px-2.5 py-1 rounded-full border-2 border-brand-border font-bold">#IndonesiaMakinCakapDigital</span>
            <span className="text-xs bg-pastel-blue px-2.5 py-1 rounded-full border-2 border-brand-border font-bold">#PIXEL2026</span>
          </div>
        </div>

        {/* Links column */}
        <div>
          <h4 className="font-heading font-bold text-base text-brand-text mb-4">Navigasi Cepat</h4>
          <ul className="space-y-2 text-sm font-sans font-semibold">
            <li>
              <button
                onClick={() => {
                  onNavigate("/");
                  setTimeout(() => {
                    document.getElementById("paths-sec")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                className="hover:underline hover:text-brand-muted text-left"
              >
                Jalur Belajar
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onNavigate("/");
                  setTimeout(() => {
                    document.getElementById("features-sec")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                className="hover:underline hover:text-brand-muted text-left"
              >
                Fitur Unggulan
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onNavigate("/");
                  setTimeout(() => {
                    document.getElementById("faq-sec")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                className="hover:underline hover:text-brand-muted text-left"
              >
                Tanya Jawab (FAQ)
              </button>
            </li>
          </ul>
        </div>

        {/* Policy & contact column */}
        <div>
          <h4 className="font-heading font-bold text-base text-brand-text mb-4">Informasi & Bantuan</h4>
          <ul className="space-y-2 text-sm font-sans font-semibold">
            <li>
              <button
                onClick={() => onNavigate("/privacy")}
                className="hover:underline hover:text-brand-muted text-left"
              >
                Kebijakan Privasi
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("/terms")}
                className="hover:underline hover:text-brand-muted text-left"
              >
                Syarat & Ketentuan
              </button>
            </li>
            <li className="flex items-center space-x-2 text-brand-muted font-sans pt-2">
              <Mail className="w-4 h-4 text-brand-text" />
              <span className="text-xs">support@cyberacademy.ai</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom section */}
      <div className="max-w-7xl mx-auto border-t-2 border-brand-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-brand-muted font-semibold space-y-4 md:space-y-0">
        <div>
          © 2026 Cyber Academy AI. Proyek Pengembangan Web untuk FTI FEST 2026.
        </div>
        <div className="flex items-center space-y-1 sm:space-y-0 space-x-1">
          <span>Dibuat dengan</span>
          <Heart className="w-3.5 h-3.5 text-pastel-red fill-pastel-red" />
          <span>oleh Tim Cyber Academy AI</span>
        </div>
      </div>
    </footer>
  );
};

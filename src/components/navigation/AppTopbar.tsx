import React from "react";
import { Menu, ShieldCheck } from "lucide-react";

interface AppTopbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen?: boolean;
  menuId?: string;
  title?: string;
  subtitle?: string;
}

export const AppTopbar: React.FC<AppTopbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  menuId = "mobile-navigation",
  title = "Cyber Academy",
  subtitle = "Belajar siber lebih aman",
}) => {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b-4 border-brand-border bg-[#FFFDF8] px-4 py-2 md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-mint shadow-[2px_2px_0_0_#111111]">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-heading text-base font-bold">{title}</span>
          <span className="block truncate text-[11px] font-semibold text-gray-600">{subtitle}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-yellow shadow-[3px_3px_0_0_#111111] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 motion-reduce:transform-none"
        aria-label="Buka menu navigasi"
        aria-expanded={isMobileMenuOpen}
        aria-controls={menuId}
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
    </header>
  );
};

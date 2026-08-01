import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";

interface BackButtonProps {
  label: string;
  fallbackRoute: string;
  parentRoute?: string;
  onNavigate?: (route: string) => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ label, fallbackRoute, parentRoute, onNavigate, className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Check if we can safely go back in history
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (onNavigate) {
        onNavigate(parentRoute || fallbackRoute);
      } else {
        navigate(parentRoute || fallbackRoute);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex min-h-11 min-w-0 max-w-full items-center gap-2 whitespace-normal break-words px-4 py-2 rounded-xl border-2 border-black neo-shadow-sm hover:bg-gray-100 transition-all active:translate-y-0.5 active:shadow-none font-bold text-left text-sm cursor-pointer",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="min-w-0">{label}</span>
    </button>
  );
};

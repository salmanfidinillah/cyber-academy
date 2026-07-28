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
        "flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-black neo-shadow-sm hover:bg-gray-100 transition-all active:translate-y-0.5 active:shadow-none font-bold text-sm cursor-pointer",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

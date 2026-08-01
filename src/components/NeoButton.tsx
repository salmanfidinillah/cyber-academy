import React from "react";

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "yellow" | "peach" | "lavender" | "destructive" | "ghost" | "mint";
  size?: "sm" | "md" | "lg";
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  let bgClass = "bg-pastel-mint";
  if (variant === "secondary") bgClass = "bg-white";
  else if (variant === "yellow") bgClass = "bg-pastel-yellow";
  else if (variant === "peach") bgClass = "bg-pastel-peach";
  else if (variant === "lavender") bgClass = "bg-pastel-lavender";
  else if (variant === "destructive") bgClass = "bg-pastel-red";
  else if (variant === "mint") bgClass = "bg-pastel-mint";
  else if (variant === "ghost") bgClass = "bg-transparent";

  const sizeClass =
    size === "sm"
      ? "px-4 py-2 text-xs sm:text-sm rounded-lg"
      : size === "lg"
      ? "px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg rounded-[16px] font-heading font-bold"
      : "px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-heading font-bold";

  const borderAndShadow =
    variant === "ghost"
      ? "hover:bg-brand-muted/10 disabled:opacity-50 disabled:pointer-events-none"
      : "neo-border neo-shadow-sm neo-btn-transition neo-btn-interactive disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:neo-shadow-sm";

  return (
    <button
      className={`inline-flex min-w-0 max-w-full items-center justify-center whitespace-normal break-words text-[#111111] font-heading select-none text-center outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${bgClass} ${sizeClass} ${borderAndShadow} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

import React from "react";

interface NeoBadgeProps {
  children: React.ReactNode;
  bgColor?: string;
  size?: "sm" | "md";
  className?: string;
}

export const NeoBadge: React.FC<NeoBadgeProps> = ({
  children,
  bgColor = "bg-pastel-yellow",
  size = "md",
  className = ""
}) => {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-block font-heading font-bold text-brand-text rounded-full neo-border-thin select-none ${bgColor} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
};

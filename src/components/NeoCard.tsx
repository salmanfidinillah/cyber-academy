import React from "react";

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  bgColor?: string;
  shadowSize?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  bgColor = "bg-brand-surface",
  shadowSize = "md",
  interactive = false,
  className = "",
  ...props
}) => {
  const shadowClass =
    shadowSize === "sm"
      ? "neo-shadow-sm"
      : shadowSize === "lg"
      ? "neo-shadow-lg"
      : "neo-shadow";

  const interactiveClass = interactive
    ? "neo-btn-transition neo-btn-interactive cursor-pointer"
    : "";

  return (
    <div
      className={`neo-border rounded-[20px] p-5 sm:p-6 ${bgColor} ${shadowClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

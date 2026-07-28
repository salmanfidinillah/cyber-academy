import React from "react";
import { createPortal } from "react-dom";

export interface SidebarTooltipState {
  id: string;
  label: string;
  left: number;
  top: number;
}

interface SidebarTooltipProps {
  tooltip: SidebarTooltipState | null;
}

export const getSidebarTooltip = (
  target: HTMLElement,
  label: string,
  id: string,
): SidebarTooltipState => {
  const rect = target.getBoundingClientRect();

  return {
    id,
    label,
    left: rect.right + 12,
    top: rect.top + rect.height / 2,
  };
};

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ tooltip }) => {
  if (!tooltip || typeof document === "undefined") return null;

  return createPortal(
    <div
      id={tooltip.id}
      role="tooltip"
      className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg border-2 border-black bg-black px-3 py-2 text-xs font-bold text-white shadow-[3px_3px_0_0_#B8F1D5]"
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      {tooltip.label}
    </div>,
    document.body,
  );
};

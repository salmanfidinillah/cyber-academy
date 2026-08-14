import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface LessonDrawerProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side: "left" | "right";
  mobileFullscreen?: boolean;
  children: React.ReactNode;
}

export const LessonDrawer: React.FC<LessonDrawerProps> = ({
  id,
  isOpen,
  onClose,
  title,
  description,
  side,
  mobileFullscreen = false,
  children,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;

    const getFocusableElements = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      const firstElement = getFocusableElements()[0];
      (firstElement || panelRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      const previousFocus = previousFocusRef.current;
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClass =
    side === "left"
      ? "left-0 lesson-drawer-enter-left w-[min(92vw,23rem)] border-r-4 shadow-[8px_0_0_0_#111111]"
      : `right-0 lesson-drawer-enter-right ${
          mobileFullscreen ? "w-full sm:w-[min(92vw,27.5rem)]" : "w-[min(92vw,27.5rem)]"
        } border-l-4 shadow-[-8px_0_0_0_#111111]`;

  return createPortal(
    <div className="fixed inset-0 z-[70]" data-testid={`${id}-overlay-root`}>
      <div
        className="lesson-drawer-overlay absolute inset-0 bg-black/55"
        onMouseDown={onClose}
        aria-hidden="true"
        data-testid={`${id}-overlay`}
      />
      <aside
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        tabIndex={-1}
        className={`fixed inset-y-0 z-[71] flex min-h-0 max-w-full flex-col overflow-hidden border-black bg-[#FFFDF8] outline-none ${sideClass}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b-3 border-black bg-pastel-yellow px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="font-heading text-lg font-extrabold leading-tight text-brand-text">
              {title}
            </h2>
            {description && (
              <p id={`${id}-description`} className="mt-1 text-xs font-semibold leading-relaxed text-brand-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-red shadow-[2px_2px_0_0_#111111] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 motion-reduce:transform-none"
            aria-label={`Tutup ${title}`}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </aside>
    </div>,
    document.body,
  );
};

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminMobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currentUser: any;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const AdminMobileSidebarDrawer: React.FC<AdminMobileSidebarDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
  currentUser,
  currentRoute,
  onNavigate,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const originalOverflow = document.body.style.overflow;

    const getFocusableElements = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          drawerRef.current?.focus();
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
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      const firstElement = getFocusableElements()[0];
      (firstElement || drawerRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      const previousFocus = previousFocusRef.current;
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="sidebar-overlay-enter absolute inset-0 bg-black/55"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        id="admin-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi admin Cyber Academy"
        tabIndex={-1}
        className="sidebar-drawer-enter fixed inset-y-0 left-0 z-50 w-[min(85vw,20rem)] overflow-hidden border-r-4 border-black bg-[#F0F4F8] shadow-[8px_0_0_0_#111111] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-[60] flex size-10 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-red outline-none shadow-[2px_2px_0_0_#111111] hover:bg-red-200 focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2"
          aria-label="Tutup menu navigasi admin"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <AdminSidebar
          collapsed={false}
          onToggle={onClose}
          onLogout={onLogout}
          currentUser={currentUser}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isMobile={true}
        />
      </div>
    </div>
  );
};

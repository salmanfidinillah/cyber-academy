import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AppTopbar } from "./AppTopbar";
import { AdminMobileSidebarDrawer } from "./AdminMobileSidebarDrawer";
import { BackButton } from "./BackButton";
import { Breadcrumb } from "./Breadcrumb";
import { cn } from "../../lib/utils";
import { User } from "../../types";
import { useUser } from "../../contexts/UserContext";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./sidebarState";

interface AdminShellProps {
  currentUser: User;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ currentUser, currentRoute, onNavigate, onLogout, children }) => {
  const { isAdmin } = useUser();
  const [collapsed, setCollapsed] = useState(() => readSidebarCollapsed("adminSidebarCollapsed"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    writeSidebarCollapsed("adminSidebarCollapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentRoute]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8] p-6 text-center">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-4 text-pastel-red">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <button 
            onClick={() => onNavigate("/dashboard")}
            className="px-6 py-3 bg-black text-white rounded-xl font-bold neo-shadow-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Determine back navigation logic
  const getBackInfo = () => {
    if (currentRoute === "/admin") {
      return { label: "Kembali ke Aplikasi", route: "/dashboard" };
    }
    if (currentRoute.startsWith("/admin/users/")) {
      return { label: "Kembali ke Daftar Pengguna", route: "/admin/users" };
    }
    if (currentRoute.startsWith("/admin/learning-paths/")) {
      return { label: "Kembali ke Alur Belajar", route: "/admin/learning-paths" };
    }
    if (currentRoute.startsWith("/admin/courses/")) {
      return { label: "Kembali ke Daftar Kelas", route: "/admin/courses" };
    }
    if (currentRoute.startsWith("/admin/lessons/")) {
      return { label: "Kembali ke Daftar Materi", route: "/admin/lessons" };
    }
    if (currentRoute.startsWith("/admin/quizzes/")) {
      return { label: "Kembali ke Daftar Kuis", route: "/admin/quizzes" };
    }
    if (currentRoute.startsWith("/admin/simulations/")) {
      return { label: "Kembali ke Daftar Simulasi", route: "/admin/simulations" };
    }
    if (currentRoute.startsWith("/admin/badges/")) {
      return { label: "Kembali ke Daftar Lencana", route: "/admin/badges" };
    }
    if (currentRoute.startsWith("/admin/certificates/")) {
      return { label: "Kembali ke Daftar Sertifikat", route: "/admin/certificates" };
    }
    if (currentRoute === "/admin/audit-logs") {
      return { label: "Kembali ke Admin Dashboard", route: "/admin" };
    }
    if (currentRoute.startsWith("/admin")) {
      return { label: "Kembali ke Admin Dashboard", route: "/admin" };
    }
    return null;
  };

  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; route?: string }> = [
      { label: "Admin Portal", route: "/admin" }
    ];

    if (currentRoute === "/admin") {
      return [{ label: "Admin Portal" }];
    }

    if (currentRoute === "/admin/users") {
      items.push({ label: "User Management" });
    } else if (currentRoute === "/admin/learning-paths") {
      items.push({ label: "Learning Path Management" });
    } else if (currentRoute === "/admin/courses") {
      items.push({ label: "Course Management" });
    } else if (currentRoute === "/admin/lessons") {
      items.push({ label: "Lesson Management" });
    } else if (currentRoute === "/admin/quizzes") {
      items.push({ label: "Quiz Management" });
    } else if (currentRoute === "/admin/simulations") {
      items.push({ label: "Simulation Management" });
    } else if (currentRoute === "/admin/badges") {
      items.push({ label: "Badge Metadata Management" });
    } else if (currentRoute === "/admin/certificates") {
      items.push({ label: "Certificate Management" });
    } else {
      const parts = currentRoute.split("/");
      const last = parts[parts.length - 1];
      if (last) {
        items.push({ label: last.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") });
      }
    }

    return items;
  };

  const backInfo = getBackInfo();

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-clip bg-[#F8F9FA]">
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onLogout={onLogout}
          currentUser={currentUser}
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          isMobile={false}
        />
      </div>
      
      <AdminMobileSidebarDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={onLogout}
        currentUser={currentUser}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
      />

      <div
        className={cn(
          "min-w-0 flex-1 transition-[margin-left] duration-300 motion-reduce:transition-none",
          collapsed
            ? "lg:ml-[var(--sidebar-collapsed-width)]"
            : "lg:ml-[var(--sidebar-expanded-width)]",
        )}
      >
        <AppTopbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          menuId="admin-mobile-navigation"
          title="Cyber Academy Admin"
          subtitle="Panel administrator"
        />
        <main className="min-w-0 max-w-full p-3.5 sm:p-6">
          <Breadcrumb items={getBreadcrumbItems()} onNavigate={onNavigate} />
          {backInfo && (
            <div className="mb-6">
              <BackButton
                label={backInfo.label}
                fallbackRoute={backInfo.route}
                onNavigate={onNavigate}
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

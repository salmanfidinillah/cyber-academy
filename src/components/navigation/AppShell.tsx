import React, { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { BackButton } from "./BackButton";
import { Breadcrumb } from "./Breadcrumb";
import { cn } from "../../lib/utils";
import { getSimulationDefinition } from "../../simulationCatalog";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./sidebarState";

interface AppShellProps {
  currentUser: any;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentUser, currentRoute, onNavigate, onLogout, children }) => {
  const [collapsed, setCollapsed] = useState(() => readSidebarCollapsed("sidebarCollapsed"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    writeSidebarCollapsed("sidebarCollapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentRoute]);

  // Determine back navigation logic
  const getBackInfo = () => {
    // If it's the dashboard, we don't show back button
    if (currentRoute === "/dashboard") return null;

    // Settings sub-pages
    if (currentRoute === "/settings/profile" || currentRoute === "/settings/account" || currentRoute === "/settings/security") {
      return { label: "Kembali ke Pengaturan", route: "/settings" };
    }
    // Settings main page
    if (currentRoute === "/settings") {
      return { label: "Kembali ke Profil", route: "/profile" };
    }
    // Profile page
    if (currentRoute === "/profile") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // Quiz/lessons inside courses
    if (currentRoute.includes("/quiz") || currentRoute.includes("/lessons/")) {
      const parts = currentRoute.split("/");
      const courseIndex = parts.indexOf("courses");
      if (courseIndex !== -1 && parts[courseIndex + 1]) {
        const courseSlug = parts[courseIndex + 1];
        return { label: "Kembali ke Detail Kursus", route: `/learn/courses/${courseSlug}` };
      }
    }
    // Course Detail
    if (currentRoute.startsWith("/learn/courses/")) {
      return { label: "Kembali ke Jalur Belajar", route: "/learn/paths" };
    }
    // Path Detail
    if (currentRoute.startsWith("/learn/paths/")) {
      return { label: "Kembali ke Semua Jalur Belajar", route: "/learn/paths" };
    }
    // All paths landing
    if (currentRoute === "/learn/paths") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // Simulation sub-pages
    if (currentRoute.startsWith("/simulations/")) {
      return { label: "Kembali ke Simulasi", route: "/simulations" };
    }
    // Simulations landing
    if (currentRoute === "/simulations") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // AI Tutor sub-conversations
    if (currentRoute.startsWith("/ai-tutor/") && currentRoute !== "/ai-tutor") {
      return { label: "Kembali ke AI Tutor", route: "/ai-tutor" };
    }
    // AI Tutor landing
    if (currentRoute === "/ai-tutor") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // Progress insight
    if (currentRoute === "/progress/insight") {
      return { label: "Kembali ke Progress", route: "/progress" };
    }
    // Progress page
    if (currentRoute === "/progress") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // Badges page
    if (currentRoute === "/badges") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }
    // Certificates page
    if (currentRoute === "/certificates") {
      return { label: "Kembali ke Dashboard", route: "/dashboard" };
    }

    return null;
  };

  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; route?: string }> = [
      { label: "Dashboard", route: "/dashboard" }
    ];

    if (currentRoute === "/dashboard") {
      return [{ label: "Dashboard" }];
    }

    if (currentRoute === "/profile") {
      items.push({ label: "Profil Saya" });
    } else if (currentRoute === "/settings") {
      items.push({ label: "Pengaturan" });
    } else if (currentRoute === "/settings/profile") {
      items.push({ label: "Pengaturan", route: "/settings" });
      items.push({ label: "Ubah Profil" });
    } else if (currentRoute === "/settings/account") {
      items.push({ label: "Pengaturan", route: "/settings" });
      items.push({ label: "Kelola Akun" });
    } else if (currentRoute === "/settings/security") {
      items.push({ label: "Pengaturan", route: "/settings" });
      items.push({ label: "Keamanan" });
    } else if (currentRoute === "/learn/paths") {
      items.push({ label: "Jalur Belajar" });
    } else if (currentRoute.startsWith("/learn/paths/")) {
      const parts = currentRoute.split("/");
      const slug = parts[parts.length - 1];
      items.push({ label: "Jalur Belajar", route: "/learn/paths" });
      items.push({ label: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") });
    } else if (currentRoute.startsWith("/learn/courses/")) {
      items.push({ label: "Jalur Belajar", route: "/learn/paths" });
      const parts = currentRoute.split("/");
      const courseIndex = parts.indexOf("courses");
      const courseSlug = parts[courseIndex + 1];
      
      const isQuiz = currentRoute.includes("/quiz");
      const isLesson = currentRoute.includes("/lessons/");

      const courseLabel = courseSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      if (isQuiz) {
        items.push({ label: courseLabel, route: `/learn/courses/${courseSlug}` });
        items.push({ label: "Kuis" });
      } else if (isLesson) {
        items.push({ label: courseLabel, route: `/learn/courses/${courseSlug}` });
        const lessonSlug = parts[parts.length - 1];
        items.push({ label: lessonSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") });
      } else {
        items.push({ label: courseLabel });
      }
    } else if (currentRoute === "/simulations") {
      items.push({ label: "Simulasi Keamanan" });
    } else if (currentRoute.startsWith("/simulations/")) {
      const simulationId = currentRoute.split("/")[2] || "";
      items.push({ label: "Simulasi Keamanan", route: "/simulations" });
      items.push({
        label:
          getSimulationDefinition(simulationId)?.title ||
          simulationId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      });
    } else if (currentRoute === "/progress") {
      items.push({ label: "Progres Belajar" });
    } else if (currentRoute === "/progress/insight") {
      items.push({ label: "Progres Belajar", route: "/progress" });
      items.push({ label: "Learning Insights" });
    } else if (currentRoute === "/ai-tutor") {
      items.push({ label: "AI Tutor" });
    } else if (currentRoute.startsWith("/ai-tutor/")) {
      items.push({ label: "AI Tutor", route: "/ai-tutor" });
      items.push({ label: "Sesi Percakapan" });
    } else if (currentRoute === "/badges") {
      items.push({ label: "Lencana Penghargaan" });
    } else if (currentRoute === "/certificates") {
      items.push({ label: "Sertifikat Kelulusan" });
    } else {
      const cleanPath = currentRoute.replace(/^\//, "");
      if (cleanPath) {
        items.push({ label: cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1) });
      }
    }

    return items;
  };

  const backInfo = getBackInfo();

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-clip bg-[#FFFDF8]">
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onLogout={onLogout}
          currentUser={currentUser}
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          isMobile={false}
        />
      </div>
      
      <MobileSidebarDrawer
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
            ? "md:ml-[var(--sidebar-collapsed-width)]"
            : "md:ml-[var(--sidebar-expanded-width)]",
        )}
      >
        <AppTopbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          menuId="mobile-navigation"
        />
        <main className="min-w-0 max-w-full p-4 sm:p-6">
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

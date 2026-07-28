import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  BookText,
  HelpCircle,
  ShieldCheck,
  Award,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getSidebarTooltip,
  SidebarTooltip,
  SidebarTooltipState,
} from "./SidebarTooltip";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  currentUser: any;
  currentRoute?: string;
  onNavigate: (route: string) => void;
  isMobile?: boolean;
}

const navItems = [
  { label: "Admin Dashboard", route: "/admin", icon: LayoutDashboard },
  { label: "Users", route: "/admin/users", icon: Users },
  { label: "Learning Paths", route: "/admin/learning-paths", icon: BookOpen },
  { label: "Courses", route: "/admin/courses", icon: Library },
  { label: "Lessons", route: "/admin/lessons", icon: BookText },
  { label: "Quizzes", route: "/admin/quizzes", icon: HelpCircle },
  { label: "Simulations", route: "/admin/simulations", icon: ShieldCheck },
  { label: "Badges", route: "/admin/badges", icon: Award },
  { label: "Certificates", route: "/admin/certificates", icon: GraduationCap },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggle,
  onLogout,
  currentUser,
  isMobile = false,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [tooltip, setTooltip] = useState<SidebarTooltipState | null>(null);
  const isCompact = collapsed && !isMobile;
  const displayName = currentUser?.displayName || "Administrator";
  const avatarUrl =
    currentUser?.photoURL ||
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}`;

  const showTooltip = (
    event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    id: string,
  ) => {
    if (!isCompact) return;
    setTooltip(getSidebarTooltip(event.currentTarget, label, id));
  };

  const hideTooltip = () => setTooltip(null);

  const itemClassName = (isActive: boolean) =>
    cn(
      "group relative flex min-h-11 items-center rounded-xl border-[3px] border-transparent font-bold text-gray-700 outline-none transition-[background-color,border-color,box-shadow,transform] duration-150",
      "hover:border-black hover:bg-pastel-blue/60 focus-visible:border-black focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2",
      isActive && "border-black bg-pastel-blue text-black shadow-[3px_3px_0_0_#111111]",
      isCompact ? "mx-auto size-11 justify-center p-0" : "w-full gap-3 px-3 py-2",
    );

  return (
    <aside
      aria-label={isMobile ? "Navigasi admin mobile" : "Navigasi admin"}
      className={cn(
        "left-0 top-0 z-40 flex h-dvh flex-col overflow-x-hidden border-r-4 border-brand-border bg-[#F0F4F8]",
        "transition-[width] duration-300 motion-reduce:transition-none",
        isMobile ? "relative w-full border-r-0" : "fixed",
        !isMobile &&
          (isCompact
            ? "w-[var(--sidebar-collapsed-width)]"
            : "w-[var(--sidebar-expanded-width)]"),
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b-4 border-brand-border",
          isCompact ? "flex-col justify-center gap-2 px-2 py-3" : "min-h-20 justify-between gap-1.5 px-3 py-3",
        )}
      >
        <Link
          to="/admin"
          onClick={isMobile ? onToggle : undefined}
          aria-label="Cyber Academy Admin — kembali ke admin dashboard"
          className={cn(
            "group flex min-w-0 items-center rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2",
            isCompact ? "justify-center" : "gap-2",
          )}
        >
          <span className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-blue shadow-[3px_3px_0_0_#111111] transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none",
            isCompact ? "size-11" : "size-10",
          )}>
            <Shield className="size-5" aria-hidden="true" />
          </span>
          {!isCompact && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-heading text-[15px] font-bold">Cyber Academy</span>
              <span className="block truncate text-[10px] font-semibold text-gray-600">Panel administrator</span>
            </span>
          )}
        </Link>

        {!isMobile && (
          <button
            type="button"
            onClick={onToggle}
            onMouseEnter={(event) => showTooltip(event, "Perluas sidebar", "tooltip-admin-expand")}
            onMouseLeave={hideTooltip}
            onFocus={(event) => showTooltip(event, "Perluas sidebar", "tooltip-admin-expand")}
            onBlur={hideTooltip}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white outline-none transition-colors hover:bg-pastel-yellow focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2"
            aria-label={isCompact ? "Perluas sidebar admin" : "Ciutkan sidebar admin"}
            aria-describedby={isCompact && tooltip?.id === "tooltip-admin-expand" ? tooltip.id : undefined}
          >
            {isCompact ? (
              <PanelLeftOpen className="size-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <nav className={cn("min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden py-3", isCompact ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive = item.route === "/admin"
            ? currentPath === "/admin"
            : currentPath === item.route || currentPath.startsWith(item.route + "/");
          return (
            <Link
              key={item.route}
              to={item.route}
              onClick={isMobile ? onToggle : undefined}
              onMouseEnter={(event) => showTooltip(event, item.label, `tooltip-admin-${item.route}`)}
              onMouseLeave={hideTooltip}
              onFocus={(event) => showTooltip(event, item.label, `tooltip-admin-${item.route}`)}
              onBlur={hideTooltip}
              className={itemClassName(isActive)}
              aria-current={isActive ? "page" : undefined}
              aria-label={isCompact ? item.label : undefined}
              aria-describedby={isCompact && tooltip?.id === `tooltip-admin-${item.route}` ? tooltip.id : undefined}
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              {!isCompact && <span className="truncate text-sm">{item.label}</span>}
              {isActive && isCompact && (
                <span
                  className="absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-black bg-pastel-yellow"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("shrink-0 space-y-1.5 border-t-4 border-brand-border", isCompact ? "p-2" : "p-3")}>
        <div
          className={cn(
            "flex min-w-0 items-center rounded-xl",
            isCompact ? "justify-center" : "gap-3 border-2 border-black bg-white p-2",
          )}
          onMouseEnter={(event) => showTooltip(event, displayName, "tooltip-admin-profile")}
          onMouseLeave={hideTooltip}
        >
          <img
            src={avatarUrl}
            alt={`Avatar ${displayName}`}
            className="size-10 shrink-0 rounded-lg border-2 border-black bg-pastel-peach object-cover"
          />
          {!isCompact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{displayName}</p>
              <p className="truncate text-xs text-gray-500">{currentUser?.email || "Email belum tersedia"}</p>
            </div>
          )}
        </div>
        <Link
          to="/dashboard"
          onClick={isMobile ? onToggle : undefined}
          onMouseEnter={(event) => showTooltip(event, "Kembali ke aplikasi", "tooltip-admin-back")}
          onMouseLeave={hideTooltip}
          onFocus={(event) => showTooltip(event, "Kembali ke aplikasi", "tooltip-admin-back")}
          onBlur={hideTooltip}
          className={cn(itemClassName(false), "hover:bg-white")}
          aria-label={isCompact ? "Kembali ke aplikasi" : undefined}
          aria-describedby={isCompact && tooltip?.id === "tooltip-admin-back" ? tooltip.id : undefined}
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
          {!isCompact && <span className="truncate text-sm">Kembali ke Aplikasi</span>}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          onMouseEnter={(event) => showTooltip(event, "Keluar", "tooltip-admin-logout")}
          onMouseLeave={hideTooltip}
          onFocus={(event) => showTooltip(event, "Keluar", "tooltip-admin-logout")}
          onBlur={hideTooltip}
          className={cn(
            "flex min-h-11 items-center rounded-xl border-[3px] border-transparent font-bold text-red-800 outline-none transition-colors hover:border-black hover:bg-pastel-red focus-visible:border-black focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2",
            isCompact ? "mx-auto size-11 justify-center p-0" : "w-full gap-3 px-3 py-2",
          )}
          aria-label={isCompact ? "Keluar" : undefined}
          aria-describedby={isCompact && tooltip?.id === "tooltip-admin-logout" ? tooltip.id : undefined}
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          {!isCompact && <span className="text-sm">Keluar</span>}
        </button>
      </div>
      <SidebarTooltip tooltip={tooltip} />
    </aside>
  );
};

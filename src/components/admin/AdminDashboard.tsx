import React, { useEffect, useState } from "react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { AlertTriangle, Library, ShieldCheck, BookOpen, BookText, FileCheck, RefreshCw, Target } from "lucide-react";
import { fetchAdminAuditLogs, fetchAdminDashboardStats } from "../../services/adminService";

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate }) => {
  const [stats, setStats] = useState({
    learningPaths: 0,
    coursesPublished: 0,
    lessonsPublished: 0,
    quizzesCount: 0,
    simulationAttempts: 0,
    activeCertificates: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadDashboard = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([fetchAdminDashboardStats(), fetchAdminAuditLogs(10)])
      .then(([dashboardStats, logs]) => {
        setStats(dashboardStats);
        setRecentLogs(logs);
      })
      .catch((error) => {
        setRecentLogs([]);
        setLoadError(error?.message || "Gagal memuat data dashboard admin.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser.uid]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Ringkasan statistik dan aktivitas platform.</p>
      </div>

      {loadError && (
        <div className="bg-pastel-peach border-3 border-black rounded-xl p-4 neo-shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" role="alert">
          <p className="font-bold flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{loadError}</p>
          <button className="neo-button bg-white" onClick={loadDashboard}><RefreshCw className="w-4 h-4" />Coba Lagi</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Library, label: "Total Learning Path", value: stats.learningPaths },
          { icon: BookOpen, label: "Course Published", value: stats.coursesPublished },
          { icon: BookText, label: "Lesson Published", value: stats.lessonsPublished },
          { icon: FileCheck, label: "Total Quiz", value: stats.quizzesCount },
          { icon: Target, label: "Simulasi Dimainkan", value: stats.simulationAttempts },
          { icon: ShieldCheck, label: "Sertifikat Aktif", value: stats.activeCertificates },
        ].map((stat) => (
          <NeoCard key={stat.label} className="p-4 text-center">
            <stat.icon className="w-8 h-8 mx-auto mb-2 text-pastel-blue" />
            <p className="text-xl sm:text-2xl font-bold">{loading ? "…" : stat.value}</p>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">{stat.label}</p>
          </NeoCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-heading font-bold mt-10 mb-4">Aktivitas Terbaru</h3>
          <NeoCard className="p-0 overflow-hidden">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada aktivitas terbaru.</div>
            ) : (
              <div className="divide-y-2 divide-dashed divide-gray-200">
                {recentLogs.map((log, index) => (
                  <div key={`${log.logId}-${index}`} className="p-4 flex items-start gap-4">
                    <div className="bg-gray-100 p-2 rounded-lg neo-border">
                      <span className="text-xs font-bold uppercase text-gray-600">{log.action}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{log.safeSummary}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>
        </div>
        <div>
          <h3 className="text-xl font-heading font-bold mt-10 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Lihat Pengguna", route: "/admin/users" },
              { label: "Kelola Learning Paths", route: "/admin/learning-paths" },
              { label: "Kelola Courses", route: "/admin/courses" },
              { label: "Kelola Lessons", route: "/admin/lessons" },
              { label: "Kelola Quizzes", route: "/admin/quizzes" },
            ].map(action => (
              <button 
                key={action.route}
                onClick={() => onNavigate(action.route)}
                className="p-4 bg-pastel-mint border-2 border-black rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

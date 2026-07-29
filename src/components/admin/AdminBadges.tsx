import React, { useEffect, useState } from "react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { RefreshCw } from "lucide-react";
import { fetchAdminBadges } from "../../services/achievementService";

interface AdminBadgesProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminBadges: React.FC<AdminBadgesProps> = () => {
  const [badges, setBadges] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setBadges(await fetchAdminBadges());
    } catch (err: any) {
      setError(err.message || "Gagal memuat badge.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeBadges = badges.filter((badge) => badge.status === "active" && !badge.isLegacy);
  const legacyBadges = badges.filter((badge) => badge.isLegacy || badge.status !== "active");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Manajemen Badges</h1>
          <p className="mt-1 text-sm font-medium text-gray-600">
            {loading ? "Memuat status badge..." : `${activeBadges.length} badge milestone aktif`}
          </p>
        </div>
        <button onClick={() => void load()} className="p-2 bg-white rounded-lg neo-border" aria-label="Muat ulang">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg font-bold text-red-700">{error}</div>}

      <NeoCard className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="p-4 font-bold text-sm uppercase">Title</th>
              <th className="p-4 font-bold text-sm uppercase">Requirement</th>
              <th className="p-4 font-bold text-sm uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center font-bold">Memuat badge...</td></tr>
            ) : badges.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500 font-bold">Belum ada badge.</td>
              </tr>
            ) : badges.map(badge => (
              <tr key={badge.badgeId} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <p className="font-bold">{badge.title || badge.badgeId}</p>
                  <p className="mt-1 text-xs font-mono text-gray-500">{badge.slug || badge.badgeId}</p>
                </td>
                <td className="p-4 text-sm">{badge.requirementType}: {badge.requirementValue}</td>
                <td className="p-4">
                  <span className={`inline-flex px-3 py-2 rounded-lg neo-border text-xs font-bold ${badge.status === "active" && !badge.isLegacy ? "bg-pastel-mint" : "bg-gray-200"}`}>
                    {badge.status === "active" && !badge.isLegacy ? "Aktif" : "Legacy — Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeoCard>

      {!loading && legacyBadges.length > 0 && (
        <p className="text-xs text-gray-500">
          {legacyBadges.length} definisi legacy dipertahankan untuk histori dan tidak dapat diaktifkan kembali.
        </p>
      )}
    </div>
  );
};

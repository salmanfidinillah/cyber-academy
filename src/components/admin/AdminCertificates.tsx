import React, { useEffect, useState } from "react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { fetchAdminCertificates, updateCertificateStatus } from "../../services/achievementService";

interface AdminCertificatesProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminCertificates: React.FC<AdminCertificatesProps> = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setCerts(await fetchAdminCertificates());
    } catch (err: any) {
      setError(err.message || "Gagal memuat sertifikat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleStatus = async (certificate: any) => {
    const next = certificate.status === "active" ? "revoked" : "active";
    if (next === "revoked" && !window.confirm(`Cabut sertifikat ${certificate.certificateCode}?`)) return;
    try {
      const updated = await updateCertificateStatus(certificate.certificateId, next);
      setCerts((current) => current.map((item) => item.certificateId === updated.certificateId ? updated : item));
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui sertifikat.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Manajemen Sertifikat</h1>
        <button onClick={() => void load()} className="p-2 bg-white rounded-lg neo-border" aria-label="Muat ulang">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg font-bold text-red-700">{error}</div>}

      <NeoCard className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="p-4 font-bold text-sm uppercase">Code</th>
              <th className="p-4 font-bold text-sm uppercase">Recipient</th>
              <th className="p-4 font-bold text-sm uppercase">Status</th>
              <th className="p-4 font-bold text-sm uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center font-bold">Memuat sertifikat...</td></tr>
            ) : certs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Belum ada sertifikat.</td>
              </tr>
            ) : certs.map(cert => (
              <tr key={cert.certificateId} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold">{cert.certificateCode}</td>
                <td className="p-4 text-sm">{cert.recipientName}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded neo-border ${cert.status === 'active' ? 'bg-pastel-mint' : 'bg-pastel-peach'}`}>
                    {cert.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => void toggleStatus(cert)} className="px-3 py-2 bg-pastel-peach rounded-lg neo-border text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {cert.status === "active" ? "Cabut" : "Aktifkan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeoCard>
    </div>
  );
};

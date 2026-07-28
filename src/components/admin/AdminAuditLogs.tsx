import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { NeoCard } from "../NeoCard";
import { fetchAdminAuditLogs } from "../../services/adminService";

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await fetchAdminAuditLogs(100));
    } catch (err: any) {
      setError(err.message || "Gagal memuat audit log.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Audit Log</h1><p className="text-gray-600">Riwayat perubahan penting oleh administrator.</p></div>
        <button onClick={() => void load()} className="p-2 bg-white rounded-lg neo-border"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg font-bold text-red-700">{error}</div>}
      <NeoCard className="p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 border-b-2 border-black"><th className="p-4">Waktu</th><th className="p-4">Aksi</th><th className="p-4">Entitas</th><th className="p-4">Ringkasan</th></tr></thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? <tr><td colSpan={4} className="p-8 text-center font-bold">Memuat audit log...</td></tr> :
              logs.length === 0 ? <tr><td colSpan={4} className="p-8 text-center">Belum ada aktivitas.</td></tr> :
              logs.map((log) => <tr key={log.logId}><td className="p-4 text-xs">{new Date(log.createdAt).toLocaleString("id-ID")}</td><td className="p-4 font-bold">{log.action}</td><td className="p-4 text-sm">{log.entityType}/{log.entityId}</td><td className="p-4 text-sm">{log.safeSummary}</td></tr>)}
          </tbody>
        </table>
      </NeoCard>
    </div>
  );
}

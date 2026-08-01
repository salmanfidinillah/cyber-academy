import React, { useEffect, useState, useMemo } from "react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { Search } from "lucide-react";
import { fetchAdminSimulations, updateAdminSimulation } from "../../services/adminService";

interface AdminSimulationsProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminSimulations: React.FC<AdminSimulationsProps> = () => {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminSimulations()
      .then(setSimulations)
      .catch((err) => setError(err.message || "Gagal memuat simulasi."))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (simulation: any) => {
    try {
      const updated = await updateAdminSimulation(simulation.simulationId, {
        status: simulation.status === "published" ? "draft" : "published",
      });
      setSimulations((items) => items.map((item) => item.simulationId === updated.simulationId ? updated : item));
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui simulasi.");
    }
  };

  const filteredSimulations = useMemo(() => {
    return simulations.filter(s => 
      (s.title?.toLowerCase().includes(search.toLowerCase()) || s.slug?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [simulations, search]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Manajemen Simulasi</h1>
      </div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 font-bold">{error}</div>}

      <NeoCard className="p-4 flex items-center gap-4">
        <div className="flex min-w-0 w-full flex-1 items-center gap-3 rounded-xl border-2 border-black bg-white p-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 outline-none font-bold bg-transparent"
            placeholder="Cari simulasi..."
          />
        </div>
      </NeoCard>

      <NeoCard className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[38rem] text-left">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="p-4 font-bold text-sm uppercase">Title</th>
              <th className="p-4 font-bold text-sm uppercase">Type</th>
              <th className="p-4 font-bold text-sm uppercase">Status</th>
              <th className="p-4 font-bold text-sm uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center font-bold">Memuat simulasi...</td></tr>
            ) : filteredSimulations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Belum ada simulasi.</td>
              </tr>
            ) : filteredSimulations.map(sim => (
              <tr key={sim.simulationId} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold">{sim.title}</td>
                <td className="p-4 text-sm">{sim.type}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded neo-border ${sim.status === 'published' ? 'bg-pastel-mint' : 'bg-gray-200'}`}>
                    {sim.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => void toggleStatus(sim)} className="px-3 py-2 bg-pastel-yellow rounded-lg neo-border text-xs font-bold">
                    {sim.status === "published" ? "Jadikan Draft" : "Publikasikan"}
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

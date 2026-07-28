import React, { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserX } from "lucide-react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { fetchAdminUsers, updateAdminUser } from "../../services/adminService";

interface AdminUsersProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || "Gagal memuat pengguna."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return users.filter((user) =>
      user.email.toLowerCase().includes(needle) || user.displayName.toLowerCase().includes(needle)
    );
  }, [search, users]);

  const patchUser = async (uid: string, payload: any) => {
    setError("");
    try {
      const updated = await updateAdminUser(uid, payload);
      setUsers((items) => items.map((item) => item.uid === uid ? updated : item));
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui pengguna.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Manajemen Pengguna</h1>
        <p className="text-gray-600">Role dan status akun tersinkron dengan Firebase Authentication.</p>
      </div>
      {error && <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg font-bold text-red-700">{error}</div>}
      <NeoCard className="p-4 flex items-center gap-3">
        <Search className="w-5 h-5" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1 outline-none font-bold" placeholder="Cari nama atau email..." />
      </NeoCard>
      <NeoCard className="p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 border-b-2 border-black">
            <th className="p-4">Pengguna</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Aksi</th>
          </tr></thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? <tr><td colSpan={4} className="p-8 text-center font-bold">Memuat pengguna...</td></tr> :
              filtered.map((user) => (
                <tr key={user.uid}>
                  <td className="p-4"><div className="font-bold">{user.displayName || "Tanpa nama"}</div><div className="text-xs text-gray-500">{user.email}</div></td>
                  <td className="p-4 font-bold">{user.role}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded neo-border text-xs font-bold ${user.accountStatus === "active" ? "bg-pastel-mint" : "bg-pastel-peach"}`}>{user.accountStatus}</span></td>
                  <td className="p-4 flex gap-2">
                    <button disabled={user.uid === currentUser.uid} onClick={() => void patchUser(user.uid, { role: user.role === "admin" ? "user" : "admin" })} className="p-2 bg-pastel-blue rounded-lg neo-border disabled:opacity-40" title="Ubah role"><ShieldCheck className="w-4 h-4" /></button>
                    <button disabled={user.uid === currentUser.uid} onClick={() => void patchUser(user.uid, { accountStatus: user.accountStatus === "active" ? "disabled" : "active" })} className="p-2 bg-pastel-peach rounded-lg neo-border disabled:opacity-40" title="Ubah status"><UserX className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </NeoCard>
    </div>
  );
};

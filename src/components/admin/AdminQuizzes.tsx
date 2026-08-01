import React, { useEffect, useState, useMemo } from "react";
import { User, Quiz } from "../../types";
import { NeoCard } from "../NeoCard";
import { Plus, Search, Eye, Edit, RefreshCw, Trash2 } from "lucide-react";
import { deleteAdminQuizApi, getAdminQuizzesApi } from "../../services/quizService";

interface AdminQuizzesProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminQuizzes: React.FC<AdminQuizzesProps> = ({ onNavigate }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getAdminQuizzesApi();
      setQuizzes(items);
    } catch (err: any) {
      setError(err.message || "Gagal memuat kuis admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const removeQuiz = async (quizId: string) => {
    if (!window.confirm("Hapus kuis ini? Kuis yang memiliki attempt akan diarsipkan.")) return;
    try {
      await deleteAdminQuizApi(quizId);
      await loadQuizzes();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus kuis.");
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => 
      (q.title?.toLowerCase().includes(search.toLowerCase()) || q.courseId?.toLowerCase().includes(search.toLowerCase())) &&
      (filter.status === "all" || q.status === filter.status)
    );
  }, [quizzes, search, filter]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-heading font-bold">Manajemen Quizzes</h1>
        <button 
            onClick={() => onNavigate("/admin/quizzes/new")}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-pastel-blue p-3 font-bold neo-shadow-sm transition-all hover:bg-opacity-90 sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Tambah Baru
        </button>
      </div>

      <NeoCard className="flex flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 w-full flex-1 items-center gap-3 rounded-xl border-2 border-black bg-white p-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 outline-none font-bold bg-transparent"
            placeholder="Cari berdasarkan title atau course ID..."
          />
        </div>
        <select 
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="w-full min-w-0 bg-white p-2 rounded-xl border-2 border-black font-bold outline-none sm:w-auto"
        >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
        </select>
      </NeoCard>

      <NeoCard className="p-0 overflow-hidden overflow-x-auto">
        {error && (
          <div className="m-4 flex min-w-0 flex-col items-stretch gap-3 rounded-xl border-2 border-black bg-pastel-peach p-3 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{error}</span>
            <button onClick={loadQuizzes} className="rounded-lg border-2 border-black bg-white px-3 py-1">Coba Lagi</button>
          </div>
        )}
        {loading && <div className="flex items-center justify-center gap-2 p-8 font-bold"><RefreshCw className="h-5 w-5 animate-spin" /> Memuat kuis...</div>}
        {!loading && (
        <table className="w-full min-w-[44rem] text-left">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="p-4 font-bold text-sm uppercase">Title</th>
              <th className="p-4 font-bold text-sm uppercase">Course ID</th>
              <th className="p-4 font-bold text-sm uppercase">Status</th>
              <th className="p-4 font-bold text-sm uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {filteredQuizzes.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Belum ada quiz.</td>
              </tr>
            ) : filteredQuizzes.map(quiz => (
              <tr key={quiz.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold">{quiz.title}</td>
                <td className="p-4 text-sm font-mono">{quiz.courseId}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded neo-border ${quiz.status === 'published' ? 'bg-pastel-mint' : quiz.status === 'draft' ? 'bg-pastel-yellow' : 'bg-gray-200'}`}>
                    {quiz.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => onNavigate(`/admin/quizzes/${quiz.id}`)} className="p-2 bg-pastel-blue rounded-lg neo-border"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => onNavigate(`/admin/quizzes/${quiz.id}/edit`)} className="p-2 bg-pastel-yellow rounded-lg neo-border"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => removeQuiz(quiz.id)} className="p-2 bg-pastel-peach rounded-lg neo-border"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </NeoCard>
    </div>
  );
};

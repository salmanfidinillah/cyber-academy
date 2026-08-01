import React, { useEffect, useState, useMemo } from "react";
import { User } from "../../types";
import { NeoCard } from "../NeoCard";
import { Plus, Search, Edit, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import {
  fetchAdminLessons,
  fetchAdminCourses,
  createAdminLesson,
  updateAdminLesson,
  deleteAdminLesson,
} from "../../services/adminContentService";

interface AdminLessonsProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const AdminLessons: React.FC<AdminLessonsProps> = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");

  // Pagination State
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    slug: "",
    summary: "",
    content: "",
    contentType: "text",
    estimatedDuration: 10,
    status: "draft",
    order: 0,
    xpReward: 15,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = async (cursorToFetch: string | null = currentCursor) => {
    setLoading(true);
    setError(null);
    try {
      const [lessonsRes, coursesRes] = await Promise.all([
        fetchAdminLessons({
          courseId: courseFilter || undefined,
          status: statusFilter,
          search,
          limit: 20,
          cursor: cursorToFetch || undefined,
        }),
        fetchAdminCourses(),
      ]);
      setLessons(lessonsRes.items || []);
      setNextCursor(lessonsRes.nextCursor || null);
      setCourses(coursesRes.items || []);
    } catch (err: any) {
      console.error("Error loading lessons:", err);
      setError(err.message || "Gagal memuat daftar lesson.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageIndex(0);
    setCurrentCursor(null);
    setCursorHistory([null]);
    loadData(null);
  }, [statusFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageIndex(0);
    setCurrentCursor(null);
    setCursorHistory([null]);
    loadData(null);
  };

  const handleOpenCreate = () => {
    setEditingLesson(null);
    const defaultCourseId = courses[0]?.id || "";
    setFormData({
      courseId: defaultCourseId,
      title: "",
      slug: "",
      summary: "",
      content: "",
      contentType: "text",
      estimatedDuration: 10,
      status: "draft",
      order: lessons.length + 1,
      xpReward: 15,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      courseId: lesson.courseId || "",
      title: lesson.title || "",
      slug: lesson.slug || "",
      summary: lesson.summary || lesson.objective || "",
      content: lesson.content || "",
      contentType: lesson.contentType || "text",
      estimatedDuration: lesson.estimatedDuration ?? 10,
      status: lesson.status || "draft",
      order: lesson.order ?? 0,
      xpReward: lesson.xpReward ?? 15,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title wajib diisi.");
      return;
    }
    if (!formData.courseId) {
      setFormError("Pilih Parent Course.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingLesson) {
        await updateAdminLesson(editingLesson.id, formData);
      } else {
        await createAdminLesson(formData);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      console.error("Form submit error:", err);
      setFormError(err.message || "Gagal menyimpan lesson.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    setDeleteError(null);

    try {
      await deleteAdminLesson(deletingId);
      setDeletingId(null);
      await loadData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Gagal menghapus lesson.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLessons = useMemo(() => {
    if (!search.trim()) return lessons;
    const s = search.toLowerCase();
    return lessons.filter(
      (l) => l.title?.toLowerCase().includes(s) || l.slug?.toLowerCase().includes(s)
    );
  }, [lessons, search]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 text-left">
      <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-heading font-bold">Manajemen Lessons</h1>
          <p className="text-sm text-gray-600 font-bold mt-1">Data tersimpan langsung di Cloud Firestore.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-pastel-blue p-3 font-bold neo-shadow-sm transition-all hover:bg-opacity-90 cursor-pointer sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Tambah Baru
        </button>
      </div>

      {error && (
        <NeoCard className="flex flex-col items-stretch gap-3 bg-pastel-pink p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="min-w-0 break-words font-bold text-red-800 [overflow-wrap:anywhere]">{error}</span>
          </div>
          <button onClick={() => loadData(null)} className="p-2 bg-white rounded-lg border-2 border-black font-bold flex items-center gap-1 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </NeoCard>
      )}

      <NeoCard className="p-4 flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex min-w-0 w-full flex-1 items-center gap-3 rounded-xl border-2 border-black bg-white p-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 outline-none font-bold bg-transparent"
            placeholder="Cari berdasarkan title atau slug..."
          />
        </form>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-auto">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="min-w-0 bg-white p-2 rounded-xl border-2 border-black font-bold outline-none cursor-pointer"
          >
            <option value="">Semua Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-0 bg-white p-2 rounded-xl border-2 border-black font-bold outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </NeoCard>

      <NeoCard className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="p-4 font-bold text-sm uppercase">Order</th>
              <th className="p-4 font-bold text-sm uppercase">Title / Slug</th>
              <th className="p-4 font-bold text-sm uppercase">Course ID</th>
              <th className="p-4 font-bold text-sm uppercase">Status</th>
              <th className="p-4 font-bold text-sm uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-bold">
                  Memuat data dari Firestore...
                </td>
              </tr>
            ) : filteredLessons.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-bold">
                  Belum ada lesson.
                </td>
              </tr>
            ) : (
              filteredLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold">{lesson.order ?? 0}</td>
                  <td className="p-4">
                    <div className="font-bold">{lesson.title}</div>
                    <div className="text-xs text-gray-500 font-mono">{lesson.slug || lesson.id}</div>
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-600">{lesson.courseId}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded neo-border ${
                        lesson.status === "published"
                          ? "bg-pastel-mint"
                          : lesson.status === "draft"
                          ? "bg-pastel-yellow"
                          : "bg-gray-200"
                      }`}
                    >
                      {lesson.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(lesson)}
                      className="p-2 bg-pastel-yellow rounded-lg neo-border hover:opacity-80 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(lesson.id);
                        setDeletingTitle(lesson.title);
                        setDeleteError(null);
                      }}
                      className="p-2 bg-pastel-pink rounded-lg neo-border text-red-700 hover:opacity-80 transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        <div className="flex min-w-[20rem] items-center justify-between gap-3 border-t-2 border-black bg-gray-50 p-4">
          <div className="text-xs font-bold text-gray-600">
            Halaman {pageIndex + 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pageIndex === 0 || loading}
              onClick={() => {
                if (pageIndex > 0) {
                  const prevCursor = cursorHistory[pageIndex - 1];
                  setPageIndex(pageIndex - 1);
                  setCurrentCursor(prevCursor);
                  loadData(prevCursor);
                }
              }}
              className="px-3 py-1 bg-pastel-mint border-2 border-black rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              &laquo; Prev
            </button>
            <button
              disabled={!nextCursor || loading}
              onClick={() => {
                if (nextCursor) {
                  const newHistory = [...cursorHistory.slice(0, pageIndex + 1), nextCursor];
                  setCursorHistory(newHistory);
                  setPageIndex(pageIndex + 1);
                  setCurrentCursor(nextCursor);
                  loadData(nextCursor);
                }
              }}
              className="px-3 py-1 bg-pastel-mint border-2 border-black rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next &raquo;
            </button>
          </div>
        </div>
      </NeoCard>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl space-y-4 overflow-y-auto overscroll-contain rounded-2xl border-2 border-black bg-white p-4 neo-shadow sm:p-6">
            <h2 className="text-2xl font-bold font-heading">
              {editingLesson ? "Edit Lesson" : "Tambah Lesson Baru"}
            </h2>

            {formError && (
              <div className="p-3 bg-pastel-pink border-2 border-black rounded-xl text-red-800 font-bold text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold mb-1">Parent Course *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full p-2 border-2 border-black rounded-xl font-bold"
                >
                  <option value="">-- Pilih Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Judul Lesson *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  placeholder="e.g. Pengantar Keamanan Siber"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Slug (Opsional)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  placeholder="Otomatis dari judul jika kosong"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Ringkasan / Objective</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  placeholder="Tujuan pembelajaran singkat..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Konten Materi (Markdown / Teks)</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border-2 border-black rounded-xl font-mono text-sm"
                  placeholder="Tuliskan isi materi pembelajaran..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-black rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t-2 border-gray-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-11 w-full px-4 py-2 border-2 border-black rounded-xl font-bold bg-gray-100 hover:bg-gray-200 cursor-pointer sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 w-full px-4 py-2 border-2 border-black rounded-xl font-bold bg-pastel-mint neo-shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer sm:w-auto"
                >
                  {submitting ? "Menyimpan..." : "Simpan Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-2xl border-2 border-black bg-white p-4 text-left neo-shadow sm:p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold font-heading">Konfirmasi Hapus Lesson</h3>
            </div>

            <p className="font-bold text-gray-700">
              Apakah Anda yakin ingin menghapus Lesson <span className="text-black">"{deletingTitle}"</span>?
            </p>

            {deleteError && (
              <div className="p-3 bg-pastel-pink border-2 border-black rounded-xl text-red-800 font-bold text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border-2 border-black rounded-xl font-bold bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 border-2 border-black rounded-xl font-bold bg-pastel-pink text-red-800 neo-shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

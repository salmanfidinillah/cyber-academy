import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Course, Question, QuestionOption, Quiz } from "../../types";
import { fetchAdminCourses } from "../../services/adminContentService";
import {
  createAdminQuestionApi,
  createAdminQuizApi,
  deleteAdminQuestionApi,
  getAdminQuestionsApi,
  getAdminQuizApi,
  updateAdminQuestionApi,
  updateAdminQuizApi,
} from "../../services/quizService";
import { NeoButton } from "../NeoButton";
import { NeoCard } from "../NeoCard";

interface Props {
  onNavigate: (route: string) => void;
}

const blankOptions = (): QuestionOption[] => [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
];

export const AdminQuizEditor: React.FC<Props> = ({ onNavigate }) => {
  const { id } = useParams();
  const location = useLocation();
  const isNew = location.pathname.endsWith("/new");
  const [courses, setCourses] = useState<Course[]>([]);
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    courseId: "",
    title: "",
    description: "",
    passingScore: 70,
    xpReward: 30,
    status: "draft",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Partial<Question>>({
    questionText: "",
    explanation: "",
    recommendedLessonId: null,
    order: 1,
    status: "draft",
    correctOptionId: "a",
    options: blankOptions(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesResponse = await fetchAdminCourses({ limit: 100 });
      setCourses(coursesResponse.items || coursesResponse || []);
      if (!isNew && id) {
        const [quizData, questionData] = await Promise.all([
          getAdminQuizApi(id),
          getAdminQuestionsApi(id),
        ]);
        setQuiz(quizData);
        setQuestions(questionData.sort((a, b) => a.order - b.order));
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat editor kuis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, isNew]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === quiz.courseId),
    [courses, quiz.courseId]
  );

  const saveQuiz = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        courseId: quiz.courseId,
        title: quiz.title,
        description: quiz.description,
        passingScore: Number(quiz.passingScore),
        xpReward: Number(quiz.xpReward),
        status: quiz.status,
      };
      if (isNew) {
        const created = await createAdminQuizApi(payload);
        onNavigate(`/admin/quizzes/${created.id}/edit`);
      } else if (id) {
        const updated = await updateAdminQuizApi(id, payload);
        setQuiz(updated);
        setNotice("Kuis berhasil disimpan.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kuis.");
    } finally {
      setSaving(false);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestion({
      questionText: "",
      explanation: "",
      recommendedLessonId: null,
      order: questions.length + 1,
      status: "draft",
      correctOptionId: "a",
      options: blankOptions(),
    });
  };

  const editQuestion = (item: Question) => {
    setEditingQuestionId(item.id);
    setQuestion({ ...item, options: item.options.map((option) => ({ ...option })) });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const saveQuestion = async () => {
    if (!id || !quiz.courseId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const options = (question.options || [])
        .map((option) => ({ id: option.id.trim(), text: option.text.trim() }))
        .filter((option) => option.id && option.text);
      const payload = {
        quizId: id,
        courseId: quiz.courseId,
        questionText: question.questionText,
        options,
        correctOptionId: question.correctOptionId,
        explanation: question.explanation,
        recommendedLessonId: question.recommendedLessonId || null,
        order: Number(question.order),
        status: question.status,
      };
      if (editingQuestionId) {
        await updateAdminQuestionApi(editingQuestionId, payload);
      } else {
        await createAdminQuestionApi(payload);
      }
      setQuestions((await getAdminQuestionsApi(id)).sort((a, b) => a.order - b.order));
      resetQuestionForm();
      setNotice("Pertanyaan berhasil disimpan.");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan pertanyaan.");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    if (!id || !window.confirm("Hapus pertanyaan ini?")) return;
    setSaving(true);
    try {
      await deleteAdminQuestionApi(questionId);
      setQuestions((await getAdminQuestionsApi(id)).sort((a, b) => a.order - b.order));
      if (editingQuestionId === questionId) resetQuestionForm();
      setNotice("Pertanyaan berhasil dihapus.");
    } catch (err: any) {
      setError(err.message || "Gagal menghapus pertanyaan.");
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: string) => {
    const next = [...(question.options || blankOptions())];
    next[index] = { ...next[index], [field]: value };
    setQuestion({ ...question, options: next });
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-bold">
        <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin" /> Memuat editor kuis...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NeoButton variant="secondary" onClick={() => onNavigate("/admin/quizzes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </NeoButton>
        <h1 className="min-w-0 break-words font-heading text-2xl font-extrabold [overflow-wrap:anywhere]">
          {isNew ? "Tambah Kuis" : `Editor Kuis: ${quiz.title || id}`}
        </h1>
      </div>

      {error && <div className="rounded-xl border-2 border-black bg-pastel-peach p-4 text-sm font-bold">{error}</div>}
      {notice && <div className="rounded-xl border-2 border-black bg-pastel-mint p-4 text-sm font-bold">{notice}</div>}

      <NeoCard className="grid gap-4 p-5 md:grid-cols-2">
        <label className="space-y-1 text-sm font-bold">
          <span>Course</span>
          <select
            className="w-full rounded-xl border-2 border-black bg-white p-3"
            value={quiz.courseId || ""}
            onChange={(event) => setQuiz({ ...quiz, courseId: event.target.value })}
            disabled={!isNew}
          >
            <option value="">Pilih course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold">
          <span>Status</span>
          <select
            className="w-full rounded-xl border-2 border-black bg-white p-3"
            value={quiz.status || "draft"}
            onChange={(event) => setQuiz({ ...quiz, status: event.target.value as Quiz["status"] })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold md:col-span-2">
          <span>Judul</span>
          <input className="w-full rounded-xl border-2 border-black p-3" value={quiz.title || ""} onChange={(event) => setQuiz({ ...quiz, title: event.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-bold md:col-span-2">
          <span>Deskripsi</span>
          <textarea className="min-h-24 w-full rounded-xl border-2 border-black p-3" value={quiz.description || ""} onChange={(event) => setQuiz({ ...quiz, description: event.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-bold">
          <span>Nilai Kelulusan</span>
          <input type="number" min={1} max={100} className="w-full rounded-xl border-2 border-black p-3" value={quiz.passingScore || 70} onChange={(event) => setQuiz({ ...quiz, passingScore: Number(event.target.value) })} />
        </label>
        <label className="space-y-1 text-sm font-bold">
          <span>XP Kelulusan Pertama</span>
          <input type="number" min={0} max={1000} className="w-full rounded-xl border-2 border-black p-3" value={quiz.xpReward || 0} onChange={(event) => setQuiz({ ...quiz, xpReward: Number(event.target.value) })} />
        </label>
        <div className="flex md:col-span-2 md:justify-end">
          <NeoButton variant="primary" disabled={saving || !quiz.courseId || !quiz.title || !quiz.description} onClick={saveQuiz} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Kuis"}
          </NeoButton>
        </div>
      </NeoCard>

      {!isNew && id && (
        <>
          <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-extrabold">Daftar Pertanyaan</h2>
              <p className="text-xs font-semibold text-brand-muted">{questions.length} pertanyaan · {selectedCourse?.title}</p>
            </div>
            <NeoButton variant="secondary" onClick={resetQuestionForm} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Pertanyaan Baru</NeoButton>
          </div>

          <div className="space-y-3">
            {questions.length === 0 && <NeoCard className="p-6 text-center text-sm font-bold">Belum ada pertanyaan.</NeoCard>}
            {questions.map((item) => (
              <NeoCard key={item.id} className="flex min-w-0 flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand-muted">Nomor {item.order} · {item.status}</p>
                  <h3 className="break-words font-bold [overflow-wrap:anywhere]">{item.questionText}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border-2 border-black bg-pastel-yellow p-2 font-bold" onClick={() => editQuestion(item)}>Edit</button>
                  <button className="rounded-lg border-2 border-black bg-pastel-peach p-2" onClick={() => removeQuestion(item.id)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </NeoCard>
            ))}
          </div>

          <NeoCard className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-extrabold">{editingQuestionId ? "Edit Pertanyaan" : "Pertanyaan Baru"}</h2>
            <textarea
              className="min-h-24 w-full rounded-xl border-2 border-black p-3"
              placeholder="Teks pertanyaan"
              value={question.questionText || ""}
              onChange={(event) => setQuestion({ ...question, questionText: event.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {(question.options || blankOptions()).map((option, index) => (
                <div key={index} className="flex min-w-0 gap-2">
                  <input className="w-16 rounded-xl border-2 border-black p-3 font-mono" value={option.id} onChange={(event) => updateOption(index, "id", event.target.value)} />
                  <input className="min-w-0 flex-1 rounded-xl border-2 border-black p-3" placeholder={`Opsi ${index + 1}`} value={option.text} onChange={(event) => updateOption(index, "text", event.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm font-bold">
                <span>Jawaban Benar</span>
                <select className="w-full rounded-xl border-2 border-black bg-white p-3" value={question.correctOptionId || ""} onChange={(event) => setQuestion({ ...question, correctOptionId: event.target.value })}>
                  {(question.options || []).filter((option) => option.id).map((option) => <option key={option.id} value={option.id}>{option.id}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm font-bold">
                <span>Urutan</span>
                <input type="number" min={1} className="w-full rounded-xl border-2 border-black p-3" value={question.order || 1} onChange={(event) => setQuestion({ ...question, order: Number(event.target.value) })} />
              </label>
              <label className="space-y-1 text-sm font-bold">
                <span>Status</span>
                <select className="w-full rounded-xl border-2 border-black bg-white p-3" value={question.status || "draft"} onChange={(event) => setQuestion({ ...question, status: event.target.value as Question["status"] })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <textarea
              className="min-h-20 w-full rounded-xl border-2 border-black p-3"
              placeholder="Penjelasan jawaban"
              value={question.explanation || ""}
              onChange={(event) => setQuestion({ ...question, explanation: event.target.value })}
            />
            <input
              className="w-full rounded-xl border-2 border-black p-3"
              placeholder="Recommended lesson ID (opsional)"
              value={question.recommendedLessonId || ""}
              onChange={(event) => setQuestion({ ...question, recommendedLessonId: event.target.value || null })}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {editingQuestionId && <NeoButton variant="secondary" onClick={resetQuestionForm} className="w-full sm:w-auto">Batal Edit</NeoButton>}
              <NeoButton variant="primary" disabled={saving} onClick={saveQuestion} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" /> Simpan Pertanyaan</NeoButton>
            </div>
          </NeoCard>
        </>
      )}
    </div>
  );
};

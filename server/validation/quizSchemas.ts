import { z } from "zod";

export const QuestionOptionSchema = z.object({
  id: z.string().trim().min(1, "ID opsi wajib diisi").max(24),
  text: z.string().trim().min(1, "Teks opsi wajib diisi").max(500),
}).strict();

export const QuizCreateSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID wajib diisi").max(128),
  title: z.string().trim().min(3, "Judul quiz minimal 3 karakter").max(160),
  description: z.string().trim().min(5, "Deskripsi minimal 5 karakter").max(2000),
  passingScore: z.number().int().min(1).max(100, "Passing score antara 1 dan 100"),
  xpReward: z.number().int().min(0).max(1000, "XP reward tidak valid"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
}).strict();

export const QuizUpdateSchema = QuizCreateSchema.partial();

export const QuestionCreateSchema = z.object({
  quizId: z.string().trim().min(1, "Quiz ID wajib diisi").max(128),
  courseId: z.string().trim().min(1, "Course ID wajib diisi").max(128),
  questionText: z.string().trim().min(5, "Teks pertanyaan minimal 5 karakter").max(2000),
  options: z.array(QuestionOptionSchema).min(2, "Minimal 2 opsi").max(6, "Maksimal 6 opsi"),
  correctOptionId: z.string().trim().min(1, "ID jawaban benar wajib diisi").max(24),
  explanation: z.string().trim().min(5, "Penjelasan minimal 5 karakter").max(3000),
  recommendedLessonId: z.string().trim().max(128).optional().nullable(),
  order: z.number().int().positive("Urutan harus angka positif"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
}).strict();

export const QuestionUpdateSchema = QuestionCreateSchema.partial();

export const QuizSubmissionSchema = z.object({
  answers: z.record(z.string().max(128), z.string().max(24)).refine((val) => Object.keys(val).length > 0 && Object.keys(val).length <= 100, {
    message: "Jawaban kuis tidak boleh kosong",
  }),
}).strict();

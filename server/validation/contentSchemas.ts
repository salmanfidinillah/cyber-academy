import { z } from "zod";

export function normalizeSlug(str: string): string {
  const normalized = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.substring(0, 120);
}

export const StatusSchema = z.enum(["draft", "published", "archived"]);

const ThumbnailUrlSchema = z
  .string()
  .max(500, "Thumbnail URL maksimal 500 karakter")
  .refine(
    (val) => val === "" || /^https?:\/\/.+/i.test(val),
    "Thumbnail URL harus berupa URL HTTP/HTTPS yang valid atau string kosong"
  )
  .default("");

export const LearningPathCreateSchema = z
  .object({
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").default(""),
    shortDescription: z.string().max(300, "Deskripsi singkat maksimal 300 karakter").optional(),
    level: z.string().max(50).default("Beginner"),
    estimatedDuration: z.number().int().min(0).default(60),
    thumbnailURL: ThumbnailUrlSchema,
    status: StatusSchema.default("draft"),
    order: z.number().int().min(0).default(0),
    xpReward: z.number().int().min(0).optional(),
    badgeName: z.string().max(100).optional(),
    bgColor: z.string().max(50).optional(),
  })
  .strict();

export const LearningPathUpdateSchema = z
  .object({
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim().optional(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
    shortDescription: z.string().max(300, "Deskripsi singkat maksimal 300 karakter").optional(),
    level: z.string().max(50).optional(),
    estimatedDuration: z.number().int().min(0).optional(),
    thumbnailURL: ThumbnailUrlSchema.optional(),
    status: StatusSchema.optional(),
    order: z.number().int().min(0).optional(),
    xpReward: z.number().int().min(0).optional(),
    badgeName: z.string().max(100).optional(),
    bgColor: z.string().max(50).optional(),
  })
  .strict();

export const CourseCreateSchema = z
  .object({
    learningPathId: z.string().min(1, "learningPathId wajib diisi"),
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").default(""),
    shortDescription: z.string().max(300, "Deskripsi singkat maksimal 300 karakter").optional(),
    category: z.string().max(100).default("General"),
    level: z.string().max(50).default("beginner"),
    estimatedDuration: z.number().int().min(0).default(30),
    thumbnailURL: ThumbnailUrlSchema,
    status: StatusSchema.default("draft"),
    order: z.number().int().min(0).default(0),
    xpReward: z.number().int().min(0).optional(),
    learningOutcomes: z.array(z.string().max(300)).max(20).optional(),
  })
  .strict();

export const CourseUpdateSchema = z
  .object({
    learningPathId: z.string().min(1, "learningPathId wajib diisi").optional(),
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim().optional(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
    shortDescription: z.string().max(300, "Deskripsi singkat maksimal 300 karakter").optional(),
    category: z.string().max(100).optional(),
    level: z.string().max(50).optional(),
    estimatedDuration: z.number().int().min(0).optional(),
    thumbnailURL: ThumbnailUrlSchema.optional(),
    status: StatusSchema.optional(),
    order: z.number().int().min(0).optional(),
    xpReward: z.number().int().min(0).optional(),
    learningOutcomes: z.array(z.string().max(300)).max(20).optional(),
  })
  .strict();

export const LessonCreateSchema = z
  .object({
    courseId: z.string().min(1, "courseId wajib diisi"),
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    summary: z.string().max(1000, "Ringkasan maksimal 1000 karakter").default(""),
    objective: z.string().max(1000, "Tujuan pembelajaran maksimal 1000 karakter").optional(),
    content: z.string().max(50000, "Konten maksimal 50000 karakter").default(""),
    contentType: z.string().max(50).default("text"),
    estimatedDuration: z.number().int().min(0).default(10),
    status: StatusSchema.default("draft"),
    order: z.number().int().min(0).default(0),
    xpReward: z.number().int().min(0).optional(),
    exampleCase: z
      .object({
        title: z.string().max(150),
        description: z.string().max(1000),
      })
      .optional(),
    securityTips: z.array(z.string().max(300)).max(20).optional(),
    keyTakeaways: z.array(z.string().max(300)).max(20).optional(),
  })
  .strict();

export const LessonUpdateSchema = z
  .object({
    courseId: z.string().min(1, "courseId wajib diisi").optional(),
    title: z.string().min(3, "Title minimal 3 karakter").max(120, "Title maksimal 120 karakter").trim().optional(),
    slug: z.string().max(120, "Slug maksimal 120 karakter").optional(),
    summary: z.string().max(1000, "Ringkasan maksimal 1000 karakter").optional(),
    objective: z.string().max(1000, "Tujuan pembelajaran maksimal 1000 karakter").optional(),
    content: z.string().max(50000, "Konten maksimal 50000 karakter").optional(),
    contentType: z.string().max(50).optional(),
    estimatedDuration: z.number().int().min(0).optional(),
    status: StatusSchema.optional(),
    order: z.number().int().min(0).optional(),
    xpReward: z.number().int().min(0).optional(),
    exampleCase: z
      .object({
        title: z.string().max(150),
        description: z.string().max(1000),
      })
      .optional(),
    securityTips: z.array(z.string().max(300)).max(20).optional(),
    keyTakeaways: z.array(z.string().max(300)).max(20).optional(),
  })
  .strict();

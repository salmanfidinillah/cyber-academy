// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Course, Lesson, UserProgress } from "../types";
import { MemoryRouter } from "react-router-dom";

const catalogMocks = vi.hoisted(() => ({
  fetchCatalogLessonByCourseAndLessonSlug: vi.fn(),
  fetchCatalogCourseById: vi.fn(),
  fetchCatalogLessonsForCourse: vi.fn(),
}));

const learningMocks = vi.hoisted(() => ({
  fetchMyProgress: vi.fn(),
  completeMyLesson: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  recordRemedialLessonView: vi.fn(),
  createAiConversation: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  authenticatedFetch: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  refreshUserProfile: vi.fn(),
}));

vi.mock("../services/catalogService", () => catalogMocks);
vi.mock("../services/learningStateService", () => learningMocks);
vi.mock("../lib/learningStore", () => storeMocks);
vi.mock("../services/apiClient", () => apiMocks);
vi.mock("../contexts/UserContext", () => ({
  useUser: () => ({ refreshUserProfile: userMocks.refreshUserProfile }),
}));

import { LessonDetail } from "./LessonDetail";
import { AppShell } from "./navigation/AppShell";

const course: Course = {
  id: "course-one",
  learningPathId: "beginner-path",
  title: "Dasar Keamanan Digital",
  slug: "course-one",
  description: "Kelas keamanan digital untuk pemula.",
  category: "Cyber Safety",
  level: "beginner",
  order: 1,
  estimatedDuration: 60,
  xpReward: 50,
  learningOutcomes: ["Mengenali risiko"],
  lessonCount: 3,
  status: "published",
};

const lessons: Lesson[] = [
  {
    id: "lesson-one",
    courseId: course.id,
    learningPathId: course.learningPathId,
    title: "Mengenal Keamanan Digital",
    slug: "lesson-one",
    order: 1,
    objective: "Memahami dasar keamanan digital.",
    content:
      "**Pendahuluan**\nKeamanan digital melindungi data dan akun.\n\n**Konsep Utama**\n1. **Akun aman** — gunakan perlindungan berlapis.\n2. **Data aman** — batasi akses.\n- Periksa alamat situs\n- Gunakan kata sandi kuat",
    exampleCase: {
      title: "Pesan mencurigakan",
      description: "Pengguna menerima tautan yang meminta kata sandi.",
    },
    securityTips: ["Periksa pengirim", "Jangan bagikan kata sandi"],
    keyTakeaways: ["Verifikasi sebelum percaya"],
    estimatedDuration: 8,
    xpReward: 15,
    status: "published",
  },
  {
    id: "lesson-two",
    courseId: course.id,
    learningPathId: course.learningPathId,
    title: "Melindungi Akun",
    slug: "lesson-two",
    order: 2,
    objective: "Memahami perlindungan akun.",
    content: "**Pendahuluan**\nGunakan autentikasi berlapis.",
    keyTakeaways: ["Aktifkan MFA"],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published",
  },
  {
    id: "lesson-three",
    courseId: course.id,
    learningPathId: course.learningPathId,
    title: "Menjaga Privasi",
    slug: "lesson-three",
    order: 3,
    objective: "Memahami privasi.",
    content: "**Pendahuluan**\nBatasi data yang dibagikan.",
    keyTakeaways: ["Tinjau izin aplikasi"],
    estimatedDuration: 9,
    xpReward: 15,
    status: "published",
  },
];

const completedProgress = (lesson: Lesson): UserProgress => ({
  progressId: `user-a_lesson_${lesson.id}`,
  userId: "user-a",
  contentType: "lesson",
  contentId: lesson.id,
  learningPathId: course.learningPathId,
  courseId: course.id,
  status: "completed",
  progressPercent: 100,
  startedAt: "2026-07-29T00:00:00.000Z",
  completedAt: "2026-07-29T00:01:00.000Z",
  updatedAt: "2026-07-29T00:01:00.000Z",
});

const currentUser = {
  uid: "user-a",
  displayName: "Salman",
  email: "salman@example.com",
  currentLevel: 2,
  totalXp: 30,
  learningStreak: 1,
} as any;

const renderLesson = ({
  lesson = lessons[0],
  progress = [],
  onNavigate = vi.fn<(route: string) => void>(),
}: {
  lesson?: Lesson;
  progress?: UserProgress[];
  onNavigate?: (route: string) => void;
} = {}) => {
  catalogMocks.fetchCatalogLessonByCourseAndLessonSlug.mockResolvedValue(lesson);
  catalogMocks.fetchCatalogCourseById.mockResolvedValue(course);
  catalogMocks.fetchCatalogLessonsForCourse.mockResolvedValue(lessons);
  learningMocks.fetchMyProgress.mockResolvedValue(progress);

  const renderResult = render(
    <LessonDetail
      currentUser={currentUser}
      onNavigate={onNavigate}
      courseSlug={course.slug}
      lessonSlug={lesson.slug}
    />,
  );

  return { onNavigate, ...renderResult };
};

const openMaterialDrawer = async () => {
  const trigger = await screen.findByRole("button", { name: "Daftar Materi" });
  fireEvent.click(trigger);
  return screen.getByRole("dialog", { name: "Daftar Materi" });
};

const openAiPanel = async () => {
  const trigger = await screen.findByRole("button", { name: "Tanya AI Tutor" });
  fireEvent.click(trigger);
  return screen.getByRole("dialog", { name: "AI Tutor Materi" });
};

beforeEach(() => {
  vi.clearAllMocks();
  storeMocks.recordRemedialLessonView.mockResolvedValue(undefined);
  storeMocks.createAiConversation.mockResolvedValue({ conversationId: "conversation-one" });
  learningMocks.completeMyLesson.mockResolvedValue({
    xpEarned: 15,
    alreadyCompleted: false,
    totalXp: 45,
    currentLevel: 2,
    levelUp: false,
    learningStreak: 1,
    lessonProgress: completedProgress(lessons[0]),
    courseProgress: {
      ...completedProgress(lessons[0]),
      contentType: "course",
      contentId: course.id,
      progressPercent: 33,
      completedLessonCount: 1,
      totalLessonCount: 3,
      lessonsCompleted: false,
    },
    pathProgress: {
      ...completedProgress(lessons[0]),
      contentType: "path",
      contentId: course.learningPathId,
      progressPercent: 0,
    },
  });
  userMocks.refreshUserProfile.mockResolvedValue(undefined);
  apiMocks.authenticatedFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ answer: "Gunakan autentikasi berlapis." }),
  });

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0);
    window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
  }
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("LessonDetail focused lesson layout", () => {
  it("1. renders the lesson, objective, structured content, and progress", async () => {
    renderLesson();
    expect(await screen.findByRole("heading", { name: lessons[0].title })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Pendahuluan" })).toBeTruthy();
    expect(screen.getByText("Keamanan digital melindungi data dan akun.")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("2. keeps the canonical back button in AppShell and no duplicate in lesson content", () => {
    render(
      <MemoryRouter initialEntries={["/learn/courses/course-one/lessons/lesson-one"]}>
        <AppShell
          currentUser={currentUser}
          currentRoute="/learn/courses/course-one/lessons/lesson-one"
          onNavigate={vi.fn()}
          onLogout={vi.fn()}
        >
          <div>Lesson child</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("button", { name: "Kembali ke Detail Kelas" })).toHaveLength(1);
  });

  it("3. opens the material drawer from the toolbar", async () => {
    renderLesson();
    expect(await openMaterialDrawer()).toBeTruthy();
    expect(screen.getByRole("button", { name: "Daftar Materi" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("4. closes the material drawer from its close button", async () => {
    renderLesson();
    await openMaterialDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Tutup Daftar Materi" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Daftar Materi" })).toBeNull(),
    );
  });

  it("5. selects an unlocked material using the existing route", async () => {
    const { onNavigate } = renderLesson({ progress: [completedProgress(lessons[0])] });
    const drawer = await openMaterialDrawer();
    fireEvent.click(within(drawer).getByRole("button", { name: /2\. Melindungi Akun/ }));
    expect(onNavigate).toHaveBeenCalledWith(
      "/learn/courses/course-one/lessons/lesson-two",
    );
    expect(screen.queryByRole("dialog", { name: "Daftar Materi" })).toBeNull();
  });

  it("6. exposes the active material with aria-current", async () => {
    renderLesson();
    const drawer = await openMaterialDrawer();
    expect(
      within(drawer)
        .getByRole("button", { name: /1\. Mengenal Keamanan Digital/ })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("7. preserves the existing locked-material behavior", async () => {
    renderLesson();
    const drawer = await openMaterialDrawer();
    const lockedLesson = within(drawer).getByRole("button", {
      name: /2\. Melindungi Akun.*terkunci/,
    });
    expect((lockedLesson as HTMLButtonElement).disabled).toBe(true);
  });

  it("8. opens AI Tutor as a dialog panel", async () => {
    renderLesson();
    expect(await openAiPanel()).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tanya AI Tutor" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("9. does not create a conversation or send an AI request when opening the panel", async () => {
    renderLesson();
    await openAiPanel();
    expect(apiMocks.authenticatedFetch).not.toHaveBeenCalled();
    expect(storeMocks.createAiConversation).not.toHaveBeenCalled();
  });

  it("10. keeps the composer within the AI dialog", async () => {
    renderLesson();
    const dialog = await openAiPanel();
    const composer = screen.getByTestId("lesson-ai-composer");
    expect(dialog.contains(composer)).toBe(true);
    expect(composer.className).toContain("shrink-0");
  });

  it("11. sends a question through the existing AI endpoint and context", async () => {
    renderLesson();
    const dialog = await openAiPanel();
    fireEvent.change(within(dialog).getByLabelText("Pertanyaan untuk AI Tutor"), {
      target: { value: "Apa itu autentikasi?" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kirim pertanyaan ke AI Tutor" }));

    await waitFor(() => expect(apiMocks.authenticatedFetch).toHaveBeenCalledTimes(1));
    expect(apiMocks.authenticatedFetch.mock.calls[0][0]).toBe("/api/ai/tutor");
    const request = apiMocks.authenticatedFetch.mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body.message).toBe("Apa itu autentikasi?");
    expect(body.contextType).toBe("lesson");
    expect(body.lessonTitle).toBe(lessons[0].title);
  });

  it("12. exposes the existing AI loading state in the panel", async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    apiMocks.authenticatedFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    renderLesson();
    const dialog = await openAiPanel();
    fireEvent.change(within(dialog).getByLabelText("Pertanyaan untuk AI Tutor"), {
      target: { value: "Tolong jelaskan" },
    });
    fireEvent.submit(screen.getByTestId("lesson-ai-composer"));
    expect(await within(dialog).findByText("AI sedang merumuskan saran aman...")).toBeTruthy();
    resolveRequest({ ok: true, json: async () => ({ answer: "Jawaban" }) });
  });

  it("13. keeps lesson content visible when the AI request fails", async () => {
    apiMocks.authenticatedFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "AI sementara tidak tersedia" }),
    });
    renderLesson();
    const dialog = await openAiPanel();
    fireEvent.change(within(dialog).getByLabelText("Pertanyaan untuk AI Tutor"), {
      target: { value: "Tolong bantu" },
    });
    fireEvent.submit(screen.getByTestId("lesson-ai-composer"));
    expect(await within(dialog).findByText("AI sementara tidak tersedia")).toBeTruthy();
    expect(screen.getByRole("heading", { name: lessons[0].title })).toBeTruthy();
  });

  it("14. completes a lesson through the existing completion handler", async () => {
    renderLesson();
    fireEvent.click(await screen.findByRole("button", { name: /Tandai Selesai/ }));
    await waitFor(() => expect(learningMocks.completeMyLesson).toHaveBeenCalledWith("lesson-one"));
    expect(userMocks.refreshUserProfile).toHaveBeenCalledTimes(1);
  });

  it("15. prevents a double click from creating duplicate completion requests", async () => {
    let resolveCompletion: (value: unknown) => void = () => undefined;
    learningMocks.completeMyLesson.mockReturnValue(
      new Promise((resolve) => {
        resolveCompletion = resolve;
      }),
    );
    renderLesson();
    const button = await screen.findByRole("button", { name: /Tandai Selesai/ });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(learningMocks.completeMyLesson).toHaveBeenCalledTimes(1);
    resolveCompletion({
      xpEarned: 15,
      levelUp: false,
      courseProgress: { progressPercent: 33, lessonsCompleted: false },
    });
  });

  it("16. keeps next lesson locked until completion", async () => {
    renderLesson();
    const nextButton = await screen.findByRole("button", {
      name: "Materi berikutnya terkunci sampai materi ini selesai",
    });
    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("17. navigates to the next lesson only after current completion", async () => {
    const { onNavigate } = renderLesson({ progress: [completedProgress(lessons[0])] });
    fireEvent.click(
      await screen.findByRole("button", { name: "Buka materi berikutnya" }),
    );
    expect(onNavigate).toHaveBeenCalledWith(
      "/learn/courses/course-one/lessons/lesson-two",
    );
  });

  it("18. keeps previous lesson navigation on the existing route", async () => {
    const { onNavigate } = renderLesson({
      lesson: lessons[1],
      progress: [completedProgress(lessons[0])],
    });
    fireEvent.click(await screen.findByRole("button", { name: /Materi Sebelumnya/ }));
    expect(onNavigate).toHaveBeenCalledWith(
      "/learn/courses/course-one/lessons/lesson-one",
    );
  });

  it("19. shows completion progress supplied by the existing progress response", async () => {
    renderLesson({ progress: [completedProgress(lessons[0])] });
    const progressbar = await screen.findByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("33");
    expect(progressbar.getAttribute("aria-valuetext")).toBe("1 dari 3 materi selesai");
  });

  it("20. opening and closing UI panels does not change XP or completion state", async () => {
    renderLesson();
    await openMaterialDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Tutup Daftar Materi" }));
    await openAiPanel();
    fireEvent.click(screen.getByRole("button", { name: "Tutup AI Tutor Materi" }));
    expect(learningMocks.completeMyLesson).not.toHaveBeenCalled();
    expect(userMocks.refreshUserProfile).not.toHaveBeenCalled();
  });

  it("21. does not render permanent material or AI columns", async () => {
    const { container } = renderLesson();
    await screen.findByRole("heading", { name: lessons[0].title });
    expect(screen.queryByRole("dialog", { name: "Daftar Materi" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "AI Tutor Materi" })).toBeNull();
    expect(container.querySelector(".lg\\:grid-cols-12")).toBeNull();
  });

  it("22. scopes long-content overflow inside the lesson reader and AI composer", async () => {
    const { container } = renderLesson();
    await screen.findByRole("heading", { name: lessons[0].title });
    expect(container.querySelector(".lesson-reading-content")).toBeTruthy();
    const dialog = await openAiPanel();
    expect(within(dialog).getByLabelText("Pertanyaan untuk AI Tutor").className).toContain("min-w-0");
  });

  it("23. closes a drawer with Escape", async () => {
    renderLesson();
    await openMaterialDrawer();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Daftar Materi" })).toBeNull(),
    );
  });

  it("24. returns focus to the trigger when a drawer closes", async () => {
    renderLesson();
    const trigger = await screen.findByRole("button", { name: "Daftar Materi" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("25. leaves the non-lesson quiz back action unchanged", () => {
    render(
      <MemoryRouter initialEntries={["/learn/courses/course-one/quiz"]}>
        <AppShell
          currentUser={currentUser}
          currentRoute="/learn/courses/course-one/quiz"
          onNavigate={vi.fn()}
          onLogout={vi.fn()}
        >
          <div>Quiz child</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Kembali ke Detail Kursus" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Kembali ke Detail Kelas" })).toBeNull();
  });

  it("26. creates a full-screen conversation only when the old action is clicked", async () => {
    const { onNavigate } = renderLesson();
    const dialog = await openAiPanel();
    fireEvent.click(within(dialog).getByRole("button", { name: /Layar Penuh/ }));
    await waitFor(() =>
      expect(storeMocks.createAiConversation).toHaveBeenCalledWith(
        "user-a",
        "lesson",
        "beginner-path",
        "course-one",
        "lesson-one",
        `Tutor Lesson: ${lessons[0].title}`,
      ),
    );
    expect(onNavigate).toHaveBeenCalledWith("/ai-tutor/conversation-one");
  });
});

describe("LessonDetail responsive viewport contract", () => {
  it.each([
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ])("keeps a single-column reader contract at $width × $height", async ({ width, height }) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });

    const { container } = renderLesson();
    await screen.findByRole("heading", { name: lessons[0].title });

    expect(container.querySelector(".lg\\:grid-cols-12")).toBeNull();
    expect(container.querySelector(".lesson-reading-content")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Daftar Materi" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tanya AI Tutor" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Daftar Materi" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "AI Tutor Materi" })).toBeNull();
  });
});

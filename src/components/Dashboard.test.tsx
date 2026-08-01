// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

const dashboardMocks = vi.hoisted(() => ({
  context: { currentUser: null as any },
  fetchCatalogLearningPaths: vi.fn(),
  fetchCatalogCoursesForPath: vi.fn(),
  fetchCatalogLessonsForCourse: vi.fn(),
  fetchMyProgress: vi.fn(),
  fetchMyBadges: vi.fn(),
  fetchMyCertificates: vi.fn(),
}));

vi.mock("../contexts/UserContext", () => ({
  useUser: () => ({ currentUser: dashboardMocks.context.currentUser }),
}));

vi.mock("../services/catalogService", () => ({
  fetchCatalogLearningPaths: dashboardMocks.fetchCatalogLearningPaths,
  fetchCatalogCoursesForPath: dashboardMocks.fetchCatalogCoursesForPath,
  fetchCatalogLessonsForCourse: dashboardMocks.fetchCatalogLessonsForCourse,
}));

vi.mock("../services/learningStateService", () => ({
  fetchMyProgress: dashboardMocks.fetchMyProgress,
}));

vi.mock("../services/achievementService", () => ({
  fetchMyBadges: dashboardMocks.fetchMyBadges,
  fetchMyCertificates: dashboardMocks.fetchMyCertificates,
}));

const user = {
  uid: "user-1",
  displayName: "Salman",
  email: "salman@example.com",
  photoURL: "",
  role: "user",
  accountStatus: "active",
  onboardingCompleted: true,
  totalXp: 240,
  currentLevel: 3,
  learningStreak: 5,
  lastStudyDate: null,
  lastActiveAt: null,
  createdAt: "2026-07-01",
  updatedAt: "2026-07-29",
  learningGoal: "career",
  studyTime: "15min",
} as const;

const beginnerPath = {
  id: "beginner",
  title: "Beginner",
  description: "Fondasi keamanan digital.",
  level: "Beginner",
  courseCount: 1,
  durationMinutes: 60,
  xpReward: 100,
  courses: [],
  bgColor: "bg-pastel-mint",
  badgeName: "Beginner Master",
  order: 1,
};

const beginnerCourse = {
  id: "course-1",
  learningPathId: "beginner",
  title: "Dasar Keamanan Akun",
  slug: "dasar-keamanan-akun",
  description: "Dasar keamanan.",
  category: "fundamental",
  level: "beginner",
  order: 1,
  estimatedDuration: 20,
  xpReward: 30,
  learningOutcomes: [],
  lessonCount: 1,
  status: "published",
};

const beginnerLesson = {
  id: "lesson-1",
  courseId: "course-1",
  learningPathId: "beginner",
  title: "Membuat Password Kuat",
  slug: "membuat-password-kuat",
  order: 1,
  objective: "Membuat password kuat.",
  content: "Materi",
  keyTakeaways: [],
  estimatedDuration: 10,
  xpReward: 10,
  status: "published",
};

const progress = [
  {
    progressId: "user-1_path_beginner",
    userId: "user-1",
    contentType: "path",
    contentId: "beginner",
    status: "in_progress",
    progressPercent: 40,
    startedAt: "2026-07-28",
    updatedAt: "2026-07-29",
  },
  {
    progressId: "user-1_course_course-1",
    userId: "user-1",
    contentType: "course",
    contentId: "course-1",
    status: "in_progress",
    progressPercent: 50,
    startedAt: "2026-07-28",
    updatedAt: "2026-07-29",
  },
];

function renderDashboard(onNavigate = vi.fn()) {
  return {
    onNavigate,
    ...render(
      <Dashboard
        currentUser={user as any}
        onLogout={() => undefined}
        onNavigate={onNavigate}
      />,
    ),
  };
}

describe("Dashboard UI polish", () => {
  beforeEach(() => {
    dashboardMocks.context.currentUser = user;
    dashboardMocks.fetchCatalogLearningPaths.mockReset().mockResolvedValue([beginnerPath]);
    dashboardMocks.fetchCatalogCoursesForPath.mockReset().mockResolvedValue([beginnerCourse]);
    dashboardMocks.fetchCatalogLessonsForCourse.mockReset().mockResolvedValue([beginnerLesson]);
    dashboardMocks.fetchMyProgress.mockReset().mockResolvedValue(progress);
    dashboardMocks.fetchMyBadges.mockReset().mockResolvedValue([
      { badgeId: "badge-cyber-defender", userId: "user-1" },
    ]);
    dashboardMocks.fetchMyCertificates.mockReset().mockResolvedValue([
      { certificateId: "cert-1", status: "active" },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the Dashboard with backend user, XP, level, and streak data", async () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Selamat datang kembali, Salman" })).toBeTruthy();
    expect(screen.getByText("Total XP").closest("article")?.textContent).toContain("240");
    expect(screen.getByText("Level").closest("article")?.textContent).toContain("Lvl 3");
    expect(screen.getByText("Streak").closest("article")?.textContent).toContain("5");
    await screen.findByRole("button", { name: /Dasar Keamanan Akun/i });
  });

  it("keeps backend progress values and the existing progress calculation visible", async () => {
    renderDashboard();

    const progressBars = await screen.findAllByRole("progressbar", { name: "Progres Jalur Beginner" });
    expect(progressBars.some((bar) => bar.getAttribute("aria-valuenow") === "40")).toBe(true);
    expect(screen.getByText("50% selesai · 1 materi")).toBeTruthy();
  });

  it("keeps the primary continue CTA on the existing lesson route", async () => {
    const { onNavigate } = renderDashboard();

    fireEvent.click(await screen.findByRole("button", { name: /Lanjutkan Belajar/i }));
    expect(onNavigate).toHaveBeenCalledWith(
      "/learn/courses/dasar-keamanan-akun/lessons/membuat-password-kuat",
    );
  });

  it("keeps progress and AI Insight navigation handlers on their old routes", async () => {
    const { onNavigate } = renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Lihat Progress" }));
    fireEvent.click(screen.getByRole("button", { name: "Lihat Insight Belajar" }));

    expect(onNavigate).toHaveBeenCalledWith("/progress");
    expect(onNavigate).toHaveBeenCalledWith("/progress/insight");
  });

  it("renders badge and certificate values returned by the existing achievement requests", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("1/4")).toBeTruthy();
      expect(screen.getByText("Aktif")).toBeTruthy();
      expect(screen.getByText("Sudah diraih")).toBeTruthy();
    });
  });

  it("shows a friendly empty state with one path CTA", async () => {
    dashboardMocks.fetchCatalogLearningPaths.mockResolvedValue([]);
    const { onNavigate } = renderDashboard();

    expect(await screen.findByText("Mulai perjalanan siber pertamamu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Jelajahi Jalur Belajar" }));
    expect(onNavigate).toHaveBeenCalledWith("/learn/paths");
  });

  it("shows the Dashboard loading state without changing the request contract", () => {
    dashboardMocks.fetchCatalogLearningPaths.mockReturnValue(new Promise(() => undefined));
    renderDashboard();

    expect(screen.getByRole("status", { name: "Memuat katalog pembelajaran" })).toBeTruthy();
    expect(screen.getByText("Menyiapkan misi belajarmu...")).toBeTruthy();
  });

  it("shows the existing catalog error with retry behavior", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    dashboardMocks.fetchCatalogLearningPaths.mockRejectedValue(new Error("Katalog offline"));
    renderDashboard();

    expect((await screen.findByRole("alert")).textContent).toContain("Katalog offline");
    fireEvent.click(screen.getByRole("button", { name: "Coba Lagi" }));
    await waitFor(() => expect(dashboardMocks.fetchCatalogLearningPaths).toHaveBeenCalledTimes(2));
  });

  it("does not duplicate Dashboard data requests during a normal render", async () => {
    renderDashboard();

    await screen.findByRole("button", { name: /Dasar Keamanan Akun/i });
    expect(dashboardMocks.fetchMyProgress).toHaveBeenCalledTimes(1);
    expect(dashboardMocks.fetchMyBadges).toHaveBeenCalledTimes(1);
    expect(dashboardMocks.fetchMyCertificates).toHaveBeenCalledTimes(1);
    expect(dashboardMocks.fetchCatalogLearningPaths).toHaveBeenCalledTimes(1);
    expect(dashboardMocks.fetchCatalogCoursesForPath).toHaveBeenCalledTimes(1);
    expect(dashboardMocks.fetchCatalogLessonsForCourse).toHaveBeenCalledTimes(1);
  });

  it("renders a profile skeleton and avoids data requests while the user is unavailable", () => {
    dashboardMocks.context.currentUser = null;
    render(
      <Dashboard
        currentUser={undefined}
        onLogout={() => undefined}
        onNavigate={() => undefined}
      />,
    );

    expect(screen.getByRole("status", { name: "Memuat profil dan Dashboard" })).toBeTruthy();
    expect(dashboardMocks.fetchMyProgress).not.toHaveBeenCalled();
    expect(dashboardMocks.fetchCatalogLearningPaths).not.toHaveBeenCalled();
  });

  it("uses responsive no-overflow classes and reduced-motion fallbacks locally", () => {
    const dashboardPath = path.resolve(process.cwd(), "src/components/Dashboard.tsx");
    const source = fs.readFileSync(dashboardPath, "utf-8");

    expect(source).toContain("min-w-0");
    expect(source).toContain("grid-cols-2");
    expect(source).toContain("sm:grid-cols-3");
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain("motion-reduce:transition-none");
  });

  it("does not alter routes outside Dashboard", () => {
    const appPath = path.resolve(process.cwd(), "src/App.tsx");
    const source = fs.readFileSync(appPath, "utf-8");

    expect(source).toContain('<Route path="/dashboard" element={<DashboardRoute />} />');
    expect(source).toContain('<Route path="/learn/paths" element={<LearningPathsRoute />} />');
    expect(source).toContain('<Route path="/simulations" element={<SimulationsRoute />} />');
    expect(source).toContain('<Route path="/ai-tutor" element={<AiTutorRoute />} />');
    expect(source).toContain('<Route path="/certificates" element={<CertificatesRoute />} />');
  });

  it("keeps XP and progress derivation expressions unchanged", () => {
    const dashboardPath = path.resolve(process.cwd(), "src/components/Dashboard.tsx");
    const source = fs.readFileSync(dashboardPath, "utf-8");

    expect(source).toContain("const levelProgressXp = currentUser.totalXp % 100;");
    expect(source).toContain("userProgress[`${userId}_path_${activePath.id}`]?.progressPercent || 0");
  });
});

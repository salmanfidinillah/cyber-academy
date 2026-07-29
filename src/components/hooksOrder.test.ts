// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import fs from "fs";
import path from "path";

let mockContextUser: any = null;

vi.mock("../contexts/UserContext", () => ({
  useUser: () => ({
    currentUser: mockContextUser,
    refreshUserProfile: vi.fn(),
  }),
}));

vi.mock("../services/catalogService", () => ({
  fetchCatalogLearningPaths: vi.fn().mockResolvedValue([]),
  fetchCatalogCoursesForPath: vi.fn().mockResolvedValue([]),
  fetchCatalogLessonsForCourse: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/learningStateService", () => ({
  fetchMyProgress: vi.fn().mockResolvedValue([]),
  fetchMyXpTransactions: vi.fn().mockResolvedValue({ transactions: [], nextCursor: null }),
  resetMyLearningState: vi.fn().mockResolvedValue({ success: true, message: "" }),
  completeMyLesson: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/learningStore", () => ({
  getUserProgress: vi.fn().mockReturnValue({}),
  getFirestoreUserBadges: vi.fn().mockReturnValue([]),
  getFirestoreCertificates: vi.fn().mockReturnValue([]),
  getXpTransactions: vi.fn().mockResolvedValue([]),
  resetUserProgress: vi.fn().mockResolvedValue(true),
  getLevelProgressPercent: vi.fn().mockReturnValue(0),
  getXpNeededForNextLevel: vi.fn().mockReturnValue(100),
}));

vi.mock("../services/achievementService", () => ({
  fetchMyBadges: vi.fn().mockResolvedValue([]),
  fetchMyCertificates: vi.fn().mockResolvedValue([]),
  evaluateMyBadgeState: vi.fn().mockResolvedValue({ userBadges: [], progress: [] }),
}));

import { Dashboard } from "./Dashboard";
import { ProgressPage } from "./ProgressPage";

describe("Rules of Hooks Validation in Dashboard & ProgressPage", () => {
  beforeEach(() => {
    cleanup();
    mockContextUser = null;
  });

  it("Static check: Dashboard.tsx declares all hooks before conditional returns", () => {
    const dashboardPath = path.resolve(process.cwd(), "src/components/Dashboard.tsx");
    const content = fs.readFileSync(dashboardPath, "utf-8");

    const earlyReturnIdx = content.indexOf("if (!currentUser)");
    expect(earlyReturnIdx).toBeGreaterThan(0);

    const firstUseStateIdx = content.indexOf("useState");
    const firstUseEffectIdx = content.indexOf("useEffect");

    expect(firstUseStateIdx).toBeGreaterThan(0);
    expect(firstUseEffectIdx).toBeGreaterThan(0);

    expect(firstUseStateIdx).toBeLessThan(earlyReturnIdx);
    expect(firstUseEffectIdx).toBeLessThan(earlyReturnIdx);
  });

  it("Static check: ProgressPage.tsx declares all hooks before conditional returns", () => {
    const progressPath = path.resolve(process.cwd(), "src/components/ProgressPage.tsx");
    const content = fs.readFileSync(progressPath, "utf-8");

    const earlyReturnIdx = content.indexOf("if (!currentUser)");
    expect(earlyReturnIdx).toBeGreaterThan(0);

    const firstUseStateIdx = content.indexOf("useState");
    const firstUseEffectIdx = content.indexOf("useEffect");

    expect(firstUseStateIdx).toBeGreaterThan(0);
    expect(firstUseEffectIdx).toBeGreaterThan(0);

    expect(firstUseStateIdx).toBeLessThan(earlyReturnIdx);
    expect(firstUseEffectIdx).toBeLessThan(earlyReturnIdx);
  });

  it("Runtime Render Check: Dashboard renders with null user then rerenders with valid user without hook errors", () => {
    const validUser: any = {
      uid: "user_test_123",
      displayName: "Taruna Test",
      email: "taruna@example.com",
      role: "user",
      totalXp: 150,
      currentLevel: 2,
      learningStreak: 3,
      learningGoal: "protect_self",
      studyTime: "15min",
    };

    // 1. Initial render with null user
    mockContextUser = null;
    const { rerender } = render(
      React.createElement(Dashboard, {
        currentUser: undefined,
        onLogout: () => {},
        onNavigate: () => {},
      })
    );

    // 2. Transition/Rerender with valid user
    mockContextUser = validUser;
    expect(() => {
      rerender(
        React.createElement(Dashboard, {
          currentUser: validUser,
          onLogout: () => {},
          onNavigate: () => {},
        })
      );
    }).not.toThrow();
  });

  it("Runtime Render Check: ProgressPage renders with null user then rerenders with valid user without hook errors", () => {
    const validUser: any = {
      uid: "user_test_123",
      displayName: "Taruna Test",
      email: "taruna@example.com",
      role: "user",
      totalXp: 150,
      currentLevel: 2,
      learningStreak: 3,
      learningGoal: "protect_self",
      studyTime: "15min",
    };

    mockContextUser = null;
    const { rerender } = render(
      React.createElement(ProgressPage, {
        currentUser: undefined,
        onNavigate: () => {},
      })
    );

    mockContextUser = validUser;
    expect(() => {
      rerender(
        React.createElement(ProgressPage, {
          currentUser: validUser,
          onNavigate: () => {},
        })
      );
    }).not.toThrow();
  });
});

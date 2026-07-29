// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      layoutId: _layoutId,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
}));

const badges = [
  {
    badgeId: "badge-cyber-defender",
    title: "Beginner Master",
    slug: "beginner-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Beginner.",
    requirementLabel: "Selesaikan seluruh course Beginner.",
    icon: "book-shield",
    category: "Beginner",
    requirementType: "learning_path_completion",
    requirementValue: "beginner-path",
    order: 1,
    status: "active",
  },
  {
    badgeId: "badge-intermediate-defender",
    title: "Intermediate Master",
    slug: "intermediate-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Intermediate.",
    requirementLabel: "Selesaikan seluruh course Intermediate.",
    icon: "layers-shield",
    category: "Intermediate",
    requirementType: "learning_path_completion",
    requirementValue: "intermediate-path",
    order: 2,
    status: "active",
  },
  {
    badgeId: "badge-advanced-specialist",
    title: "Advanced Master",
    slug: "advanced-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Advanced.",
    requirementLabel: "Selesaikan seluruh course Advanced.",
    icon: "crown-shield",
    category: "Advanced",
    requirementType: "learning_path_completion",
    requirementValue: "advanced-path",
    order: 3,
    status: "active",
  },
  {
    badgeId: "badge-simulation-analyst",
    title: "Simulation Defender",
    slug: "simulation-defender",
    description: "Menyelesaikan seluruh simulasi keamanan siber yang diwajibkan.",
    requirementLabel: "Selesaikan seluruh simulasi aktif.",
    icon: "shield-alert",
    category: "Practical",
    requirementType: "simulation_completion",
    requirementValue: "all-required-simulations",
    order: 4,
    status: "active",
  },
];

const serviceMocks = vi.hoisted(() => ({
  fetchBadges: vi.fn(),
  evaluateMyBadgeState: vi.fn(),
}));

vi.mock("../services/achievementService", () => serviceMocks);

import { BadgeList } from "./BadgeList";

afterEach(cleanup);

beforeEach(() => {
  serviceMocks.fetchBadges.mockResolvedValue(badges);
  serviceMocks.evaluateMyBadgeState.mockResolvedValue({
    userBadges: [],
    progress: badges.map((badge, index) => ({
      badgeId: badge.badgeId,
      badgeSlug: badge.slug,
      title: badge.title,
      requirementType: badge.requirementType,
      requirementValue: badge.requirementValue,
      completedItems: index,
      totalItems: 4,
      progressPercent: index * 25,
      isEligible: false,
      breakdown: {},
    })),
  });
});

describe("BadgeList milestone UI", () => {
  it("1. renders exactly the four active milestone badges", async () => {
    render(
      <BadgeList
        currentUser={{ uid: "user-a" } as any}
        onNavigate={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Beginner Master")).toBeTruthy();
    });
    expect(screen.getByText("Intermediate Master")).toBeTruthy();
    expect(screen.getByText("Advanced Master")).toBeTruthy();
    expect(screen.getByText("Simulation Defender")).toBeTruthy();
    expect(
      document.querySelectorAll("#badge-list-container h3")
    ).toHaveLength(4);
  });

  it("2. does not render granular legacy badge names", async () => {
    render(
      <BadgeList
        currentUser={{ uid: "user-a" } as any}
        onNavigate={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("Beginner Master")).toBeTruthy());
    expect(screen.queryByText("First Step")).toBeNull();
    expect(screen.queryByText("Password Guard")).toBeNull();
    expect(screen.queryByText("Phishing Hunter")).toBeNull();
    expect(screen.queryByText("Privacy Protector")).toBeNull();
  });

  it("3. renders progress values supplied by the server response", async () => {
    render(
      <BadgeList
        currentUser={{ uid: "user-a" } as any}
        onNavigate={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("75%")).toBeTruthy());
    expect(screen.getByText("3/4")).toBeTruthy();
  });
});

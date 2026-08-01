import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("responsive layout safeguards", () => {
  it("keeps tablet widths on the drawer navigation layout", () => {
    const appShell = readSource("./navigation/AppShell.tsx");
    const adminShell = readSource("./navigation/AdminShell.tsx");
    const topbar = readSource("./navigation/AppTopbar.tsx");

    expect(appShell).toContain("hidden lg:block");
    expect(appShell).toContain("lg:ml-[var(--sidebar-expanded-width)]");
    expect(adminShell).toContain("hidden lg:block");
    expect(adminShell).toContain("lg:ml-[var(--sidebar-expanded-width)]");
    expect(topbar).toContain("lg:hidden");
  });

  it("constrains long modal content to the viewport", () => {
    const badgeList = readSource("./BadgeList.tsx");
    const lessonDetail = readSource("./LessonDetail.tsx");
    const adminLessons = readSource("./admin/AdminLessons.tsx");

    expect(badgeList).toContain("max-h-[calc(100dvh-1.5rem)]");
    expect(badgeList).toContain("overflow-y-auto");
    expect(lessonDetail).toContain("max-h-[calc(100dvh-1.5rem)]");
    expect(adminLessons).toContain("max-h-[calc(100dvh-1.5rem)]");
  });

  it("contains wide certificate and admin table content internally", () => {
    const certificate = readSource("./CertificatePreview.tsx");
    const adminCourses = readSource("./admin/AdminCourses.tsx");
    const adminUsers = readSource("./admin/AdminUsers.tsx");

    expect(certificate).toContain("overflow-x-auto");
    expect(certificate).toContain("min-w-[40rem]");
    expect(adminCourses).toContain("overflow-x-auto");
    expect(adminCourses).toContain("min-w-[46rem]");
    expect(adminUsers).toContain("overflow-x-auto");
    expect(adminUsers).toContain("min-w-[44rem]");
  });

  it("prevents chat composers and long messages from forcing body overflow", () => {
    const aiTutor = readSource("./AiTutor.tsx");
    const lessonPanel = readSource("./lesson/LessonAiPanel.tsx");

    expect(aiTutor).toContain("min-w-0 flex-1");
    expect(aiTutor).toContain("[overflow-wrap:anywhere]");
    expect(lessonPanel).toContain("min-w-0 flex-1");
    expect(lessonPanel).toContain("[overflow-wrap:anywhere]");
  });
});

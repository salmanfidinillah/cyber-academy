// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the hero and all important landing sections", () => {
    render(<LandingPage onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: /Belajar Cybersecurity/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Cara Menyenangkan Menguasai Pertahanan Digital/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Jalur Pembelajaran Terstruktur/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Pertanyaan yang Sering Diajukan/i })).toBeTruthy();
  });

  it("keeps the primary CTA and feature routes functional", () => {
    const onNavigate = vi.fn();
    render(<LandingPage onNavigate={onNavigate} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Mulai Belajar dengan Google/i })[0]);
    expect(onNavigate).toHaveBeenCalledWith("/register");

    fireEvent.click(screen.getAllByRole("button", { name: /Coba Sekarang/i })[0]);
    expect(onNavigate).toHaveBeenCalledWith("/learn/paths");

    fireEvent.click(screen.getByRole("button", { name: /Coba Simulasi Phishing Lengkap/i }));
    expect(onNavigate).toHaveBeenCalledWith("/simulations");
  });

  it("scrolls to paths and exposes accessible FAQ state", () => {
    render(<LandingPage onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Lihat Jalur Belajar" }));
    expect(document.getElementById("paths-sec")?.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    const faqButton = screen.getAllByRole("button", { expanded: false })[0];
    fireEvent.click(faqButton);
    expect(faqButton.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps landing styles scoped and supports reduced motion", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/components/LandingPage.css"),
      "utf8",
    );

    expect(css).toContain(".landing-page");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toContain("html, body");
  });
});

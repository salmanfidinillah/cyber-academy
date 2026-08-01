// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "./Footer";

describe("Footer landing page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the final product, developer, and competition identities", () => {
    render(<Footer onNavigate={vi.fn()} />);

    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: "Cyber Academy — kembali ke beranda",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Salman Fidinillah", { exact: false })).toBeTruthy();
    expect(
      screen.getByText("FTI Festival 2026 — Web Development.", {
        exact: false,
      }),
    ).toBeTruthy();
  });

  it("removes the old team identity, false support address, and legacy copy", () => {
    render(<Footer onNavigate={vi.fn()} />);

    expect(screen.queryByText(/Tim Cyber Academy AI/i)).toBeNull();
    expect(screen.queryByText(/support@cyberacademy\.ai/i)).toBeNull();
    expect(screen.queryByText(/Proyek Pengembangan Web/i)).toBeNull();
    expect(screen.queryByText(/FTI FEST 2026/i)).toBeNull();
    expect(screen.queryByText(/Cyber Academy AI\./i)).toBeNull();
  });

  it("uses only valid existing internal routes or landing anchors", () => {
    render(<Footer onNavigate={vi.fn()} />);

    const expectedLinks = {
      "Jalur Belajar": "/#paths-sec",
      Simulasi: "/simulations",
      "AI Tutor": "/ai-tutor",
      FAQ: "/#faq-sec",
      "Kebijakan Privasi": "/privacy",
      "Syarat & Ketentuan": "/terms",
    };

    for (const [name, href] of Object.entries(expectedLinks)) {
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
        href,
      );
    }

    expect(document.querySelector('footer a[href="#"]')).toBeNull();
    expect(screen.queryByRole("link", { name: /GitHub/i })).toBeNull();
  });

  it("matches anchors and routes that already exist in the application", () => {
    const landingSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/LandingPage.tsx"),
      "utf8",
    );
    const appSource = fs.readFileSync(
      path.join(process.cwd(), "src/App.tsx"),
      "utf8",
    );

    expect(landingSource).toContain('id="paths-sec"');
    expect(landingSource).toContain('id="faq-sec"');

    for (const route of [
      "/simulations",
      "/ai-tutor",
      "/privacy",
      "/terms",
    ]) {
      expect(appSource).toContain(`path="${route}"`);
    }
  });

  it("keeps route navigation and landing-section scrolling functional", () => {
    const onNavigate = vi.fn();
    const pathsSection = document.createElement("section");
    pathsSection.id = "paths-sec";
    document.body.appendChild(pathsSection);

    render(<Footer onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("link", { name: "Simulasi" }));
    expect(onNavigate).toHaveBeenCalledWith("/simulations");

    fireEvent.click(screen.getByRole("link", { name: "Jalur Belajar" }));
    expect(onNavigate).toHaveBeenCalledWith("/");
    vi.runAllTimers();
    expect(pathsSection.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    pathsSection.remove();
  });

  it("provides labeled navigation, visible focus styles, and mobile-safe layout classes", () => {
    render(<Footer onNavigate={vi.fn()} />);

    expect(
      screen.getByRole("navigation", { name: "Navigasi cepat footer" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Informasi footer" }),
    ).toBeTruthy();

    const footer = screen.getByRole("contentinfo");
    const grid = footer.querySelector(".grid");
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(
      screen.getByRole("link", { name: "Simulasi" }).className,
    ).toContain("focus-visible:ring-4");
    expect(footer.textContent).not.toContain("#IndonesiaMakinCakapDigital");
    expect(footer.textContent).not.toContain("#PIXEL2026");
  });
});

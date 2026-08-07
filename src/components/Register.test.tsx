// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authServiceMocks = vi.hoisted(() => ({
  registerWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock("../services/authService", () => authServiceMocks);

import { Register } from "./Register";

const fillRegistrationForm = () => {
  fireEvent.change(screen.getByPlaceholderText("cth. Salman Fidinillah"), {
    target: { value: "Salman Fidinillah" },
  });
  fireEvent.change(screen.getByPlaceholderText("nama@email.com"), {
    target: { value: "salman@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Min. 8 karakter"), {
    target: { value: "Password123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Ulangi sandi"), {
    target: { value: "Password123" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Daftar Akun Baru" }));
};

describe("Register verification message", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authServiceMocks.registerWithEmail.mockReset();
    authServiceMocks.loginWithGoogle.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows a password hint that matches the eight-character validation", () => {
    render(<Register onNavigate={vi.fn()} />);

    expect(screen.getByPlaceholderText("Min. 8 karakter")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Min. 6 karakter")).toBeNull();
  });

  it("shows the requested email guidance only after registration succeeds", async () => {
    authServiceMocks.registerWithEmail.mockResolvedValue({ uid: "user-1" });
    const onNavigate = vi.fn();
    render(<Register onNavigate={onNavigate} />);

    fillRegistrationForm();

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Periksa email Anda")).toBeTruthy();
    expect(
      screen.getByText("Email verifikasi telah dikirim ke alamat email yang Anda daftarkan."),
    ).toBeTruthy();
    expect(
      screen.getByText("Silakan periksa Kotak Masuk, Spam, Promosi, atau Semua Email."),
    ).toBeTruthy();
    expect(screen.getByText(/pilih “Bukan spam”/i)).toBeTruthy();

    act(() => vi.advanceTimersByTime(800));
    expect(onNavigate).toHaveBeenCalledWith("/verify-email");
  });

  it("shows an honest error and no success message when verification sending fails", async () => {
    authServiceMocks.registerWithEmail.mockRejectedValue(
      new Error(
        "Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Silakan coba kirim ulang email verifikasi atau kembali beberapa saat lagi.",
      ),
    );
    const onNavigate = vi.fn();
    render(<Register onNavigate={onNavigate} />);

    fillRegistrationForm();

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText(
        "Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Silakan coba kirim ulang email verifikasi atau kembali beberapa saat lagi.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Periksa email Anda")).toBeNull();
    act(() => vi.advanceTimersByTime(800));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("keeps the Google registration success message unchanged", async () => {
    authServiceMocks.loginWithGoogle.mockResolvedValue({ uid: "google-user" });
    const onNavigate = vi.fn();
    render(<Register onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Daftar cepat dengan Google" }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Berhasil masuk via Google!")).toBeTruthy();
    expect(screen.queryByText("Periksa email Anda")).toBeNull();

    act(() => vi.advanceTimersByTime(800));
    expect(onNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

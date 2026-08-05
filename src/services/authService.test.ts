import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  reload: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));

const userServiceMocks = vi.hoisted(() => ({
  createUserProfileIfMissing: vi.fn(),
}));

const firebaseClientMocks = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  initPersistencePromise: Promise.resolve(),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: authMocks.sendEmailVerification,
  updateProfile: authMocks.updateProfile,
  GoogleAuthProvider: class {
    addScope() {}
    setCustomParameters() {}
  },
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
  updatePassword: vi.fn(),
  getIdToken: vi.fn(),
  onAuthStateChanged: vi.fn(),
  reload: authMocks.reload,
  deleteUser: authMocks.deleteUser,
}));

vi.mock("../lib/firebaseClient", () => firebaseClientMocks);
vi.mock("./userService", () => userServiceMocks);

import {
  isEmailRegistrationProfilePending,
  markEmailRegistrationProfileReady,
  registerWithEmail,
} from "./authService";

describe("registerWithEmail email verification", () => {
  const createdUser = {
    uid: "user-1",
    email: "salman@example.com",
    displayName: "Salman",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    firebaseClientMocks.auth.currentUser = createdUser;
    authMocks.createUserWithEmailAndPassword.mockResolvedValue({ user: createdUser });
    authMocks.updateProfile.mockResolvedValue(undefined);
    authMocks.reload.mockResolvedValue(undefined);
    userServiceMocks.createUserProfileIfMissing.mockResolvedValue(undefined);
    authMocks.sendEmailVerification.mockResolvedValue(undefined);
  });

  it("returns the created user after the verification email is sent", async () => {
    await expect(
      registerWithEmail("Salman", "salman@example.com", "Password123"),
    ).resolves.toBe(createdUser);

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(authMocks.sendEmailVerification).toHaveBeenCalledWith(createdUser);
    expect(isEmailRegistrationProfilePending(createdUser.uid)).toBe(true);

    markEmailRegistrationProfileReady(createdUser.uid);
    expect(isEmailRegistrationProfilePending(createdUser.uid)).toBe(false);
  });

  it("reports a partial success and keeps the created account when sending fails", async () => {
    authMocks.sendEmailVerification.mockRejectedValue(
      new Error("verification service unavailable"),
    );

    await expect(
      registerWithEmail("Salman", "salman@example.com", "Password123"),
    ).rejects.toThrow(
      "Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Silakan coba kirim ulang email verifikasi atau kembali beberapa saat lagi.",
    );

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(userServiceMocks.createUserProfileIfMissing).toHaveBeenCalledWith(createdUser);
    expect(authMocks.deleteUser).not.toHaveBeenCalled();
  });

  it("clears the pending profile guard when profile creation fails", async () => {
    userServiceMocks.createUserProfileIfMissing.mockRejectedValue(
      new Error("firestore unavailable"),
    );

    await expect(
      registerWithEmail("Salman", "salman@example.com", "Password123"),
    ).rejects.toThrow("firestore unavailable");

    expect(authMocks.deleteUser).toHaveBeenCalledWith(createdUser);
    expect(isEmailRegistrationProfilePending(createdUser.uid)).toBe(false);
  });

  it("does not leave registration pending when account creation fails", async () => {
    authMocks.createUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    await expect(
      registerWithEmail("Salman", "salman@example.com", "Password123"),
    ).rejects.toThrow(
      "Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
    );

    expect(isEmailRegistrationProfilePending(createdUser.uid)).toBe(false);
    expect(userServiceMocks.createUserProfileIfMissing).not.toHaveBeenCalled();
    expect(authMocks.sendEmailVerification).not.toHaveBeenCalled();
  });
});

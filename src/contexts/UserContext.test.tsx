// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authServiceMocks = vi.hoisted(() => ({
  authStateCallback: null as ((user: any) => Promise<void>) | null,
  registrationProfilePending: false,
  subscribeToAuthState: vi.fn((callback: (user: any) => Promise<void>) => {
    authServiceMocks.authStateCallback = callback;
    return vi.fn();
  }),
  logoutUser: vi.fn(),
  reloadCurrentAuthUser: vi.fn(),
  handleGoogleRedirectResult: vi.fn(),
  isEmailRegistrationProfilePending: vi.fn(
    () => authServiceMocks.registrationProfilePending,
  ),
  markEmailRegistrationProfileReady: vi.fn(),
}));

const userServiceMocks = vi.hoisted(() => ({
  profileCallback: null as ((profile: any) => void) | null,
  subscribeToUserProfile: vi.fn(
    (_uid: string, onProfile: (profile: any) => void) => {
      userServiceMocks.profileCallback = onProfile;
      return vi.fn();
    },
  ),
  createUserProfileIfMissing: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("../services/authService", () => authServiceMocks);
vi.mock("../services/userService", () => userServiceMocks);
vi.mock("firebase/auth", () => ({
  getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
}));

import { UserProvider, useUser } from "./UserContext";

const firebaseUser = {
  uid: "new-user",
  email: "new@example.com",
  emailVerified: false,
};

const ProfileStateProbe = () => {
  const { loading, authError, currentUser } = useUser();
  return (
    <div>
      <span>{loading ? "loading" : "initialized"}</span>
      <span>{authError || "no-error"}</span>
      <span>{currentUser?.uid || "no-profile"}</span>
    </div>
  );
};

const startAuthenticatedProfileSubscription = async () => {
  await act(async () => {
    await authServiceMocks.authStateCallback?.(firebaseUser);
  });
};

describe("UserContext registration profile synchronization", () => {
  beforeEach(() => {
    authServiceMocks.authStateCallback = null;
    authServiceMocks.registrationProfilePending = false;
    userServiceMocks.profileCallback = null;
    vi.clearAllMocks();
    authServiceMocks.handleGoogleRedirectResult.mockResolvedValue(null);
  });

  afterEach(cleanup);

  it("does not expose a missing-profile error while email registration is active", async () => {
    authServiceMocks.registrationProfilePending = true;
    render(
      <UserProvider>
        <ProfileStateProbe />
      </UserProvider>,
    );

    await startAuthenticatedProfileSubscription();
    act(() => userServiceMocks.profileCallback?.(null));

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.getByText("no-error")).toBeTruthy();
    expect(
      screen.queryByText(/Profil pengguna tidak ditemukan/i),
    ).toBeNull();
  });

  it("finishes loading when the newly-created profile arrives", async () => {
    authServiceMocks.registrationProfilePending = true;
    render(
      <UserProvider>
        <ProfileStateProbe />
      </UserProvider>,
    );

    await startAuthenticatedProfileSubscription();
    act(() =>
      userServiceMocks.profileCallback?.({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        accountStatus: "active",
        onboardingCompleted: false,
      }),
    );

    expect(screen.getByText("initialized")).toBeTruthy();
    expect(screen.getByText("no-error")).toBeTruthy();
    expect(screen.getByText(firebaseUser.uid)).toBeTruthy();
    expect(
      authServiceMocks.markEmailRegistrationProfileReady,
    ).toHaveBeenCalledWith(firebaseUser.uid);
  });

  it("keeps the real missing-profile error after initialization", async () => {
    render(
      <UserProvider>
        <ProfileStateProbe />
      </UserProvider>,
    );

    await startAuthenticatedProfileSubscription();
    act(() => userServiceMocks.profileCallback?.(null));

    expect(screen.getByText("initialized")).toBeTruthy();
    expect(
      screen.getByText(
        "Profil pengguna tidak ditemukan. Silakan klik 'Coba Lagi' untuk memulihkan.",
      ),
    ).toBeTruthy();
  });
});

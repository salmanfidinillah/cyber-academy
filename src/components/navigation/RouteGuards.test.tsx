// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const userContextMocks = vi.hoisted(() => ({
  useUser: vi.fn(),
}));

vi.mock("../../contexts/UserContext", () => userContextMocks);

import { PublicRoute, VerificationRoute } from "./RouteGuards";

afterEach(cleanup);

describe("registration route guard priority", () => {
  it("prioritizes the verification page for an initialized unverified user", () => {
    userContextMocks.useUser.mockReturnValue({
      authUser: { uid: "new-user", emailVerified: false },
      currentUser: {
        uid: "new-user",
        accountStatus: "active",
        onboardingCompleted: false,
      },
      loading: false,
      authError: null,
      refreshUserProfile: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/register" element={<div>Registration form</div>} />
          </Route>
          <Route element={<VerificationRoute />}>
            <Route
              path="/verify-email"
              element={<div>Verification card</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Verification card")).toBeTruthy();
    expect(screen.queryByText("Registration form")).toBeNull();
  });

  it("keeps the existing verified-user redirect unchanged", () => {
    userContextMocks.useUser.mockReturnValue({
      authUser: { uid: "existing-user", emailVerified: true },
      currentUser: {
        uid: "existing-user",
        accountStatus: "active",
        onboardingCompleted: true,
      },
      loading: false,
      authError: null,
      refreshUserProfile: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login form</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.queryByText("Login form")).toBeNull();
  });
});

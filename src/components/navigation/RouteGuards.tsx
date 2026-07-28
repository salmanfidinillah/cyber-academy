import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { LoadingBoundary } from "../LoadingBoundary";
import { AuthProfileErrorState } from "../AuthProfileErrorState";

export const PublicRoute: React.FC = () => {
  const { authUser, currentUser, loading, authError, refreshUserProfile, logout } = useUser();

  if (authError) {
    return (
      <AuthProfileErrorState
        error={authError}
        onRetry={async () => { await refreshUserProfile(); }}
        onLogout={logout}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <LoadingBoundary message="Memuat sesi Anda..." />
      </div>
    );
  }

  if (authUser && currentUser) {
    if (currentUser.accountStatus === "disabled") {
      return <Navigate to="/login" replace />;
    }
    if (!authUser.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    if (!currentUser.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const ProtectedRoute: React.FC = () => {
  const { authUser, currentUser, loading, authError, refreshUserProfile, logout } = useUser();

  if (authError) {
    return (
      <AuthProfileErrorState
        error={authError}
        onRetry={async () => { await refreshUserProfile(); }}
        onLogout={logout}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <LoadingBoundary message="Memuat sesi Anda..." />
      </div>
    );
  }

  if (!authUser || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!currentUser.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { authUser, currentUser, loading, authError, refreshUserProfile, logout } = useUser();

  if (authError) {
    return (
      <AuthProfileErrorState
        error={authError}
        onRetry={async () => { await refreshUserProfile(); }}
        onLogout={logout}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <LoadingBoundary message="Memuat sesi Anda..." />
      </div>
    );
  }

  if (!authUser || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (currentUser.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const VerificationRoute: React.FC = () => {
  const { authUser, currentUser, loading, authError, refreshUserProfile, logout } = useUser();

  if (authError) {
    return (
      <AuthProfileErrorState
        error={authError}
        onRetry={async () => { await refreshUserProfile(); }}
        onLogout={logout}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <LoadingBoundary message="Memuat sesi Anda..." />
      </div>
    );
  }

  if (!authUser || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (authUser.emailVerified) {
    if (!currentUser.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { authUser, currentUser, isAdmin, loading, authError, refreshUserProfile, logout } = useUser();

  if (authError) {
    return (
      <AuthProfileErrorState
        error={authError}
        onRetry={async () => { await refreshUserProfile(); }}
        onLogout={logout}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <LoadingBoundary message="Memuat sesi Anda..." />
      </div>
    );
  }

  if (!authUser || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
};

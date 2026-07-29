import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { Onboarding } from "./components/Onboarding";
import { Dashboard } from "./components/Dashboard";
import { LearningPaths } from "./components/LearningPaths";
import { CourseDetail } from "./components/CourseDetail";
import { CourseQuiz } from "./components/CourseQuiz";
import { QuizResult } from "./components/QuizResult";
import { SimulationsLanding } from "./components/SimulationsLanding";
import { SimulationPlayer } from "./components/SimulationPlayer";
import { ProgressPage } from "./components/ProgressPage";
import { AiTutor } from "./components/AiTutor";
import { LearningInsightPage } from "./components/LearningInsight";
import { BadgeList } from "./components/BadgeList";
import { CertificatePreview } from "./components/CertificatePreview";
import { PublicVerifyCertificate } from "./components/PublicVerifyCertificate";
import { ErrorBoundary, LoadingBoundary } from "./components/LoadingBoundary";

// Profile and Settings pages
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { SettingsProfile } from "./components/SettingsProfile";
import { SettingsAccount } from "./components/SettingsAccount";
import { SettingsSecurity } from "./components/SettingsSecurity";
import { useUser } from "./contexts/UserContext";
import { logoutUser } from "./services/authService";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { PublicLayout, UserLayout, AdminLayout } from "./components/navigation/Layouts";
import { PublicRoute, ProtectedRoute, OnboardingRoute, VerificationRoute, AdminRoute } from "./components/navigation/RouteGuards";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlaceholderPage } from "./components/PlaceholderPage";

// Admin components
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminLearningPaths } from "./components/admin/AdminLearningPaths";
import { AdminCourses } from "./components/admin/AdminCourses";
import { AdminLessons } from "./components/admin/AdminLessons";
import { AdminQuizzes } from "./components/admin/AdminQuizzes";
import { AdminQuizEditor } from "./components/admin/AdminQuizEditor";
import { AdminSimulations } from "./components/admin/AdminSimulations";
import { AdminAuditLogs } from "./components/admin/AdminAuditLogs";
import { AdminBadges } from "./components/admin/AdminBadges";
import { AdminCertificates } from "./components/admin/AdminCertificates";

const LessonDetail = lazy(() =>
  import("./components/LessonDetail").then((module) => ({
    default: module.LessonDetail,
  })),
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on path change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Unified callback for pages that require manual state-based navigate callbacks
  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Wrapper components with props mapping
  const LandingPageRoute = () => <LandingPage onNavigate={handleNavigate} />;
  
  const LoginRoute = () => {
    return (
      <Login 
        onNavigate={handleNavigate} 
      />
    );
  };

  const RegisterRoute = () => {
    return (
      <Register 
        onNavigate={handleNavigate} 
      />
    );
  };

  const ForgotPasswordRoute = () => <ForgotPassword onNavigate={handleNavigate} />;

  const OnboardingRouteWrapper = () => {
    const { currentUser, refreshUserProfile } = useUser();
    return (
      <Onboarding 
        currentUser={currentUser!} 
        onOnboardingComplete={async () => {
          await refreshUserProfile();
          navigate("/dashboard", { replace: true });
        }} 
      />
    );
  };

  const DashboardRoute = () => {
    const { currentUser, logout } = useUser();
    const handleLogout = async () => {
      await logout();
      navigate("/", { replace: true });
    };
    return <Dashboard currentUser={currentUser!} onLogout={handleLogout} onNavigate={handleNavigate} />;
  };

  const LearningPathsRoute = () => {
    const { currentUser } = useUser();
    const { pathSlug } = useParams();
    return <LearningPaths currentUser={currentUser!} onNavigate={handleNavigate} pathSlug={pathSlug} />;
  };

  const CourseDetailRoute = () => {
    const { currentUser } = useUser();
    const { courseSlug } = useParams();
    return <CourseDetail currentUser={currentUser!} onNavigate={handleNavigate} courseSlug={courseSlug || ""} />;
  };

  const QuizResultRoute = () => {
    const { currentUser } = useUser();
    const { courseSlug, attemptId } = useParams();
    return <QuizResult currentUser={currentUser!} onNavigate={handleNavigate} courseSlug={courseSlug || ""} attemptId={attemptId || ""} />;
  };

  const LessonDetailRoute = () => {
    const { currentUser } = useUser();
    const { courseSlug, lessonSlug } = useParams();
    return (
      <Suspense fallback={<LoadingBoundary message="Memuat materi pelajaran..." />}>
        <LessonDetail
          currentUser={currentUser!}
          onNavigate={handleNavigate}
          courseSlug={courseSlug || ""}
          lessonSlug={lessonSlug || ""}
        />
      </Suspense>
    );
  };

  const CourseQuizRoute = () => {
    const { currentUser } = useUser();
    const { courseSlug } = useParams();
    return <CourseQuiz currentUser={currentUser!} onNavigate={handleNavigate} courseSlug={courseSlug || ""} />;
  };

  const SimulationsRoute = () => {
    const { currentUser } = useUser();
    return <SimulationsLanding currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const SimulationPlayerRoute = () => {
    const { currentUser } = useUser();
    const { simulationId } = useParams();
    return <SimulationPlayer currentUser={currentUser!} simulationId={simulationId || ""} onNavigate={handleNavigate} />;
  };

  const ProgressPageRoute = () => {
    const { currentUser } = useUser();
    return <ProgressPage currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const ProfilePageRoute = () => {
    const { currentUser } = useUser();
    return <ProfilePage currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const SettingsPageRoute = () => {
    const { currentUser } = useUser();
    return <SettingsPage currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const SettingsProfileRoute = () => {
    const { currentUser } = useUser();
    return <SettingsProfile currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const SettingsAccountRoute = () => {
    const { currentUser } = useUser();
    return <SettingsAccount currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const SettingsSecurityRoute = () => {
    const { currentUser } = useUser();
    return <SettingsSecurity currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const ProgressInsightRoute = () => {
    const { currentUser } = useUser();
    return <LearningInsightPage currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AiTutorRoute = () => {
    const { currentUser } = useUser();
    const { conversationId } = useParams();
    return <AiTutor currentUser={currentUser!} onNavigate={handleNavigate} selectedConversationId={conversationId} />;
  };

  const BadgesRoute = () => {
    const { currentUser } = useUser();
    return <BadgeList currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const CertificatesRoute = () => {
    const { currentUser } = useUser();
    return <CertificatePreview currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const PublicVerifyCertificateRoute = () => {
    const { code } = useParams();
    return <PublicVerifyCertificate initialCode={code || ""} onNavigate={handleNavigate} />;
  };

  // Admin wrappers
  const AdminDashboardRoute = () => {
    const { currentUser } = useUser();
    return <AdminDashboard currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminUsersRoute = () => {
    const { currentUser } = useUser();
    return <AdminUsers currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminLearningPathsRoute = () => {
    const { currentUser } = useUser();
    return <AdminLearningPaths currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminCoursesRoute = () => {
    const { currentUser } = useUser();
    return <AdminCourses currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminLessonsRoute = () => {
    const { currentUser } = useUser();
    return <AdminLessons currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminQuizzesRoute = () => {
    const { currentUser } = useUser();
    return <AdminQuizzes currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminQuizEditorRoute = () => {
    return <AdminQuizEditor onNavigate={handleNavigate} />;
  };

  const AdminSimulationsRoute = () => {
    const { currentUser } = useUser();
    return <AdminSimulations currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminBadgesRoute = () => {
    const { currentUser } = useUser();
    return <AdminBadges currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  const AdminCertificatesRoute = () => {
    const { currentUser } = useUser();
    return <AdminCertificates currentUser={currentUser!} onNavigate={handleNavigate} />;
  };

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes wrapped in PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPageRoute />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/register" element={<RegisterRoute />} />
            <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
          </Route>
          
          {/* Public without PublicRoute guard (can be viewed by guests or logged-in users) */}
          <Route path="/verify/certificate" element={<PublicVerifyCertificateRoute />} />
          <Route path="/verify/certificate/:code" element={<PublicVerifyCertificateRoute />} />
          <Route path="/privacy" element={<PlaceholderPage pageName="privacy" onNavigate={handleNavigate} />} />
          <Route path="/terms" element={<PlaceholderPage pageName="terms" onNavigate={handleNavigate} />} />
          
          {/* Home legacy redirect */}
          <Route path="/home" element={<Navigate to="/" replace />} />
        </Route>

        {/* Verification Route */}
        <Route element={<VerificationRoute />}>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Onboarding route wrapped in PublicLayout but has OnboardingRoute guard */}
        <Route element={<PublicLayout />}>
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<OnboardingRouteWrapper />} />
          </Route>
        </Route>

        {/* Protected User routes with ProtectedRoute check */}
        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/learn/paths" element={<LearningPathsRoute />} />
            <Route path="/learn/paths/:pathSlug" element={<LearningPathsRoute />} />
            
            <Route path="/learn/courses/:courseSlug" element={<CourseDetailRoute />} />
            <Route path="/learn/courses/:courseSlug/quiz" element={<CourseQuizRoute />} />
            <Route path="/learn/courses/:courseSlug/quiz/results/:attemptId" element={<QuizResultRoute />} />
            <Route path="/learn/courses/:courseSlug/lessons/:lessonSlug" element={<LessonDetailRoute />} />
            
            <Route path="/simulations" element={<SimulationsRoute />} />
            <Route path="/simulations/:simulationId" element={<SimulationPlayerRoute />} />
            
            <Route path="/progress" element={<ProgressPageRoute />} />
            <Route path="/progress/insight" element={<ProgressInsightRoute />} />
            
            <Route path="/ai-tutor" element={<AiTutorRoute />} />
            <Route path="/ai-tutor/:conversationId" element={<AiTutorRoute />} />
            
            <Route path="/badges" element={<BadgesRoute />} />
            <Route path="/certificates" element={<CertificatesRoute />} />
            
            {/* Direct mapping for settings and profile routes in main layout */}
            <Route path="/profile" element={<ProfilePageRoute />} />
            <Route path="/settings" element={<SettingsPageRoute />} />
            <Route path="/settings/profile" element={<SettingsProfileRoute />} />
            <Route path="/settings/account" element={<SettingsAccountRoute />} />
            <Route path="/settings/security" element={<SettingsSecurityRoute />} />
          </Route>
        </Route>

        {/* Protected Admin routes with AdminRoute check BEFORE AdminLayout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardRoute />} />
            <Route path="/admin/users" element={<AdminUsersRoute />} />
            <Route path="/admin/users/:id" element={<AdminUsersRoute />} />
            <Route path="/admin/users/:id/edit" element={<AdminUsersRoute />} />
            <Route path="/admin/learning-paths" element={<AdminLearningPathsRoute />} />
            <Route path="/admin/learning-paths/new" element={<AdminLearningPathsRoute />} />
            <Route path="/admin/learning-paths/:id" element={<AdminLearningPathsRoute />} />
            <Route path="/admin/learning-paths/:id/edit" element={<AdminLearningPathsRoute />} />
            <Route path="/admin/courses" element={<AdminCoursesRoute />} />
            <Route path="/admin/courses/new" element={<AdminCoursesRoute />} />
            <Route path="/admin/courses/:id" element={<AdminCoursesRoute />} />
            <Route path="/admin/courses/:id/edit" element={<AdminCoursesRoute />} />
            <Route path="/admin/lessons" element={<AdminLessonsRoute />} />
            <Route path="/admin/lessons/new" element={<AdminLessonsRoute />} />
            <Route path="/admin/lessons/:id" element={<AdminLessonsRoute />} />
            <Route path="/admin/lessons/:id/edit" element={<AdminLessonsRoute />} />
            <Route path="/admin/quizzes" element={<AdminQuizzesRoute />} />
            <Route path="/admin/quizzes/new" element={<AdminQuizEditorRoute />} />
            <Route path="/admin/quizzes/:id" element={<AdminQuizEditorRoute />} />
            <Route path="/admin/quizzes/:id/edit" element={<AdminQuizEditorRoute />} />
            <Route path="/admin/simulations" element={<AdminSimulationsRoute />} />
            <Route path="/admin/simulations/new" element={<AdminSimulationsRoute />} />
            <Route path="/admin/simulations/:id" element={<AdminSimulationsRoute />} />
            <Route path="/admin/simulations/:id/edit" element={<AdminSimulationsRoute />} />
            <Route path="/admin/badges" element={<AdminBadgesRoute />} />
            <Route path="/admin/badges/new" element={<AdminBadgesRoute />} />
            <Route path="/admin/badges/:id" element={<AdminBadgesRoute />} />
            <Route path="/admin/badges/:id/edit" element={<AdminBadgesRoute />} />
            <Route path="/admin/certificates" element={<AdminCertificatesRoute />} />
            <Route path="/admin/certificates/:id" element={<AdminCertificatesRoute />} />
            <Route path="/admin/certificates/:id/revoke" element={<AdminCertificatesRoute />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Route>

        {/* 404 Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../Navbar";
import { Footer } from "../Footer";
import { AppShell } from "./AppShell";
import { AdminShell } from "./AdminShell";
import { useUser } from "../../contexts/UserContext";
import { logoutUser } from "../../services/authService";
import { LoadingBoundary } from "../LoadingBoundary";

export const PublicLayout: React.FC = () => {
  const { currentUser, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDF8] text-brand-text font-sans selection:bg-pastel-yellow selection:text-brand-text">
      <Navbar 
        currentRoute={location.pathname} 
        onNavigate={(route) => navigate(route)} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow">
        {isLoading ? (
          <div className="min-h-[450px] flex items-center justify-center">
            <LoadingBoundary message="Memproses permintaan Anda..." />
          </div>
        ) : (
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        )}
      </main>
      <Footer onNavigate={(route) => navigate(route)} />
    </div>
  );
};

export const UserLayout: React.FC = () => {
  const { currentUser, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    navigate("/login");
  };

  return (
    <AppShell 
      currentUser={currentUser} 
      currentRoute={location.pathname} 
      onNavigate={(route) => navigate(route)} 
      onLogout={handleLogout}
    >
      {isLoading ? (
        <div className="min-h-[450px] flex items-center justify-center">
          <LoadingBoundary message="Memproses permintaan Anda..." />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      )}
    </AppShell>
  );
};

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    navigate("/login");
  };

  return (
    <AdminShell 
      currentUser={currentUser} 
      currentRoute={location.pathname} 
      onNavigate={(route) => navigate(route)} 
      onLogout={handleLogout}
    >
      {isLoading ? (
        <div className="min-h-[450px] flex items-center justify-center">
          <LoadingBoundary message="Memproses permintaan Anda..." />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      )}
    </AdminShell>
  );
};

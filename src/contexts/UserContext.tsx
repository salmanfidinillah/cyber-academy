import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { subscribeToAuthState, logoutUser, reloadCurrentAuthUser, handleGoogleRedirectResult } from "../services/authService";
import { subscribeToUserProfile, createUserProfileIfMissing, getUserProfile } from "../services/userService";
import { User as FirebaseUser, getIdTokenResult } from "firebase/auth";

interface UserContextType {
  authUser: FirebaseUser | null;
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  refreshUserProfile: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAdminClaim = async (user: FirebaseUser, forceRefresh = false): Promise<boolean> => {
    try {
      const tokenResult = await getIdTokenResult(user, forceRefresh);
      const admin = tokenResult.claims.admin === true;
      setIsAdmin(admin);
      return admin;
    } catch (err) {
      console.error("Error checking custom admin claim:", err);
      setIsAdmin(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setAuthUser(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthError(null);
    } catch (err: any) {
      console.error("Logout error in UserContext:", err);
      setAuthError("Terjadi kesalahan saat keluar.");
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async (): Promise<User | null> => {
    try {
      const refreshedUser = await reloadCurrentAuthUser();
      if (refreshedUser) {
        setAuthUser(refreshedUser);
        await checkAdminClaim(refreshedUser, true);
        let profile = await getUserProfile(refreshedUser.uid);
        if (!profile) {
          profile = await createUserProfileIfMissing(refreshedUser);
        }
        
        if (profile) {
          if (profile.accountStatus === "disabled") {
            await logoutUser();
            setAuthUser(null);
            setCurrentUser(null);
            setIsAdmin(false);
            setAuthError("Akun Anda dinonaktifkan.");
            localStorage.setItem("disabled_alert", "true");
            return null;
          }
          setCurrentUser(profile);
          setAuthError(null);
          return profile;
        } else {
          setCurrentUser(null);
          setAuthError("Gagal menyinkronkan profil pengguna. Silakan coba lagi.");
          return null;
        }
      } else {
        setAuthUser(null);
        setCurrentUser(null);
        setIsAdmin(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error refreshing profile:", err);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthError("Gagal menyinkronkan profil pengguna. Silakan coba lagi.");
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    const checkRedirect = async () => {
      try {
        await handleGoogleRedirectResult();
      } catch (err: any) {
        console.error("Redirect sign-in error:", err);
        if (active) {
          setAuthError("Gagal masuk menggunakan Google Redirect.");
        }
      }
    };
    checkRedirect();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
      setLoading(true);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        setAuthUser(firebaseUser);
        await checkAdminClaim(firebaseUser);
        // Subscribe directly to real-time profile changes (No double profile creation here)
        unsubscribeFirestore = subscribeToUserProfile(
          firebaseUser.uid,
          (profileData) => {
            if (profileData) {
              if (profileData.accountStatus === "disabled") {
                logoutUser().then(() => {
                  setAuthUser(null);
                  setCurrentUser(null);
                  setIsAdmin(false);
                  setAuthError("Akun Anda dinonaktifkan.");
                  localStorage.setItem("disabled_alert", "true");
                  setLoading(false);
                });
                return;
              }
              setCurrentUser(profileData);
              setAuthError(null);
              setLoading(false);
            } else {
              // Fail closed: Profile does not exist yet (e.g. race condition/not created)
              setCurrentUser(null);
              setAuthError("Profil pengguna tidak ditemukan. Silakan klik 'Coba Lagi' untuk memulihkan.");
              setLoading(false);
            }
          },
          (error) => {
            console.error("Firestore subscription error:", error);
            setCurrentUser(null);
            setAuthError("Gagal menyinkronkan data profil dari server.");
            setLoading(false);
          }
        );
      } else {
        setAuthUser(null);
        setCurrentUser(null);
        setIsAdmin(false);
        setAuthError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        authUser,
        currentUser,
        isAdmin,
        loading,
        authError,
        refreshUserProfile,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

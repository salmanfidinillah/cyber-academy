import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  verifyBeforeUpdateEmail, 
  updatePassword, 
  getIdToken, 
  onAuthStateChanged, 
  reload,
  deleteUser,
  User as FirebaseUser
} from "firebase/auth";
import { auth, initPersistencePromise } from "../lib/firebaseClient";
import { createUserProfileIfMissing } from "./userService";

let emailRegistrationInProgress = false;
let pendingEmailRegistrationProfileUid: string | null = null;

export function isEmailRegistrationProfilePending(uid: string): boolean {
  return emailRegistrationInProgress || pendingEmailRegistrationProfileUid === uid;
}

export function markEmailRegistrationProfileReady(uid: string): void {
  if (pendingEmailRegistrationProfileUid === uid) {
    pendingEmailRegistrationProfileUid = null;
  }
}

// Map Firebase authentication error codes to custom Indonesian user-friendly messages
export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/invalid-credential":
      return "Email atau kata sandi salah. Harap periksa kembali.";
    case "auth/user-disabled":
      return "Akun ini telah dinonaktifkan oleh administrator.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan masuk yang gagal. Silakan coba beberapa saat lagi.";
    case "auth/network-request-failed":
      return "Gangguan koneksi jaringan. Harap periksa koneksi internet Anda.";
    case "auth/popup-closed-by-user":
      return "Proses masuk dengan Google dibatalkan oleh pengguna.";
    case "auth/popup-blocked":
      return "Popup diblokir oleh browser Anda. Harap izinkan popup untuk situs ini.";
    case "auth/account-exists-with-different-credential":
      return "Akun dengan email ini sudah terdaftar dengan metode masuk yang berbeda.";
    case "auth/operation-not-allowed":
      return "Metode masuk ini tidak diizinkan saat ini.";
    case "auth/unauthorized-domain":
      return "Domain aplikasi ini belum diotorisasi di Firebase Console Anda. Harap tambahkan domain ini (ais-dev-... atau ais-pre-...) ke menu Firebase Console -> Authentication -> Settings -> Authorized domains.";
    case "auth/email-already-in-use":
      return "Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    case "auth/weak-password":
      return "Kata sandi terlalu lemah. Kata sandi harus minimal 8 karakter, serta mengandung minimal satu huruf besar, satu huruf kecil, dan satu angka.";
    case "auth/user-not-found":
      return "Akun dengan email ini tidak ditemukan.";
    case "auth/wrong-password":
      return "Kata sandi salah. Harap periksa kembali.";
    default:
      return "Terjadi kesalahan sistem. Silakan coba lagi nanti.";
  }
}

export async function registerWithEmail(displayName: string, email: string, password: string): Promise<FirebaseUser> {
  let createdUser: FirebaseUser | null = null;
  let firestoreProfileCreated = false;
  emailRegistrationInProgress = true;
  pendingEmailRegistrationProfileUid = null;
  try {
    await initPersistencePromise;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    createdUser = userCredential.user;
    pendingEmailRegistrationProfileUid = createdUser.uid;
    
    // Update display name in Firebase Auth
    await updateProfile(createdUser, { displayName });
    
    // Reload user to ensure profile is updated in auth state
    await reload(createdUser);
    const refreshedUser = auth.currentUser || createdUser;
    
    // Create initial user profile in Firestore
    try {
      await createUserProfileIfMissing(refreshedUser);
      firestoreProfileCreated = true;
    } catch (firestoreErr) {
      console.error("Failed to create Firestore profile after registration. Deleting Auth user:", firestoreErr);
      try {
        await deleteUser(refreshedUser);
      } catch (deleteErr) {
        console.error("Failed to delete orphaned Auth user:", deleteErr);
      }
      pendingEmailRegistrationProfileUid = null;
      throw firestoreErr;
    }
    
    // Send email verification link
    try {
      await sendEmailVerification(refreshedUser);
    } catch (verifErr) {
      console.error("Failed to send verification email during registration:", verifErr);
      throw new Error(
        "Akun berhasil dibuat, tetapi email verifikasi belum dapat dikirim. Silakan coba kirim ulang email verifikasi atau kembali beberapa saat lagi."
      );
    }
    
    return refreshedUser;
  } catch (error: any) {
    console.error("Registration error:", error);
    if (!firestoreProfileCreated) {
      pendingEmailRegistrationProfileUid = null;
    }
    if (error.code) {
      throw new Error(mapFirebaseAuthError(error.code));
    }
    throw error;
  } finally {
    emailRegistrationInProgress = false;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    await initPersistencePromise;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Ensure Firestore profile is present (e.g. if created outside)
    await createUserProfileIfMissing(user);
    
    return user;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });
  
  try {
    await initPersistencePromise;
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Create Firestore profile if missing
    await createUserProfileIfMissing(user);
    
    return user;
  } catch (error: any) {
    console.error("Google Popup Sign-In failed, attempting fallback:", error);
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      try {
        await signInWithRedirect(auth, provider);
        // Wait for redirect to complete
        return null;
      } catch (redirectErr: any) {
        throw new Error(mapFirebaseAuthError(redirectErr.code));
      }
    }
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function handleGoogleRedirectResult(): Promise<FirebaseUser | null> {
  try {
    await initPersistencePromise;
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await createUserProfileIfMissing(result.user);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error("Google Redirect Result error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Password reset error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Tidak ada pengguna aktif yang terautentikasi.");
  }
  try {
    await sendEmailVerification(user);
  } catch (error: any) {
    console.error("Resend verification email error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function reloadCurrentAuthUser(): Promise<FirebaseUser | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    await reload(user);
    return auth.currentUser;
  } catch (error: any) {
    console.error("Reload user error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function reauthenticateWithPassword(password: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Tidak ada pengguna aktif yang terautentikasi.");
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return true;
  } catch (error: any) {
    console.error("Reauthentication error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function updateAccountEmail(newEmail: string, password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Tidak ada pengguna aktif yang terautentikasi.");
  }
  try {
    // Reauthenticate first
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // Start verification before changing email
    await verifyBeforeUpdateEmail(user, newEmail);
  } catch (error: any) {
    console.error("Email update error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function updateAccountPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Tidak ada pengguna aktif yang terautentikasi.");
  }
  try {
    // Reauthenticate first
    const emailCred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, emailCred);
    
    // Update password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error("Password update error:", error);
    throw new Error(mapFirebaseAuthError(error.code));
  }
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await getIdToken(user, forceRefresh);
  } catch (error) {
    console.error("Get ID Token error:", error);
    return null;
  }
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

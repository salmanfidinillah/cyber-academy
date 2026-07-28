import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, User as FirebaseUser } from "firebase/auth";
import { db, storage, auth } from "../lib/firebaseClient";
import { User } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function normalizeTimestamp(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === "string") {
    return val;
  }
  return null;
}

export function mapFirebaseUserToAppUser(firebaseUser: FirebaseUser, firestoreData: Record<string, any>): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || firestoreData?.email || "",
    displayName: firestoreData?.displayName || firebaseUser.displayName || "Pengguna Cyber",
    photoURL: firestoreData?.photoURL || firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
    role: (firestoreData?.role as "user" | "admin") || "user",
    accountStatus: (firestoreData?.accountStatus as "active" | "disabled" | "deleted") || "active",
    onboardingCompleted: !!firestoreData?.onboardingCompleted,
    
    // Server-authoritative learning stats from Firestore user document
    totalXp: typeof firestoreData?.totalXp === "number" ? firestoreData.totalXp : 0,
    currentLevel: typeof firestoreData?.currentLevel === "number" ? firestoreData.currentLevel : 1,
    learningStreak: typeof firestoreData?.learningStreak === "number" ? firestoreData.learningStreak : 0,
    longestStreak: typeof firestoreData?.longestStreak === "number" ? firestoreData.longestStreak : (firestoreData?.learningStreak ?? 0),
    lastStudyDate: firestoreData?.lastStudyDate || firestoreData?.lastLearningDate || null,
    lastActiveAt: normalizeTimestamp(firestoreData?.lastActiveAt) || null,
    createdAt: normalizeTimestamp(firestoreData?.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(firestoreData?.updatedAt) || new Date().toISOString(),
    
    providerIds: firebaseUser.providerData?.map(p => p.providerId) || [],
    emailVerified: firebaseUser.emailVerified,
    bio: firestoreData?.bio || "",
    learningGoal: firestoreData?.learningGoal || "",
    skillLevel: firestoreData?.skillLevel || "",
    interests: firestoreData?.interests || [],
    studyTime: firestoreData?.studyTime || "",
  };
}

export async function getUserProfile(uid: string): Promise<User | null> {
  if (!auth.currentUser) {
    throw new Error("Tidak ada sesi pengguna aktif.");
  }
  if (uid !== auth.currentUser.uid) {
    throw new Error("UID tidak cocok dengan pengguna aktif.");
  }
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data) return null;
      return mapFirebaseUserToAppUser(auth.currentUser, data);
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createUserProfileIfMissing(firebaseUser: FirebaseUser): Promise<User> {
  const path = `users/${firebaseUser.uid}`;
  try {
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return mapFirebaseUserToAppUser(firebaseUser, data || {});
    } else {
      // Create default user profile
      const defaultProfile: Record<string, any> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        role: "user",
        accountStatus: "active",
        onboardingCompleted: false,
        displayName: firebaseUser.displayName || "Pengguna Cyber",
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
        bio: "",
        learningGoal: "",
        skillLevel: "",
        interests: [],
        studyTime: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      await setDoc(docRef, defaultProfile);
      return mapFirebaseUserToAppUser(firebaseUser, defaultProfile);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export function subscribeToUserProfile(
  uid: string,
  onProfile: (user: User | null) => void,
  onError: (error: Error) => void
): () => void {
  const path = `users/${uid}`;
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (docSnap) => {
    try {
      if (docSnap.exists() && auth.currentUser) {
        onProfile(mapFirebaseUserToAppUser(auth.currentUser, docSnap.data()));
      } else {
        onProfile(null);
      }
    } catch (err: any) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (err: any) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export function buildSafeProfileUpdates(updates: Partial<User>): Record<string, any> {
  const safeUpdates: any = {};
  if (updates.displayName !== undefined) safeUpdates.displayName = updates.displayName;
  if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
  if (updates.photoURL !== undefined) safeUpdates.photoURL = updates.photoURL;
  if (updates.learningGoal !== undefined) safeUpdates.learningGoal = updates.learningGoal;
  if (updates.skillLevel !== undefined) safeUpdates.skillLevel = updates.skillLevel;
  if (updates.interests !== undefined) safeUpdates.interests = updates.interests;
  if (updates.studyTime !== undefined) safeUpdates.studyTime = updates.studyTime;
  if (updates.onboardingCompleted !== undefined) safeUpdates.onboardingCompleted = updates.onboardingCompleted;
  return safeUpdates;
}

export async function updateOwnUserProfile(updates: Partial<User>): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error("Sesi pengguna tidak valid.");
  }
  const path = `users/${currentUid}`;
  try {
    const docRef = doc(db, "users", currentUid);
    const safeUpdates = buildSafeProfileUpdates(updates);
    safeUpdates.updatedAt = serverTimestamp();

    await updateDoc(docRef, safeUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function completeOwnOnboarding(onboardingData: {
  learningGoal: string;
  skillLevel: string;
  interests: string[];
  studyTime: string;
}): Promise<User> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error("Sesi pengguna tidak valid.");
  }
  const path = `users/${currentUid}`;
  try {
    const docRef = doc(db, "users", currentUid);
    await updateDoc(docRef, {
      onboardingCompleted: true,
      learningGoal: onboardingData.learningGoal,
      skillLevel: onboardingData.skillLevel,
      interests: onboardingData.interests,
      studyTime: onboardingData.studyTime,
      updatedAt: serverTimestamp()
    });
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || !auth.currentUser) {
      throw new Error("Sesi pengguna atau dokumen profil tidak ditemukan.");
    }
    return mapFirebaseUserToAppUser(auth.currentUser, docSnap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function uploadCurrentUserAvatar(file: File): Promise<string> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error("Sesi pengguna tidak valid.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Hanya file JPG, PNG, atau WEBP yang diizinkan.");
  }

  try {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const avatarRef = ref(storage, `users/${currentUid}/avatar/${filename}`);

    await uploadBytes(avatarRef, file);
    const downloadURL = await getDownloadURL(avatarRef);

    // Sync to auth profile
    if (auth.currentUser && auth.currentUser.uid === currentUid) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }

    // Sync to Firestore profile
    await updateOwnUserProfile({ photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    throw error;
  }
}

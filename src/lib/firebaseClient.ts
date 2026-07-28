import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import appletConfig from "../../firebase-applet-config.json";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId,
};

const firestoreDatabaseId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || "(default)";

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

if (!isFirebaseConfigured) {
  console.error(
    "Error: Firebase Environment Variables are missing! Please check VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your configuration."
  );
}

let firebaseApp: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const throwMissingConfig = (serviceName: string) => {
  throw new Error(`Firebase tidak dapat dijalankan karena konfigurasi ${serviceName} tidak lengkap. Silakan periksa file .env Anda.`);
};

if (isFirebaseConfigured) {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp, firestoreDatabaseId);
  storage = getStorage(firebaseApp);
} else {
  // Use typed Proxy objects that throw explicit and readable configuration errors when any method/property is accessed
  auth = new Proxy({} as Auth, {
    get() {
      throwMissingConfig("Auth");
    }
  });
  db = new Proxy({} as Firestore, {
    get() {
      throwMissingConfig("Firestore");
    }
  });
  storage = new Proxy({} as FirebaseStorage, {
    get() {
      throwMissingConfig("Storage");
    }
  });
}

// Ensure persistence is set and export it as a Promise to be awaited before any auth transaction
export const initPersistencePromise = isFirebaseConfigured && auth
  ? setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("Failed to set persistence:", err);
    })
  : Promise.resolve();

export { firebaseApp, auth, db, storage };


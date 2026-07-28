import { initializeApp, getApps, getApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function initAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT;

  let credential;
  const inlineServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineServiceAccount) {
    try {
      credential = cert(JSON.parse(inlineServiceAccount));
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON service account yang valid.");
    }
  } else {
    credential = applicationDefault();
  }

  return initializeApp({
    credential,
    projectId: projectId || undefined,
  });
}

const adminApp = initAdminApp();
export const adminAuth = getAuth(adminApp);

let firestoreDatabaseId: string | undefined = undefined;
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    firestoreDatabaseId = config.firestoreDatabaseId;
  }
} catch (err) {
  console.error("Gagal membaca firebase-applet-config.json:", err);
}

export const adminDb = getFirestore(adminApp, firestoreDatabaseId || undefined);

import { adminAuth, adminDb } from "../server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

async function main() {
  const args = process.argv.slice(2);
  let cliEmail: string | undefined;
  let cliUid: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      cliEmail = args[i + 1];
      i++;
    } else if (args[i] === "--uid" && args[i + 1]) {
      cliUid = args[i + 1];
      i++;
    }
  }

  const email = cliEmail;
  const uid = cliUid;

  if (!email && !uid) {
    console.error("Error: Mohon berikan argumen CLI (--email <email> atau --uid <uid>).");
    console.error("Contoh CLI:");
    console.error("  npm run set-admin -- --email user@example.com");
    console.error("  npm run set-admin -- --uid FIREBASE_UID");
    process.exit(1);
  }

  let userRecord;
  try {
    if (cliEmail || (!cliUid && email)) {
      console.log(`Mencari pengguna dengan email: ${email}...`);
      userRecord = await adminAuth.getUserByEmail(email!);
    } else if (uid) {
      console.log(`Mencari pengguna dengan UID: ${uid}...`);
      userRecord = await adminAuth.getUser(uid);
    }
  } catch (err: any) {
    console.error("Gagal menemukan pengguna di Firebase Auth:", err.message || err);
    process.exit(1);
  }

  if (!userRecord) {
    console.error("Pengguna tidak ditemukan.");
    process.exit(1);
  }

  const targetUid = userRecord.uid;
  const targetEmail = userRecord.email || email || "tanpa-email";
  console.log(`Pengguna ditemukan: ${targetEmail} (UID: ${targetUid})`);

  const currentClaims = userRecord.customClaims || {};
  try {
    await adminAuth.setCustomUserClaims(targetUid, {
      ...currentClaims,
      admin: true,
    });
    console.log("SUCCESS: Custom claim 'admin: true' berhasil ditetapkan di Firebase Auth.");
  } catch (err: any) {
    console.error("CRITICAL FAILURE: Gagal menetapkan custom claim admin:", err.message || err);
    process.exit(1);
  }

  let firestoreSuccess = false;
  try {
    const userDocRef = adminDb.collection("users").doc(targetUid);
    const docSnap = await userDocRef.get();
    if (docSnap.exists) {
      await userDocRef.update({
        role: "admin",
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log("SUCCESS: Metadata Firestore users/{uid}.role berhasil diperbarui menjadi 'admin'.");
      firestoreSuccess = true;
    } else {
      console.log("INFO: Dokumen Firestore users/{uid} belum ada. Custom claim admin telah diset di Auth.");
      firestoreSuccess = true;
    }
  } catch (err: any) {
    console.error("PARTIAL FAILURE: Custom claim admin berhasil diset di Auth, namun pembaruan dokumen metadata Firestore mengalami kendala:", err.message || err);
  }

  console.log(`\n================================================================`);
  console.log(`Selesai! Status Admin untuk ${targetEmail} (UID: ${targetUid}) telah aktif.`);
  console.log(`CATATAN PENTING OTHORISASI:`);
  console.log(`Pengguna harus melakukan Logout dan Login kembali, atau memicu force token refresh (getIdToken(user, true)) pada browser agar klaim admin baru aktif di ID token client.`);
  console.log(`================================================================\n`);

  if (!firestoreSuccess) {
    console.warn("Peringatan: Pembaruan metadata Firestore tidak penuh, namun klaim otorisasi utama Firebase Auth telah aktif.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Terjadi kesalahan fatal pada set-admin script:", err);
  process.exit(1);
});

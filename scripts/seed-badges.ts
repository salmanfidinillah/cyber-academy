import { FieldValue } from "firebase-admin/firestore";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { buildBadgeSeedPlan, ExistingDocument } from "./badgeMaintenance";

interface BadgeSeedDb {
  collection(name: string): any;
  batch(): any;
}

async function readDocuments(db: BadgeSeedDb, collectionName: string): Promise<ExistingDocument[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() || {} }));
}

export async function runBadgeSeed(
  db: BadgeSeedDb,
  confirm = false,
  logger: Pick<Console, "log"> = console
) {
  const existingBadges = await readDocuments(db, "badges");
  const plan = buildBadgeSeedPlan(existingBadges);
  logger.log("Badge seed plan:", plan.summary);

  if (!confirm || plan.writes.length === 0) {
    logger.log(
      confirm
        ? "Tidak ada perubahan badge yang diperlukan."
        : "Dry-run selesai. Tambahkan --confirm untuk menulis perubahan."
    );
    return { ...plan.summary, writesApplied: 0, dryRun: !confirm };
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  plan.writes.forEach((write) => {
    batch.set(
      db.collection("badges").doc(write.id),
      {
        ...write.data,
        ...(write.reason === "deactivate_legacy_definition"
          ? { deprecatedAt: now }
          : {}),
        ...(!write.exists ? { createdAt: now } : {}),
        updatedAt: now,
      },
      { merge: true }
    );
  });
  await batch.commit();
  logger.log(`${plan.writes.length} definisi badge berhasil disinkronkan.`);
  return { ...plan.summary, writesApplied: plan.writes.length, dryRun: false };
}

export async function main(args = process.argv.slice(2)) {
  const confirm = args.includes("--confirm");
  const { adminDb } = await import("../server/firebaseAdmin");
  return runBadgeSeed(adminDb, confirm);
}

const isMainModule =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith("seed-badges.ts") ||
    process.argv[1].endsWith("seed-badges.js"));

if (isMainModule) {
  main().catch((error) => {
    console.error("Badge seed gagal:", error?.message || error);
    process.exit(1);
  });
}

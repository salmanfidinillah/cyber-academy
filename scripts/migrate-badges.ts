import { FieldValue } from "firebase-admin/firestore";
import { fileURLToPath } from "node:url";
import process from "node:process";
import {
  buildBadgeMigrationPlan,
  ExistingDocument,
  PlannedWrite,
} from "./badgeMaintenance";

interface BadgeMigrationDb {
  collection(name: string): any;
  batch(): any;
}

async function readDocuments(
  db: BadgeMigrationDb,
  collectionName: string
): Promise<ExistingDocument[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() || {} }));
}

async function applyWrites(
  db: BadgeMigrationDb,
  collectionName: string,
  writes: PlannedWrite[]
) {
  for (let offset = 0; offset < writes.length; offset += 400) {
    const chunk = writes.slice(offset, offset + 400);
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    chunk.forEach((write) => {
      batch.set(
        db.collection(collectionName).doc(write.id),
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
  }
}

export async function runBadgeMigration(
  db: BadgeMigrationDb,
  confirm = false,
  logger: Pick<Console, "log"> = console
) {
  const [badges, userBadges] = await Promise.all([
    readDocuments(db, "badges"),
    readDocuments(db, "userBadges"),
  ]);
  const plan = buildBadgeMigrationPlan(badges, userBadges);
  logger.log("Badge migration plan:", plan.summary);
  logger.log(`Definition writes: ${plan.badgeWrites.length}`);
  logger.log(`User award writes: ${plan.userBadgeWrites.length}`);

  if (!confirm) {
    logger.log("Dry-run selesai tanpa menulis data. Tambahkan --confirm untuk menjalankan migrasi.");
    return { ...plan.summary, writesApplied: 0, dryRun: true };
  }

  await applyWrites(db, "badges", plan.badgeWrites);
  await applyWrites(db, "userBadges", plan.userBadgeWrites);
  const writesApplied = plan.badgeWrites.length + plan.userBadgeWrites.length;
  logger.log(`${writesApplied} dokumen berhasil diperbarui tanpa penghapusan data.`);
  return { ...plan.summary, writesApplied, dryRun: false };
}

export async function main(args = process.argv.slice(2)) {
  const confirm = args.includes("--confirm");
  const { adminDb } = await import("../server/firebaseAdmin");
  return runBadgeMigration(adminDb, confirm);
}

const isMainModule =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith("migrate-badges.ts") ||
    process.argv[1].endsWith("migrate-badges.js"));

if (isMainModule) {
  main().catch((error) => {
    console.error("Migrasi badge gagal:", error?.message || error);
    process.exit(1);
  });
}

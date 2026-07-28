import { learningPaths, courses, lessons } from "../src/data.js";
import { quizzes, questions } from "../src/quiz_data.js";
import {
  validateSeedData,
  planSeedOperations,
  buildSeedItemPayloads,
} from "./seedValidator.js";

export { validateSeedData };
import { fileURLToPath } from "url";
import process from "process";

export async function main(overrideArgs?: string[]) {
  const args = overrideArgs || process.argv.slice(2);
  const confirm = args.includes("--confirm");

  if (!confirm) {
    console.error(
      "Peringatan: Seeding hanya akan membuat dokumen katalog Firestore yang belum ada. Jalankan dengan flag --confirm untuk melanjutkan."
    );
    process.exit(1);
  }

  // 1. Memory validation
  try {
    validateSeedData(learningPaths, courses, lessons, quizzes, questions);
    console.log("Validasi integritas data seed sukses (termasuk quizzes & questions).");
  } catch (err: any) {
    console.error("Validasi data seed GAGAL:", err.message);
    process.exit(1);
  }

  // 2. Dynamic import of Firebase Admin ONLY after confirm & memory validation
  const { adminDb } = await import("../server/firebaseAdmin.js");
  const { FieldValue } = await import("firebase-admin/firestore");

  console.log("Memulai seeding data konten (Learning Paths, Courses, Lessons, Quizzes, Questions) ke Cloud Firestore...\n");

  // 3. Preflight read existing document IDs from Firestore using composite keys (${collection}/${id})
  const seedItems = buildSeedItemPayloads(learningPaths, courses, lessons, quizzes, questions);
  const existingDocIds = new Set<string>();

  const docRefs = seedItems.map((item) =>
    adminDb.collection(item.collection).doc(item.id)
  );

  if (docRefs.length > 0) {
    const snapshots = await adminDb.getAll(...docRefs);
    snapshots.forEach((snap, idx) => {
      if (snap.exists) {
        const item = seedItems[idx];
        existingDocIds.add(`${item.collection}/${item.id}`);
      }
    });
  }

  // 4. Plan seed operations
  const plan = planSeedOperations(
    learningPaths,
    courses,
    lessons,
    existingDocIds,
    quizzes,
    questions
  );

  if (plan.itemsToCreate.length > 450) {
    console.error(
      `Jumlah dokumen baru (${plan.itemsToCreate.length}) melebihi batas aman 450 untuk satu atomic batch. Seeding dibatalkan.`
    );
    process.exit(1);
  }

  if (plan.itemsToCreate.length === 0) {
    console.log("\n================ SUMMARY SEEDING ================");
    console.log(`Total Source     : ${plan.totalSource}`);
    console.log(`Created          : 0`);
    console.log(`Skipped Existing : ${plan.skippedExisting}`);
    console.log(`Failed           : 0`);
    console.log("Semua dokumen sudah ada di Firestore. Tidak ada perubahan.");
    console.log("=================================================\n");
    return {
      totalSource: plan.totalSource,
      created: 0,
      skippedExisting: plan.skippedExisting,
      failed: 0,
    };
  }

  // 5. Atomic batch write using batch.create() ONLY
  const batch = adminDb.batch();
  const now = FieldValue.serverTimestamp();

  for (const item of plan.itemsToCreate) {
    const docRef = adminDb.collection(item.collection).doc(item.id);
    const dataWithTimestamps = {
      ...item.data,
      createdAt: now,
      updatedAt: now,
    };
    batch.create(docRef, dataWithTimestamps);
  }

  try {
    await batch.commit();
    console.log("\n================ SUMMARY SEEDING ================");
    console.log(`Total Source     : ${plan.totalSource}`);
    console.log(`Created          : ${plan.itemsToCreate.length}`);
    console.log(`Skipped Existing : ${plan.skippedExisting}`);
    console.log(`Failed           : 0`);
    console.log("=================================================\n");
    return {
      totalSource: plan.totalSource,
      created: plan.itemsToCreate.length,
      skippedExisting: plan.skippedExisting,
      failed: 0,
    };
  } catch (err: any) {
    console.error("Batch create gagal:", err.message);
    console.log("\n================ SUMMARY SEEDING ================");
    console.log(`Total Source     : ${plan.totalSource}`);
    console.log(`Created          : 0`);
    console.log(`Skipped Existing : ${plan.skippedExisting}`);
    console.log(`Failed           : ${plan.itemsToCreate.length}`);
    console.log("=================================================\n");
    throw err;
  }
}

const isMainModule =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith("seed-content.ts") ||
    process.argv[1].endsWith("seed-content.js"));

if (isMainModule) {
  main().catch((err) => {
    console.error("Seeding Error:", err);
    process.exit(1);
  });
}

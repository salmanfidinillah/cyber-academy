import { fileURLToPath } from "node:url";
import process from "node:process";
import { learningPaths, courses, lessons } from "../src/data.js";
import { quizzes, questions } from "../src/quiz_data.js";
import {
  buildSeedItemPayloads,
  planSeedOperations,
  validateSeedData,
} from "./seedValidator.js";

export { validateSeedData };

const CATALOG_COLLECTIONS = [
  "learningPaths",
  "courses",
  "lessons",
  "quizzes",
  "questions",
] as const;
const DEFAULT_PRODUCTION_PROJECT_ID = "cyber-academy-6aeba";

type SeedTarget = "emulator" | "test" | "production";

function readArgument(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function readTarget(args: string[]): SeedTarget {
  const target = readArgument(args, "target") || "emulator";
  if (!(["emulator", "test", "production"] as string[]).includes(target)) {
    throw new Error("Target seed tidak valid. Gunakan emulator, test, atau production.");
  }
  return target as SeedTarget;
}

function printPlan(plan: ReturnType<typeof planSeedOperations>, dryRun: boolean): void {
  console.log("\n================ RENCANA SEED ================");
  console.log(`Mode             : ${dryRun ? "DRY-RUN (tanpa write)" : "WRITE"}`);
  console.log(`Total Source     : ${plan.totalSource}`);
  console.log(`Would Create     : ${plan.itemsToCreate.length}`);
  console.log(`Would Update     : ${plan.itemsToUpdate.length}`);
  console.log(`Unexpected Docs  : ${plan.unexpectedExistingIds.length}`);
  console.log("==============================================\n");
}

export async function main(overrideArgs?: string[]) {
  const args = overrideArgs || process.argv.slice(2);
  const target = readTarget(args);
  const confirm = args.includes("--confirm");
  const explicitDryRun = args.includes("--dry-run");
  const dryRun = explicitDryRun || !confirm;
  const productionProjectId =
    process.env.PRODUCTION_FIREBASE_PROJECT_ID || DEFAULT_PRODUCTION_PROJECT_ID;
  const projectId =
    readArgument(args, "project") ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT;

  validateSeedData(learningPaths, courses, lessons, quizzes, questions);
  console.log("Validasi integritas source sukses (path, course, lesson, quiz, question, count, dan order).\n");

  if (!projectId) {
    throw new Error("Project ID wajib diberikan melalui --project=PROJECT_ID atau environment variable.");
  }

  if (target === "emulator" && !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      "Target default adalah emulator, tetapi FIRESTORE_EMULATOR_HOST belum aktif. Jalankan emulator atau pilih --target=test/production secara eksplisit.",
    );
  }

  if (target !== "production" && projectId === productionProjectId) {
    throw new Error(
      "Project produksi tidak boleh digunakan dengan target emulator/test. Gunakan --target=production secara eksplisit.",
    );
  }

  if (target === "test" && projectId === productionProjectId) {
    throw new Error("Project produksi tidak dapat diperlakukan sebagai project test.");
  }

  if (target === "production") {
    if (projectId !== productionProjectId) {
      throw new Error(
        `Target production hanya diizinkan untuk project yang terdaftar: ${productionProjectId}.`,
      );
    }
    const productionConfirmation = readArgument(args, "confirm-production");
    if (!dryRun && productionConfirmation !== productionProjectId) {
      throw new Error(
        `Write produksi memerlukan --confirm-production=${productionProjectId} selain --confirm.`,
      );
    }
  }

  // Pastikan Firebase Admin mengarah ke project yang dipilih sebelum module diinisialisasi.
  process.env.FIREBASE_PROJECT_ID = projectId;

  const { adminDb } = await import("../server/firebaseAdmin.js");
  const { FieldValue } = await import("firebase-admin/firestore");

  // Preflight hanya membaca lima koleksi katalog. Tidak ada koleksi pengguna yang disentuh.
  const collectionSnapshots = await Promise.all(
    CATALOG_COLLECTIONS.map((collectionName) =>
      adminDb.collection(collectionName).select().get(),
    ),
  );
  const existingDocIds = new Set<string>();
  collectionSnapshots.forEach((snapshot, index) => {
    const collectionName = CATALOG_COLLECTIONS[index];
    snapshot.docs.forEach((document) => {
      existingDocIds.add(`${collectionName}/${document.id}`);
    });
  });

  const plan = planSeedOperations(
    learningPaths,
    courses,
    lessons,
    existingDocIds,
    quizzes,
    questions,
  );
  printPlan(plan, dryRun);

  if (plan.unexpectedExistingIds.length > 0) {
    console.error("Dokumen katalog yang tidak terdapat di source:");
    plan.unexpectedExistingIds.forEach((documentId) => console.error(`- ${documentId}`));
    throw new Error(
      "Sinkronisasi dibatalkan. Script tidak menghapus dokumen otomatis; review dokumen tak dikenal terlebih dahulu.",
    );
  }

  if (dryRun) {
    console.log("Dry-run selesai. Tidak ada perubahan yang ditulis ke Firestore.");
    return {
      dryRun: true,
      totalSource: plan.totalSource,
      wouldCreate: plan.itemsToCreate.length,
      wouldUpdate: plan.itemsToUpdate.length,
      written: 0,
    };
  }

  if (plan.operations.length > 450) {
    throw new Error(
      `Jumlah operasi (${plan.operations.length}) melebihi batas aman 450 untuk satu atomic batch.`,
    );
  }

  const batch = adminDb.batch();
  const now = FieldValue.serverTimestamp();

  for (const operation of plan.operations) {
    const documentRef = adminDb.collection(operation.collection).doc(operation.id);
    const payload = {
      ...operation.data,
      ...(operation.mode === "create" ? { createdAt: now } : {}),
      updatedAt: now,
    };
    batch.set(documentRef, payload, { merge: true });
  }

  await batch.commit();
  console.log(`Seed selesai: ${plan.operations.length} dokumen katalog di-upsert secara idempotent.`);

  return {
    dryRun: false,
    totalSource: plan.totalSource,
    created: plan.itemsToCreate.length,
    updated: plan.itemsToUpdate.length,
    written: plan.operations.length,
  };
}

const isMainModule =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith("seed-content.ts") ||
    process.argv[1].endsWith("seed-content.js"));

if (isMainModule) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
    console.error(`Seeding Error: ${message}`);
    process.exitCode = 1;
  });
}

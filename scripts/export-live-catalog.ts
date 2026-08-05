import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";

const CATALOG_COLLECTIONS = [
  "learningPaths",
  "courses",
  "lessons",
  "quizzes",
  "questions",
] as const;

type CatalogCollectionName = (typeof CATALOG_COLLECTIONS)[number];
type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ExportedDocument {
  id: string;
  [key: string]: JsonValue;
}

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function toJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof GeoPoint) {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (value instanceof DocumentReference) {
    return value.path;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        toJsonSafe(nestedValue),
      ]),
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return String(value);
}

function getDocumentString(document: ExportedDocument, field: string): string {
  const value = document[field];
  return typeof value === "string" ? value : "";
}

async function main(): Promise<void> {
  const projectId =
    readArgument("project") ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID;
  const databaseId = readArgument("database") || process.env.FIRESTORE_DATABASE_ID || "(default)";
  const outputPath = path.resolve(
    process.cwd(),
    readArgument("output") || "firestore-catalog-export.json",
  );

  if (!projectId) {
    throw new Error(
      "Project ID tidak ditemukan. Gunakan --project=PROJECT_ID atau set GOOGLE_CLOUD_PROJECT.",
    );
  }

  const app =
    getApps()[0] ||
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  const db = getFirestore(app, databaseId);

  const snapshots = await Promise.all(
    CATALOG_COLLECTIONS.map((collectionName) => db.collection(collectionName).get()),
  );

  const collections = Object.fromEntries(
    snapshots.map((snapshot, index) => {
      const collectionName = CATALOG_COLLECTIONS[index];
      const documents = snapshot.docs.map((document) => {
        const serialized = toJsonSafe(document.data());
        const fields =
          serialized && typeof serialized === "object" && !Array.isArray(serialized)
            ? serialized
            : {};
        return {
          ...fields,
          id: document.id,
        } as ExportedDocument;
      });
      return [collectionName, documents];
    }),
  ) as Record<CatalogCollectionName, ExportedDocument[]>;

  const counts = Object.fromEntries(
    CATALOG_COLLECTIONS.map((collectionName) => [
      collectionName,
      collections[collectionName].length,
    ]),
  ) as Record<CatalogCollectionName, number>;

  const coursesPerLearningPath = collections.learningPaths
    .map((learningPath) => {
      const learningPathId = learningPath.id;
      return {
        learningPathId,
        title: getDocumentString(learningPath, "title"),
        courseCount: collections.courses.filter(
          (course) => getDocumentString(course, "learningPathId") === learningPathId,
        ).length,
      };
    })
    .sort((first, second) => first.learningPathId.localeCompare(second.learningPathId));

  const exportedCatalog = {
    metadata: {
      exportedAt: new Date().toISOString(),
      projectId,
      databaseId,
      collections: [...CATALOG_COLLECTIONS],
      readOnly: true,
    },
    counts,
    coursesPerLearningPath,
    collections,
  };

  await writeFile(outputPath, `${JSON.stringify(exportedCatalog, null, 2)}\n`, "utf8");

  console.log("Ekspor katalog Firestore selesai (read-only).\n");
  for (const collectionName of CATALOG_COLLECTIONS) {
    console.log(`${collectionName}: ${counts[collectionName]} dokumen`);
  }
  console.log("\nJumlah kelas per learning path:");
  for (const summary of coursesPerLearningPath) {
    console.log(`${summary.learningPathId}: ${summary.courseCount} kelas`);
  }
  console.log(`\nFile tersimpan: ${outputPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
  console.error(`Ekspor katalog gagal: ${message}`);
  process.exitCode = 1;
});

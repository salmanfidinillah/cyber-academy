import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../firebaseAdmin", () => {
  const store: Record<string, Record<string, any>> = {};
  let generatedId = 0;

  const makeRef = (collectionName: string, id: string) => {
    const ref: any = {
      id,
      collectionName,
      get: async () => {
        const data = store[collectionName]?.[id];
        return {
          id,
          ref,
          exists: Boolean(data),
          data: () => data,
        };
      },
      set: async (data: any, options?: { merge?: boolean }) => {
        if (!store[collectionName]) store[collectionName] = {};
        store[collectionName][id] =
          options?.merge && store[collectionName][id]
            ? { ...store[collectionName][id], ...data }
            : { ...data };
      },
    };
    return ref;
  };

  const makeQuery = (collectionName: string) => {
    const conditions: Array<{ field: string; value: any }> = [];
    const query: any = {
      where: (field: string, operator: string, value: any) => {
        if (operator === "==") conditions.push({ field, value });
        return query;
      },
      get: async () => {
        const docs = Object.entries(store[collectionName] || {})
          .filter(([, data]) =>
            conditions.every((condition) => data[condition.field] === condition.value)
          )
          .map(([id, data]) => ({
            id,
            ref: makeRef(collectionName, id),
            exists: true,
            data: () => data,
          }));
        return { docs, empty: docs.length === 0 };
      },
    };
    return query;
  };

  const adminDb: any = {
    __store: store,
    collection: (name: string) => ({
      doc: (id?: string) => makeRef(name, id || `generated-${++generatedId}`),
      get: () => makeQuery(name).get(),
      where: (field: string, operator: string, value: any) =>
        makeQuery(name).where(field, operator, value),
    }),
    batch: () => {
      const operations: Array<() => Promise<void>> = [];
      return {
        set: (ref: any, data: any, options?: { merge?: boolean }) => {
          operations.push(() => ref.set(data, options));
        },
        commit: async () => {
          for (const operation of operations) await operation();
        },
      };
    },
    runTransaction: async (callback: (transaction: any) => Promise<any>) => {
      const transaction = {
        get: (ref: any) => ref.get(),
        create: (ref: any, data: any) => {
          const collection = ref.collectionName;
          if (store[collection]?.[ref.id]) throw new Error("Document already exists");
          if (!store[collection]) store[collection] = {};
          store[collection][ref.id] = { ...data };
        },
        set: (ref: any, data: any, options?: { merge?: boolean }) =>
          ref.set(data, options),
        update: (ref: any, data: any) => ref.set(data, { merge: true }),
      };
      return callback(transaction);
    },
  };

  return {
    adminDb,
    adminAuth: {},
  };
});

import { adminDb } from "../firebaseAdmin";
import {
  evaluateUserBadgeState,
  listBadges,
  listUserBadges,
  updateBadge,
} from "./achievementService";

const store = (adminDb as any).__store as Record<string, Record<string, any>>;

function seedCompletedBeginner(uid: string) {
  store.learningPaths["beginner-path"] = { status: "published" };
  store.courses["beginner-course"] = {
    learningPathId: "beginner-path",
    status: "published",
  };
  store.lessons["beginner-lesson"] = {
    courseId: "beginner-course",
    status: "published",
  };
  store.quizzes["beginner-quiz"] = {
    courseId: "beginner-course",
    status: "published",
  };
  store.userProgress[`${uid}__course__beginner-course`] = {
    userId: uid,
    contentType: "course",
    contentId: "beginner-course",
    status: "completed",
  };
  store.userProgress[`${uid}__lesson__beginner-lesson`] = {
    userId: uid,
    contentType: "lesson",
    contentId: "beginner-lesson",
    status: "completed",
  };
  store.quizSummaries[`${uid}__quiz__beginner-quiz`] = {
    userId: uid,
    quizId: "beginner-quiz",
    courseId: "beginner-course",
    passed: true,
  };
}

describe("achievement service badge integration", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    [
      "badges",
      "userBadges",
      "learningPaths",
      "courses",
      "lessons",
      "quizzes",
      "simulations",
      "userProgress",
      "quizSummaries",
      "simulationAttempts",
      "adminAuditLogs",
      "xpTransactions",
    ].forEach((collection) => {
      store[collection] = {};
    });
  });

  it("1. awards Beginner Master once and remains idempotent on repeated evaluation", async () => {
    seedCompletedBeginner("user-a");
    const first = await evaluateUserBadgeState("user-a");
    const firstAwardedAt = store.userBadges[
      "user-a__badge__badge-cyber-defender"
    ].awardedAt;
    const second = await evaluateUserBadgeState("user-a");

    expect(first.userBadges).toHaveLength(1);
    expect(second.userBadges).toHaveLength(1);
    expect(Object.keys(store.userBadges)).toHaveLength(1);
    expect(
      store.userBadges["user-a__badge__badge-cyber-defender"].awardedAt
    ).toBe(firstAwardedAt);
  });

  it("2. writes only one audit entry for one badge award", async () => {
    seedCompletedBeginner("user-a");
    await evaluateUserBadgeState("user-a");
    await evaluateUserBadgeState("user-a");
    expect(Object.keys(store.adminAuditLogs)).toHaveLength(1);
  });

  it("3. does not create or duplicate XP rewards for badges", async () => {
    seedCompletedBeginner("user-a");
    await evaluateUserBadgeState("user-a");
    await evaluateUserBadgeState("user-a");
    expect(Object.keys(store.xpTransactions)).toHaveLength(0);
  });

  it("4. prevents User A progress from awarding User B", async () => {
    seedCompletedBeginner("user-a");
    const userB = await evaluateUserBadgeState("user-b");
    expect(userB.userBadges).toHaveLength(0);
    expect(store.userBadges["user-b__badge__badge-cyber-defender"]).toBeUndefined();
  });

  it("5. returns only four active badges even when an unknown active definition exists", async () => {
    store.badges["badge-unknown"] = {
      badgeId: "badge-unknown",
      slug: "unknown",
      status: "active",
    };
    const badges = await listBadges(false);
    expect(badges).toHaveLength(4);
    expect(badges.some((badge: any) => badge.badgeId === "badge-unknown")).toBe(false);
    expect(store.badges["badge-unknown"].status).toBe("inactive");
  });

  it("6. tolerates legacy badge data in Firestore", async () => {
    store.badges["badge-first-step"] = {
      badgeId: "badge-first-step",
      slug: "first-step",
      status: "active",
    };
    await expect(listBadges(true)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badgeId: "badge-first-step",
          status: "inactive",
          isLegacy: true,
        }),
      ])
    );
  });

  it("7. normalizes an existing active milestone award to the canonical slug", async () => {
    store.userBadges["user-a__badge__badge-cyber-defender"] = {
      userBadgeId: "user-a__badge__badge-cyber-defender",
      userId: "user-a",
      badgeId: "badge-cyber-defender",
      badgeSlug: "cyber-defender",
      awardedAt: "2026-01-01T00:00:00.000Z",
    };
    const awards = await listUserBadges("user-a");
    expect(awards[0].badgeSlug).toBe("beginner-master");
  });

  it("8. never exposes granular legacy user awards as active awards", async () => {
    store.userBadges["user-a__badge__badge-first-step"] = {
      userId: "user-a",
      badgeId: "badge-first-step",
      badgeSlug: "first-step",
      awardedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(await listUserBadges("user-a")).toHaveLength(0);
  });

  it("9. prevents an admin operation from deactivating a primary milestone", async () => {
    await expect(
      updateBadge("admin-a", "badge-cyber-defender", { status: "inactive" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("10. prevents an admin operation from reactivating a legacy badge", async () => {
    await expect(
      updateBadge("admin-a", "badge-first-step", { status: "active" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("11. prevents canonical milestone names from drifting in admin", async () => {
    await expect(
      updateBadge("admin-a", "badge-cyber-defender", { title: "Duplicate Master" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

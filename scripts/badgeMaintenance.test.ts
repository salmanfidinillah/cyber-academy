import { describe, expect, it, vi } from "vitest";
import {
  ACTIVE_BADGE_DEFINITIONS,
  toActiveBadgeDocument,
} from "../server/services/badgeDefinitions";
import {
  buildBadgeMigrationPlan,
  buildBadgeSeedPlan,
  ExistingDocument,
} from "./badgeMaintenance";
import { runBadgeMigration } from "./migrate-badges";

describe("badge seed and migration safety", () => {
  it("1. seed creates exactly four active definitions on an empty database", () => {
    const plan = buildBadgeSeedPlan([]);
    expect(plan.writes).toHaveLength(4);
    expect(plan.writes.every((write) => write.data.status === "active")).toBe(true);
  });

  it("2. seed is idempotent for canonical definitions", () => {
    const existing = ACTIVE_BADGE_DEFINITIONS.map((definition) => ({
      id: definition.badgeId,
      data: toActiveBadgeDocument(definition),
    }));
    expect(buildBadgeSeedPlan(existing).writes).toHaveLength(0);
  });

  it("3. seed deactivates legacy definitions without deleting them", () => {
    const plan = buildBadgeSeedPlan([
      {
        id: "badge-first-step",
        data: { badgeId: "badge-first-step", status: "active" },
      },
    ]);
    const legacy = plan.writes.find((write) => write.id === "badge-first-step");
    expect(legacy?.data).toMatchObject({ status: "inactive", deprecated: true });
    expect(legacy?.reason).toBe("deactivate_legacy_definition");
  });

  it("4. migration normalizes old milestone award slugs", () => {
    const plan = buildBadgeMigrationPlan([], [
      {
        id: "user-1__badge__badge-cyber-defender",
        data: {
          userId: "user-1",
          badgeId: "badge-cyber-defender",
          badgeSlug: "cyber-defender",
        },
      },
    ]);
    expect(plan.userBadgeWrites).toEqual([
      expect.objectContaining({
        id: "user-1__badge__badge-cyber-defender",
        data: expect.objectContaining({ badgeSlug: "beginner-master" }),
      }),
    ]);
  });

  it("5. migration does not convert granular legacy awards into Master badges", () => {
    const plan = buildBadgeMigrationPlan([], [
      {
        id: "user-1__badge__badge-first-step",
        data: {
          userId: "user-1",
          badgeId: "badge-first-step",
          badgeSlug: "first-step",
        },
      },
    ]);
    expect(plan.userBadgeWrites).toHaveLength(0);
  });

  it("6. migration preserves existing awardedAt values by not including them in writes", () => {
    const plan = buildBadgeMigrationPlan([], [
      {
        id: "award-1",
        data: {
          userId: "user-1",
          badgeId: "badge-intermediate-defender",
          badgeSlug: "intermediate-defender",
          awardedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    ]);
    expect(plan.userBadgeWrites[0].data).not.toHaveProperty("awardedAt");
  });

  it("7. dry-run reads and reports but never creates a write batch", async () => {
    const batch = vi.fn();
    const logger = { log: vi.fn() };
    const db = {
      collection: (name: string) => ({
        get: async () => ({
          docs: name === "badges"
            ? [{
                id: "badge-first-step",
                data: () => ({ status: "active" }),
              }]
            : [],
        }),
      }),
      batch,
    };

    const result = await runBadgeMigration(db as any, false, logger);
    expect(result.dryRun).toBe(true);
    expect(result.writesApplied).toBe(0);
    expect(batch).not.toHaveBeenCalled();
  });

  it("8. migration plan is idempotent after definitions and awards are canonical", () => {
    const badges: ExistingDocument[] = ACTIVE_BADGE_DEFINITIONS.map((definition) => ({
      id: definition.badgeId,
      data: toActiveBadgeDocument(definition),
    }));
    const userBadges: ExistingDocument[] = ACTIVE_BADGE_DEFINITIONS.map((definition) => ({
      id: `user-1__badge__${definition.badgeId}`,
      data: {
        userId: "user-1",
        badgeId: definition.badgeId,
        badgeSlug: definition.slug,
        sourceType: definition.requirementType,
        sourceId: definition.requirementValue,
        idempotencyKey: `badge_award:user-1:${definition.slug}`,
      },
    }));
    const plan = buildBadgeMigrationPlan(badges, userBadges);
    expect(plan.badgeWrites).toHaveLength(0);
    expect(plan.userBadgeWrites).toHaveLength(0);
  });
});

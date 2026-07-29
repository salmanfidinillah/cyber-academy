import {
  ACTIVE_BADGE_DEFINITIONS,
  ACTIVE_BADGE_IDS,
  getActiveBadgeDefinition,
  toActiveBadgeDocument,
} from "../server/services/badgeDefinitions";

export interface ExistingDocument {
  id: string;
  data: Record<string, any>;
}

export interface PlannedWrite {
  id: string;
  data: Record<string, any>;
  exists: boolean;
  reason: string;
}

export interface BadgeMigrationPlan {
  badgeWrites: PlannedWrite[];
  userBadgeWrites: PlannedWrite[];
  summary: {
    activeDefinitions: number;
    definitionsToCreate: number;
    definitionsToUpdate: number;
    legacyDefinitionsToDeactivate: number;
    userAwardsToNormalize: number;
  };
}

function valuesMatch(current: Record<string, any>, expected: Record<string, any>) {
  return Object.entries(expected).every(([key, value]) =>
    Array.isArray(value)
      ? JSON.stringify(current[key] || []) === JSON.stringify(value)
      : current[key] === value
  );
}

export function buildBadgeMigrationPlan(
  existingBadges: ExistingDocument[],
  existingUserBadges: ExistingDocument[] = []
): BadgeMigrationPlan {
  const badgeMap = new Map(existingBadges.map((document) => [document.id, document]));
  const badgeWrites: PlannedWrite[] = [];

  ACTIVE_BADGE_DEFINITIONS.forEach((definition) => {
    const existing = badgeMap.get(definition.badgeId);
    const canonical = toActiveBadgeDocument(definition);
    if (existing && valuesMatch(existing.data, canonical)) return;
    badgeWrites.push({
      id: definition.badgeId,
      data: canonical,
      exists: Boolean(existing),
      reason: existing ? "normalize_active_definition" : "create_active_definition",
    });
  });

  existingBadges.forEach((document) => {
    if (ACTIVE_BADGE_IDS.has(document.id)) return;
    const expected = {
      status: "inactive",
      deprecated: true,
      replacementBadgeId: null,
    };
    if (valuesMatch(document.data, expected) && document.data.deprecatedAt) return;
    badgeWrites.push({
      id: document.id,
      data: expected,
      exists: true,
      reason: "deactivate_legacy_definition",
    });
  });

  const userBadgeWrites = existingUserBadges.flatMap((document) => {
    const definition = getActiveBadgeDefinition(String(document.data.badgeId || ""));
    const userId = String(document.data.userId || "").trim();
    if (!definition || !userId) return [];
    const expected = {
      badgeSlug: definition.slug,
      sourceType: definition.requirementType,
      sourceId: definition.requirementValue,
      idempotencyKey: `badge_award:${userId}:${definition.slug}`,
    };
    if (valuesMatch(document.data, expected)) return [];
    return [{
      id: document.id,
      data: expected,
      exists: true,
      reason: "normalize_active_user_award",
    }];
  });

  return {
    badgeWrites,
    userBadgeWrites,
    summary: {
      activeDefinitions: ACTIVE_BADGE_DEFINITIONS.length,
      definitionsToCreate: badgeWrites.filter(
        (write) => write.reason === "create_active_definition"
      ).length,
      definitionsToUpdate: badgeWrites.filter(
        (write) => write.reason === "normalize_active_definition"
      ).length,
      legacyDefinitionsToDeactivate: badgeWrites.filter(
        (write) => write.reason === "deactivate_legacy_definition"
      ).length,
      userAwardsToNormalize: userBadgeWrites.length,
    },
  };
}

export function buildBadgeSeedPlan(existingBadges: ExistingDocument[]) {
  const plan = buildBadgeMigrationPlan(existingBadges, []);
  return {
    writes: plan.badgeWrites,
    summary: plan.summary,
  };
}

export type ActiveBadgeId =
  | "badge-cyber-defender"
  | "badge-intermediate-defender"
  | "badge-advanced-specialist"
  | "badge-simulation-analyst";

export type BadgeRequirementType = "learning_path_completion" | "simulation_completion";

export interface ActiveBadgeDefinition {
  badgeId: ActiveBadgeId;
  title: string;
  slug: string;
  description: string;
  requirementLabel: string;
  icon: string;
  color: string;
  category: string;
  requirementType: BadgeRequirementType;
  requirementValue: string;
  order: number;
  status: "active";
  previousSlugs: readonly string[];
}

export const ACTIVE_BADGE_DEFINITIONS: readonly ActiveBadgeDefinition[] = [
  {
    badgeId: "badge-cyber-defender",
    title: "Beginner Master",
    slug: "beginner-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Beginner.",
    requirementLabel:
      "Selesaikan seluruh course dan lesson wajib pada jalur Beginner, lalu lulus seluruh quiz wajib.",
    icon: "book-shield",
    color: "pastel-yellow",
    category: "Beginner",
    requirementType: "learning_path_completion",
    requirementValue: "beginner-path",
    order: 1,
    status: "active",
    previousSlugs: ["cyber-defender"],
  },
  {
    badgeId: "badge-intermediate-defender",
    title: "Intermediate Master",
    slug: "intermediate-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Intermediate.",
    requirementLabel:
      "Selesaikan seluruh course dan lesson wajib pada jalur Intermediate, lalu lulus seluruh quiz wajib.",
    icon: "layers-shield",
    color: "pastel-blue",
    category: "Intermediate",
    requirementType: "learning_path_completion",
    requirementValue: "intermediate-path",
    order: 2,
    status: "active",
    previousSlugs: ["intermediate-defender"],
  },
  {
    badgeId: "badge-advanced-specialist",
    title: "Advanced Master",
    slug: "advanced-master",
    description: "Menyelesaikan seluruh jalur pembelajaran Advanced.",
    requirementLabel:
      "Selesaikan seluruh course dan lesson wajib pada jalur Advanced, lalu lulus seluruh quiz wajib.",
    icon: "crown-shield",
    color: "pastel-lavender",
    category: "Advanced",
    requirementType: "learning_path_completion",
    requirementValue: "advanced-path",
    order: 3,
    status: "active",
    previousSlugs: ["advanced-security-specialist"],
  },
  {
    badgeId: "badge-simulation-analyst",
    title: "Simulation Defender",
    slug: "simulation-defender",
    description: "Menyelesaikan seluruh simulasi keamanan siber yang diwajibkan.",
    requirementLabel:
      "Lulus seluruh simulasi aktif yang diwajibkan sesuai passing score masing-masing simulasi.",
    icon: "shield-alert",
    color: "pastel-mint",
    category: "Practical",
    requirementType: "simulation_completion",
    requirementValue: "all-required-simulations",
    order: 4,
    status: "active",
    previousSlugs: ["simulation-analyst"],
  },
] as const;

export const ACTIVE_BADGE_IDS = new Set<string>(
  ACTIVE_BADGE_DEFINITIONS.map((badge) => badge.badgeId)
);

export const ACTIVE_BADGE_SLUGS = new Set<string>(
  ACTIVE_BADGE_DEFINITIONS.map((badge) => badge.slug)
);

export const LEGACY_BADGE_IDS = new Set<string>([
  "badge-first-step",
  "badge-password-guard",
  "badge-phishing-hunter",
  "badge-privacy-protector",
]);

export function toActiveBadgeDocument(definition: ActiveBadgeDefinition) {
  return {
    badgeId: definition.badgeId,
    title: definition.title,
    slug: definition.slug,
    description: definition.description,
    requirementLabel: definition.requirementLabel,
    icon: definition.icon,
    color: definition.color,
    category: definition.category,
    requirementType: definition.requirementType,
    requirementValue: definition.requirementValue,
    order: definition.order,
    status: definition.status,
    previousSlugs: [...definition.previousSlugs],
    deprecated: false,
    deprecatedAt: null,
    replacementBadgeId: null,
  };
}

export function getActiveBadgeDefinition(badgeId: string) {
  return ACTIVE_BADGE_DEFINITIONS.find((badge) => badge.badgeId === badgeId);
}

export function isActiveBadgeId(badgeId: string): badgeId is ActiveBadgeId {
  return ACTIVE_BADGE_IDS.has(badgeId);
}

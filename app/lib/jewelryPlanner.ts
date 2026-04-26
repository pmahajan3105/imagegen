import type { PortraitAnalysis } from "./analysis";
import type { FinishRule, MetalRule, WatchGuidance } from "./jewelryRulesTypes";
import type { UserProfileContext } from "./userContext";
import { JEWELRY_RULES } from "../data/jewelryRules";
import { getSeason } from "../data/colorSystem";

// TODO: stylePreferences-driven scoring (e.g. "minimal" → favor delicate scale,
// "statement" → favor bold scale). Today only hardAvoids are applied.
function isMetalHardAvoided(metal: MetalRule, hardAvoids: string[] | undefined): boolean {
  if (!hardAvoids?.length) return false;
  const haystack = `${metal.name} ${metal.family}`.toLowerCase();
  return hardAvoids.some((token) => {
    const t = token.trim().toLowerCase();
    return t.length > 0 && haystack.includes(t);
  });
}

// The portrait analysis emits 4 legacy metal verdicts (Gold/Silver/Rose Gold/Brass-Bronze).
// The canonical jewelry data uses kebab-case ids covering 8 metals; the report compares
// the 4 legacy ones in the visual grid and pulls additional canonical context for
// finishes, mixed metals, and watch guidance.

const LEGACY_TO_CANONICAL: Record<string, string> = {
  Gold: "gold",
  Silver: "silver",
  "Rose Gold": "rose-gold",
  "Brass/Bronze": "brass-bronze"
};

const CANONICAL_TO_LEGACY: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  "rose-gold": "Rose Gold",
  "brass-bronze": "Brass/Bronze"
};

const COMPARISON_METAL_ORDER = ["gold", "silver", "rose-gold", "brass-bronze"] as const;

export type MetalAssessment = {
  metalId: string;
  metalName: string;
  legacyName: string;
  family: string;
  modelVerdict: string;
  canonicalMatch: "primary" | "supporting" | "use-carefully";
  finishOptions: string[];
  watchOut: string;
  notes?: string;
};

export type JewelryPlan = {
  bestMetalAssessment: MetalAssessment;
  metalsToCompare: MetalAssessment[];
  recommendedFinishes: FinishRule[];
  mixedMetalsCombinations: string[];
  mixedMetalsRules: string[];
  watchGuidance: WatchGuidance | undefined;
  userUndertone: string;
  userChroma: string;
};

function classifyMatch(
  metal: MetalRule,
  userUndertone: string
): "primary" | "supporting" | "use-carefully" {
  const lower = userUndertone.toLowerCase();
  if (metal.bestForUndertones.includes(lower)) return "primary";
  // Partial match — e.g. user is "neutral" and canonical has "neutral-warm"
  if (
    metal.bestForUndertones.some(
      (u) => u.includes(lower) || lower.includes(u)
    )
  ) {
    return "supporting";
  }
  return "use-carefully";
}

function selectFinishesForChroma(chroma: string): FinishRule[] {
  return Object.values(JEWELRY_RULES.finishes).filter((f) =>
    f.bestForChromas.includes(chroma)
  );
}

function selectMixedMetalsForBestMetal(bestMetalId: string): string[] {
  // Filter combinations that involve the user's best metal, keep top 3 for layout.
  return JEWELRY_RULES.mixedMetals.allowedCombinations
    .filter((combo) => combo.toLowerCase().includes(bestMetalId))
    .slice(0, 3);
}

export function selectJewelryPlan(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext
): JewelryPlan {
  const locked = portrait.paletteHypotheses[0];
  // Look up canonical season by locked hypothesis id to get authoritative undertone/chroma traits.
  const canonicalSeason = locked ? getSeason(locked.id) : undefined;
  const userUndertone = (
    canonicalSeason?.traits.undertone ?? portrait.undertone.value
  ).toLowerCase();
  const userChroma = canonicalSeason?.traits.chroma ?? "soft";

  const hardAvoids = userProfile?.hardAvoids;
  const metalsToCompare: MetalAssessment[] = COMPARISON_METAL_ORDER.flatMap((id) => {
    const canonical = JEWELRY_RULES.metals[id];
    if (isMetalHardAvoided(canonical, hardAvoids)) return [];
    const legacyKey = CANONICAL_TO_LEGACY[id] as keyof PortraitAnalysis["metalVerdicts"];
    const modelVerdict = portrait.metalVerdicts[legacyKey] ?? "Good";
    const canonicalMatch = classifyMatch(canonical, userUndertone);
    return [{
      metalId: id,
      metalName: canonical.name,
      legacyName: legacyKey,
      family: canonical.family,
      modelVerdict,
      canonicalMatch,
      finishOptions: canonical.finishOptions,
      watchOut: canonical.watchOut,
      notes: canonical.notes
    }];
  });

  const bestMetalIdRaw = LEGACY_TO_CANONICAL[portrait.bestMetal.value] ?? "gold";
  const bestMetalSurvived = metalsToCompare.some((m) => m.metalId === bestMetalIdRaw);
  const bestMetalId = bestMetalSurvived ? bestMetalIdRaw : (metalsToCompare[0]?.metalId ?? "gold");
  const bestMetalAssessment =
    metalsToCompare.find((m) => m.metalId === bestMetalId) ?? metalsToCompare[0];

  const recommendedFinishes = selectFinishesForChroma(userChroma);
  const mixedMetalsCombinations = selectMixedMetalsForBestMetal(bestMetalId);

  const faceShapeId = portrait.canonicalFaceShape?.id;
  const watchGuidance = faceShapeId ? JEWELRY_RULES.watchGuidance[faceShapeId] : undefined;

  return {
    bestMetalAssessment,
    metalsToCompare,
    recommendedFinishes,
    mixedMetalsCombinations,
    mixedMetalsRules: JEWELRY_RULES.mixedMetals.rules,
    watchGuidance,
    userUndertone,
    userChroma
  };
}

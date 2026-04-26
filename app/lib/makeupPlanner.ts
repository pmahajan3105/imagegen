import type { PortraitAnalysis } from "./analysis";
import type {
  GroomingSection,
  MakeupSection,
  ShadeGuideEntry,
  ShadeUndertone,
  ShadeDepth
} from "./makeupRulesTypes";
import type { UserProfileContext } from "./userContext";
import { MAKEUP_RULES } from "../data/makeupRules";
import { getSeason } from "../data/colorSystem";

export type MakeupVariant = "makeup" | "grooming";

export type MakeupSectionSelection = {
  section: MakeupSection;
  safeEntry: ShadeGuideEntry | undefined;
  statementEntry: ShadeGuideEntry | undefined;
};

export type GroomingSectionSelection = {
  section: GroomingSection;
  undertoneDirection?: string;
  undertoneDepthEntry?: ShadeGuideEntry;
};

export type MakeupPlan = {
  variant: MakeupVariant;
  userUndertone: ShadeUndertone;
  userDepth: ShadeDepth;
  userChroma: string;
  userContrast: string;
  makeupSelections: MakeupSectionSelection[];   // populated when variant === "makeup"
  groomingSelections: GroomingSectionSelection[]; // populated when variant === "grooming"
};

function mapUndertone(canonical: string): ShadeUndertone {
  // Canonical: warm | neutral-warm | neutral | neutral-cool | cool | olive
  // Makeup grid: warm | cool | neutral
  switch (canonical) {
    case "warm":
    case "neutral-warm":
      return "warm";
    case "cool":
    case "neutral-cool":
      return "cool";
    case "neutral":
    case "olive":
    default:
      return "neutral";
  }
}

function mapDepth(canonical: string): ShadeDepth {
  // Canonical: light | medium | medium-deep | deep
  // Makeup grid: light | medium | deep
  switch (canonical) {
    case "light":
      return "light";
    case "medium":
      return "medium";
    case "medium-deep":
    case "deep":
      return "deep";
    default:
      return "medium";
  }
}

function determineVariant(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext
): MakeupVariant {
  // UserProfile override takes precedence.
  const stated = userProfile?.presentation;
  if (stated === "masculine") return "grooming";
  if (stated === "feminine") return "makeup";
  // Fall back to model-inferred presentation.
  if (portrait.presentation.value === "Masculine") return "grooming";
  return "makeup";
}

function findSafeEntry(
  entries: ShadeGuideEntry[],
  undertone: ShadeUndertone,
  depth: ShadeDepth
): ShadeGuideEntry | undefined {
  return entries.find((e) => e.undertone === undertone && e.depth === depth);
}

export function selectMakeupPlan(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext
): MakeupPlan {
  const variant = determineVariant(portrait, userProfile);

  const locked = portrait.paletteHypotheses[0];
  const canonicalSeason = locked ? getSeason(locked.id) : undefined;

  const userUndertone = mapUndertone(
    canonicalSeason?.traits.undertone ?? portrait.undertone.value.toLowerCase()
  );
  const userDepth = mapDepth(
    canonicalSeason?.traits.depth ?? portrait.depth.value.toLowerCase().replace("-", "-")
  );
  const userChroma = canonicalSeason?.traits.chroma ?? "soft";
  const userContrast = canonicalSeason?.traits.contrast ?? portrait.contrast.value.toLowerCase();

  const makeupSelections: MakeupSectionSelection[] = [];
  const groomingSelections: GroomingSectionSelection[] = [];

  if (variant === "makeup") {
    for (const section of Object.values(MAKEUP_RULES.makeup)) {
      const safeEntry = findSafeEntry(section.safeEveryday, userUndertone, userDepth);
      const statementEntry = section.statement.find(
        (e) => e.undertone === userUndertone
      );
      makeupSelections.push({ section, safeEntry, statementEntry });
    }
  } else {
    for (const section of Object.values(MAKEUP_RULES.grooming)) {
      const undertoneDirection = section.directionByUndertone?.[userUndertone];
      const undertoneDepthEntry = section.directionByUndertoneDepth?.find(
        (e) => e.undertone === userUndertone && e.depth === userDepth
      );
      groomingSelections.push({ section, undertoneDirection, undertoneDepthEntry });
    }
  }

  return {
    variant,
    userUndertone,
    userDepth,
    userChroma,
    userContrast,
    makeupSelections,
    groomingSelections
  };
}

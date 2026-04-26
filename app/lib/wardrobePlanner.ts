import type { PortraitAnalysis, Swatch } from "./analysis";
import type { UserProfileContext } from "./userContext";
import type {
  CapsulePresetId,
  CapsuleSlot,
  CapsuleSlotCategory,
  WardrobeCapsule
} from "./wardrobeCapsuleTypes";
import { WARDROBE_CAPSULES } from "../data/wardrobeCapsules";

const PRESET_FALLBACK: CapsulePresetId = "casual-everyday";

function matchCapsulePreset(stylePreferences: string[] | undefined): CapsulePresetId {
  const prefs = (stylePreferences ?? []).map((s) => s.toLowerCase().trim());
  const hasAny = (...needles: string[]) =>
    prefs.some((p) => needles.some((n) => p.includes(n)));

  if (hasAny("workwear", "professional", "polished", "office")) return "workwear-polished";
  if (hasAny("minimal", "clean", "quiet")) return "minimal-clean";
  if (hasAny("classic", "timeless", "heritage")) return "classic-timeless";
  if (hasAny("bold", "statement", "loud")) return "bold-statement";
  if (hasAny("street", "urban", "streetwear")) return "street-urban";
  if (hasAny("casual", "everyday", "relaxed", "weekend")) return "casual-everyday";
  return PRESET_FALLBACK;
}

export type ResolvedSlot = {
  slot: CapsuleSlot;
  category: CapsuleSlotCategory;
  resolvedSwatch: Swatch;
};

export type WardrobePlan = {
  capsule: WardrobeCapsule;
  resolved: ResolvedSlot[];
  paletteName: string;
  paletteId: string;
  presetUsed: CapsulePresetId;
};

function pickSwatch(
  swatches: Swatch[],
  index: number,
  fallback: Swatch[]
): Swatch {
  if (swatches.length > 0) {
    return swatches[index % swatches.length];
  }
  if (fallback.length > 0) {
    return fallback[index % fallback.length];
  }
  // Last-resort placeholder; should never happen with a populated canonical palette.
  return { name: "Unresolved", hex: "#888888" };
}

export function selectWardrobeCapsule(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext
): WardrobePlan {
  const presetId = matchCapsulePreset(userProfile?.stylePreferences);
  const capsule = WARDROBE_CAPSULES.capsules[presetId];

  const locked = portrait.paletteHypotheses[0];
  const palette = locked.palette;

  // Per-role round-robin indexes so multiple slots with the same paletteRole
  // get distinct swatches when possible.
  const roleIndex: Record<string, number> = {
    "best-neutral": 0,
    signature: 0,
    accent: 0,
    any: 0
  };

  const orderedSlots: Array<{ slot: CapsuleSlot; category: CapsuleSlotCategory }> = [
    ...capsule.tops.map((s) => ({ slot: s, category: "top" as const })),
    ...capsule.bottoms.map((s) => ({ slot: s, category: "bottom" as const })),
    ...capsule.layers.map((s) => ({ slot: s, category: "layer" as const })),
    ...capsule.shoes.map((s) => ({ slot: s, category: "shoes" as const })),
    ...capsule.accessories.map((s) => ({ slot: s, category: "accessory" as const }))
  ];

  const resolved: ResolvedSlot[] = orderedSlots.map(({ slot, category }) => {
    const role = slot.paletteRole;
    let resolvedSwatch: Swatch;
    if (role === "best-neutral") {
      resolvedSwatch = pickSwatch(palette.bestNeutrals, roleIndex[role]++, palette.bestNeutrals);
    } else if (role === "signature") {
      resolvedSwatch = pickSwatch(palette.signatureColors, roleIndex[role]++, palette.bestNeutrals);
    } else if (role === "accent") {
      resolvedSwatch = pickSwatch(palette.accentColors, roleIndex[role]++, palette.signatureColors);
    } else {
      // "any" or unknown — default to best neutrals.
      resolvedSwatch = pickSwatch(palette.bestNeutrals, roleIndex.any++, palette.bestNeutrals);
    }
    return { slot, category, resolvedSwatch };
  });

  return {
    capsule,
    resolved,
    paletteName: locked.name,
    paletteId: locked.id,
    presetUsed: presetId
  };
}

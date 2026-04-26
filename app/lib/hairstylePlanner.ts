import type {
  FaceShape,
  FacialHair,
  HairLength,
  HairTexture,
  PortraitAnalysis
} from "./analysis";
import type { HairstyleEntry } from "./hairstyleTypes";
import type {
  HairChangeTolerance,
  MaintenanceTolerance,
  StatedPresentation,
  UserProfileContext
} from "./userContext";
import { HAIRSTYLE_LIBRARY } from "../data/hairstyleLibrary";

const LENGTH_ORDER: HairLength[] = ["Buzz", "Short", "Medium", "Shoulder", "Long"];

function presentationKey(
  value: PortraitAnalysis["presentation"]["value"]
): StatedPresentation | undefined {
  if (value === "Unclear") return undefined;
  return value.toLowerCase() as StatedPresentation;
}

function maintenanceRank(m: MaintenanceTolerance): number {
  return m === "low" ? 1 : m === "medium" ? 2 : 3;
}

function neighborLengths(current: HairLength): HairLength[] {
  const i = LENGTH_ORDER.indexOf(current);
  if (i < 0) return LENGTH_ORDER;
  const lo = Math.max(0, i - 1);
  const hi = Math.min(LENGTH_ORDER.length - 1, i + 1);
  return LENGTH_ORDER.slice(lo, hi + 1);
}

function passesPresentation(
  entry: HairstyleEntry,
  statedPresentation: StatedPresentation | undefined
): boolean {
  if (!statedPresentation) return true;
  return entry.presentation.includes(statedPresentation);
}

function passesFaceShape(entry: HairstyleEntry, faceShape: FaceShape): boolean {
  return entry.faceShapes.includes(faceShape);
}

function passesTexture(entry: HairstyleEntry, texture: HairTexture): boolean {
  return entry.hairTextures.includes(texture);
}

function passesFacialHair(entry: HairstyleEntry, facialHair: FacialHair): boolean {
  return entry.facialHairCompat.includes(facialHair);
}

function passesLengthTolerance(
  entry: HairstyleEntry,
  currentLength: HairLength,
  tolerance: HairChangeTolerance | undefined
): boolean {
  if (!tolerance || tolerance === "open-to-change") return true;
  if (tolerance === "keep-current") {
    return entry.hairLengths.includes(currentLength);
  }
  // small-change: current ± 1
  const allowed = neighborLengths(currentLength);
  return entry.hairLengths.some((l) => allowed.includes(l));
}

function passesMaintenance(
  entry: HairstyleEntry,
  userMaintenance: MaintenanceTolerance | undefined
): boolean {
  if (!userMaintenance) return true;
  return maintenanceRank(entry.maintenance) <= maintenanceRank(userMaintenance);
}

function passesHardAvoids(entry: HairstyleEntry, hardAvoids: string[] | undefined): boolean {
  if (!hardAvoids?.length) return true;
  const haystack = `${entry.name.toLowerCase()} ${entry.description.toLowerCase()}`;
  return !hardAvoids.some((a) => {
    const trimmed = a.trim().toLowerCase();
    return trimmed.length > 0 && haystack.includes(trimmed);
  });
}

type FilterPolicy = {
  useLengthTolerance: boolean;
  useMaintenance: boolean;
};

function filterCandidates(
  portrait: PortraitAnalysis,
  userProfile: UserProfileContext | undefined,
  policy: FilterPolicy
): HairstyleEntry[] {
  const statedPresentation =
    userProfile?.presentation ?? presentationKey(portrait.presentation.value);
  const faceShape = portrait.faceShape.value;
  const texture = portrait.currentHair.texture;
  const length = portrait.currentHair.length;
  const facialHair = portrait.facialHair.value;

  return HAIRSTYLE_LIBRARY.filter((entry) => {
    if (!passesPresentation(entry, statedPresentation)) return false;
    if (!passesFaceShape(entry, faceShape)) return false;
    if (!passesTexture(entry, texture)) return false;
    if (!passesFacialHair(entry, facialHair)) return false;
    if (!passesHardAvoids(entry, userProfile?.hardAvoids)) return false;
    if (
      policy.useLengthTolerance &&
      !passesLengthTolerance(entry, length, userProfile?.hairChangeTolerance)
    ) {
      return false;
    }
    if (policy.useMaintenance && !passesMaintenance(entry, userProfile?.maintenance)) {
      return false;
    }
    return true;
  });
}

function scoreEntry(
  entry: HairstyleEntry,
  portrait: PortraitAnalysis,
  userProfile: UserProfileContext | undefined
): number {
  let score = 0;

  // Style/tone preferences (matches in stylePreferences boost score)
  const stylePrefs = userProfile?.stylePreferences ?? [];
  for (const pref of stylePrefs) {
    if (entry.tone === pref) score += 2;
  }

  // Reward exact-texture entries (vs supporting many textures)
  if (
    entry.hairTextures.length === 1 &&
    entry.hairTextures[0] === portrait.currentHair.texture
  ) {
    score += 1;
  }

  // Reward entries that include the user's current hair length (less change required)
  if (entry.hairLengths.includes(portrait.currentHair.length)) {
    score += 1;
  }

  // Slight diversity bonus: entries that flatter several face shapes are more universally robust.
  score += Math.min(entry.faceShapes.length / 4, 1);

  return score;
}

export type HairstyleSelection = {
  selected: HairstyleEntry[];
  candidateCount: number;
  policyUsed: FilterPolicy;
};

export function selectHairstyles(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext,
  count = 4
): HairstyleSelection {
  // Cascade: try strict filter, relax soft constraints if too few survivors.
  const policies: FilterPolicy[] = [
    { useLengthTolerance: true, useMaintenance: true },
    { useLengthTolerance: true, useMaintenance: false },
    { useLengthTolerance: false, useMaintenance: false }
  ];

  let candidates: HairstyleEntry[] = [];
  let policyUsed: FilterPolicy = policies[0];

  for (const policy of policies) {
    candidates = filterCandidates(portrait, userProfile, policy);
    policyUsed = policy;
    if (candidates.length >= count) break;
  }

  const scored = candidates.map((entry, libraryIndex) => ({
    entry,
    score: scoreEntry(entry, portrait, userProfile),
    libraryIndex
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.libraryIndex - b.libraryIndex;
  });

  return {
    selected: scored.slice(0, count).map((s) => s.entry),
    candidateCount: candidates.length,
    policyUsed
  };
}

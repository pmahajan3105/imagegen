import type { PortraitAnalysis } from "./analysis";
import type { FaceShapeId } from "./faceShapeTypes";
import type { FrameCatalogEntry } from "./eyewearTypes";
import type { StatedPresentation, UserProfileContext } from "./userContext";
import { EYEWEAR_RULES } from "../data/eyewearLibrary";

const KNOWN_FACE_SHAPE_IDS: FaceShapeId[] = [
  "oval",
  "round",
  "square",
  "rectangle",
  "oblong",
  "heart",
  "diamond",
  "triangle"
];

function presentationKey(
  value: PortraitAnalysis["presentation"]["value"]
): StatedPresentation | undefined {
  if (value === "Unclear") return undefined;
  return value.toLowerCase() as StatedPresentation;
}

function getFaceShapeId(portrait: PortraitAnalysis): FaceShapeId | undefined {
  if (portrait.canonicalFaceShape) return portrait.canonicalFaceShape.id;
  const v = portrait.faceShape.value.toLowerCase();
  if (KNOWN_FACE_SHAPE_IDS.includes(v as FaceShapeId)) return v as FaceShapeId;
  return undefined;
}

function passesPresentation(
  entry: FrameCatalogEntry,
  presentation: StatedPresentation | undefined
): boolean {
  if (!presentation) return true;
  return entry.compatiblePresentations.includes(presentation);
}

function passesFaceShape(entry: FrameCatalogEntry, faceShapeId: FaceShapeId | undefined): boolean {
  if (!faceShapeId) return true;
  return entry.compatibleFaceShapes.includes(faceShapeId);
}

function passesHardAvoids(entry: FrameCatalogEntry, hardAvoids: string[] | undefined): boolean {
  if (!hardAvoids?.length) return true;
  const haystack = `${entry.name.toLowerCase()} ${entry.shapeCategory.toLowerCase()} ${entry.material.toLowerCase()} ${entry.colorTone.toLowerCase()} ${entry.notes.toLowerCase()}`;
  return !hardAvoids.some((a) => {
    const trimmed = a.trim().toLowerCase();
    return trimmed.length > 0 && haystack.includes(trimmed);
  });
}

function scoreEntry(
  entry: FrameCatalogEntry,
  portrait: PortraitAnalysis,
  userProfile: UserProfileContext | undefined
): number {
  let score = 0;

  // Match user style preferences against "reads as" tag
  const stylePrefs = userProfile?.stylePreferences ?? [];
  if (stylePrefs.includes(entry.readsAs)) score += 2;

  // Color tone harmony with undertone (Warm undertone → Warm-tone frames; Cool → Cool)
  const undertone = portrait.undertone.value.toLowerCase();
  const tone = entry.colorTone.toLowerCase();
  if (undertone === "warm" && tone.startsWith("warm")) score += 2;
  else if (undertone === "cool" && tone.startsWith("cool")) score += 2;
  else if (tone.startsWith("neutral")) score += 1;
  else if ((undertone === "warm" && tone.startsWith("cool")) || (undertone === "cool" && tone.startsWith("warm"))) {
    score -= 1;
  }

  // Versatility bonus (entries that flatter many face shapes are more universally robust)
  score += Math.min(entry.compatibleFaceShapes.length / 6, 1);

  return score;
}

export type FrameSelection = {
  flattering: FrameCatalogEntry[];
  useCarefully?: FrameCatalogEntry;
  candidateCount: number;
};

export function selectFrames(
  portrait: PortraitAnalysis,
  userProfile?: UserProfileContext,
  flatteringCount = 5
): FrameSelection {
  const faceShapeId = getFaceShapeId(portrait);
  const presentation = userProfile?.presentation ?? presentationKey(portrait.presentation.value);

  // Compatible entries: face shape ∩ presentation ∩ no hard-avoid match
  const compatible = EYEWEAR_RULES.catalog.filter(
    (e) =>
      passesFaceShape(e, faceShapeId) &&
      passesPresentation(e, presentation) &&
      passesHardAvoids(e, userProfile?.hardAvoids)
  );

  const scored = compatible.map((entry, libraryIndex) => ({
    entry,
    score: scoreEntry(entry, portrait, userProfile),
    libraryIndex
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.libraryIndex - b.libraryIndex;
  });

  const flattering = scored.slice(0, flatteringCount).map((s) => s.entry);
  const flatteringIds = new Set(flattering.map((e) => e.id));

  // Pick a "use carefully" educational example: an entry whose compatibleFaceShapes
  // does NOT include the user's face shape (so it would not flatter), but whose
  // presentation still matches and is not in user's hardAvoids. Prefer one that
  // overlaps with face-shape-specific useCarefully keywords for relevance.
  const incompatible = EYEWEAR_RULES.catalog.filter(
    (e) =>
      !passesFaceShape(e, faceShapeId) &&
      passesPresentation(e, presentation) &&
      passesHardAvoids(e, userProfile?.hardAvoids) &&
      !flatteringIds.has(e.id)
  );

  let useCarefully: FrameCatalogEntry | undefined;
  if (faceShapeId && incompatible.length > 0) {
    const faceRules = EYEWEAR_RULES.byFaceShape[faceShapeId];
    const useCarefullyText = faceRules?.useCarefully.join(" ").toLowerCase() ?? "";
    // Prefer entries whose shape category appears in the face-shape-specific use-carefully list
    const targeted = incompatible.find((e) => {
      const shapeWord = e.shapeCategory.toLowerCase();
      return shapeWord && useCarefullyText.includes(shapeWord);
    });
    useCarefully = targeted ?? incompatible[0];
  }

  return {
    flattering,
    useCarefully,
    candidateCount: compatible.length
  };
}

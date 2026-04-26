export type MakeupSectionId =
  | "foundation-complexion"
  | "concealer"
  | "blush"
  | "eyeshadow"
  | "eyeliner-mascara"
  | "brow"
  | "lip";

export type GroomingSectionId =
  | "skin-tonics"
  | "lip-balm"
  | "beard-care"
  | "eyebrow-direction"
  | "complexion-enhancers";

export type ShadeUndertone = "warm" | "cool" | "neutral";
export type ShadeDepth = "light" | "medium" | "deep" | "any-depth";

/** One entry from an "undertone × depth" or "undertone × any-depth" guidance grid. */
export type ShadeGuideEntry = {
  undertone: ShadeUndertone;
  depth: ShadeDepth;
  guidance: string;
};

/** Direction without depth — used by short grooming sections (lip balm, skin tonics). */
export type DirectionByUndertone = {
  warm?: string;
  cool?: string;
  neutral?: string;
};

export type MakeupSection = {
  id: MakeupSectionId;
  name: string;
  goal: string;
  safeEveryday: ShadeGuideEntry[];
  statement: ShadeGuideEntry[];
  finishGuidance: string[];
  useCarefully: string[];
  glassesFrameInteraction?: string[];
  hairColorCrossReference?: string[];
};

export type GroomingSection = {
  id: GroomingSectionId;
  name: string;
  goal: string;
  // Exactly one of these is populated depending on the section's structure.
  directionByUndertone?: DirectionByUndertone;
  directionByUndertoneDepth?: ShadeGuideEntry[];
  hairColorCrossReference?: string[];
  useCarefully: string[];
  notes: string[];
};

export type MakeupRulesData = {
  sourcing?: string;
  makeup: Record<MakeupSectionId, MakeupSection>;
  grooming: Record<GroomingSectionId, GroomingSection>;
};

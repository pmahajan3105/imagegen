export type CapsulePresetId =
  | "casual-everyday"
  | "workwear-polished"
  | "minimal-clean"
  | "classic-timeless"
  | "bold-statement"
  | "street-urban";

export type CapsuleSlotCategory = "top" | "bottom" | "layer" | "shoes" | "accessory";

export type CapsuleSlot = {
  slotId: string;          // e.g. "CE-T01"
  type: string;            // garment type description
  category: CapsuleSlotCategory;
  paletteRole: string;     // "best-neutral" | "signature" | "accent" | "any" (kept as string for forward-compat)
  silhouette: string;      // "shoulder-balancing", "none", etc.
  intent: string;          // intent tag(s)
  formality: string;       // formality range, e.g. "1-2"
  runtimeNote: string;
};

export type WardrobeCapsule = {
  id: CapsulePresetId;
  name: string;
  stylePreset: string;
  lifestyle: string;
  defaultFormality: string;
  philosophy: string;
  capsuleLogic: string;
  paletteRecipe: string;
  tops: CapsuleSlot[];
  bottoms: CapsuleSlot[];
  layers: CapsuleSlot[];
  shoes: CapsuleSlot[];
  accessories: CapsuleSlot[];
  outfitFormulas: string[];
  substitutionRules: string[];
  outfitMath: string[];
};

export type WardrobeSchemaDoc = {
  coreContract?: string;
  paletteRoles?: string;
  formalityRange?: string;
  intentTags?: string;
  runtimeRule?: string;
};

export type WardrobeCapsulesData = {
  sourcing?: string;
  schema: WardrobeSchemaDoc;
  capsules: Record<CapsulePresetId, WardrobeCapsule>;
};

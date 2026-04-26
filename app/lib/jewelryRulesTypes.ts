export type MetalId =
  | "gold"
  | "rose-gold"
  | "brass-bronze"
  | "copper"
  | "silver"
  | "platinum"
  | "white-gold"
  | "pewter";

export type FinishId = "polished" | "matte" | "brushed" | "antiqued" | "hammered";
export type ScaleId = "delicate" | "medium" | "chunky";
export type MetalFamily = "warm" | "cool";

export type MetalRule = {
  id: MetalId;
  name: string;
  family: MetalFamily;
  bestForUndertones: string[];
  bestForDepths: string[];
  bestForChromas: string[];
  finishOptions: string[];
  watchOut: string;
  notes?: string;
};

export type FinishRule = {
  id: FinishId;
  name: string;
  bestForChromas: string[];
  bestForOccasions: string[];
  pairsWithMetals: string[];
  useCarefully: string;
};

export type ScaleRule = {
  id: ScaleId;
  name: string;
  bestForBodyScale: string;
  bestForFaceFeatures: string;
  itemCategoriesAtScale: string[];
  useCarefully: string;
};

export type MixedMetalsRules = {
  allowedCombinations: string[];
  rules: string[];
  useCarefully: string[];
  notes: string[];
};

export type WatchGuidance = {
  id: string;
  name: string;
  faceShapeId: string;
  bestCaseSizes: string;
  bestCaseShapes: string[];
  bestStrapMaterials: string[];
  useCarefully: string;
};

export type JewelryRulesData = {
  sourcing?: string;
  metals: Record<MetalId, MetalRule>;
  finishes: Record<FinishId, FinishRule>;
  scales: Record<ScaleId, ScaleRule>;
  mixedMetals: MixedMetalsRules;
  watchGuidance: Record<string, WatchGuidance>;
};

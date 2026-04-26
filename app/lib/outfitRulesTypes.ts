export type OccasionId = "work" | "casual" | "event";

export type OccasionRules = {
  id: OccasionId;
  name: string;
  compositionTarget: string;
  goal: string;
  paletteApproach: string[];
  silhouettePrinciples: string[];
  layeringStrategy: string[];
  fabricGuidance: string[];
  exampleOutfitShapes: string[];
  useCarefully: string[];
};

export type OutfitRulesData = {
  sourcing?: string;
  occasions: Record<OccasionId, OccasionRules>;
};

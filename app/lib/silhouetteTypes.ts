export type SilhouetteShapeId =
  | "hourglass"
  | "pear"
  | "inverted-triangle"
  | "rectangle"
  | "apple";

export type SilhouetteShape = {
  id: SilhouetteShapeId;
  name: string;
  aliases: string[];
  howToIdentify?: string;
  goal?: string;
  diagnosticCues: string[];
  waistStrategy: string[];
  shoulderHipBalance: string[];
  verticalLine: string[];
  bestRises: string[];
  bestHemlines: string[];
  necklines: string[];
  sleeves: string[];
  layeringRules: string[];
  fabricAndStructure: string[];
  useCarefully: string[];
  commonMisidentifications: string[];
  notes: string[];
  variants: SilhouetteVariant[];
};

export type SilhouetteVariant = {
  id: string;
  name: string;
  parentId: SilhouetteShapeId;
  aliases: string[];
  howToIdentify?: string;
  deltaFromParent?: string;
  diagnosticCues: string[];
  stylingAdjustments: string[];
  notes: string[];
};

export type UniversalSilhouettePrinciples = {
  proportionMath: string[];
  verticalLineCreation: string[];
  horizontalLineManagement: string[];
  layeringHierarchy: string[];
  fitHierarchy: string[];
  colorAndPatternTools: string[];
  printScaleByShape: string[];
};

export type SilhouetteRulesData = {
  shapes: Record<SilhouetteShapeId, SilhouetteShape>;
  universal: UniversalSilhouettePrinciples;
};

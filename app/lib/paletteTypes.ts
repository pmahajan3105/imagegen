import type { Confidence, Swatch } from "./analysis";

export type PaletteSwatchGroup = {
  bestNeutrals: Swatch[];
  signatureColors: Swatch[];
  accentColors: Swatch[];
  useCarefully: Swatch[];
};

export type PaletteHypothesis = {
  id: string;
  name: string;
  confidence: Confidence;
  supportingSignals: string[];
  riskNotes: string[];
  palette: PaletteSwatchGroup;
  rules?: string[];
};

export type LockedPaletteSource = "user" | "model-default";

export type LockedPalette = {
  hypothesisId: string;
  source: LockedPaletteSource;
  lockedAt: string;
};

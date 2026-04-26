import type { FaceShapeId } from "./faceShapeTypes";
import type { StatedPresentation } from "./userContext";

export type FrameCategory = "classic" | "modern" | "bold" | "retro";

export type EyewearFaceShapeRules = {
  id: FaceShapeId;
  bestFrameShapes: string[];
  useCarefully: string[];
  materialGuidance: string[];
  bridgeStyleGuidance: string[];
  browLineGuidance: string[];
  colorContrastGuidance: string[];
  frameWidthGuidance: string[];
  lensHeightGuidance: string[];
};

export type FrameCatalogEntry = {
  id: string;
  name: string;
  category: FrameCategory;
  shapeCategory: string;
  material: string;
  thickness: string;
  colorTone: string;
  bridgeStyle: string;
  compatibleFaceShapes: FaceShapeId[];
  compatiblePresentations: StatedPresentation[];
  readsAs: string;
  useCarefullyIf: string;
  notes: string;
};

export type EyewearRulesData = {
  universalRules: string[];
  byFaceShape: Record<FaceShapeId, EyewearFaceShapeRules>;
  catalog: FrameCatalogEntry[];
};

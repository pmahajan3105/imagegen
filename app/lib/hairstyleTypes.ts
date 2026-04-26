import type { FaceShape, FacialHair, HairLength, HairTexture } from "./analysis";
import type { MaintenanceTolerance, StatedPresentation } from "./userContext";

export type HairstyleTone = "professional" | "neutral" | "bold";

export type HairstyleEntry = {
  id: string;
  name: string;
  description: string;
  presentation: StatedPresentation[];
  faceShapes: FaceShape[];
  hairLengths: HairLength[];
  hairTextures: HairTexture[];
  facialHairCompat: FacialHair[];
  maintenance: MaintenanceTolerance;
  tone: HairstyleTone;
  disallowedIf?: string;
  notes?: string;
};

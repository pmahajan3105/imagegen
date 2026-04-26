export type FaceSize = "small" | "good" | "large";
export type Lighting = "poor" | "mixed" | "good";
export type PortraitAngle = "front" | "slight-angle" | "strong-angle";

export type ImageQualitySignals = {
  faceSize: FaceSize;
  eyesVisible: boolean;
  lighting: Lighting;
  portraitAngle: PortraitAngle;
  confidencePenalty: number;
};

export type ImageQualityRawSignals = Omit<ImageQualitySignals, "confidencePenalty">;

export function computeConfidencePenalty(signals: ImageQualityRawSignals): number {
  let penalty = 0;
  if (signals.faceSize === "small") penalty += 0.3;
  if (!signals.eyesVisible) penalty += 0.2;
  if (signals.lighting === "poor") penalty += 0.3;
  else if (signals.lighting === "mixed") penalty += 0.1;
  if (signals.portraitAngle === "strong-angle") penalty += 0.2;
  else if (signals.portraitAngle === "slight-angle") penalty += 0.05;
  return Math.min(1, Math.round(penalty * 100) / 100);
}

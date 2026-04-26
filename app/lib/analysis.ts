import type { ImageQualityRawSignals, ImageQualitySignals } from "./imageQuality";
import { computeConfidencePenalty } from "./imageQuality";
import type { PaletteHypothesis } from "./paletteTypes";
import type { SilhouetteShape, SilhouetteShapeId } from "./silhouetteTypes";
import type { FaceShapeId, FaceShapePrinciples } from "./faceShapeTypes";
import { getSeason, resolveSeasonId } from "../data/colorSystem";
import { SILHOUETTE_RULES } from "../data/silhouetteRules";
import { FACE_SHAPE_RULES } from "../data/faceShapeRules";

export const ANALYSIS_MODEL = "gpt-5.5";
export const ANALYSIS_SCHEMA_VERSION = 7;

const RESPONSES_URL = "https://api.openai.com/v1/responses";

export type Confidence = "high" | "medium" | "low";

export type Verdict<T extends string> = {
  value: T;
  confidence: Confidence;
  notes?: string;
};

export type Swatch = { name: string; hex: string; note?: string };

export type Depth = "Light" | "Light-Medium" | "Medium" | "Medium-Deep" | "Deep";
export type Contrast = "Low" | "Low-Medium" | "Medium" | "Medium-High" | "High";
export type Undertone = "Warm" | "Cool" | "Neutral" | "Olive";
export type Clarity = "Bright" | "Muted" | "Soft";
export type FaceShape =
  | "Oval"
  | "Round"
  | "Square"
  | "Rectangle"
  | "Oblong"
  | "Heart"
  | "Diamond"
  | "Triangle";
export type Metal = "Gold" | "Silver" | "Rose Gold" | "Brass/Bronze";
export type MetalVerdict = "Best" | "Strong" | "Good" | "Skip";
export type BodyShape =
  | "Hourglass"
  | "Pear"
  | "Apple"
  | "Rectangle"
  | "Inverted Triangle";

// Visible-presentation fields. These describe what is *visible* in the photo,
// not the person's identity. Used to lock cross-report rendering against
// reference-contamination from layout reference images.
export type Presentation = "Masculine" | "Feminine" | "Androgynous" | "Unclear";
export type FacialHair =
  | "None"
  | "Stubble"
  | "Mustache"
  | "Goatee"
  | "Beard"
  | "Full Beard";
export type HairLength =
  | "Buzz"
  | "Short"
  | "Medium"
  | "Shoulder"
  | "Long";
export type HairTexture = "Straight" | "Wavy" | "Curly" | "Coily";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HYPOTHESIS_PALETTE_REQUIREMENTS = {
  bestNeutrals: { min: 4, max: 7 },
  signatureColors: { min: 4, max: 8 },
  accentColors: { min: 3, max: 5 },
  useCarefully: { min: 3, max: 6 }
} as const;
const HYPOTHESIS_COUNT = { min: 2, max: 3 } as const;

export type PortraitAnalysis = {
  schemaVersion: typeof ANALYSIS_SCHEMA_VERSION;
  generatedAt: string;
  modelUsed: string;
  imageQuality: ImageQualitySignals;
  paletteHypotheses: PaletteHypothesis[];
  canonicalFaceShape?: FaceShapePrinciples;
  depth: Verdict<Depth>;
  contrast: Verdict<Contrast>;
  undertone: Verdict<Undertone> & { displayLabel: string };
  clarity: Verdict<Clarity>;
  faceShape: Verdict<FaceShape> & {
    forehead: string;
    cheekbones: string;
    jawline: string;
    chin: string;
    lengthToWidthRatio: string;
  };
  hairColor: string;
  eyeColor: string;
  presentation: Verdict<Presentation>;
  facialHair: Verdict<FacialHair>;
  currentHair: {
    length: HairLength;
    texture: HairTexture;
    notes?: string;
  };
  styleGuardrails: string[];
  bestMetal: Verdict<Metal>;
  metalVerdicts: Record<Metal, MetalVerdict>;
};

export type BodyAnalysis = {
  schemaVersion: typeof ANALYSIS_SCHEMA_VERSION;
  generatedAt: string;
  modelUsed: string;
  bodyShape: Verdict<BodyShape>;
  shoulderHipBalance: string;
  waistDefinition: string;
  torsoLegBalance: string;
  bestFeatures: string[];
  silhouetteRules: string[];
  canonicalSilhouette?: SilhouetteShape;
};

const BODY_SHAPE_TO_ID: Record<BodyShape, SilhouetteShapeId> = {
  Hourglass: "hourglass",
  Pear: "pear",
  Apple: "apple",
  Rectangle: "rectangle",
  "Inverted Triangle": "inverted-triangle"
};

const FACE_SHAPE_TO_ID: Record<FaceShape, FaceShapeId> = {
  Oval: "oval",
  Round: "round",
  Square: "square",
  Rectangle: "rectangle",
  Oblong: "oblong",
  Heart: "heart",
  Diamond: "diamond",
  Triangle: "triangle"
};

export class AnalysisRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisRefusedError";
  }
}

export class AnalysisSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisSchemaError";
  }
}

export class AnalysisTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisTransportError";
  }
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function portraitCacheKey(hash: string) {
  return `portrait:${hash}:v${ANALYSIS_SCHEMA_VERSION}`;
}

export function bodyCacheKey(hash: string) {
  return `body:${hash}:v${ANALYSIS_SCHEMA_VERSION}`;
}

const verdictSchema = (enumValues: string[]) => ({
  type: "object",
  additionalProperties: false,
  required: ["value", "confidence", "notes"],
  properties: {
    value: { type: "string", enum: enumValues },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: "string" }
  }
});

const swatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "hex"],
  properties: {
    name: { type: "string" },
    hex: { type: "string" }
  }
};

const swatchListSchema = { type: "array", items: swatchSchema };

const PORTRAIT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "imageQuality",
    "paletteHypotheses",
    "depth",
    "contrast",
    "undertone",
    "clarity",
    "faceShape",
    "hairColor",
    "eyeColor",
    "presentation",
    "facialHair",
    "currentHair",
    "styleGuardrails",
    "bestMetal",
    "metalVerdicts"
  ],
  properties: {
    imageQuality: {
      type: "object",
      additionalProperties: false,
      required: ["faceSize", "eyesVisible", "lighting", "portraitAngle"],
      properties: {
        faceSize: { type: "string", enum: ["small", "good", "large"] },
        eyesVisible: { type: "boolean" },
        lighting: { type: "string", enum: ["poor", "mixed", "good"] },
        portraitAngle: {
          type: "string",
          enum: ["front", "slight-angle", "strong-angle"]
        }
      }
    },
    paletteHypotheses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "name",
          "confidence",
          "supportingSignals",
          "riskNotes",
          "palette"
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          supportingSignals: { type: "array", items: { type: "string" } },
          riskNotes: { type: "array", items: { type: "string" } },
          palette: {
            type: "object",
            additionalProperties: false,
            required: ["bestNeutrals", "signatureColors", "accentColors", "useCarefully"],
            properties: {
              bestNeutrals: swatchListSchema,
              signatureColors: swatchListSchema,
              accentColors: swatchListSchema,
              useCarefully: swatchListSchema
            }
          }
        }
      }
    },
    depth: verdictSchema(["Light", "Light-Medium", "Medium", "Medium-Deep", "Deep"]),
    contrast: verdictSchema(["Low", "Low-Medium", "Medium", "Medium-High", "High"]),
    undertone: {
      type: "object",
      additionalProperties: false,
      required: ["value", "confidence", "notes", "displayLabel"],
      properties: {
        value: { type: "string", enum: ["Warm", "Cool", "Neutral", "Olive"] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        notes: { type: "string" },
        displayLabel: { type: "string" }
      }
    },
    clarity: verdictSchema(["Bright", "Muted", "Soft"]),
    faceShape: {
      type: "object",
      additionalProperties: false,
      required: [
        "value",
        "confidence",
        "notes",
        "forehead",
        "cheekbones",
        "jawline",
        "chin",
        "lengthToWidthRatio"
      ],
      properties: {
        value: {
          type: "string",
          enum: [
            "Oval",
            "Round",
            "Square",
            "Rectangle",
            "Oblong",
            "Heart",
            "Diamond",
            "Triangle"
          ]
        },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        notes: { type: "string" },
        forehead: { type: "string" },
        cheekbones: { type: "string" },
        jawline: { type: "string" },
        chin: { type: "string" },
        lengthToWidthRatio: { type: "string" }
      }
    },
    hairColor: { type: "string" },
    eyeColor: { type: "string" },
    presentation: verdictSchema(["Masculine", "Feminine", "Androgynous", "Unclear"]),
    facialHair: verdictSchema([
      "None",
      "Stubble",
      "Mustache",
      "Goatee",
      "Beard",
      "Full Beard"
    ]),
    currentHair: {
      type: "object",
      additionalProperties: false,
      required: ["length", "texture", "notes"],
      properties: {
        length: {
          type: "string",
          enum: ["Buzz", "Short", "Medium", "Shoulder", "Long"]
        },
        texture: {
          type: "string",
          enum: ["Straight", "Wavy", "Curly", "Coily"]
        },
        notes: { type: "string" }
      }
    },
    styleGuardrails: { type: "array", items: { type: "string" } },
    bestMetal: verdictSchema(["Gold", "Silver", "Rose Gold", "Brass/Bronze"]),
    metalVerdicts: {
      type: "object",
      additionalProperties: false,
      required: ["Gold", "Silver", "Rose Gold", "Brass/Bronze"],
      properties: {
        Gold: { type: "string", enum: ["Best", "Strong", "Good", "Skip"] },
        Silver: { type: "string", enum: ["Best", "Strong", "Good", "Skip"] },
        "Rose Gold": { type: "string", enum: ["Best", "Strong", "Good", "Skip"] },
        "Brass/Bronze": { type: "string", enum: ["Best", "Strong", "Good", "Skip"] }
      }
    }
  }
};

const BODY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "bodyShape",
    "shoulderHipBalance",
    "waistDefinition",
    "torsoLegBalance",
    "bestFeatures",
    "silhouetteRules"
  ],
  properties: {
    bodyShape: verdictSchema([
      "Hourglass",
      "Pear",
      "Apple",
      "Rectangle",
      "Inverted Triangle"
    ]),
    shoulderHipBalance: { type: "string" },
    waistDefinition: { type: "string" },
    torsoLegBalance: { type: "string" },
    bestFeatures: { type: "array", items: { type: "string" } },
    silhouetteRules: { type: "array", items: { type: "string" } }
  }
};

const PORTRAIT_PROMPT = `You are a careful color, face, and personal-styling analyst. Analyze the uploaded portrait and return a single JSON object that matches the provided schema exactly.

Guidelines:
- imageQuality: report what is observable in the photo itself. faceSize: "small" if the face occupies a small fraction of the frame (mostly torso or scenery), "good" if naturally framed, "large" if tightly cropped. eyesVisible: true only if both eyes are clearly visible. lighting: "good" if even and balanced, "mixed" if uneven or with strong color cast, "poor" if very dark, blown-out, or heavily mixed. portraitAngle: "front" if facing camera directly, "slight-angle" for small head turn, "strong-angle" for near-profile.
- paletteHypotheses: emit 2-3 plausible 12-season hypotheses for this person, ordered by likelihood (most likely first). Use canonical Sci/Art season IDs as 'id', one of: light-spring, true-spring, bright-spring, light-summer, true-summer, soft-summer, soft-autumn, true-autumn, dark-autumn, true-winter, bright-winter, dark-winter. Set 'name' to the corresponding display label (e.g. "Soft Autumn"). 'confidence' reflects relative strength among these hypotheses. 'supportingSignals': 2-4 short observations supporting this hypothesis (e.g. "warm depth", "muted chroma reads in cheekbones"). 'riskNotes': 1-2 short notes on what could undermine confidence (e.g. "harsh sunlight", "narrow eye visibility"). 'palette': for THIS hypothesis, supply 4-7 bestNeutrals, 4-8 signatureColors, 3-5 accentColors, 3-6 useCarefully swatches. Each swatch has a short readable name and a 6-digit hex.
- Use only what is visible in the photo. Do not invent details.
- Be conservative on subjective traits. Set confidence to "low" or "medium" when in doubt; reserve "high" for clearly visible traits.
- Use 'notes' on each verdict to give one short reason rooted in visible features.
- For undertone.displayLabel, write a short, friendly label such as "Warm (Golden)" or "Cool (Pink)".
- metalVerdicts must include all four metals.
- presentation.value: how the person *visually presents* in the photo (grooming, styling, hair, facial hair). This is NOT a claim about gender identity — it captures the visible styling cues that downstream image generations should match. Use "Unclear" if you genuinely can't tell.
- facialHair.value: visible facial hair amount only. "None", "Stubble", "Mustache", "Goatee", "Beard", "Full Beard".
- currentHair.length: visible hair length. "Buzz" = buzzed/bald, "Short" = above ears, "Medium" = ear to chin, "Shoulder" = chin to shoulder, "Long" = below shoulders. currentHair.texture: "Straight" / "Wavy" / "Curly" / "Coily". currentHair.notes: optional 1-line note on parting, density, or styling cues.
- styleGuardrails: 3-5 short imperative phrases the image generator must follow to avoid feminizing or masculinizing this person inappropriately, e.g. "preserve full beard", "keep masculine grooming silhouette", "do not add makeup", "preserve long curly hair". Tailor to what is visible.
- Avoid medical, weight, or judgmental claims.`;

const BODY_PROMPT = `You are a careful body-shape and styling analyst. Analyze the uploaded full-body photo and return a single JSON object that matches the schema exactly.

Guidelines:
- Use only what is visible. Do not estimate weight, measurements, or anything sensitive.
- Be conservative on bodyShape. Set confidence accordingly. Use neutral, supportive language.
- shoulderHipBalance, waistDefinition, torsoLegBalance: each a short clause (under 12 words).
- bestFeatures: 3-5 short phrases. silhouetteRules: 4-6 short phrases ("define waist", "fitted top, flared bottom").
- Avoid weight or body criticism.`;

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

type ResponsesApiContent =
  | { type: "output_text"; text: string }
  | { type: "refusal"; refusal: string }
  | { type: string; [key: string]: unknown };

type ResponsesApiOutputItem = {
  type: string;
  content?: ResponsesApiContent[];
};

type ResponsesApiPayload = {
  output_parsed?: unknown;
  output?: ResponsesApiOutputItem[];
  output_text?: string;
  error?: { message?: string };
};

function extractJsonFromResponse(payload: ResponsesApiPayload): unknown {
  if (payload.output_parsed) {
    return payload.output_parsed;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal" && "refusal" in content) {
        throw new AnalysisRefusedError(String(content.refusal));
      }
    }
  }

  const textParts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && "text" in content) {
        textParts.push(String(content.text));
      }
    }
  }

  const combined =
    textParts.join("") || (typeof payload.output_text === "string" ? payload.output_text : "");

  if (!combined.trim()) {
    throw new AnalysisSchemaError("Analysis response was empty.");
  }

  try {
    return JSON.parse(combined);
  } catch {
    throw new AnalysisSchemaError("Analysis response was not valid JSON.");
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateVerdict<T extends string>(
  raw: unknown,
  enumValues: readonly T[],
  path: string
): Verdict<T> {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError(`${path} is not an object.`);
  }
  const obj = raw as Record<string, unknown>;
  if (!enumValues.includes(obj.value as T)) {
    throw new AnalysisSchemaError(`${path}.value is not one of the expected values.`);
  }
  if (!["high", "medium", "low"].includes(String(obj.confidence))) {
    throw new AnalysisSchemaError(`${path}.confidence is invalid.`);
  }
  return {
    value: obj.value as T,
    confidence: obj.confidence as Confidence,
    notes: typeof obj.notes === "string" ? obj.notes : undefined
  };
}

function validateSwatchList(
  raw: unknown,
  path: string,
  requirement: { min: number; max: number }
): Swatch[] {
  if (!Array.isArray(raw)) {
    throw new AnalysisSchemaError(`${path} is not an array.`);
  }
  if (raw.length < requirement.min || raw.length > requirement.max) {
    throw new AnalysisSchemaError(
      `${path} must contain ${requirement.min}-${requirement.max} swatches.`
    );
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new AnalysisSchemaError(`${path}[${index}] is not an object.`);
    }
    const swatch = item as Record<string, unknown>;
    if (!isString(swatch.name) || !isString(swatch.hex)) {
      throw new AnalysisSchemaError(`${path}[${index}] is missing name or hex.`);
    }
    const hex = swatch.hex.startsWith("#") ? swatch.hex : `#${swatch.hex}`;
    if (!HEX_COLOR_PATTERN.test(hex)) {
      throw new AnalysisSchemaError(`${path}[${index}].hex must be a 6-digit hex color.`);
    }
    return { name: swatch.name, hex: hex.toUpperCase() };
  });
}

function validatePaletteHypothesis(raw: unknown, path: string): PaletteHypothesis {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError(`${path} is not an object.`);
  }
  const obj = raw as Record<string, unknown>;
  if (!isString(obj.id)) {
    throw new AnalysisSchemaError(`${path}.id is required.`);
  }
  if (!isString(obj.name)) {
    throw new AnalysisSchemaError(`${path}.name is required.`);
  }
  if (!["high", "medium", "low"].includes(String(obj.confidence))) {
    throw new AnalysisSchemaError(`${path}.confidence is invalid.`);
  }
  if (!isStringArray(obj.supportingSignals)) {
    throw new AnalysisSchemaError(`${path}.supportingSignals must be an array of strings.`);
  }
  if (!isStringArray(obj.riskNotes)) {
    throw new AnalysisSchemaError(`${path}.riskNotes must be an array of strings.`);
  }
  const paletteRaw = obj.palette;
  if (!paletteRaw || typeof paletteRaw !== "object") {
    throw new AnalysisSchemaError(`${path}.palette is not an object.`);
  }
  const p = paletteRaw as Record<string, unknown>;

  const modelPalette = {
    bestNeutrals: validateSwatchList(
      p.bestNeutrals,
      `${path}.palette.bestNeutrals`,
      HYPOTHESIS_PALETTE_REQUIREMENTS.bestNeutrals
    ),
    signatureColors: validateSwatchList(
      p.signatureColors,
      `${path}.palette.signatureColors`,
      HYPOTHESIS_PALETTE_REQUIREMENTS.signatureColors
    ),
    accentColors: validateSwatchList(
      p.accentColors,
      `${path}.palette.accentColors`,
      HYPOTHESIS_PALETTE_REQUIREMENTS.accentColors
    ),
    useCarefully: validateSwatchList(
      p.useCarefully,
      `${path}.palette.useCarefully`,
      HYPOTHESIS_PALETTE_REQUIREMENTS.useCarefully
    )
  };

  // Canonical override: if the model-emitted id (or name, or alias) resolves to a
  // populated canonical season in app/data/colorSystem.ts, replace the model's
  // palette with the canonical one. The data file is the source of truth for
  // hex values; the model only contributes per-photo signals (supporting + risk).
  const canonicalId = resolveSeasonId(obj.id) ?? resolveSeasonId(obj.name);
  const canonical = canonicalId ? getSeason(canonicalId) : undefined;
  const useCanonical = Boolean(canonical && canonical.populated);

  return {
    id: useCanonical && canonical ? canonical.id : obj.id,
    name: useCanonical && canonical ? canonical.name : obj.name,
    confidence: obj.confidence as Confidence,
    supportingSignals: obj.supportingSignals,
    riskNotes: obj.riskNotes,
    palette: useCanonical && canonical ? canonical.palette : modelPalette,
    rules: useCanonical && canonical ? canonical.rules : undefined
  };
}

function validatePaletteHypotheses(raw: unknown): PaletteHypothesis[] {
  if (!Array.isArray(raw)) {
    throw new AnalysisSchemaError("paletteHypotheses is not an array.");
  }
  if (raw.length < HYPOTHESIS_COUNT.min || raw.length > HYPOTHESIS_COUNT.max) {
    throw new AnalysisSchemaError(
      `paletteHypotheses must contain ${HYPOTHESIS_COUNT.min}-${HYPOTHESIS_COUNT.max} entries.`
    );
  }
  return raw.map((item, index) =>
    validatePaletteHypothesis(item, `paletteHypotheses[${index}]`)
  );
}

function validateImageQuality(raw: unknown): ImageQualitySignals {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError("imageQuality is not an object.");
  }
  const iq = raw as Record<string, unknown>;
  const faceSize = String(iq.faceSize);
  if (!["small", "good", "large"].includes(faceSize)) {
    throw new AnalysisSchemaError("imageQuality.faceSize is invalid.");
  }
  if (typeof iq.eyesVisible !== "boolean") {
    throw new AnalysisSchemaError("imageQuality.eyesVisible must be boolean.");
  }
  const lighting = String(iq.lighting);
  if (!["poor", "mixed", "good"].includes(lighting)) {
    throw new AnalysisSchemaError("imageQuality.lighting is invalid.");
  }
  const portraitAngle = String(iq.portraitAngle);
  if (!["front", "slight-angle", "strong-angle"].includes(portraitAngle)) {
    throw new AnalysisSchemaError("imageQuality.portraitAngle is invalid.");
  }
  const rawSignals: ImageQualityRawSignals = {
    faceSize: faceSize as ImageQualityRawSignals["faceSize"],
    eyesVisible: iq.eyesVisible,
    lighting: lighting as ImageQualityRawSignals["lighting"],
    portraitAngle: portraitAngle as ImageQualityRawSignals["portraitAngle"]
  };
  return {
    ...rawSignals,
    confidencePenalty: computeConfidencePenalty(rawSignals)
  };
}

function validatePortrait(raw: unknown): PortraitAnalysis {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError("Portrait analysis is not an object.");
  }
  const o = raw as Record<string, unknown>;

  const imageQuality = validateImageQuality(o.imageQuality);
  const paletteHypotheses = validatePaletteHypotheses(o.paletteHypotheses);

  const depth = validateVerdict<Depth>(
    o.depth,
    ["Light", "Light-Medium", "Medium", "Medium-Deep", "Deep"],
    "depth"
  );
  const contrast = validateVerdict<Contrast>(
    o.contrast,
    ["Low", "Low-Medium", "Medium", "Medium-High", "High"],
    "contrast"
  );

  const undertoneRaw = o.undertone;
  if (!undertoneRaw || typeof undertoneRaw !== "object") {
    throw new AnalysisSchemaError("undertone is not an object.");
  }
  const undertoneBase = validateVerdict<Undertone>(
    undertoneRaw,
    ["Warm", "Cool", "Neutral", "Olive"],
    "undertone"
  );
  const displayLabel = (undertoneRaw as Record<string, unknown>).displayLabel;
  if (!isString(displayLabel)) {
    throw new AnalysisSchemaError("undertone.displayLabel is required.");
  }

  const clarity = validateVerdict<Clarity>(
    o.clarity,
    ["Bright", "Muted", "Soft"],
    "clarity"
  );

  const faceRaw = o.faceShape;
  if (!faceRaw || typeof faceRaw !== "object") {
    throw new AnalysisSchemaError("faceShape is not an object.");
  }
  const faceBase = validateVerdict<FaceShape>(
    faceRaw,
    ["Oval", "Round", "Square", "Rectangle", "Oblong", "Heart", "Diamond", "Triangle"],
    "faceShape"
  );
  const f = faceRaw as Record<string, unknown>;
  if (
    !isString(f.forehead) ||
    !isString(f.cheekbones) ||
    !isString(f.jawline) ||
    !isString(f.chin) ||
    !isString(f.lengthToWidthRatio)
  ) {
    throw new AnalysisSchemaError("faceShape sub-fields incomplete.");
  }

  if (!isString(o.hairColor) || !isString(o.eyeColor)) {
    throw new AnalysisSchemaError("hairColor or eyeColor missing.");
  }

  const presentation = validateVerdict<Presentation>(
    o.presentation,
    ["Masculine", "Feminine", "Androgynous", "Unclear"],
    "presentation"
  );
  const facialHair = validateVerdict<FacialHair>(
    o.facialHair,
    ["None", "Stubble", "Mustache", "Goatee", "Beard", "Full Beard"],
    "facialHair"
  );

  const hairRaw = o.currentHair;
  if (!hairRaw || typeof hairRaw !== "object") {
    throw new AnalysisSchemaError("currentHair is not an object.");
  }
  const hairObj = hairRaw as Record<string, unknown>;
  const allowedLengths = ["Buzz", "Short", "Medium", "Shoulder", "Long"];
  const allowedTextures = ["Straight", "Wavy", "Curly", "Coily"];
  if (!allowedLengths.includes(String(hairObj.length))) {
    throw new AnalysisSchemaError("currentHair.length is invalid.");
  }
  if (!allowedTextures.includes(String(hairObj.texture))) {
    throw new AnalysisSchemaError("currentHair.texture is invalid.");
  }
  const currentHair = {
    length: hairObj.length as HairLength,
    texture: hairObj.texture as HairTexture,
    notes: typeof hairObj.notes === "string" ? hairObj.notes : undefined
  };

  if (!isStringArray(o.styleGuardrails)) {
    throw new AnalysisSchemaError("styleGuardrails must be an array of strings.");
  }
  const styleGuardrails = o.styleGuardrails;

  const bestMetal = validateVerdict<Metal>(
    o.bestMetal,
    ["Gold", "Silver", "Rose Gold", "Brass/Bronze"],
    "bestMetal"
  );

  const verdictsRaw = o.metalVerdicts;
  if (!verdictsRaw || typeof verdictsRaw !== "object") {
    throw new AnalysisSchemaError("metalVerdicts is not an object.");
  }
  const v = verdictsRaw as Record<string, unknown>;
  const allowedVerdicts = ["Best", "Strong", "Good", "Skip"];
  const metalVerdicts: Record<Metal, MetalVerdict> = {} as Record<Metal, MetalVerdict>;
  for (const metal of ["Gold", "Silver", "Rose Gold", "Brass/Bronze"] as const) {
    if (!allowedVerdicts.includes(String(v[metal]))) {
      throw new AnalysisSchemaError(`metalVerdicts.${metal} is invalid.`);
    }
    metalVerdicts[metal] = v[metal] as MetalVerdict;
  }

  // Canonical face-shape attachment: same pattern as colorSystem and silhouette.
  // Validator looks up the face shape and attaches canonical principles.
  const canonicalFaceShapeId = FACE_SHAPE_TO_ID[faceBase.value];
  const canonicalFaceShape = canonicalFaceShapeId
    ? FACE_SHAPE_RULES[canonicalFaceShapeId]
    : undefined;

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    modelUsed: ANALYSIS_MODEL,
    imageQuality,
    paletteHypotheses,
    canonicalFaceShape,
    depth,
    contrast,
    undertone: { ...undertoneBase, displayLabel },
    clarity,
    faceShape: {
      ...faceBase,
      forehead: f.forehead,
      cheekbones: f.cheekbones,
      jawline: f.jawline,
      chin: f.chin,
      lengthToWidthRatio: f.lengthToWidthRatio
    },
    hairColor: o.hairColor,
    eyeColor: o.eyeColor,
    presentation,
    facialHair,
    currentHair,
    styleGuardrails,
    bestMetal,
    metalVerdicts
  };
}

function validateBody(raw: unknown): BodyAnalysis {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError("Body analysis is not an object.");
  }
  const o = raw as Record<string, unknown>;

  const bodyShape = validateVerdict<BodyShape>(
    o.bodyShape,
    ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"],
    "bodyShape"
  );

  if (
    !isString(o.shoulderHipBalance) ||
    !isString(o.waistDefinition) ||
    !isString(o.torsoLegBalance)
  ) {
    throw new AnalysisSchemaError("body sub-fields incomplete.");
  }
  if (!isStringArray(o.bestFeatures) || !isStringArray(o.silhouetteRules)) {
    throw new AnalysisSchemaError("bestFeatures or silhouetteRules invalid.");
  }

  // Canonical override: look up the canonical silhouette principles for the
  // identified body shape. Same pattern as the palette canonical override —
  // the data file is the source of truth for principles; the model only
  // contributes per-photo observations (shoulderHipBalance, waistDefinition,
  // torsoLegBalance, bestFeatures, silhouetteRules).
  const canonicalShapeId = BODY_SHAPE_TO_ID[bodyShape.value];
  const canonicalSilhouette = canonicalShapeId
    ? SILHOUETTE_RULES.shapes[canonicalShapeId]
    : undefined;

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    modelUsed: ANALYSIS_MODEL,
    bodyShape,
    shoulderHipBalance: o.shoulderHipBalance,
    waistDefinition: o.waistDefinition,
    torsoLegBalance: o.torsoLegBalance,
    bestFeatures: o.bestFeatures,
    silhouetteRules: o.silhouetteRules,
    canonicalSilhouette
  };
}

async function callResponses(
  apiKey: string,
  imageDataUrl: string,
  promptText: string,
  schemaName: string,
  schema: Record<string, unknown>,
  signal?: AbortSignal
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: promptText },
              { type: "input_image", image_url: imageDataUrl }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema
          }
        }
      }),
      signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new AnalysisTransportError(
      err instanceof Error ? err.message : "Network error during analysis."
    );
  }

  let payload: ResponsesApiPayload;
  try {
    payload = (await response.json()) as ResponsesApiPayload;
  } catch {
    throw new AnalysisTransportError(
      `Analysis returned ${response.status} ${response.statusText} with non-JSON body.`
    );
  }

  if (!response.ok) {
    throw new AnalysisTransportError(
      payload.error?.message || `Analysis returned ${response.status} ${response.statusText}.`
    );
  }

  return extractJsonFromResponse(payload);
}

export async function analyzePortrait(
  file: File,
  apiKey: string,
  signal?: AbortSignal
): Promise<PortraitAnalysis> {
  const dataUrl = await readFileAsDataUrl(file);
  const raw = await callResponses(
    apiKey.trim(),
    dataUrl,
    PORTRAIT_PROMPT,
    "PortraitAnalysis",
    PORTRAIT_JSON_SCHEMA,
    signal
  );
  return validatePortrait(raw);
}

export async function analyzeBody(
  file: File,
  apiKey: string,
  signal?: AbortSignal
): Promise<BodyAnalysis> {
  const dataUrl = await readFileAsDataUrl(file);
  const raw = await callResponses(
    apiKey.trim(),
    dataUrl,
    BODY_PROMPT,
    "BodyAnalysis",
    BODY_JSON_SCHEMA,
    signal
  );
  return validateBody(raw);
}

export const ANALYSIS_MODEL = "gpt-5.5";
export const ANALYSIS_SCHEMA_VERSION = 2;

const RESPONSES_URL = "https://api.openai.com/v1/responses";

export type Confidence = "high" | "medium" | "low";

export type Verdict<T extends string> = {
  value: T;
  confidence: Confidence;
  notes?: string;
};

export type Swatch = { name: string; hex: string };

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
const PALETTE_REQUIREMENTS = {
  bestNeutrals: { min: 6, max: 7 },
  signatureColors: { min: 6, max: 8 },
  accentColors: { min: 4, max: 5 },
  avoid: { min: 5, max: 6 }
} as const;

export type PortraitAnalysis = {
  schemaVersion: typeof ANALYSIS_SCHEMA_VERSION;
  generatedAt: string;
  modelUsed: string;
  depth: Verdict<Depth>;
  contrast: Verdict<Contrast>;
  undertone: Verdict<Undertone> & { displayLabel: string };
  clarity: Verdict<Clarity>;
  colorSeason: Verdict<string> & { description: string };
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
  palette: {
    bestNeutrals: Swatch[];
    signatureColors: Swatch[];
    accentColors: Swatch[];
    avoid: Swatch[];
  };
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
    "depth",
    "contrast",
    "undertone",
    "clarity",
    "colorSeason",
    "faceShape",
    "hairColor",
    "eyeColor",
    "presentation",
    "facialHair",
    "currentHair",
    "styleGuardrails",
    "palette",
    "bestMetal",
    "metalVerdicts"
  ],
  properties: {
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
    colorSeason: {
      type: "object",
      additionalProperties: false,
      required: ["value", "confidence", "notes", "description"],
      properties: {
        value: { type: "string" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        notes: { type: "string" },
        description: { type: "string" }
      }
    },
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
    palette: {
      type: "object",
      additionalProperties: false,
      required: ["bestNeutrals", "signatureColors", "accentColors", "avoid"],
      properties: {
        bestNeutrals: swatchListSchema,
        signatureColors: swatchListSchema,
        accentColors: swatchListSchema,
        avoid: swatchListSchema
      }
    },
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
- Use only what is visible in the photo. Do not invent details.
- Be conservative on subjective traits. Set confidence to "low" or "medium" when in doubt; reserve "high" for clearly visible traits.
- Use 'notes' on each verdict to give one short reason rooted in visible features.
- For undertone.displayLabel, write a short, friendly label such as "Warm (Golden)" or "Cool (Pink)".
- For colorSeason.value, choose any standard 12-season label such as "Deep Autumn", "Soft Summer", "Bright Spring". Use neutral wording like "most likely" in colorSeason.notes.
- palette.bestNeutrals: 6-7 swatches. signatureColors: 6-8. accentColors: 4-5. avoid: 5-6. Each swatch has a short readable name and a 6-digit hex.
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

function validatePortrait(raw: unknown): PortraitAnalysis {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisSchemaError("Portrait analysis is not an object.");
  }
  const o = raw as Record<string, unknown>;

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

  const seasonRaw = o.colorSeason;
  if (!seasonRaw || typeof seasonRaw !== "object") {
    throw new AnalysisSchemaError("colorSeason is not an object.");
  }
  const seasonObj = seasonRaw as Record<string, unknown>;
  if (!isString(seasonObj.value) || !isString(seasonObj.description)) {
    throw new AnalysisSchemaError("colorSeason.value or .description missing.");
  }
  if (!["high", "medium", "low"].includes(String(seasonObj.confidence))) {
    throw new AnalysisSchemaError("colorSeason.confidence invalid.");
  }

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

  const paletteRaw = o.palette;
  if (!paletteRaw || typeof paletteRaw !== "object") {
    throw new AnalysisSchemaError("palette is not an object.");
  }
  const p = paletteRaw as Record<string, unknown>;
  const palette = {
    bestNeutrals: validateSwatchList(
      p.bestNeutrals,
      "palette.bestNeutrals",
      PALETTE_REQUIREMENTS.bestNeutrals
    ),
    signatureColors: validateSwatchList(
      p.signatureColors,
      "palette.signatureColors",
      PALETTE_REQUIREMENTS.signatureColors
    ),
    accentColors: validateSwatchList(
      p.accentColors,
      "palette.accentColors",
      PALETTE_REQUIREMENTS.accentColors
    ),
    avoid: validateSwatchList(p.avoid, "palette.avoid", PALETTE_REQUIREMENTS.avoid)
  };

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

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    modelUsed: ANALYSIS_MODEL,
    depth,
    contrast,
    undertone: { ...undertoneBase, displayLabel },
    clarity,
    colorSeason: {
      value: seasonObj.value,
      confidence: seasonObj.confidence as Confidence,
      notes: typeof seasonObj.notes === "string" ? seasonObj.notes : undefined,
      description: seasonObj.description
    },
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
    palette,
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

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    modelUsed: ANALYSIS_MODEL,
    bodyShape,
    shoulderHipBalance: o.shoulderHipBalance,
    waistDefinition: o.waistDefinition,
    torsoLegBalance: o.torsoLegBalance,
    bestFeatures: o.bestFeatures,
    silhouetteRules: o.silhouetteRules
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

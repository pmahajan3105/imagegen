import type { PortraitAnalysis, Swatch } from "./analysis";

export const IDENTITY_PRESERVE_FRAGMENT =
  "Preserve subject identity exactly from Image 1. Do not alter face shape, skin tone, eye color, hair color, hair length, facial hair, age, or visible presentation. The person rendered must be the same person.";

export const BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT =
  "Preserve subject identity exactly: face, skin tone, eye color, hair color, hair length, facial hair, age, and visible presentation come from Image 1; body scale, body proportions, posture, and full-body silhouette come from the uploaded full-body photo. Do not slim, widen, lengthen, shorten, or glamorize the body.";

/** Render a list of swatches as comma-separated "Name #HEX" entries. */
export function swatchList(list: Swatch[]): string {
  return list.map((s) => `${s.name} ${s.hex}`).join(", ");
}

/** Map an inferred presentation verdict to a single sentence used by personLock. */
export function presentationDirective(
  presentation: "Masculine" | "Feminine" | "Androgynous" | "Unclear"
): string {
  switch (presentation) {
    case "Masculine":
      return "masculine-presenting; the output renders a masculine-presenting person";
    case "Feminine":
      return "feminine-presenting; the output renders a feminine-presenting person";
    case "Androgynous":
    case "Unclear":
    default:
      return "androgynous or has unclear presentation; render in a way that does not strongly gender the look";
  }
}

/** Outfit-category guidance gated on the inferred visible presentation. Used by report
 *  prompts that compose outfit categories (Outfit Style Guide). */
export function outfitPresentationGuidance(portrait: PortraitAnalysis): string {
  if (portrait.presentation.value === "Masculine") {
    return `OUTFIT SELECTION FOR THIS USER:
- Derive garment categories from the user's masculine-presenting styling cues and uploaded references.
- Favor relevant categories such as knitwear, shirts, tees, polos, overshirts, trousers, denim, jackets, coats, boots, sneakers, loafers, belts, watches, and simple jewelry.
- Do not default to blouses, skirts, dresses, heels, or feminine silhouettes unless the uploaded references clearly support that direction.`;
  }

  if (portrait.presentation.value === "Feminine") {
    return `OUTFIT SELECTION FOR THIS USER:
- Derive garment categories from the user's feminine-presenting styling cues and uploaded references.
- Use feminine, neutral, or relaxed garment categories only when they match the uploaded references and body analysis.
- Do not force dresses, skirts, heels, soft silhouettes, or glam styling by default; choose them only when they serve the user's visible style and silhouette rules.`;
  }

  return `OUTFIT SELECTION FOR THIS USER:
- Derive garment categories from the user's visible styling cues and uploaded references.
- Keep the wardrobe clean, practical, and not strongly gendered unless the uploaded references clearly suggest a direction.
- Do not force dresses, suits, heels, skirts, or other gendered archetypes by default.`;
}

export type RenderDecision = {
  label: string;
  details?: string;
};

export type RenderLockedDecisionsOptions = {
  itemNounPlural: string;
  decisions: RenderDecision[];
  doNotInventClause?: string;
};

export function renderLockedDecisions(opts: RenderLockedDecisionsOptions): string {
  const intro = `Render these ${opts.decisions.length} selected ${opts.itemNounPlural}:`;
  const lines = opts.decisions.map((decision, index) => {
    const numbered = `${index + 1}. ${decision.label}`;
    return decision.details ? `${numbered} — ${decision.details}` : numbered;
  });
  const closing = opts.doNotInventClause ?? `Do not invent other ${opts.itemNounPlural}.`;
  return [intro, ...lines, "", closing].join("\n");
}

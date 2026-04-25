import type { PortraitAnalysis, BodyAnalysis, Swatch } from "./analysis";

export type ImageReference = "portrait" | "body" | "hand";
export type OutfitStyleMode = "identity-preserving" | "styling-board";

export type PortraitStepInput = {
  portrait: PortraitAnalysis;
  body?: BodyAnalysis;
  outfitStyleMode?: OutfitStyleMode;
};

export type PortraitAnalysisStep = {
  title: string;
  description: string;
  reference: ImageReference;
  requires: { portrait: true; body?: boolean };
  buildPrompt: (input: PortraitStepInput) => string;
};

const STYLE_BLOCK = `Style: editorial fashion infographic, warm cream background, fine grid dividers, deep brown and black serif headlines, clean sans-serif labels, generous whitespace, premium magazine feel.`;

function tileAnchor(variation: string) {
  return `Tile consistency: every tile uses the same head-and-shoulders crop, same neutral background, same lighting, same neutral expression. Only the ${variation} changes between tiles.`;
}

function preserveRepeat(items: string[]) {
  return [
    "PRESERVE (final reminder, applies after all other instructions):",
    ...items.map((item) => `- ${item}`)
  ].join("\n");
}

// Standard framing for multi-image input. The last image is always a layout reference.
// Index-by-role language keeps user reference imagery separate from layout references.
function imageRoles(
  layoutLabel: string | null,
  options: {
    primaryReference?: string;
    primaryUse?: string;
    intermediateReferences?: string | null;
    layoutUse?: string;
    separationRule?: string;
  } = {}
) {
  const primaryReference = options.primaryReference ?? "the user's primary portrait";
  const primaryUse =
    options.primaryUse ??
    "Use it as the IDENTITY and PERSON reference for every face rendered in the output.";
  const intermediateReferences =
    options.intermediateReferences === undefined
      ? layoutLabel
        ? "Any images between Image 1 and the LAST image: additional angles of the SAME person. Use them only to confirm identity (eye color, brow shape, nose, skin tone). Do not blend in any other person."
        : "Any images after Image 1: additional angles of the SAME person. Use them only to confirm identity (eye color, brow shape, nose, skin tone). Do not blend in any other person."
      : options.intermediateReferences;
  const layoutUse =
    options.layoutUse ??
    "Use it ONLY for layout, region arrangement, typography hierarchy, card and badge styles, swatch arrangement, and overall composition.";
  const separationRule =
    options.separationRule ??
    "do NOT copy the person, hair color, skin tone, or any face from the layout reference";

  if (!layoutLabel) {
    return `IMAGE INPUTS (read carefully):
- Image 1: ${primaryReference}. ${primaryUse}
${intermediateReferences ? `- ${intermediateReferences}\n` : ""}- No layout reference image is provided for this report. Build the page from the written layout instructions below.

Hard separation rule: do NOT invent a generic model, celebrity, influencer, stock-photo face, or fashion-reference person. Every rendered person must come from the user's image inputs and analysis values below.`;
  }

  return `IMAGE INPUTS (read carefully):
- Image 1: ${primaryReference}. ${primaryUse}
${intermediateReferences ? `- ${intermediateReferences}\n` : ""}- The LAST image: a "${layoutLabel}" LAYOUT REFERENCE. ${layoutUse}

Hard separation rule: ${separationRule}. Do NOT copy text labels, season names, color values, or numeric data from the layout reference verbatim. Replace ALL of those with the user's analysis values below. People who appear in the layout reference are placeholders only; do not copy their gender, hairstyle, hair length, makeup level, clothing, or pose.`;
}

// Person Lock — applied to every report. Identity claims are grounded in the
// pre-computed analysis values (extracted from the user's portrait photo by
// gpt-5.5), NOT in whichever image happens to be in slot 1 — because for
// hand-based and body-based reports, Image 1 does not show the face.
function personLock(portrait: PortraitAnalysis) {
  const guardrailLines = portrait.styleGuardrails.length
    ? portrait.styleGuardrails.map((g) => `  - ${g}`).join("\n")
    : "  - (none specified)";
  return `PERSON LOCK (the user's identity is defined by these pre-computed values, regardless of which user image is in slot 1; for hand or body reports the face is not visible in the input but the identity below still applies):
- Visible presentation: ${portrait.presentation.value}.
- Facial hair: ${portrait.facialHair.value}. Render exactly this. Do not add facial hair if "None"; do not remove or change facial hair otherwise.
- Current hair: ${portrait.currentHair.length} length, ${portrait.currentHair.texture} texture${portrait.currentHair.notes ? ` (${portrait.currentHair.notes})` : ""}. Hair color: ${portrait.hairColor}.
- Eye color: ${portrait.eyeColor}. Skin tone, brow shape, jawline, age, and ethnic features come from the user's portrait analysis (the values are the source of truth even if the face is not visible in slot 1).
- Style guardrails (must be honored in every rendered region):
${guardrailLines}
- Do NOT feminize or masculinize the person to match the layout reference. The user appears ${portrait.presentation.value === "Masculine" ? "masculine-presenting; the output renders a masculine-presenting person" : portrait.presentation.value === "Feminine" ? "feminine-presenting; the output renders a feminine-presenting person" : "androgynous or has unclear presentation; render in a way that does not strongly gender the look"}.
- Hairstyles, clothing cuts, makeup level, accessories, and silhouettes must suit the user's visible presentation, not the layout reference's subject.`;
}

function hairstyleGuidance(portrait: PortraitAnalysis) {
  if (portrait.presentation.value === "Masculine") {
    return `HAIRSTYLE SELECTION FOR THIS USER:
- The user is masculine-presenting. Use masculine or gender-neutral grooming language.
- Pick 4 from style families that fit the visible hair length/texture: textured crop, taper, side part, brushed-back waves, modern quiff, slick back, natural curls, shoulder-length flow, long layered flow.
- If the user's current hair is Shoulder or Long, at least one option may preserve longer flow. If current hair is Short or Medium, do not invent below-shoulder length.
- Do NOT use labels like "lob", "bob", "curtain bangs", "curtain fringe", "face-framing highlights", "pony tail", or "low bun" unless the uploaded portrait already clearly supports that exact styling direction.`;
  }

  if (portrait.presentation.value === "Feminine") {
    return `HAIRSTYLE SELECTION FOR THIS USER:
- The user is feminine-presenting. Choose styles that preserve the visible presentation and current hair direction.
- Pick 4 from style families that fit the visible hair length/texture: soft layers, long layers, textured bob, collarbone cut, side-swept waves, sleek straight, polished updo, natural curls, face-framing layers.
- Do not force short, long, fringe, or updo categories if they do not fit the uploaded portrait.`;
  }

  return `HAIRSTYLE SELECTION FOR THIS USER:
- The user's presentation is ${portrait.presentation.value}. Use gender-neutral styling language.
- Pick 4 styles that fit the visible hair length/texture without strongly gendering the look.
- Favor terms like textured crop, soft layers, natural waves, brushed-back shape, side part, clean taper, collarbone cut, or shoulder-length flow when appropriate.
- Do not force fringe, bob, bun, quiff, or heavily gendered labels unless the uploaded portrait clearly supports them.`;
}

function outfitPresentationGuidance(portrait: PortraitAnalysis) {
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

function compose(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join("\n\n");
}

export const PORTRAIT_ANALYSIS_STEPS: PortraitAnalysisStep[] = [
  {
    title: "Color Season Report",
    description: "Polished color analysis showing depth, contrast, undertone, palette, and metals.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic personal color analysis infographic, using the user's portrait(s) for identity and the written layout instructions for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Depth: ${portrait.depth.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}
- Season: ${portrait.colorSeason.value}
- Season feel: ${portrait.colorSeason.description}`,
        `Available swatches. Use the exact hex values when rendering circles or color bands:
- Signature colors: ${swatchList(portrait.palette.signatureColors)}
- Accent colors: ${swatchList(portrait.palette.accentColors)}
- Best neutrals: ${swatchList(portrait.palette.bestNeutrals)}
- Avoid: ${swatchList(portrait.palette.avoid)}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Region structure: a top "key features" band, a try-on grid of portrait tiles, a "best palette" card with the season name and a circle palette, and a bottom band of swatch rows.
- Header bar: render exactly the user's values: "${portrait.depth.value}" / "${portrait.contrast.value}" / "${portrait.undertone.displayLabel}".
- Try-on tiles: render the SAME user (from Image 1) in each tile wearing only a solid top in a chosen color. Pick 4 flattering tile colors from the user's Signature/Accent swatches and 2 less-harmonious tile colors from the user's Avoid swatches. Vary the flattering picks across depth and saturation.
- Beneath each tile, render a colored band matching the tile's hex, the swatch name in small caps, and a 2-3 word verdict caption that you compose for this specific user and swatch (positive for flattering, neutral-descriptive for less-harmonious, never insulting).
- Where the reference has a "Best Palette" card, render: "YOUR BEST PALETTE" eyebrow, the season name "${portrait.colorSeason.value}" in large bold serif, a 1-2 line tagline derived from the season feel, then a 12-circle palette in 3x4 (curated from the user's Signature + Accent swatches, no labels).
- Where the reference has bottom swatch rows, render "BEST NEUTRALS" (5-7 circles from the user's Best Neutrals) and "AVOID" (5-7 circles from the user's Avoid), each circle labeled with its swatch name in small caps below. Add a single concluding line composed for the user.`,
        tileAnchor("solid top color"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Every rendered swatch (circles, bands, tile tops) must use one of the exact hex values listed in the swatches block.
- Preserve facial identity, proportions, and skin texture from the uploaded portrait across every tile.
- Hands have exactly five fingers. One person only across the entire image.
- No watermarks, signatures, brand logos, or fake product codes.
- Do not mention that this is AI-generated.
- Inside the try-on grid, never use "Avoid", "Bad", or "Ugly" as a caption. Use "Skip" or descriptive phrasing.`,
        preserveRepeat([
          "Same person across all 6 try-on tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features, age.",
          "Identical head-and-shoulders crop, same camera angle, same neutral expression in every tile.",
          "Identical neutral background and identical soft warm lighting across tiles.",
          "Every rendered color (tile top, swatch circle, color band) uses an exact hex from the swatches list above.",
          "Season name printed in the right card is exactly: " + portrait.colorSeason.value
        ])
      ]);
    }
  },
  {
    title: "Face Shape And Feature Map",
    description: "Annotated face shape map with proportions and flattering principles.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) =>
      compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 face shape analysis infographic, using the user's portrait(s) for identity and the written layout instructions for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}
- Forehead: ${portrait.faceShape.forehead}
- Cheekbones: ${portrait.faceShape.cheekbones}
- Jawline: ${portrait.faceShape.jawline}
- Chin: ${portrait.faceShape.chin}
- Length-to-width ratio: ${portrait.faceShape.lengthToWidthRatio}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Region structure: a top band with the face shape headline, a hero region with the user's portrait surrounded by 5 annotation callouts, a right card describing the face shape, and bottom cards for contour/highlight map and face-shape principles.
- Top band: render "YOUR FACE SHAPE" small-caps eyebrow + "${portrait.faceShape.value}" in extra-large bold serif.
- Hero region: a photorealistic head-and-shoulders portrait of the user from Image 1. Five thin tan leader lines fan out from the face to small text callouts:
  1. "FOREHEAD WIDTH" - body: "${portrait.faceShape.forehead}"
  2. "CHEEKBONE PROMINENCE" - body: "${portrait.faceShape.cheekbones}"
  3. "JAWLINE ANGLE" - body: "${portrait.faceShape.jawline}"
  4. "FACE LENGTH TO WIDTH RATIO" - body: "Yours: ${portrait.faceShape.lengthToWidthRatio}"
  5. "CHIN SHAPE" - body: "${portrait.faceShape.chin}"
  Leader lines must not cross the eyes, nose, or mouth.
- Right card: face-silhouette icon for ${portrait.faceShape.value}, heading "${portrait.faceShape.value} FACE" small-caps, then 2-3 lines describing this face shape's qualities. Compose the description fresh.
- Bottom-left card "CONTOUR & HIGHLIGHT MAP": line-art face diagram with shaded zones for ${portrait.faceShape.value}, plus 3 rows (BRONZER / HIGHLIGHTER / BLUSH) each with a small swatch circle + label + 1-line placement note specific to ${portrait.faceShape.value}.
- Bottom-right card "BEST FOR ${portrait.faceShape.value.toUpperCase()} FACES": 2x2 grid - 2 lean-in principles (green check) and 2 use-carefully principles (grey dot), each under 12 words. Compose all 4 principles dynamically.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Preserve facial identity, proportions, and skin texture from the uploaded portrait. The hero portrait is the same person, undistorted.
- Hands have exactly five fingers. One person only across the entire image.
- No watermarks, signatures, brand logos, or fake product codes.
- Do not invent precise ratio ranges. Only display "Yours: ${portrait.faceShape.lengthToWidthRatio}".
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Hero portrait must read as the same person from the uploaded reference. Same eyes, brows, nose, mouth, skin tone, hair, ethnic features.`,
          `Face shape printed in the top band is exactly: ${portrait.faceShape.value}.`,
          `Length-to-width ratio printed in the right callout is exactly: ${portrait.faceShape.lengthToWidthRatio}.`,
          "Five callouts: forehead, cheekbones, jawline, chin, length ratio. Leader lines never cross the face's eyes, nose, or mouth."
        ])
      ])
  },
  {
    title: "Best Hairstyles Board",
    description: "Four photo-realistic hairstyle options tailored to the face shape.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) =>
      compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic hairstyle recommendation board. Identity preservation is the single most important rule on this page; the four faces must read as the same person to a casual viewer.",
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}
- Hair color (preserve in every tile): ${portrait.hairColor}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Use 4 photorealistic head-and-shoulders portrait tiles in a clean 2-column by 2-row grid. Larger per-tile pixel budget is intentional.
- Top band: small-caps title "BEST HAIRSTYLES FOR ${portrait.faceShape.value.toUpperCase()} FACE" with a thin divider below.
- Each tile shows the SAME person from the user portrait(s) wearing a plain neutral white or cream top against a soft warm beige seamless background, soft warm studio lighting, relaxed neutral expression with slight closed-mouth smile. ONLY the hairstyle changes between tiles.
- Below each tile: hairstyle name in bold small-caps (2-5 words) and a 1-line caption (under 14 words) explaining why this style flatters a ${portrait.faceShape.value} face. Compose each caption fresh.
- Pick 4 distinct hairstyles that flatter ${portrait.faceShape.value} AND suit the user's visible presentation (see Person Lock above). The four picks should span different length/shape/formality families that are plausible for the uploaded portrait.
- ${hairstyleGuidance(portrait)}
- Do not repeat a style across tiles.
- Style names and captions must use neutral language and must not contradict ${portrait.presentation.value} presentation.`,
        `IDENTITY ANCHOR (hard requirement across all 4 tiles):
- Same person in every tile, no exceptions. Faces in all 4 tiles must look like the same individual to a casual viewer at a glance.
- Preserve exactly: gender presentation, eye shape and color, brow shape and thickness, nose shape and width, mouth and lip shape, chin shape, skin tone, freckles or moles, ethnic features, apparent age.
- Preserve facial hair exactly as shown in Image 1: render the same beard, mustache, or stubble in every tile. If Image 1 has no facial hair, do not add any. If Image 1 has a beard, every tile shows the same beard.
- Preserve exactly the hair color: ${portrait.hairColor}. The cut and styling change; the color does not lighten, darken, warm, or cool.
- Same head-and-shoulders framing, same camera angle (straight-on or very slight three-quarter), same neutral relaxed expression with closed-mouth or slight smile.
- Same neutral white or cream top across all four tiles.
- Same soft warm beige seamless background across all four tiles.
- Same soft, warm, even studio lighting across all four tiles.
- The only variable across the four tiles is the hairstyle.`,
        STYLE_BLOCK,
        `Hard rules:
- "photorealistic" rendering. No illustration, painting, or stylized look.
- All text must be legible English. No gibberish, no warped letters.
- No watermarks, signatures, brand logos, or fake product codes.
- No sunglasses, hats, scarves, or face-obscuring accessories on any tile.
- Do not change the person's facial structure, ethnicity, age, skin tone, or hair color.
- Do not over-retouch skin. Pores, freckles, and natural skin texture should remain.
- Hairstyle names: bold small-caps, 2 to 5 words.
- Captions: under 14 words, neutral supportive language.
- Do not mention that this is AI-generated.`
      ])
  },
  {
    title: "Wardrobe Capsule Board",
    description: "Capsule wardrobe built around the inferred flattering palette.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles("Wardrobe Capsule Board"),
        personLock(portrait),
        "Generate a 1024x1536 wardrobe capsule infographic styled as an editorial fashion lookbook, using the LAYOUT REFERENCE for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Season: ${portrait.colorSeason.value}
- Season feel: ${portrait.colorSeason.description}
- Best metal (use for buckles, hardware, jewelry): ${portrait.bestMetal.value}`,
        `Approved garment swatches. Every garment cutout's color must match one of these exact hex values:
- Best neutrals (use for tops, bottoms, outerwear, shoes): ${swatchList(portrait.palette.bestNeutrals)}
- Signature colors (use for tops and outerwear primarily): ${swatchList(portrait.palette.signatureColors)}
- Accent colors (use sparingly, for one or two pop pieces): ${swatchList(portrait.palette.accentColors)}
- Avoid (do NOT use any of these): ${swatchList(portrait.palette.avoid)}`,
        `LAYOUT (follow the LAYOUT REFERENCE):
- Reproduce the region structure shown in the layout reference: a top band with portrait inset + season title, a 4-column garment grid (TOPS / BOTTOMS / OUTERWEAR / SHOES), an outfit-combinations strip, and a color-rules card.
- Top band: small rounded-corner portrait inset of the user (Image 1), then "YOUR SEASON:" eyebrow + "${portrait.colorSeason.value}" in large bold serif + a 1-2 line tagline drawn from the season feel.
- Grid: 4 columns × 3 garment cutouts per column = 12 cutouts. Headers "TOPS" / "BOTTOMS" / "OUTERWEAR" / "SHOES" in small-caps. Each cutout is a clean photo-realistic product shot (no model, no background, soft drop shadow). Below each cutout: garment type (sans-serif) and the matching swatch name (small-caps).
- Every cutout color must match an exact hex from the approved swatches above. Color name label must match the swatch's name. Across the 12 cutouts, prefer Best Neutrals and Signature Colors; at most 2 garments may use an Accent Color; never use an Avoid color. Vary garment types within each column.
- Choose the specific 12 garments yourself, grounded in the season "${portrait.colorSeason.value}", the best metal "${portrait.bestMetal.value}", and the user's ${portrait.presentation.value} visible presentation. Do NOT copy gendered garment categories from the layout reference. For masculine-presenting users, favor knits, shirts, tees, trousers, denim, jackets, coats, boots, sneakers, loafers, and belts. For feminine-presenting users, choose feminine or neutral garment categories only when they fit the uploaded portrait's styling cues. For androgynous or unclear presentation, keep the capsule clean, neutral, and not strongly gendered.
- Bottom-left "OUTFIT COMBINATIONS": 2 small flat-lay outfit collages numbered 1 and 2, each combining 3-4 of the 12 garments with hardware in ${portrait.bestMetal.value}.
- Bottom-right "YOUR COLOR RULES" card: 3 numbered rules, each with a small color circle + 2-4 word title + 1-line body. Compose all 3 rules dynamically for "${portrait.colorSeason.value}".`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Every garment color must use one of the exact hex values listed in the swatches block. Color name labels must match the swatch name.
- Never render a garment in a color from the Avoid list.
- No brand names. No prices. No fake product codes or SKUs.
- Hardware (buckles, zippers, jewelry, hardware on bags) is rendered in the ${portrait.bestMetal.value} metal tone.
- Garment cutouts are clean product shots; no models wearing them inside the columns.
- The portrait inset preserves facial identity, proportions, and skin texture from the uploaded portrait.
- Garment categories must match the user's visible presentation and style guardrails; do not default to blouses, skirts, heels, dresses, or feminine styling unless the portrait supports that direction.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Season name printed in the top band is exactly: ${portrait.colorSeason.value}.`,
          `Hardware metal tone across the entire board is exactly: ${portrait.bestMetal.value}.`,
          "Every garment color matches one of the approved hex values. No avoid colors anywhere on the board.",
          "Portrait inset reads as the same person from the uploaded reference. Same eyes, brows, nose, mouth, skin tone, ethnic features.",
          "Outfit-combo collages reuse garments visibly drawn from the 12 cutouts above."
        ])
      ]);
    }
  },
  {
    title: "Color Try-On Comparison",
    description: "Eight portrait try-on tiles comparing flattering, good, and skip colors.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic color try-on comparison board, using the user's portrait(s) for identity and the written layout instructions for structure. The page is focused on color comparison; do not include a separate palette card or full neutrals/avoid rows (those belong to the Color Season Report).",
        `Use these analysis values exactly. Do not re-derive them:
- Depth: ${portrait.depth.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}`,
        `Approved tile swatches. Every tile color must match one of these exact hex values:
- Signature colors (use 3 for Best tiles): ${swatchList(portrait.palette.signatureColors)}
- Accent colors (use 2 for Good tiles): ${swatchList(portrait.palette.accentColors)}
- Avoid (use 3 for Skip tiles): ${swatchList(portrait.palette.avoid)}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band: small-caps eyebrow "COLOR TRY-ON" and a thin horizontal divider below.
- Main region: 8 photorealistic portrait try-on tiles arranged in a 4-column by 2-row grid. Each tile shows the SAME person from Image 1, head-and-shoulders, wearing only a solid top in that tile's color.
- Tile composition (8 tiles total):
  - Pick 3 Signature swatches yourself for "Best" tiles. Vary depth and saturation across the 3 picks.
  - Pick 2 Accent swatches yourself for "Good" tiles.
  - Pick 3 Avoid swatches yourself for "Skip" tiles.
- Below each tile: a thin colored band exactly matching the tile's hex, the swatch name in small caps on the band, and a single-line layout below with:
  - A small badge (small green check + "BEST" for Signature picks, small grey circle + "GOOD" for Accent picks, small grey "skip" dot + "SKIP" for Avoid picks)
  - A 2-3 word verdict caption you compose for this specific person and swatch (positive for Best, neutral-positive for Good, kind-descriptive for Skip; never insulting; never the word "avoid")
- Bottom card "QUICK READ" (about 14% of canvas height): rounded soft-shadow card on slightly lighter cream. Heading "QUICK READ" small-caps. Below: 3 short lines, one each for depth, contrast, and undertone, written for this specific person (e.g. "Depth: ${portrait.depth.value} - leans into rich, full-bodied colors"). Compose each line dynamically.`,
        tileAnchor("solid top color"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Every tile color uses an exact hex from the swatches above. Color name labels match the swatch names.
- Same person across all 8 tiles, drawn from Image 1. Same crop, same lighting, same neutral expression.
- No red Xs, no "Avoid" / "Bad" / "Ugly" wording inside the grid. Use "SKIP" badge with kind descriptive verdicts.
- Do NOT copy the person, swatches, or text from the layout reference. Replace all of it with the user's content.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Same person across all 8 tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features, age.",
          "Identical head-and-shoulders crop, same camera angle, same neutral expression.",
          "Identical neutral background and identical soft lighting across tiles.",
          "Every tile color uses an exact hex from the swatches list above.",
          "Tile counts: 3 Best (Signature), 2 Good (Accent), 3 Skip (Avoid)."
        ])
      ]);
    }
  },
  {
    title: "Makeup Shade Guide",
    description: "Foundation, concealer, blush, eyeshadow, lip, and brow recommendations.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles(null),
        personLock(portrait),
        portrait.presentation.value === "Masculine"
          ? "Generate a 1024x1536 photorealistic GROOMING & SHADE GUIDE infographic for a masculine-presenting user. Reframe the report as grooming-focused: skin tone, brow shape and shaping, lip balm tones, beard care notes (if facial hair is present), subtle complexion shade notes. Do NOT render full makeup looks (no eyeshadow palettes, no lipsticks, no full glam). Replace 'Lip Color Options' with 'Lip Balm / Tinted Balm Tones'. Replace 'Eyeshadow Palette' with 'Subtle Brow & Lash Tones'. Replace 'Blush Options' with 'Healthy Complexion Notes' (light bronzer, healthy flush). Build the page from the written layout instructions."
          : "Generate a 1024x1536 photorealistic makeup shade guide infographic, using the user's portrait(s) for identity and the written layout instructions for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Depth: ${portrait.depth.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}
- Hair color: ${portrait.hairColor}
- Eye color: ${portrait.eyeColor}`,
        `Reference palette colors. Use these to inform eyeshadow and lip picks where they harmonize:
- Signature colors: ${swatchList(portrait.palette.signatureColors)}
- Accent colors: ${swatchList(portrait.palette.accentColors)}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band: extra-large bold serif heading "MAKEUP SHADE GUIDE" with small-caps eyebrow "CUSTOMIZED FOR YOU".
- Three-column body region:

  LEFT COLUMN (about 32% width):
  - "FOUNDATION SHADE RANGE" card: small-caps heading; sub-header descriptor that matches ${portrait.depth.value} depth (compose phrasing such as "Light to Medium" for lighter depths, "Medium to Deep" for deeper depths). 5 horizontal foundation brush-stroke swatches stacked vertically, labeled 1.0 through 5.0 with short shade names progressing from lighter to deeper on the ${portrait.undertone.displayLabel} undertone direction. Mark the BEST shade for this user with a thicker border around its swatch (do NOT use a circle overlay).
  - "CONCEALER RECOMMENDATION" card: heading; sub-header "1 Shade Lighter"; a single brush-stroke swatch beside a 1-line label that names the depth tier and undertone direction (e.g. "${portrait.depth.value} (${portrait.undertone.value.toLowerCase()} undertone)").
  - "BLUSH OPTIONS" card: heading; sub-header "Natural to Bold"; 4 circular blush swatches arranged horizontally, each with a 1-2 word name beneath. Compose 4 blush names that harmonize with ${portrait.undertone.displayLabel}, ranging from natural everyday to bolder evening.

  CENTER COLUMN (about 36% width): a large photorealistic head-and-shoulders portrait of the user from Image 1, centered vertically. Plain neutral background. Preserve identity exactly.

  RIGHT COLUMN (about 32% width):
  - "EYESHADOW PALETTE" card: heading; 6 square eyeshadow swatches arranged in a 3-column by 2-row grid, each with a 1-2 word name beneath. Compose 6 wearable shades that draw from or harmonize with the user's Signature and Accent palette above.
  - "LIP COLOR OPTIONS" card: heading; sub-header "Nude to Statement"; 6 horizontal lipstick swatches stacked vertically, each labeled with a 1-2 word name. Compose 6 names ranging from nude to statement, all harmonizing with ${portrait.undertone.displayLabel}.

- Bottom row (split into two cards):
  - "UNDERTONE ANALYSIS" card (about 60% width, rounded soft-shadow): small-caps heading; large bold value "${portrait.undertone.displayLabel.toUpperCase()}"; 3 short rows below, each with a small icon + 1-line indicator describing a visible undertone signal (skin cast, vein color, jewelry preference, etc.); a final summary line in 11px sans-serif: "You look best in [list 3-4 shade families]." Compose all three indicator lines and the summary dynamically for this user.
  - "BROW RECOMMENDATION" card (about 40% width, rounded soft-shadow): small-caps heading; sub-header naming the recommended brow depth range tied to "${portrait.hairColor}"; a brow brush-stroke swatch in that color; small label below the swatch ("Neutral-Warm Undertone" / similar phrasing tailored to ${portrait.undertone.displayLabel}).`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- No brand names. No prices. No medical or skin-treatment claims.
- Mark the best foundation shade with a thicker border, not a circle overlay.
- Center portrait reads as the same person from Image 1; do not over-retouch skin.
- Do NOT copy text content (shade names, undertone label, recommendations) from the layout reference. Compose all of it for this specific user.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Center portrait must read as the same person from the user's portrait(s).",
          `Undertone printed in the bottom card is exactly: ${portrait.undertone.displayLabel.toUpperCase()}.`,
          `Foundation depth scale is anchored at ${portrait.depth.value}; the marked best shade matches this depth.`,
          "All swatch labels are 1-2 words; numeric labels (1.0-5.0) appear only on the foundation row."
        ])
      ]);
    }
  },
  {
    title: "Nail Color Guide",
    description: "Twelve nail color options shown on the user's hand, with three best picks marked.",
    reference: "hand",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles("Nail Color Guide", {
          primaryReference: "the user's primary portrait",
          primaryUse:
            "Use it only for color harmony, undertone, and visible presentation. Do not render the face in the nail tiles.",
          intermediateReferences:
            "Any images after Image 1 and before the LAST image include optional additional portrait angles followed by the user's HAND PHOTO. The user image immediately before the LAST image is the hand reference: use it as the HAND, NAIL SHAPE, SKIN TONE, and POSE reference for every hand rendered in the output.",
          separationRule:
            "do NOT copy the hand, nail shape, nail colors, skin tone, or pose from the layout reference"
        }),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic nail color guide. Use the user's hand photo, immediately before the layout reference, as the hand identity reference for every tile. The LAYOUT REFERENCE shows the 4-column by 3-row tile arrangement, captions, and best-match badges.",
        `Use these analysis values exactly. Do not re-derive them:
- Undertone: ${portrait.undertone.displayLabel}
- Depth: ${portrait.depth.value}
- Season: ${portrait.colorSeason.value}`,
        `Reference palette colors. Use these to inform 3 of the 12 nail picks (the ones that match the user's undertone most closely):
- Signature colors: ${swatchList(portrait.palette.signatureColors)}
- Accent colors: ${swatchList(portrait.palette.accentColors)}`,
        `LAYOUT (follow the LAYOUT REFERENCE):
- Top band: extra-large bold serif heading "NAIL COLOR GUIDE" with small-caps eyebrow "FIND YOUR PERFECT SHADE" and a small decorative divider below.
	- Main grid: 12 tiles in a 4-column by 3-row layout. Each tile shows a close-up photograph of the SAME hand from the hand photo with all visible nails painted in that tile's polish color. Same fingers, same skin tone, same hand position across all 12 tiles; only the nail color changes.
- Below each tile (centered):
  - A number "1." through "12."
  - The polish color name in 1-3 words (compose dynamically; do NOT copy from the layout reference)
  - A small rounded-pill use-case tag in 1-2 words: "classic", "everyday", "office", "bold", "evening", "date night", or "special"
- Color selection (12 total, model picks):
  - Pick 12 distinct nail polish colors that show real range across categories: classic red, dusty/soft rose, deep burgundy or wine, nude or peachy pink, warm terracotta or cognac, bright coral or orange, forest green or jewel-tone green, navy or jewel-tone blue, mauve or muted purple, chocolate brown, clear gloss, and french manicure.
  - At least 3 of the 12 must be picks that genuinely flatter ${portrait.undertone.displayLabel} undertone and the season "${portrait.colorSeason.value}". Mark each of those 3 best picks with a subtle thin ring outlining the entire tile (NOT a circle overlay on the nails themselves) and a small star icon in the corner.
  - The remaining 9 are part of the broader range; do not mark them.`,
        `IDENTITY ANCHOR (hard requirement across all 12 tiles):
- Same hand in every tile, drawn from the hand photo. Same fingers visible, same skin tone, same hand pose, same nail shape, same nail length.
- Each hand has exactly five fingers; nails are clean and even on every hand shown.
- Only the polish color changes between tiles.
- Lighting and background are consistent across tiles.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- No brand names. No fake product codes. No prices.
- Hands have exactly five fingers in every tile.
- Best-pick badge is a thin tile outline ring + corner star, not a circle overlay on the nails.
- Do NOT copy nail color names or use-case tags from the layout reference; compose them for this user.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Same hand from the hand photo across all 12 tiles. Same fingers, same skin tone, same pose.",
          "Five fingers per hand in every tile, no extra or missing digits.",
          "Exactly 3 of the 12 tiles are marked as best picks via tile-outline ring + corner star.",
          `Best picks are chosen because they flatter ${portrait.undertone.displayLabel} undertone and ${portrait.colorSeason.value}.`
        ])
      ]);
    }
  },
  {
    title: "Accessory & Jewelry Metals Guide",
    description: "Compare four metals on the same portrait and recommend accessories in the best metal.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const metalOrder = ["Gold", "Silver", "Rose Gold", "Brass/Bronze"] as const;
      const verdictLines = metalOrder
        .map((metal) => `- ${metal}: ${portrait.metalVerdicts[metal]}`)
        .join("\n");

      return compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic accessory and jewelry metals guide, using the user's portrait(s) for identity and the written layout instructions for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Undertone: ${portrait.undertone.displayLabel}
- Contrast: ${portrait.contrast.value}
- Best metal: ${portrait.bestMetal.value}`,
        `Metal verdicts (data values; use them to choose each visible badge):
${verdictLines}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band: extra-large bold serif heading "ACCESSORY & JEWELRY METALS GUIDE" with a small italic tagline below: "Find the metals that flatter you most".
- Main row: 4 photorealistic portrait tiles in a 4-column by 1-row arrangement. Each tile shows the SAME person from Image 1, head-and-shoulders, wearing visible earrings and a delicate pendant necklace in that tile's metal tone. Plain neutral cream background, soft warm lighting, neutral expression. Only the metal of the jewelry changes between tiles.
- Tile order left to right: Gold, Silver, Rose Gold, Brass/Bronze.
- Below each tile, on the cream background:
  - A horizontal colored band rendering the metal's actual surface tone (warm yellow gold / cool silver / soft pink rose gold / warm muted brass-bronze) with the metal name in bold caps centered on the band.
  - A small badge row beneath the band:
    - For "Best" verdict: a small gold star icon + "YOUR BEST METAL" in small caps
    - For "Strong" verdict: a small green check icon + "STRONG" in small caps
    - For "Good" verdict: a small grey filled circle + "GOOD" in small caps
    - For "Skip" verdict: a small grey "skip" dot + "SKIP" in small caps
  - A 1-line reason in 11px sans-serif, composed dynamically for this metal and this user, grounded in ${portrait.undertone.displayLabel} undertone and ${portrait.contrast.value} contrast. Examples of reason shape (do not copy verbatim): "Warms your complexion", "Cools your complexion", "Less harmonious with your undertone", "Competes with your undertone".

- Bottom card "RECOMMENDED ACCESSORIES IN YOUR BEST METAL: ${portrait.bestMetal.value.toUpperCase()}" (rounded soft-shadow card on slightly lighter cream, full width, about 30% canvas height):
  - Heading in small-caps tracked across the top.
  - Below the heading: 5 photorealistic product cutouts arranged horizontally, each on a clean cream background with no model, no scene. The 5 items: a wristwatch, a pair of earrings, a pendant necklace, a chain bracelet, and a ring. Every item is rendered in the ${portrait.bestMetal.value} metal tone.
  - Below each cutout, centered, in small-caps tracked: "WATCH", "EARRINGS", "NECKLACE", "BRACELET", "RING".`,
        `IDENTITY ANCHOR (hard requirement across all 4 portrait tiles):
- Same person in every tile, drawn from Image 1. Same eyes, brows, nose, mouth, skin tone, freckles or moles, ethnic features, age.
- Same head-and-shoulders crop, same camera angle, same neutral expression with closed-mouth or slight smile.
- Same neutral top across all four tiles (a simple dark crewneck or scoop neck so the necklace is visible).
- Same soft warm lighting and same plain cream background across tiles.
- The only variable across the four portrait tiles is the metal of the jewelry.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
	- Visible badge labels under each metal MUST follow the badge system above: Best displays "YOUR BEST METAL"; Strong displays "STRONG"; Good displays "GOOD"; Skip displays "SKIP".
- Best metal hardware row uses ${portrait.bestMetal.value} consistently for all 5 product cutouts.
- Preserve facial identity, proportions, and skin texture. Do not over-retouch skin.
- Do NOT copy text content (verdict labels, reason copy, accessory captions) from the layout reference. Compose all of it for this specific user.
- No brand names, no prices, no fake product codes.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Same person across all 4 portrait tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features.",
          "Identical head-and-shoulders crop, neutral top, neutral expression, plain cream background, soft warm lighting.",
          `Metal data verdicts are represented visibly as: Gold=${portrait.metalVerdicts.Gold}, Silver=${portrait.metalVerdicts.Silver}, Rose Gold=${portrait.metalVerdicts["Rose Gold"]}, Brass/Bronze=${portrait.metalVerdicts["Brass/Bronze"]}. Best verdict displays "YOUR BEST METAL".`,
          `Bottom card heading is exactly: "RECOMMENDED ACCESSORIES IN YOUR BEST METAL: ${portrait.bestMetal.value.toUpperCase()}".`,
          `All 5 accessories in the bottom card are rendered in the ${portrait.bestMetal.value} metal tone.`
        ])
      ]);
    }
  },
  {
    title: "Eyeglasses / Frames Guide",
    description: "Eight frame styles shown on the same person, with one best match marked.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) =>
      compose([
        imageRoles(null),
        personLock(portrait),
        "Generate a 1024x1536 photorealistic eyeglasses frame recommendation board, using the user's portrait(s) for identity and the written layout instructions for structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (small): optional small-caps eyebrow line, no large heading needed.
- Main grid: 8 photorealistic portrait tiles in a 4-column by 2-row arrangement. Each tile shows the SAME person from Image 1, head-and-shoulders, wearing different eyeglasses. Plain neutral background, soft warm lighting, neutral expression. Only the frames change between tiles.
- Tile composition: pick 8 distinct frame archetypes that span shape, thickness, material, and color. Cover all of: round / circular, aviator, cat-eye, rectangular minimal, oversized square, clear or transparent acetate, wire or rimless, and one bold-colored acetate. Choose specific styles within those archetypes that work well for ${portrait.faceShape.value} where possible.
- Below each tile, on the cream background:
  - Line 1: frame name in 2-5 words (compose dynamically; do NOT copy from the layout reference)
  - Line 2: "Best for: [face shapes]" line in 11px sans-serif. List 2-4 face shapes this frame archetype flatters. If ${portrait.faceShape.value} is among them, the frame is a strong option for this user; otherwise it's a use-carefully pick.
  - Line 3: a small badge row:
    - For exactly ONE tile (the best overall match for ${portrait.faceShape.value}, ${portrait.contrast.value} contrast, and ${portrait.undertone.displayLabel}): a small gold star icon + "Your best match" in small caps
    - For tiles whose "Best for" list includes ${portrait.faceShape.value}: a small green check icon + "Strong option" in small caps
    - For tiles whose "Best for" list does NOT include ${portrait.faceShape.value}: a small grey "skip" dot + "Use Carefully" in small caps
- Frame colors should harmonize with ${portrait.undertone.displayLabel} where the frame is colored (warm tortoise for warm undertones, cool grey/black for cool undertones, etc.).`,
        `IDENTITY ANCHOR (hard requirement across all 8 tiles):
- Same person in every tile, drawn from Image 1 (and additional portrait angles if provided). Same eyes, brows, nose, mouth, skin tone, ethnic features, age.
- Same head-and-shoulders crop, same camera angle, same neutral expression.
- Same neutral top, same plain cream background, same soft warm lighting across all 8 tiles.
- Eye visibility: the eyes are clearly visible behind the frames in every tile (no opaque lenses, no extreme tint).
- The only variable across the 8 tiles is the eyeglasses frame.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Frame names 2 to 5 words; "Best for" lines under 12 words; badge labels exactly as specified above.
- Never use "Avoid", "Bad", "Ugly", or red Xs. Use "Use Carefully" or "Skip" with a grey dot.
- Exactly ONE tile is marked "Your best match" with a gold star.
- Do NOT copy frame names or "Best for" lists from the layout reference. Compose all of it for this user.
- Preserve eye visibility, facial identity, and skin texture.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Same person across all 8 tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features.",
          "Identical head-and-shoulders crop, neutral expression, plain background, soft warm lighting.",
          "Eyes are clearly visible in every tile.",
          `Exactly ONE tile is marked "Your best match" — choose the frame archetype that best flatters ${portrait.faceShape.value} face shape and ${portrait.contrast.value} contrast.`,
          "Frame archetypes covered: round, aviator, cat-eye, rectangular minimal, oversized square, clear acetate, wire/rimless, bold colored acetate."
        ])
      ])
  },
  {
    title: "Body Shape Guide",
    description: "Body shape, best features, and four flattering silhouette examples.",
    reference: "body",
    requires: { portrait: true, body: true },
    buildPrompt: ({ portrait, body }) => {
      if (!body) {
        return "Body analysis missing. Cannot generate Body Shape Guide.";
      }
      const hedged = body.bodyShape.confidence === "high"
        ? body.bodyShape.value
        : `${body.bodyShape.value} (most likely)`;

      return compose([
        imageRoles(null, {
          primaryReference: "the user's primary portrait",
          primaryUse:
            "Use it as the FACE IDENTITY, visible presentation, hair, skin tone, and styling anchor.",
          intermediateReferences:
            "Any images after Image 1 include optional additional portrait angles followed by the user's FULL-BODY STANDING PHOTO. Use the final user image as the BODY PROPORTIONS, FULL-BODY SILHOUETTE, and STANDING POSE reference.",
          separationRule:
            "do NOT copy the body, outfit, pose, measurements, or person from the layout reference"
        }),
        personLock(portrait),
        "Generate a 1024x1536 body shape guide using the written layout instructions for structure. Image 1 is the user's face identity reference; the final user image is the full-body standing photo for body proportions.",
        `Use these analysis values exactly. Do not re-derive them:
- Body shape: ${hedged}
- Shoulder/hip balance: ${body.shoulderHipBalance}
- Waist: ${body.waistDefinition}
- Torso/leg balance: ${body.torsoLegBalance}
- Best features: ${body.bestFeatures.join(", ")}
- Silhouette rules: ${body.silhouetteRules.join(", ")}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band: small-caps eyebrow "BODY SHAPE GUIDE" + a thin divider.
- Left region (about 35% width): a full-body photorealistic render using the user's face identity from Image 1 and body proportions from the full-body photo, standing, plain neutral background. Below the figure, a small text block with:
  - "Body Shape: ${body.bodyShape.value}"
  - "Best Features: ${body.bestFeatures.slice(0, 3).join(", ")}"
  - A small monoline body-silhouette diagram icon shaped to suggest a ${body.bodyShape.value} silhouette.
- Right region (about 65% width): 4 flattering silhouette examples in a horizontal row. Each example is a stylized full-body fashion figure (line-art or simple flat illustration, not a photo) wearing an outfit that follows the silhouette rules above for ${body.bodyShape.value}. Derive the garment categories from the user's visible presentation and uploaded references. Do not default to dresses, skirts, suits, heels, or any fixed gendered archetype unless the uploaded references support that direction.
- Bottom band (about 12% canvas height): a horizontal row of 4 small green-check icons + 1-line principles each, derived from the silhouette rules above. Compose each principle dynamically (examples of shape: "Define waist", "Fitted top", "Flared or straight bottom", "Balanced proportions"). Keep each under 6 words.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Supportive language only. No weight claims, no body criticism, no numeric body measurements.
- Body silhouette badge text must read exactly: "${body.bodyShape.value}".
- Right-region silhouette examples are stylized illustrations, not photos.
- Do NOT copy text content (body shape label, principles, best features) from the layout reference. Compose all of it for this user.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Body shape printed in the left region is exactly: ${body.bodyShape.value}.`,
          "Left-region figure preserves face identity from Image 1 and body proportions from the full-body photo.",
          "All silhouette examples follow the silhouette rules listed above.",
          "Bottom-band principles are 4 short lines composed from the silhouette rules; under 6 words each."
        ])
      ]);
    }
  },
  {
    title: "Outfit Style Guide",
    description: "Five full-body outfits tailored to the body shape and seasonal palette.",
    reference: "body",
    requires: { portrait: true, body: true },
    buildPrompt: ({ portrait, body, outfitStyleMode = "identity-preserving" }) => {
      if (!body) {
        return "Body analysis missing. Cannot generate Outfit Style Guide.";
      }
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");
      const outfitGuidance = outfitPresentationGuidance(portrait);
      const isIdentityPreserving = outfitStyleMode === "identity-preserving";

      return compose([
        imageRoles(null, {
          primaryReference: "the user's primary portrait",
          primaryUse:
            isIdentityPreserving
              ? "Use it as the FACE IDENTITY, visible presentation, hair, skin tone, hair shape, expression family, and styling anchor for every photorealistic outfit portrait."
              : "Use it as the FACE IDENTITY, visible presentation, hair, skin tone, and styling anchor for the small portrait inset only.",
          intermediateReferences:
            isIdentityPreserving
              ? "Any images after Image 1 include optional additional portrait angles followed by the user's FULL-BODY PHOTO. Use additional portraits to stabilize face identity. Use the final user image as the BODY PROPORTIONS, FULL-BODY SILHOUETTE, posture, and scale reference for every full-body outfit portrait."
              : "Any images after Image 1 include optional additional portrait angles followed by the user's FULL-BODY PHOTO. Use the final user image only for body proportions and silhouette rules, not as a face source.",
          separationRule:
            "do NOT copy the body, outfit, pose, measurements, or person from the layout reference"
        }),
        personLock(portrait),
        isIdentityPreserving
          ? "Generate a 1024x1536 photorealistic identity-preserving Outfit Style Guide. Show the same real person from the uploaded portrait wearing five different outfits. This mode prioritizes face identity and body proportion preservation over fashion-illustration polish."
          : "Generate a 1024x1536 outfit style guide using the written layout instructions for structure. This is a styling-board report: do NOT create photorealistic full-body portraits of the user. Use a small identity-preserved portrait inset plus outfit cutouts, flat lays, or faceless neutral mannequin silhouettes so the user's face and body are not distorted.",
        `Use these analysis values exactly. Do not re-derive them:
- Body shape: ${body.bodyShape.value}
- Silhouette rules: ${body.silhouetteRules.join(", ")}
- Season: ${portrait.colorSeason.value}
- Best metal (for jewelry/hardware): ${portrait.bestMetal.value}`,
        `Approved outfit colors. Every garment color must match one of these exact hex values:
- Best neutrals: ${swatchList(portrait.palette.bestNeutrals)}
- Signature colors: ${swatchList(portrait.palette.signatureColors)}
- Accent colors (use sparingly): ${swatchList(portrait.palette.accentColors)}
- Avoid (do NOT use): ${swatchList(portrait.palette.avoid)}`,
        outfitGuidance,
        isIdentityPreserving
          ? `LAYOUT (identity-preserving mode, build from these instructions, no layout reference image):
- Top band: small-caps eyebrow "OUTFIT STYLE" + title "Identity-Preserving Outfit Guide" + a thin divider below.
- Main region: 5 photorealistic full-body outfit portraits arranged in a single horizontal row of 5 columns. Each column shows the SAME person from Image 1, using body proportions from the full-body photo. The person has the same face, hair, skin tone, facial features, visible presentation, and natural body scale in every column. Only the outfit changes.
- Use the final user image only for body proportions and stance reference. Do not widen, slim, lengthen, shorten, or glamorize the body. Do not change the person's apparent weight.
- Outfit variety across the 5 columns, all derived from uploaded references, ${portrait.presentation.value} visible presentation, and silhouette rules: one casual everyday, one polished workwear, one elevated occasion look, one smart-casual layered look, and one weekend or evening look. Compose specific garments dynamically. Do NOT default to fixed fashion archetypes.
- Every garment color must use an exact hex from the approved swatches. Hardware (belts, buckles, jewelry) is rendered in ${portrait.bestMetal.value}.
- Below each column: a short outfit label in 1-3 words and one tiny color dot matching a key garment color.
- Bottom band: a horizontal "Key:" line with 5 short principles in 11px sans-serif, separated by small bullet dots. One principle per outfit, composed dynamically from the silhouette rules and season. Keep each under 5 words (examples of shape: "Defined waist", "Clean structure", "Rich colors", "Balanced proportions", "Best metal").`
          : `LAYOUT (styling-board mode, build from these instructions, no layout reference image):
- Top band: small-caps eyebrow "OUTFIT STYLE" + a thin divider below. Include a small rounded portrait inset from Image 1 at the left; preserve the user's face identity in this inset only.
- Main region: 5 outfit columns arranged in a single horizontal row. Each column shows one complete head-to-toe outfit as product cutouts, flat-lay garments, or a faceless neutral mannequin silhouette. Do NOT render the user's face in the outfit columns. Do NOT alter the user's body size. Use body analysis only to choose flattering silhouettes.
- Outfit variety across the 5 columns, all appropriate to ${portrait.presentation.value} presentation: one casual everyday, one polished workwear, one elevated occasion look, one smart-casual layered look, and one weekend or evening look. Compose specific outfits dynamically from the uploaded references and analysis values. Do NOT default to fashion archetypes from any generic reference.
- Every garment color must use an exact hex from the approved swatches. Hardware (belts, buckles, jewelry) is rendered in ${portrait.bestMetal.value}.
- Bottom band: a horizontal "Key:" line with 5 short principles in 11px sans-serif, separated by small bullet dots. One principle per outfit, composed dynamically from the silhouette rules and season. Keep each under 5 words (examples of shape: "Defined waist", "Clean structure", "Rich colors", "Balanced proportions", "Best metal").`,
        STYLE_BLOCK,
        isIdentityPreserving
          ? `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Identity preservation is mandatory: same face, same hair, same skin tone, same age, same visible presentation, same body proportions across all 5 outfit portraits.
- Do not exaggerate body size, weight, width, height, waist, chest, hips, or legs. No weight claims or body criticism.
- Do not make the person look like a generic model, influencer, celebrity, mannequin, or the layout-reference subject.
- Every garment color uses an exact hex from the approved swatches above. Never use an Avoid color.
- Hardware is consistently in ${portrait.bestMetal.value}.
- No brand names, no prices, no fake product codes.
- Compose outfits from the user's visible presentation, uploaded references, body analysis, and color analysis. Do not default to dresses, suits, skirts, heels, or any fixed fashion archetype.
- Do not mention that this is AI-generated.`
          : `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Outfit columns are product cutouts, flat lays, or faceless neutral mannequins. Do not render the user's face in the outfit columns.
- Do not exaggerate body size, weight, width, or proportions. No weight claims or body criticism.
- Every garment color uses an exact hex from the approved swatches above. Never use an Avoid color.
- Hardware is consistently in ${portrait.bestMetal.value}.
- No brand names, no prices, no fake product codes.
- Do NOT copy outfit ideas, color choices, or principle text from the layout reference. Compose them for this user.
- Do not mention that this is AI-generated.`,
        preserveRepeat(
          isIdentityPreserving
            ? [
                "Five full-body outfit portraits in a single row.",
                "Same person in every outfit portrait: face from Image 1, body proportions from the full-body photo.",
                "Do not alter or exaggerate the user's body size or shape.",
                "Every garment color matches one of the approved hex values; no Avoid colors anywhere.",
                "Hardware across the entire image is rendered in " + portrait.bestMetal.value + ".",
                "Bottom key line has exactly 5 principles, one per outfit, under 5 words each."
              ]
            : [
                "Five outfit columns in a single row.",
                "Outfit columns do not render the user's face; only the small portrait inset uses Image 1 identity.",
                "Every garment color matches one of the approved hex values; no Avoid colors anywhere.",
                "Hardware across the entire image is rendered in " + portrait.bestMetal.value + ".",
                "Bottom key line has exactly 5 principles, one per outfit, under 5 words each."
              ]
        )
      ]);
    }
  },
  {
    title: "Makeup Feature Guide",
    description: "Four feature close-ups (brow, eye, blush, lip) with shade swatches and recommendations.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles(null),
        personLock(portrait),
        portrait.presentation.value === "Masculine"
          ? "Generate a 1024x1536 GROOMING FEATURE GUIDE using the written layout instructions for the 4-column close-up structure. The four feature panels for a masculine-presenting user are: BROW (shaping + tone), BEARD/STUBBLE (if facial hair present, otherwise SKIN — care notes and complexion tone), LIP BALM (tinted balm tones, no full lipstick), and HAIR (texture and styling cues). Image 1 is the user's portrait; preserve facial hair exactly. Do NOT render eyeshadow, blush, full lipstick, or any glam makeup."
          : "Generate a 1024x1536 makeup feature guide using the written layout instructions for the 4-column close-up structure. Image 1 is the user's portrait; use it as the identity reference for the close-up crops.",
        `Use these analysis values exactly. Do not re-derive them:
- Depth: ${portrait.depth.value}
- Undertone: ${portrait.undertone.displayLabel}
- Hair color: ${portrait.hairColor}
- Eye color: ${portrait.eyeColor}`,
        `Reference palette colors. Use these to inform shade picks where they harmonize:
- Signature colors: ${swatchList(portrait.palette.signatureColors)}
- Accent colors: ${swatchList(portrait.palette.accentColors)}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band: small-caps eyebrow "MAKEUP GUIDE" centered, with a thin divider below.
- Main region: 4 feature panels arranged in a single horizontal row of 4 columns. The columns left to right: BROW, EYE, BLUSH, LIP.
- Each panel renders, top to bottom:
  1. A photorealistic close-up crop of that feature on the user (eyebrow region for BROW; eye + lash + lid for EYE; cheek/cheekbone area for BLUSH; closed-mouth lip area for LIP). Identity preserved from Image 1; soft warm lighting.
  2. Column header in small-caps tracked: "BROW" / "EYE" / "BLUSH" / "LIP".
  3. A row of 3 small color swatches centered, sized about 28px each. Each swatch's color is composed dynamically for that feature on this user, harmonizing with ${portrait.undertone.displayLabel} and pulling from the Signature/Accent palette where natural.
  4. Two short 1-2 word shade recommendation lines beneath the swatches, e.g. "Soft Brown / Warm Brown" for BROW, "Apricot Brown / Golden Brown" for EYE. Compose all 8 lines dynamically (2 per feature).
- Bottom band (about 12% canvas height): a single 1-line tip in serif italic centered, that ties the four features together for this user, grounded in ${portrait.depth.value} depth and ${portrait.undertone.displayLabel} undertone. Example shape (do not copy): "Glowy skin, warm tones, and fresh finishes enhance your natural radiance."`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Close-up crops preserve the user's facial features from Image 1; do not over-retouch.
- All shade names are 1-2 words; the bottom tip is 1 line under 14 words.
- No brand names, no procedures, no medical or skin-treatment claims.
- Do NOT copy shade names or the bottom tip from the layout reference. Compose them for this user.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Four columns: BROW / EYE / BLUSH / LIP, in that order, left to right.",
          "Each column has exactly 3 small swatches and 2 shade recommendation lines.",
          "Close-ups preserve the user's identity and skin texture from Image 1.",
          "Shade colors harmonize with " + portrait.undertone.displayLabel + " undertone."
        ])
      ]);
    }
  },
  {
    title: "Use Carefully Guide",
    description: "Six categories of colors and finishes to use carefully, with kind replacements.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const swatchList = (list: Swatch[]) =>
        list.map((s) => `${s.name} ${s.hex}`).join(", ");

      return compose([
        imageRoles("Use Carefully Guide"),
        personLock(portrait),
        "Generate a 1024x1536 \"Use Carefully\" style guide using the LAYOUT REFERENCE for the 6-section row structure.",
        `Use these analysis values exactly. Do not re-derive them:
- Depth: ${portrait.depth.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}
- Season: ${portrait.colorSeason.value}`,
        `Reference palette colors:
- Use Carefully (the user's avoid swatches, use these for the section examples): ${swatchList(portrait.palette.avoid)}
- Signature colors (use for replacement suggestions): ${swatchList(portrait.palette.signatureColors)}
- Accent colors (use for replacement suggestions): ${swatchList(portrait.palette.accentColors)}`,
        `LAYOUT (follow the LAYOUT REFERENCE):
- Top band: bold serif heading "USE CAREFULLY" centered, with a small italic subtitle below: "Colors and finishes to ease away from your face".
- Main region: 6 vertical sections arranged in a single horizontal row of 6 columns. Sections left to right: "Too Dark", "Too Cool", "Muted / Dusty", "Neon", "Overly Sharp", "Overly Glossy".
- Each section renders, top to bottom:
  1. Section title in small-caps tracked.
  2. Two adjacent square swatches (about 60x60 px each), side by side. For sections 1-4 (Too Dark, Too Cool, Muted/Dusty, Neon) use 2 colors from the user's Avoid swatches above that fit the section's category, OR if no exact match, render representative example colors. For sections 5-6 (Overly Sharp, Overly Glossy) render textural/material examples (a hard high-contrast B/W swatch for Sharp, a glossy mirror-finish swatch for Glossy).
  3. A 1-line replacement suggestion in 11px sans-serif, naming a Signature or Accent color from the user's palette that does the same job better. Example shape: "Try ${portrait.palette.signatureColors[0]?.name || "a signature warm"} instead."
- Bottom band (about 12% canvas height): a single concluding line in serif italic centered, written for this user and grounded in their depth + undertone. Example shape (do not copy): "Use colors and finishes carefully when they feel too heavy, cool-toned, or overpowering near your face."`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Section titles match exactly: "Too Dark", "Too Cool", "Muted / Dusty", "Neon", "Overly Sharp", "Overly Glossy".
- Use "Use Carefully" framing, never "Avoid", "Bad", or "Ugly" inside the visible report. Section titles and replacements must stay neutral.
- All replacement suggestions name colors from the user's Signature or Accent palette above.
- Do NOT copy section explanations or the bottom line from the layout reference. Compose them for this user.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Six section columns in this exact left-to-right order: Too Dark, Too Cool, Muted / Dusty, Neon, Overly Sharp, Overly Glossy.",
          "Each section has exactly 2 swatches and 1 replacement suggestion line.",
          "Replacement suggestions reference colors from the user's Signature or Accent palette.",
          "Bottom line is composed for this user, grounded in " + portrait.depth.value + " depth and " + portrait.undertone.displayLabel + " undertone."
        ])
      ]);
    }
  }
];

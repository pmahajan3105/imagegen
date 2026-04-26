import type { PortraitAnalysis, BodyAnalysis } from "./analysis";
import {
  BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT,
  IDENTITY_PRESERVE_FRAGMENT,
  outfitPresentationGuidance,
  presentationDirective,
  renderLockedDecisions,
  swatchList
} from "./promptFragments";
import { selectHairstyles } from "./hairstylePlanner";
import { selectFrames } from "./eyewearPlanner";
import { selectWardrobeCapsule } from "./wardrobePlanner";
import { selectJewelryPlan } from "./jewelryPlanner";
import { selectMakeupPlan } from "./makeupPlanner";
import type { OccasionId, SessionContext, UserProfileContext } from "./userContext";
import type { LockedPalette } from "./paletteTypes";
import { EYEWEAR_RULES } from "../data/eyewearLibrary";
import { OUTFIT_RULES } from "../data/outfitRules";
import { getSeason } from "../data/colorSystem";

export type ImageReference = "portrait" | "body";

export type PortraitStepInput = {
  portrait: PortraitAnalysis;
  body?: BodyAnalysis;
  userProfile?: UserProfileContext;
  lockedPalette?: LockedPalette;
  session?: SessionContext;
};

// Reorder paletteHypotheses so the user-locked hypothesis (if any) sits at index 0,
// keeping every step's `paletteHypotheses[0]` access correct under both lock states.
export function reorderForLock(
  portrait: PortraitAnalysis,
  lockedPalette: LockedPalette | null | undefined
): PortraitAnalysis {
  if (!lockedPalette) return portrait;
  const idx = portrait.paletteHypotheses.findIndex((h) => h.id === lockedPalette.hypothesisId);
  if (idx <= 0) return portrait;
  const reordered = [...portrait.paletteHypotheses];
  const [locked] = reordered.splice(idx, 1);
  reordered.unshift(locked);
  return { ...portrait, paletteHypotheses: reordered };
}

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
  const iq = portrait.imageQuality;
  // Threshold tuning: any single major signal (small face / poor lighting) hits 0.3,
  // multiple co-occurring issues stack toward 0.5+. We surface a soft warning at
  // ≥ 0.3 and a strong one at ≥ 0.5.
  const qualityNotice =
    iq.confidencePenalty >= 0.5
      ? `PHOTO QUALITY WARNING: confidence penalty ${iq.confidencePenalty.toFixed(2)} (faceSize=${iq.faceSize}, lighting=${iq.lighting}, eyesVisible=${iq.eyesVisible}, angle=${iq.portraitAngle}). The source photo is suboptimal for identity-preserving rendering. Render conservatively: prefer fewer, simpler tiles; do not invent micro-features (mole placement, ear shape, exact hairline) the photo doesn't clearly show; if a region (eyes, brows, jaw) is occluded, replicate the most-confident neighboring frame rather than guessing. Add a small italic note "Photo quality limited — consider a closer, evenly-lit front-facing photo for stronger identity preservation." somewhere in the bottom band.`
      : iq.confidencePenalty >= 0.3
        ? `PHOTO QUALITY NOTE: confidence penalty ${iq.confidencePenalty.toFixed(2)} (faceSize=${iq.faceSize}, lighting=${iq.lighting}, angle=${iq.portraitAngle}). Render conservatively on identity-sensitive details; do not invent features the photo doesn't clearly show.`
        : null;
  return [
    `PERSON LOCK (the user's identity is defined by these pre-computed values, regardless of which user image is in slot 1; for hand or body reports the face is not visible in the input but the identity below still applies):
- Visible presentation: ${portrait.presentation.value}.
- Facial hair: ${portrait.facialHair.value}. Render exactly this. Do not add facial hair if "None"; do not remove or change facial hair otherwise.
- Current hair: ${portrait.currentHair.length} length, ${portrait.currentHair.texture} texture${portrait.currentHair.notes ? ` (${portrait.currentHair.notes})` : ""}. Hair color: ${portrait.hairColor}.
- Eye color: ${portrait.eyeColor}. Skin tone, brow shape, jawline, age, and ethnic features come from the user's portrait analysis (the values are the source of truth even if the face is not visible in slot 1).
- Style guardrails (must be honored in every rendered region):
${guardrailLines}
- Do NOT feminize or masculinize the person to match the layout reference. The user appears ${presentationDirective(portrait.presentation.value)}.
- Hairstyles, clothing cuts, makeup level, accessories, and silhouettes must suit the user's visible presentation, not the layout reference's subject.`,
    qualityNotice
  ]
    .filter(Boolean)
    .join("\n\n");
}

function compose(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join("\n\n");
}

// TABLE OF CONTENTS — visible reports in display order.
// Search "STEP:" to jump to a step's definition; step order in this array
// drives the visible UI order.
//
//   1. Palette Direction Report
//   2. Face Balance Map
//   3. Best Hairstyles Board
//   4. Wardrobe Capsule Board
//   5. Palette Calibration
//   6. Makeup Shade Guide
//   7. Accessory & Jewelry Metals Guide
//   8. Eyeglasses / Frames Guide
//   9. Silhouette Balance Guide
//  10. Outfit Style Guide
//
// Retired-step tombstones (rationale only) live at the bottom of the array.
export const PORTRAIT_ANALYSIS_STEPS: PortraitAnalysisStep[] = [
  {
    // === STEP: Palette Direction Report ===
    title: "Palette Direction Report",
    description: "Locked palette direction with practical color rules, use-carefully exceptions, and 'also tested / why rejected' panel.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, lockedPalette }) => {
      const hypotheses = portrait.paletteHypotheses;
      const locked = hypotheses[0];
      const rejected = hypotheses.slice(1);

      const lockChipLabel = lockedPalette?.source === "user" ? "LOCKED BY YOU" : "MODEL-SUGGESTED";
      const lockSourceLine =
        lockedPalette?.source === "user"
          ? `user-locked (the user picked "${locked.name}" on the Palette Calibration page; lock the rest of the report to this direction)`
          : `model-suggested (no user lock yet; render with the top model hypothesis and frame language as a recommendation, not a confirmed identity)`;

      const bestNeutrals = locked.palette.bestNeutrals;
      const bestWhite = bestNeutrals[0];
      const bestDark = bestNeutrals[bestNeutrals.length - 1];
      const canonicalRules = locked.rules ?? [];

      // Pull rich research metadata that was ported but unused. Optional — falls
      // back to existing structure when traitNotes / descriptiveNotes are absent.
      const canonicalSeason = getSeason(locked.id);
      const traitNotes = canonicalSeason?.traitNotes;
      const descriptiveNotes = canonicalSeason?.descriptiveNotes ?? [];
      const sisterSeasons = canonicalSeason?.sisterSeasons ?? [];
      const seasonResearchBlock = traitNotes
        ? `Research notes for ${locked.name} (use for the Direction Story panel; do not copy verbatim, distill to one short sentence per axis):
- Undertone: ${traitNotes.undertone ?? "(unspecified)"}
- Depth: ${traitNotes.depth ?? "(unspecified)"}
- Chroma: ${traitNotes.chroma ?? "(unspecified)"}
- Contrast: ${traitNotes.contrast ?? "(unspecified)"}${
            descriptiveNotes.length
              ? `\n- Descriptive notes: ${descriptiveNotes.slice(0, 2).join(" / ")}`
              : ""
          }${
            sisterSeasons.length
              ? `\n- Sister seasons (palettes that flatter adjacent to this one): ${sisterSeasons.join(", ")}`
              : ""
          }`
        : null;

      const groomingCardLabel =
        portrait.presentation.value === "Masculine" ? "GROOMING TONICS" : "MAKEUP DIRECTION";
      const groomingCardCopy =
        portrait.presentation.value === "Masculine"
          ? "tinted balms, beard care tones, sunscreen tints"
          : "shade direction harmonizing with the locked palette";

      const rulesBlock = canonicalRules.length
        ? `Canonical rules for ${locked.name} (use these to compose the practical rule cards; do not invent new rules):\n- ${canonicalRules.join("\n- ")}`
        : "(canonical rules unavailable for this hypothesis; compose practical rules from the palette swatches directly)";

      const rejectedBlock = rejected.length
        ? `Also tested (rejected hypotheses for the "Also Tested / Why Rejected" panel):

${rejected
  .map(
    (h, i) =>
      `${i + 1}. ${h.name} — confidence ${h.confidence}
   Supporting signals (why the model considered it): ${h.supportingSignals.join(" / ") || "(none)"}
   Risk notes (why it was rejected in favor of ${locked.name}): ${h.riskNotes.join(" / ") || "(none)"}`
  )
  .join("\n\n")}`
        : "(no rejected hypotheses available)";

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "palette swatch groups",
        decisions: [
          { label: "Best Neutrals", details: `${bestNeutrals.length} canonical swatches` },
          {
            label: "Signature Colors",
            details: `${locked.palette.signatureColors.length} canonical swatches`
          },
          {
            label: "Accent Colors",
            details: `${locked.palette.accentColors.length} canonical swatches`
          },
          {
            label: "Use Carefully",
            details: `${locked.palette.useCarefully.length} canonical swatches, conditional`
          }
        ],
        doNotInventClause:
          "Render exactly these 4 swatch groups in the order given. Use ONLY the listed canonical hex values; do not approximate, blend, or add new swatches."
      });

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 Palette Direction Report — a personal color rule sheet for the locked palette direction. The page combines an identity hero band (the user's actual face) at the top with a swatch + rule infographic below. Identity is preserved on the hero portrait; the rest of the page is a structured infographic of swatches, practical rules, use-carefully callouts, a Direction Story panel, and 'also tested' rejected hypotheses.`,
        `Use these analysis values exactly. Do not re-derive them:
- Locked direction: ${locked.name} (id: ${locked.id})
- Lock source: ${lockSourceLine}
- Depth: ${portrait.depth.value}
- Contrast: ${portrait.contrast.value}
- Undertone: ${portrait.undertone.displayLabel}
- Best metal direction: ${portrait.bestMetal.value}
- Hair color (for the Hair Direction card): ${portrait.hairColor}
- Visible presentation (gates the grooming/makeup card framing): ${portrait.presentation.value}`,
        lockedFragment,
        `Locked palette swatches (canonical hex values from colorSystem.ts; render these EXACTLY):
- Best Neutrals (${bestNeutrals.length}): ${swatchList(bestNeutrals)}
- Signature Colors (${locked.palette.signatureColors.length}): ${swatchList(locked.palette.signatureColors)}
- Accent Colors (${locked.palette.accentColors.length}): ${swatchList(locked.palette.accentColors)}
- Use Carefully (${locked.palette.useCarefully.length}): ${swatchList(locked.palette.useCarefully)}

Best white candidate (lightest of best neutrals): ${bestWhite.name} ${bestWhite.hex}
Best dark candidate (darkest of best neutrals): ${bestDark.name} ${bestDark.hex}`,
        rulesBlock,
        seasonResearchBlock,
        rejectedBlock,
        `LAYOUT (build from these instructions, no layout reference image):
- Hero band (~14% canvas height): a small head-and-shoulders portrait of the user (identity-preserved from Image 1, neutral expression, even lighting) sits at the LEFT, occupying about 1/3 of this band's width with a soft rounded mat. To the RIGHT of the portrait: small-caps eyebrow "PALETTE DIRECTION REPORT" on top, then large bold serif "Direction: ${locked.name}", then a small monospace small-caps chip "${lockChipLabel}". The hero band is the only place the user's face appears; the rest of the page is swatches and rule cards. Thin horizontal divider below.
- Color identity row (~5%): three vertical columns separated by thin dividers — "DEPTH" / "CONTRAST" / "UNDERTONE" with this user's exact values beneath each label.
- Palette display section (~22%): three labeled rows of color circles, generous spacing, soft drop-shadow on each circle.
  - Row 1: small-caps label "BEST NEUTRALS", then the ${bestNeutrals.length} circles in canonical order (light to dark), each labeled below with its swatch name in tiny small-caps.
  - Row 2: small-caps label "SIGNATURE COLORS", all signature swatch circles + names below.
  - Row 3: small-caps label "ACCENT COLORS", all accent swatch circles + names below.
- Direction Story panel (~9%): small-caps heading "DIRECTION STORY". Two short lines, distilled from the research notes above (one short sentence each on undertone/chroma and on depth/contrast). If sister seasons are listed in the research, add a tiny ITALIC line at the bottom of this panel: "Sister palettes: <comma-joined sister names>".
- Practical rules grid (~22%): 3 columns × 2 rows = 6 rounded soft-shadow cards on slightly lighter cream. Order top-left to bottom-right:
  - Top-left: "BEST WHITE" — circle in ${bestWhite.hex}, swatch name "${bestWhite.name}", one short rule line about how this user wears white-substitute.
  - Top-middle: "BEST DARK" — circle in ${bestDark.hex}, swatch name "${bestDark.name}", one short rule line about how this user wears dark-substitute.
  - Top-right: "DENIM" — short rule line composed from canonical rules; no specific swatch mandatory (denim is a wash direction, not one hex).
  - Bottom-left: "METALS" — best metal "${portrait.bestMetal.value}" prominent, one short rule line about finishes/mixing drawn from canonical rules.
  - Bottom-middle: "HAIR DIRECTION" — short rule line about hair-color tones that harmonize with this palette (current hair "${portrait.hairColor}" as the anchor).
  - Bottom-right: "${groomingCardLabel}" — short rule line about ${groomingCardCopy}.
- Use Carefully section (~10%): small-caps heading "USE CAREFULLY (CONDITIONAL)". Row of ${locked.palette.useCarefully.length} circles using exact useCarefully hex values, each labeled below with its swatch name in tiny small-caps. Above the row, one short note: "These work in narrow contexts (specific fabric, intensity, or season-of-year) — never forbidden, always conditional."
- Also Tested / Why Rejected section (~12%): small-caps heading. ${rejected.length} card${rejected.length === 1 ? "" : "s"} (one per rejected hypothesis). Each card shows hypothesis name + confidence chip, then one supporting signal (why model considered), then one risk note (why ultimately rejected). Use neutral language ("did not draw light as evenly", not "wrong" or "bad").
- Bottom band (~6%): single italic concluding line: "Use Carefully is conditional. Rejected hypotheses are alternatives the model considered, not wrong choices."`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- The user's face appears EXACTLY ONCE — in the hero band at the top. Do not render the face inside swatch circles, rule cards, the Direction Story, the Use Carefully section, the Why Rejected cards, or anywhere else. Do not render hands or body anywhere on the page.
- Every rendered color (circle, dot, card swatch) uses an EXACT hex from the locked palette swatch list above. Do not approximate, mix, or introduce new colors.
- No certainty language. Use "Direction: ${locked.name}", "Locked direction", "Model-suggested" — never "You are X" or "Your season is X".
- The "Use Carefully" section MUST NOT use words like "Avoid", "Bad", "Wrong", or "Skip". Frame as conditional only.
- The "Why Rejected" cards MUST NOT call rejected hypotheses wrong; describe them as alternatives that did not draw light as evenly or had risk notes.
- The Direction Story panel uses ONLY the research notes provided; do not invent new color theory claims.
- No watermarks, signatures, brand logos, or fake product codes.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Hero band shows the user's identity-preserved face exactly once at the top of the page.`,
          `Locked direction headline reads exactly: "Direction: ${locked.name}"`,
          `Practical rules grid renders exactly 6 cards in 3-col × 2-row order: BEST WHITE / BEST DARK / DENIM / METALS / HAIR DIRECTION / ${groomingCardLabel}.`,
          `Best metal card prominently shows: ${portrait.bestMetal.value}.`,
          `Use Carefully section uses the exact ${locked.palette.useCarefully.length} canonical swatches; conditional language only, never "avoid".`,
          `Also Tested section shows ${rejected.length} rejected hypothesis card${rejected.length === 1 ? "" : "s"} in neutral language.`,
          `Direction Story panel summarizes the research notes for ${locked.name} in two short sentences, not a copy.`
        ])
      ]);
    }
  },
  {
    // === STEP: Face Balance Map ===
    title: "Face Balance Map",
    description: "Annotated portrait with canonical balancing principles for necklines, earrings, frames, and haircut direction. Identity-preserved hero photo + qualitative observations only (no fake measurements).",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const canonical = portrait.canonicalFaceShape;

      const observationsBlock = `Per-photo observations (for the on-photo callouts; render each as a small label with the observation text — no numeric values):
- Forehead: ${portrait.faceShape.forehead}
- Cheekbones: ${portrait.faceShape.cheekbones}
- Jawline: ${portrait.faceShape.jawline}
- Chin: ${portrait.faceShape.chin}`;

      const stylingCardsBlock = canonical
        ? `Render exactly these 4 styling principle cards in the principles grid. Use the canonical content provided; paraphrasing for legibility is fine, but do not invent new categories or merge cards.

CARD 1 — NECKLINES
- Best: ${canonical.necklines.best.join(", ")}
- Use Carefully: ${canonical.necklines.useCarefully.join(", ")}

CARD 2 — EARRINGS
- Best: ${canonical.earrings.best.join(", ")}
- Use Carefully: ${canonical.earrings.useCarefully.join(", ")}

CARD 3 — FRAMES (eyeglass shapes)
- Best: ${canonical.frames.best.join(", ")}
- Use Carefully: ${canonical.frames.useCarefully.join(", ")}

CARD 4 — HAIRCUT DIRECTION
- Best: ${canonical.haircut.best.join(", ")}
- Use Carefully: ${canonical.haircut.useCarefully.join(", ")}`
        : `Canonical face-shape principles unavailable for "${portrait.faceShape.value}". Render only the per-photo observation callouts; omit the principles grid and replace with a "principles unavailable — calibrate face shape" notice.`;

      const goalLine = canonical?.goal
        ? `Canonical goal for ${canonical.name}: "${canonical.goal}"`
        : "";

      const notesLine = canonical?.notes?.length
        ? `Canonical notes for ${canonical.name}: ${canonical.notes.join(" / ")}`
        : "";

      const lockedFragment = canonical
        ? renderLockedDecisions({
            itemNounPlural: "styling principle cards",
            decisions: [
              {
                label: "Necklines",
                details: `${canonical.necklines.best.length} flattering, ${canonical.necklines.useCarefully.length} conditional`
              },
              {
                label: "Earrings",
                details: `${canonical.earrings.best.length} flattering, ${canonical.earrings.useCarefully.length} conditional`
              },
              {
                label: "Frames",
                details: `${canonical.frames.best.length} flattering, ${canonical.frames.useCarefully.length} conditional`
              },
              {
                label: "Haircut Direction",
                details: `${canonical.haircut.best.length} flattering, ${canonical.haircut.useCarefully.length} conditional`
              }
            ],
            doNotInventClause:
              "Render exactly these 4 cards in the order given. Do not add a 5th card, merge cards, or invent new principles."
          })
        : "";

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 Face Balance Map. Identity-required mode: the user's face is the hero of the page, with subtle qualitative callouts and a styling-principles panel. The face shape name is a tag — the principles do the visible work. This is a styling map, not a biometric diagnosis.`,
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}${portrait.faceShape.confidence === "low" ? " (low confidence; the shape may also read as a neighboring category)" : ""}
- Hair color (preserve in render): ${portrait.hairColor}
- Eye color (preserve in render): ${portrait.eyeColor}
- Visible presentation: ${portrait.presentation.value}
- Facial hair (preserve exactly): ${portrait.facialHair.value}`,
        observationsBlock,
        goalLine,
        lockedFragment,
        stylingCardsBlock,
        notesLine,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~7% canvas height): small-caps eyebrow "FACE BALANCE MAP", thin horizontal divider below, small monospace small-caps chip "${portrait.faceShape.value.toUpperCase()}" right-aligned next to the eyebrow.
${canonical?.goal ? `- Goal line (~5%): centered single line in italic serif, exact text: "${canonical.goal}"` : ""}
- Hero region (~46% canvas height): a head-and-shoulders photorealistic portrait of the SAME person from Image 1, neutral cream background, soft warm studio lighting, neutral expression. Subtle thin warm-gray callout lines (1px, low opacity, ~30% black) emerge from each of the 4 facial regions to small text labels in the hero margins:
  - FOREHEAD label (top-left margin): tiny small-caps "FOREHEAD" + the per-photo observation in regular type below.
  - CHEEKBONES label (top-right margin): tiny small-caps "CHEEKBONES" + observation.
  - JAWLINE label (bottom-right margin): tiny small-caps "JAWLINE" + observation.
  - CHIN label (bottom-center, just under the figure): tiny small-caps "CHIN" + observation.
  - Callout lines do not cross the eyes, nose, or mouth and do not obscure the face. NO numeric measurements anywhere on the page.
- Principles grid (~30% canvas height): 4 rounded soft-shadow cards in a 2-column × 2-row grid on slightly lighter cream:
  - Top-left: NECKLINES
  - Top-right: EARRINGS
  - Bottom-left: FRAMES
  - Bottom-right: HAIRCUT DIRECTION
  - Each card has a small-caps heading, then two stacked sub-blocks: "BEST" (with comma-separated list) and "USE CAREFULLY" (with comma-separated list). Use the canonical content from the styling-cards block above.
${canonical?.notes?.length ? `- Notes band (~6%): one short italic line summarizing canonical notes (do not invent new content; paraphrase the canonical notes if needed for length).` : ""}
- Bottom band (~6%): single concluding line in italic: "Face balance is a starting point — fit, scale, and personal style refine it."`,
        tileAnchor("annotated portrait (single hero photo with subtle text callouts; only one face is rendered on the page)"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Identity-required mode: render exactly ONE photo of the user (the hero portrait). Do NOT render additional faces, try-on tiles, or comparison portraits.
- NO numeric measurements anywhere. No length-to-width ratios, no pixel widths, no centimeters, no millimeters, no degrees. The face shape is qualitative, not measured.
- Callout lines are subtle (1px, low-opacity warm gray). They label features without obscuring or distorting the face.
- The 4 styling principle cards must use the canonical content above; do not invent or merge categories.
- "Use Carefully" sub-blocks must NOT use words like "Avoid", "Bad", "Wrong", or "Skip"; frame as conditional.
- Preserve identity exactly: face structure, skin tone, eye color, hair color, hair length, facial hair, age. Apply the identity-preserve fragment above.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Exactly ONE hero portrait of the user; no additional faces, no try-on tiles, no comparison portraits.",
          `Face shape chip is exactly: ${portrait.faceShape.value.toUpperCase()}.`,
          "No numeric measurements, ratios, pixel widths, or centimeters anywhere on the page.",
          "The 4 principle cards (Necklines / Earrings / Frames / Haircut Direction) match the canonical content; no extras, no omissions, no merged categories.",
          "Callout lines do not cross the eyes, nose, or mouth and do not distort the face. Identity preserved exactly."
        ])
      ]);
    }
  },
  {
    // === STEP: Best Hairstyles Board ===
    title: "Best Hairstyles Board",
    description: "Four hairstyles selected from a 100-entry library, filtered for face shape, presentation, hair texture, and facial hair.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, userProfile }) => {
      const { selected, candidateCount, policyUsed } = selectHairstyles(portrait, userProfile);
      const N = selected.length;

      const decisions = selected.map((entry) => ({
        label: entry.name,
        details: entry.description
      }));

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "hairstyles",
        decisions,
        doNotInventClause:
          "Render exactly these hairstyles, in the order given. Do not invent, substitute, merge, or add other hairstyle variants."
      });

      const styleDetails = selected
        .map((entry, i) => {
          const lines = [
            `Hairstyle ${i + 1}: ${entry.name}`,
            `- Description: ${entry.description}`,
            `- Maintenance: ${entry.maintenance}`,
            `- Tone: ${entry.tone}`,
            `- Compatible face shapes: ${entry.faceShapes.join(", ")}`,
            `- Compatible textures: ${entry.hairTextures.join(", ")}`
          ];
          if (entry.notes) lines.push(`- Stylist notes: ${entry.notes}`);
          if (entry.disallowedIf) lines.push(`- Disallowed if: ${entry.disallowedIf}`);
          return lines.join("\n");
        })
        .join("\n\n");

      const planNote = `Planner: ${candidateCount} candidates passed the deterministic filter (face shape ${portrait.faceShape.value} ∩ presentation ${portrait.presentation.value} ∩ texture ${portrait.currentHair.texture} ∩ facial hair ${portrait.facialHair.value}${policyUsed.useLengthTolerance ? " ∩ length tolerance" : ""}${policyUsed.useMaintenance ? " ∩ maintenance" : ""}). Top ${N} selected by score.`;

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 photorealistic Best Hairstyles Board. The board shows the user with ${N} different hairstyles from a curated library, all pre-filtered as flattering for this user's face shape, presentation, hair texture, and facial-hair level.`,
        lockedFragment,
        `Per-hairstyle details (canonical data, do not modify):\n\n${styleDetails}`,
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}
- Presentation: ${portrait.presentation.value}
- Current hair: ${portrait.currentHair.length} length, ${portrait.currentHair.texture} texture
- Hair color (preserve exactly in every tile): ${portrait.hairColor}
- Facial hair (preserve exactly): ${portrait.facialHair.value}`,
        planNote,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~10% canvas height): small-caps title "BEST HAIRSTYLES FOR ${portrait.faceShape.value.toUpperCase()} FACE", thin horizontal divider below.
- Main region: ${N} photorealistic head-and-shoulders portrait tiles in a ${N === 4 ? "2-column by 2-row" : N === 3 ? "single row of 3" : N === 2 ? "single row of 2" : "single column"} grid. Each tile shows the SAME person from Image 1, neutral white or cream top, soft warm beige seamless background, soft warm studio lighting, neutral expression with slight closed-mouth smile. ONLY the hairstyle changes between tiles.
- Tile order matches the per-hairstyle details list above (top-left to bottom-right).
- Below each tile, on a thin label band:
  - Hairstyle name in bold small-caps, matching the canonical name exactly.
  - A small chip in the corner: maintenance level ("LOW MAINT" / "MED MAINT" / "HIGH MAINT") in tiny mono caps.
  - One short rationale line (under 14 words) explaining why this style flatters the user's face + presentation + current hair. Compose fresh per tile, grounded in the canonical description.`,
        tileAnchor("hairstyle (face is identical across tiles; only the hairstyle changes)"),
        STYLE_BLOCK,
        `Hard rules:
- "photorealistic" rendering. No illustration, painting, or stylized look.
- All text must be legible English. No gibberish, no warped letters.
- The ${N} hairstyles must match the listed canonical names exactly; do not invent variations or merge styles.
- No watermarks, signatures, brand logos, or fake product codes.
- No sunglasses, hats, scarves, or face-obscuring accessories on any tile.
- Do not change the person's facial structure, ethnicity, age, skin tone, or hair color.
- Preserve facial hair exactly as analyzed (${portrait.facialHair.value}). Every tile shows that exact facial-hair level.
- Hairstyle names: bold small-caps, matching the canonical name from the per-hairstyle details list.
- Captions: under 14 words, neutral supportive language.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Same person across all ${N} tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features, age.`,
          "Identical head-and-shoulders crop, same camera angle, same neutral expression in every tile.",
          "Identical neutral background and identical soft lighting across tiles — only the hairstyle changes.",
          `Hair color preserved exactly: ${portrait.hairColor}.`,
          `Facial hair preserved exactly: ${portrait.facialHair.value}.`,
          `Tile count: exactly ${N} hairstyles, matching the canonical names listed above.`
        ])
      ]);
    }
  },
  {
    // === STEP: Wardrobe Capsule Board ===
    title: "Wardrobe Capsule Board",
    description: "18-slot capsule from a 6-preset library, palette-resolved cutouts, no person — pre-filtered by user style preference and locked palette.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, userProfile }) => {
      const plan = selectWardrobeCapsule(portrait, userProfile);
      const { capsule, resolved, paletteName, presetUsed } = plan;

      const slotsByCat = {
        tops: resolved.filter((r) => r.category === "top"),
        bottoms: resolved.filter((r) => r.category === "bottom"),
        layers: resolved.filter((r) => r.category === "layer"),
        shoes: resolved.filter((r) => r.category === "shoes"),
        accessories: resolved.filter((r) => r.category === "accessory")
      };

      const slotDetails = resolved
        .map(
          (r, i) =>
            `Slot ${i + 1} — ${r.slot.slotId} (${r.category}): ${r.slot.type}
- Color: ${r.resolvedSwatch.name} ${r.resolvedSwatch.hex} (palette role: ${r.slot.paletteRole})
- Silhouette role: ${r.slot.silhouette}
- Intent: ${r.slot.intent}
- Formality: ${r.slot.formality}
- Runtime note: ${r.slot.runtimeNote}`
        )
        .join("\n\n");

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "wardrobe slots",
        decisions: resolved.map((r) => ({
          label: `${r.slot.slotId} · ${r.slot.type}`,
          details: `${r.resolvedSwatch.name} ${r.resolvedSwatch.hex}`
        })),
        doNotInventClause:
          "Render exactly these 18 slots in the order given, in the listed colors. Do not invent new garment types, swap categories, or change the resolved palette swatches."
      });

      const formulasBlock =
        capsule.outfitFormulas.length > 0
          ? `Outfit formulas (canonical, reference slot IDs above):\n- ${capsule.outfitFormulas.join("\n- ")}`
          : "";

      const substitutionBlock =
        capsule.substitutionRules.length > 0
          ? `Substitution rules (canonical):\n- ${capsule.substitutionRules.join("\n- ")}`
          : "";

      const outfitMathLine =
        capsule.outfitMath.length > 0 ? `Outfit math: ${capsule.outfitMath.join(" / ")}` : "";

      const climate = userProfile?.climate;
      const climateGuidanceMap: Record<string, string> = {
        tropical:
          "tropical climate — favor lightweight breathable fabrics (linen, light cotton, lightweight wool blends), shorter sleeves, and minimal layering; render heavy coats and chunky knits as lightweight equivalents (a linen overshirt instead of a wool overcoat) without changing slot IDs",
        temperate:
          "temperate climate — render canonical pieces as listed without seasonal substitution",
        cold:
          "cold climate — favor heavier fabrics (wool, brushed cotton, heavy denim), full-coverage hemlines and sleeves, and emphasize the layering pieces; render lightweight pieces as heavier-weight equivalents within the same garment type",
        variable:
          "variable climate — emphasize layerability; the LAYER slots are doing real work, not optional"
      };
      const climateLine = climate ? `\nClimate context: ${climateGuidanceMap[climate]}.` : "";
      const planNote = `Planner: capsule preset "${presetUsed}" selected from user style preferences (${(userProfile?.stylePreferences ?? []).join(", ") || "default"}). Locked palette "${paletteName}" used for swatch resolution; round-robin within each palette role to vary swatches across same-role slots.${climateLine}`;

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 Wardrobe Capsule Board. Hybrid mode: a small identity hero band at the top with the user's actual face, then a product-cutout infographic below. The user's face appears EXACTLY ONCE in the hero band; the 18 garment cutouts in the main grid are pure product cutouts (no model, no body, no mannequin, no hands or feet inside the cutouts).`,
        lockedFragment,
        `Per-slot details (canonical data, do not modify):

${slotDetails}`,
        `Capsule preset: ${capsule.name}
- Style preset ID: ${capsule.stylePreset}
- Lifestyle: ${capsule.lifestyle}
- Default formality: ${capsule.defaultFormality}
- Philosophy: ${capsule.philosophy}
- Capsule logic: ${capsule.capsuleLogic}
- Palette recipe: ${capsule.paletteRecipe}`,
        `Locked palette in use: ${paletteName} (${plan.paletteId})
- Visible presentation: ${portrait.presentation.value}
- Best metal direction (use for hardware on bags, belts, jewelry): ${portrait.bestMetal.value}`,
        formulasBlock,
        substitutionBlock,
        outfitMathLine,
        planNote,
        `LAYOUT (build from these instructions, no layout reference image):
- Hero band (~13% canvas height): a small head-and-shoulders portrait of the user (identity-preserved from Image 1, neutral expression, even lighting) sits at the LEFT with a soft rounded mat. To the RIGHT of the portrait: small-caps eyebrow "WARDROBE CAPSULE" on top, then the capsule chip "${capsule.name.toUpperCase()}" in monospace small-caps, then the philosophy line "${capsule.philosophy}" in italic serif at small size. Thin horizontal divider below the band.
- Locked-palette badge (~4%): small-caps "${paletteName.toUpperCase()}" + tiny text "locked palette" + a row of 4 hex dots (one per category that uses palette colors).
- Main grid (~55% canvas height): 5-column layout, one column per category in this order: TOPS (${slotsByCat.tops.length}), BOTTOMS (${slotsByCat.bottoms.length}), LAYERS (${slotsByCat.layers.length}), SHOES (${slotsByCat.shoes.length}), ACCESSORIES (${slotsByCat.accessories.length}).
  - Each column has a small-caps category header at the top.
  - Each column shows photorealistic product cutouts of the listed garments stacked vertically. Soft drop shadow under each cutout. Neutral cream background. The cutouts are products only — no model, no body, no mannequin, no hands or feet inside them.
  - Each cutout is rendered EXACTLY in the resolved hex listed in the per-slot details. Garment type is rendered in the slot's listed type description.
  - Below each cutout, a tiny three-line label: slot ID in small mono caps; garment type (1-3 words); resolved swatch name with the hex code in tiny mono.
  - Hardware on bags, belts, and any visible metal is rendered in ${portrait.bestMetal.value}.
- Outfit formulas card (~13% canvas height): rounded soft-shadow card with heading "OUTFIT FORMULAS" small-caps. List the canonical outfit formulas above; each formula references slot IDs (e.g. "${capsule.outfitFormulas[0] ?? ""}"). Render slot IDs in small mono caps.
- Outfit math footer (~5%): single italic line in tiny type with the canonical outfit-math text.
- Bottom band (~3%): single italic concluding line: "Render runtime — actual brand picks come at fitting time."`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- HYBRID MODE: the user's face appears EXACTLY ONCE — in the hero band at the top. The 18 product cutouts in the main grid contain no person, no model, no body part, no hand, no foot, no mannequin. Do not place a face inside any garment cutout or category column.
- Each cutout color uses the EXACT hex listed in the per-slot details. Do not approximate, mix, or substitute.
- Slot IDs labeled below each cutout match the per-slot details list.
- Garment types match the canonical descriptions; do not invent variants.
- Hardware metal tone across the page is exactly: ${portrait.bestMetal.value}.
- No brand names, no prices, no fake product codes or SKUs.
- Outfit formula card references slot IDs from the canonical list (e.g. "WP-T01 + WP-B01 + ..."), not generic descriptions.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Hero band shows the user's identity-preserved face exactly once at the top of the page.",
          "Main grid is product cutouts only — no person, no model, no body, no mannequin inside any cutout.",
          `Capsule chip in the top band reads exactly: ${capsule.name.toUpperCase()}.`,
          `Locked palette badge reads exactly: ${paletteName.toUpperCase()}.`,
          "Render exactly 18 product cutouts: 4 tops + 3 bottoms + 3 layers + 3 shoes + 5 accessories.",
          "Each cutout color matches the exact hex from the per-slot details; no improvisation.",
          `Hardware tone across the entire page is exactly: ${portrait.bestMetal.value}.`,
          "Slot IDs labeled below each cutout match the per-slot details list verbatim."
        ])
      ]);
    }
  },
  {
    // === STEP: Palette Calibration ===
    title: "Palette Calibration",
    description: "Drape-strip comparison of the top palette hypotheses for this person, before locking a season.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait }) => {
      const hypotheses = portrait.paletteHypotheses;
      const N = hypotheses.length;

      const hypothesisDetails = hypotheses
        .map((h, i) => {
          // Research-backed positioning fields (optional). Surfaced in the per-panel
          // "Why" line so the user understands the season's logic, not just the swatches.
          const canonicalH = getSeason(h.id);
          const positioningLines: string[] = [];
          if (canonicalH?.munsellPositioning) {
            positioningLines.push(`- Munsell positioning: ${canonicalH.munsellPositioning}`);
          }
          if (canonicalH?.skinTextureMetaphor) {
            positioningLines.push(`- Skin-texture metaphor: ${canonicalH.skinTextureMetaphor}`);
          }
          if (canonicalH?.confidenceNote) {
            positioningLines.push(`- Confidence caveat (canonical): ${canonicalH.confidenceNote}`);
          }
          return `Hypothesis ${i + 1}: ${h.name} (confidence: ${h.confidence})
- Drape colors for this panel (use exactly these hex values, no substitutions):
  - Best Neutrals: ${swatchList(h.palette.bestNeutrals)}
  - Signature Colors: ${swatchList(h.palette.signatureColors)}
  - Accent Colors: ${swatchList(h.palette.accentColors)}
- Supporting signals: ${h.supportingSignals.join("; ") || "(none)"}
- Risk notes: ${h.riskNotes.join("; ") || "(none)"}${
            positioningLines.length ? "\n" + positioningLines.join("\n") : ""
          }`;
        })
        .join("\n\n");

      const lockedDecisions = renderLockedDecisions({
        itemNounPlural: "palette hypotheses",
        decisions: hypotheses.map((h) => ({
          label: `${h.name} (${h.confidence} confidence)`,
          details: h.supportingSignals.slice(0, 2).join("; ") || undefined
        })),
        doNotInventClause:
          "Do not invent additional palette hypotheses, substitute season names, or alter the listed hex values. Render exactly these hypotheses, in the order given."
      });

      const panelHeightPct = Math.floor(80 / N);

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 photorealistic Palette Calibration board. The board compares the top ${N} palette hypotheses for this person as "drape strips" — each strip shows the user's face flanked by that hypothesis's palette so the viewer can compare which palette draws light to the face most evenly before locking a season.`,
        lockedDecisions,
        `Per-hypothesis details (canonical data, do not modify):

${hypothesisDetails}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~10% canvas height): small-caps eyebrow "PALETTE CALIBRATION", thin horizontal divider below.
- Main region: ${N} stacked horizontal panels, each ~${panelHeightPct}% of canvas height. Panels are ordered top-to-bottom matching the hypothesis order in the per-hypothesis details block above.
- Each panel contains:
  - Top of panel: the hypothesis name (medium serif) and a small confidence chip in small-caps ("HIGH", "MEDIUM", or "LOW").
  - Center of panel: a head-and-shoulders portrait of the SAME person from Image 1, occupying the middle horizontal third of the panel. Flanking the portrait, two vertical "drape" stripes:
    - LEFT stripe (~12% panel width): the hypothesis's Best Neutrals stacked top-to-bottom, one solid block per swatch, full-bleed against the panel edge.
    - RIGHT stripe (~12% panel width): the hypothesis's Signature Colors stacked top-to-bottom, one solid block per swatch, full-bleed against the panel edge.
  - Bottom of panel: a horizontal row of the hypothesis's Accent Colors (one solid square per accent, evenly spaced), each labeled below with its hex code in small monospace. Above the accent row, two stacked lines (composed from the hypothesis's canonical positioning fields when provided):
    - "Why: <one or two of this hypothesis's supporting signals, rephrased in plain language>".
    - Tiny italic positioning sub-line in mid-gray: distill the Munsell positioning or skin-texture metaphor into ONE short clause (e.g. "high value, moderate chroma" or "frosted-glass quality"). If neither is provided for this hypothesis, omit the sub-line entirely — do not invent.
  - If the hypothesis has a "Confidence caveat" in its details block, render it as a tiny RIGHT-aligned monospace small-caps badge in the panel's bottom-right corner (e.g. "TRAITS HIGH · HEX MEDIUM"). Otherwise omit.
- Bottom band (~6% canvas height): small italic note "Lock the hypothesis that draws light to your face most evenly."`,
        tileAnchor(
          "palette drape (face is identical across panels; only the surrounding palette changes)"
        ),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Every drape, neutral, signature, and accent color uses an exact hex from the per-hypothesis details. Do not invent, shift, or substitute hex values.
- Same person across all ${N} panels, drawn from Image 1. Same crop, same lighting, same neutral expression. The only thing that changes between panels is the surrounding palette drape.
- Render exactly ${N} panels, one per listed hypothesis, in the listed order. Do not add a "winner" tile, "vs" overlay, or extra comparison element.
- No red Xs, no "Avoid" / "Bad" / "Wrong" wording. The Calibration board is a comparison tool, not a judgment.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Same person across all ${N} panels. Same eyes, brows, nose, mouth, skin tone, ethnic features, age, hair color and length.`,
          "Identical head-and-shoulders crop, same camera angle, same neutral expression in every panel.",
          "Identical neutral background and identical soft lighting across panels — only the palette drape changes.",
          "Every drape, neutral, signature, and accent swatch matches an exact hex from its hypothesis's palette in the per-hypothesis details block above.",
          `Render exactly ${N} hypothesis panels — no more, no fewer.`
        ])
      ]);
    }
  },
  {
    // === STEP: Makeup Shade Guide ===
    title: "Makeup Shade Guide",
    description:
      "Presentation-gated shade direction. Feminine variant: 7 makeup sections (foundation/concealer/blush/eyeshadow/eyeliner-mascara/brow/lip). Masculine variant: 5 grooming sections (skin tonics/lip balm/beard care/eyebrow direction/complexion enhancers).",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, userProfile }) => {
      const plan = selectMakeupPlan(portrait, userProfile);
      const {
        variant,
        userUndertone,
        userDepth,
        userChroma,
        userContrast,
        makeupSelections,
        groomingSelections
      } = plan;

      const isGrooming = variant === "grooming";
      const reportTitle = isGrooming ? "Grooming & Shade Guide" : "Makeup Shade Guide";

      const sectionDecisions = isGrooming
        ? groomingSelections.map((sel) => ({
            label: sel.section.name,
            details: sel.section.goal
          }))
        : makeupSelections.map((sel) => ({
            label: sel.section.name,
            details: sel.section.goal
          }));

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: isGrooming ? "grooming sections" : "makeup sections",
        decisions: sectionDecisions,
        doNotInventClause:
          "Render exactly these sections in the order given. Do not add a section, merge sections, or invent new shade categories."
      });

      const makeupSectionDetails = makeupSelections
        .map((sel, i) => {
          const safe = sel.safeEntry?.guidance ?? "(no canonical safe-everyday match for this undertone × depth)";
          const statement = sel.statementEntry?.guidance ?? "(no canonical statement match)";
          const lines = [
            `Section ${i + 1}: ${sel.section.name} (id: ${sel.section.id})`,
            `- Goal: ${sel.section.goal}`,
            `- Safe everyday for ${userUndertone} × ${userDepth}: ${safe}`,
            `- Statement for ${userUndertone}: ${statement}`,
            `- Finish guidance: ${sel.section.finishGuidance.join(" / ")}`,
            `- Use carefully: ${sel.section.useCarefully.join(" / ")}`
          ];
          if (sel.section.glassesFrameInteraction?.length) {
            lines.push(
              `- Glasses / frame interaction: ${sel.section.glassesFrameInteraction.join(" / ")}`
            );
          }
          if (sel.section.hairColorCrossReference?.length) {
            lines.push(
              `- Hair-color cross-reference: ${sel.section.hairColorCrossReference.join(" / ")}`
            );
          }
          return lines.join("\n");
        })
        .join("\n\n");

      const groomingSectionDetails = groomingSelections
        .map((sel, i) => {
          const lines = [
            `Section ${i + 1}: ${sel.section.name} (id: ${sel.section.id})`,
            `- Goal: ${sel.section.goal}`
          ];
          if (sel.undertoneDirection) {
            lines.push(`- Direction for ${userUndertone}: ${sel.undertoneDirection}`);
          }
          if (sel.undertoneDepthEntry) {
            lines.push(
              `- Direction for ${userUndertone} × ${userDepth}: ${sel.undertoneDepthEntry.guidance}`
            );
          }
          if (!sel.undertoneDirection && !sel.undertoneDepthEntry) {
            lines.push(`- (no canonical direction match for this user)`);
          }
          if (sel.section.hairColorCrossReference?.length) {
            lines.push(
              `- Hair-color cross-reference: ${sel.section.hairColorCrossReference.join(" / ")}`
            );
          }
          lines.push(`- Use carefully: ${sel.section.useCarefully.join(" / ")}`);
          if (sel.section.notes.length) {
            lines.push(`- Notes: ${sel.section.notes.join(" / ")}`);
          }
          return lines.join("\n");
        })
        .join("\n\n");

      const sectionDetails = isGrooming ? groomingSectionDetails : makeupSectionDetails;
      const sectionCount = isGrooming ? groomingSelections.length : makeupSelections.length;
      const planNote = `Planner: variant "${variant}" (gated on presentation: ${portrait.presentation.value}${userProfile?.presentation ? `, user-stated: ${userProfile.presentation}` : ""}). User traits — undertone: ${userUndertone}, depth: ${userDepth}, chroma: ${userChroma}, contrast: ${userContrast}.`;

      // FEATURE CLOSE-UPS: 4 identity-preserved tiles that visualize the most
      // relevant sections on the user's face, with shade swatches alongside.
      type CloseUp = {
        label: string;
        region: string;
        sectionId: string;
        guidance: string;
        extraNote?: string;
        extraNoteLabel?: string;
      };

      const findMakeupSection = (id: string) =>
        makeupSelections.find((s) => s.section.id === id);
      const findGroomingSection = (id: string) =>
        groomingSelections.find((s) => s.section.id === id);

      let closeUps: CloseUp[];
      if (isGrooming) {
        const browSel = findGroomingSection("eyebrow-direction");
        const beardSel = findGroomingSection("beard-care");
        const skinTonicsSel = findGroomingSection("skin-tonics");
        const lipBalmSel = findGroomingSection("lip-balm");
        const complexionSel = findGroomingSection("complexion-enhancers");
        const hasBeard = portrait.facialHair.value !== "None";

        closeUps = [
          {
            label: "BROW",
            region:
              "eyebrow region close-up (brow + just below the brow line, eyes closed or relaxed)",
            sectionId: "eyebrow-direction",
            guidance:
              browSel?.undertoneDepthEntry?.guidance ??
              browSel?.undertoneDirection ??
              "(no canonical guidance match)",
            extraNoteLabel: "Hair color match",
            extraNote: browSel?.section.hairColorCrossReference?.[0]
          },
          hasBeard
            ? {
                label: "BEARD",
                region:
                  "jaw + chin close-up showing beard texture (no full face, just lower half)",
                sectionId: "beard-care",
                guidance:
                  beardSel?.undertoneDepthEntry?.guidance ??
                  "(no canonical beard-care match)"
              }
            : {
                label: "SKIN CARE",
                region:
                  "clean-shaven jaw + cheek close-up (lower half of face, no beard)",
                sectionId: "skin-tonics",
                guidance:
                  skinTonicsSel?.undertoneDirection ??
                  "(no canonical skin-tonic match)"
              },
          {
            label: "LIP BALM",
            region: "closed-mouth lip area close-up (lips at rest, no makeup)",
            sectionId: "lip-balm",
            guidance:
              lipBalmSel?.undertoneDirection ?? "(no canonical lip-balm match)"
          },
          {
            label: "COMPLEXION",
            region:
              "cheekbone area close-up (cheek + side of face, no full features)",
            sectionId: "complexion-enhancers",
            guidance:
              complexionSel?.undertoneDepthEntry?.guidance ??
              "(no canonical complexion-enhancer match)"
          }
        ];
      } else {
        const browSel = findMakeupSection("brow");
        const eyeSel = findMakeupSection("eyeshadow");
        const blushSel = findMakeupSection("blush");
        const lipSel = findMakeupSection("lip");
        closeUps = [
          {
            label: "BROW",
            region: "eyebrow region close-up (brow + just below the brow line)",
            sectionId: "brow",
            guidance:
              browSel?.safeEntry?.guidance ?? "(no canonical brow match)",
            extraNoteLabel: "Hair color match",
            extraNote: browSel?.section.hairColorCrossReference?.[0]
          },
          {
            label: "EYE",
            region: "eye + lash + lid close-up (eyes open, brow visible)",
            sectionId: "eyeshadow",
            guidance:
              eyeSel?.safeEntry?.guidance ?? "(no canonical eyeshadow match)",
            extraNoteLabel: "With glasses",
            extraNote: eyeSel?.section.glassesFrameInteraction?.[0]
          },
          {
            label: "BLUSH",
            region: "cheekbone close-up (cheek + side of face, no full lips)",
            sectionId: "blush",
            guidance:
              blushSel?.safeEntry?.guidance ?? "(no canonical blush match)"
          },
          {
            label: "LIP",
            region:
              "closed-mouth lip area close-up (lips at rest, neutral expression)",
            sectionId: "lip",
            guidance: lipSel?.safeEntry?.guidance ?? "(no canonical lip match)"
          }
        ];
      }

      const closeUpsBlock = `Feature close-ups (4 identity-preserved tiles in the row above the section grid; render exactly these 4 in this order, with the safe-everyday guidance driving 2–3 representative swatches per tile):

${closeUps
  .map((cu, i) => {
    const lines = [
      `Tile ${i + 1} — ${cu.label}: ${cu.region}`,
      `  Linked canonical section: ${cu.sectionId}`,
      `  Safe-everyday guidance for this user: ${cu.guidance}`
    ];
    if (cu.extraNote && cu.extraNoteLabel) {
      lines.push(`  ${cu.extraNoteLabel}: ${cu.extraNote}`);
    }
    return lines.join("\n");
  })
  .join("\n\n")}`;

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 ${reportTitle}. Hybrid mode: a top row of 4 identity-preserved feature close-ups (BROW / EYE / BLUSH / LIP for makeup; BROW / BEARD or SKIN CARE / LIP BALM / COMPLEXION for grooming), followed by a structured section grid of ${sectionCount} canonical ${isGrooming ? "grooming" : "makeup"} sections, and a tying summary line that ties the user's traits together. The page combines visual feature context with detailed canonical shade direction keyed to undertone × depth × chroma. Brand-agnostic and SKU-agnostic — shade families and ranges only, never invented foundation numbers or product names.`,
        lockedFragment,
        `Per-section canonical details (do not modify; paraphrase only for legibility):

${sectionDetails}`,
        closeUpsBlock,
        planNote,
        `Use these analysis values exactly:
- Visible presentation: ${portrait.presentation.value}
- Undertone (canonical): ${userUndertone}
- Depth (canonical): ${userDepth}
- Chroma (locked palette): ${userChroma}
- Contrast (canonical): ${userContrast}
- Hair color (preserve in render if any portrait inset): ${portrait.hairColor}
- Eye color: ${portrait.eyeColor}
- Facial hair (relevant for ${isGrooming ? "beard care" : "presentation"}): ${portrait.facialHair.value}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~7% canvas height): small-caps eyebrow "${reportTitle.toUpperCase()}", thin horizontal divider below. Right side: monospace small-caps chip showing "${userUndertone.toUpperCase()} · ${userDepth.toUpperCase()} · ${userChroma.toUpperCase()}". Tiny mono "VARIANT: ${variant.toUpperCase()}" line below the divider.
- FEATURE CLOSE-UPS row (~28% canvas height): 4 columns, one per close-up tile listed in the feature-close-ups block above. Each tile renders, top to bottom:
  1. Photorealistic close-up of the listed feature on the user (identity preserved exactly; same person from Image 1; soft warm studio lighting; neutral cream background; no over-retouch). The close-up is tightly cropped to JUST the listed region — not the full face.
  2. Tile label in small-caps tracked below the photo (e.g., "BROW", "EYE", "BLUSH", "LIP", "BEARD", "SKIN CARE", "LIP BALM", "COMPLEXION").
  3. A row of 2–3 small color swatches (~28px each) drawn from the canonical safe-everyday guidance for that tile's section. Render representative shades that match the descriptive guidance text.
  4. Two short shade-name lines (1–2 words each, drawn from the canonical guidance phrasing) below the swatches.
  5. Optional small tooltip line at the bottom of the tile: hair-color cross-reference (BROW tile) or glasses interaction (EYE tile, makeup variant only) — render in tiny mono caps if the canonical extra is present.
- Identity preservation across all 4 close-ups is critical: same person, same skin tone, same scale of feature crop, no glamming-up, no over-retouch.
- SECTION GRID (~50% canvas height): ${sectionCount} stacked sections in ${isGrooming ? "a 1-column" : "a 2-column"} layout (one section per ${isGrooming ? "row" : "card"}). Order matches the per-section details list above. Each section card has:
  - Small-caps heading with the section name.
  - Tiny mono "GOAL: <one-line goal>" under the heading.
  - "SAFE EVERYDAY" sub-block: a row of ${isGrooming ? "1–2" : "3–5"} swatch chips representing the canonical guidance for this user's traits. Each swatch is a small color disc with a 1–2 word descriptive label below (drawn from the canonical guidance text).
  - ${isGrooming ? "" : '"STATEMENT" sub-block: 1-2 swatch chips representing the canonical statement guidance.\n  - '}"FINISH" line: tiny mono caps stating the recommended finish from the section's finishGuidance.
  - "USE CAREFULLY" footer line: italic small caps, drawn from the canonical use-carefully list.
${isGrooming ? "" : "- Sections that have canonical glassesFrameInteraction guidance (Eyeshadow, Eyeliner & Mascara) include a small \"WITH GLASSES\" tooltip line.\n- Sections that have canonical hairColorCrossReference (Brow) include a tiny \"HAIR COLOR\" reference line."}
${isGrooming ? "- The Eyebrow Direction section includes a tiny \"HAIR COLOR\" reference line (canonical hairColorCrossReference).\n- Each section's \"NOTES\" line appears in italic at the bottom of the card." : ""}
- TYING SUMMARY (~6% canvas height): single italic line in serif type, centered, that ties the user's locked-palette traits into one stylistic statement. Compose dynamically grounded in undertone "${userUndertone}", depth "${userDepth}", chroma "${userChroma}", and contrast "${userContrast}". Example shape (do NOT copy verbatim): "Soft Autumn coloring at medium depth glows in muted warm peach and sage tones with satin finishes."
- Bottom band (~3% canvas height): single italic concluding line — for makeup variant: "Shade direction, not exact product matching. Brand pick happens at the counter." — for grooming variant: "Subtle direction, no full glam. Real products picked at fitting time."`,
        tileAnchor("feature crop (face is identical across all 4 close-up tiles; only the cropped region and the swatches alongside it change)"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- HYBRID MODE: the FEATURE CLOSE-UPS row at the top renders 4 identity-preserved feature crops of the user. The SECTION GRID below remains pure swatch + text — no person, no model, no full made-up face.
- Identity preservation across the 4 close-ups: same person from Image 1, same skin tone, same scale of feature crop, no over-retouch, no skin smoothing that changes apparent age.
- Close-up tiles are TIGHT CROPS of the listed region — not full faces. The user is recognizable across tiles by feature continuity, not by having the entire face rendered.
- ${isGrooming ? "GROOMING VARIANT: do NOT apply lipstick, eyeshadow, or full glam to any close-up. The LIP BALM tile shows tinted balm direction (subtle), the BROW tile shows brow grooming direction (no fill), the BEARD tile shows beard care tone (or clean skin if no beard), the COMPLEXION tile shows subtle skin tints — never full makeup." : "MAKEUP VARIANT: close-ups show the user with shade direction visible (subtle blush on the cheek tile, subtle eye shadow on the eye tile, etc.) but never heavy editorial makeup."}
- NO brand names, NO product SKUs, NO exact foundation numbers (e.g., do not invent "Estée Lauder 2W1" or any specific product code). Shade families and ranges only.
- Every shade direction must trace to the canonical per-section details above. Do not invent guidance for undertone × depth combinations not represented.
- "Use carefully" sections must NOT use words like "Avoid", "Bad", or "Wrong" — frame as conditional cautions.
- TYING SUMMARY line is composed dynamically grounded in the user's traits; do not copy the example phrasing verbatim.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Report title is exactly: "${reportTitle}".`,
          `Variant line reads: VARIANT: ${variant.toUpperCase()}.`,
          `Trait chip reads: ${userUndertone.toUpperCase()} · ${userDepth.toUpperCase()} · ${userChroma.toUpperCase()}.`,
          `Render exactly 4 feature close-up tiles in the order: ${closeUps.map((cu) => cu.label).join(" / ")}.`,
          "Same person across all 4 close-ups, identity preserved, no over-retouch.",
          `Render exactly ${sectionCount} ${isGrooming ? "grooming" : "makeup"} sections in the section grid below the close-ups; no extras, no omissions.`,
          "No brand names, no SKUs, no exact foundation numbers anywhere on the page.",
          "Each section's content matches the canonical per-section details; do not invent shade families.",
          "Tying summary line is composed for this specific user; not a copy of the example phrasing."
        ])
      ]);
    }
  },
  // "Nail Color Guide" was retired here — it required a hand-photo upload,
  // legacy palette fields, and was not part of the canonical pipeline.
  {
    // === STEP: Accessory & Jewelry Metals Guide ===
    title: "Accessory & Jewelry Metals Guide",
    description: "Visual metal comparison + canonical finish guidance, mixed-metal rules, and face-shape watch guidance. Identity-required, single-crop reuse.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, userProfile }) => {
      const plan = selectJewelryPlan(portrait, userProfile);
      const {
        bestMetalAssessment,
        metalsToCompare,
        recommendedFinishes,
        mixedMetalsCombinations,
        mixedMetalsRules,
        watchGuidance,
        userUndertone,
        userChroma
      } = plan;

      const metalDecisions = metalsToCompare.map((m) => ({
        label: `${m.metalName} (${m.legacyName})`,
        details: `${m.canonicalMatch.toUpperCase()} fit · model verdict: ${m.modelVerdict}`
      }));

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "metal comparison tiles",
        decisions: metalDecisions,
        doNotInventClause:
          "Render exactly these 4 metal comparison tiles in the order given. Do not add a 5th metal, swap names, or invent new fits."
      });

      const metalDetails = metalsToCompare
        .map(
          (m, i) =>
            `Metal ${i + 1}: ${m.metalName} (legacy label: "${m.legacyName}", family: ${m.family})
- Canonical fit for this user: ${m.canonicalMatch} (user undertone "${userUndertone}" vs canonical bestForUndertones list)
- Model verdict: ${m.modelVerdict}
- Recommended finishes: ${m.finishOptions.join(", ")}
- Watch out: ${m.watchOut}${m.notes ? `\n- Notes: ${m.notes}` : ""}`
        )
        .join("\n\n");

      const finishBlock =
        recommendedFinishes.length > 0
          ? `Recommended finishes for ${userChroma} chroma (canonical, do not invent):
${recommendedFinishes
  .map(
    (f) =>
      `- ${f.name} (${f.id}): pairs with ${f.pairsWithMetals.slice(0, 4).join(", ")}; best for ${f.bestForOccasions.join(", ")}; use carefully — ${f.useCarefully}`
  )
  .join("\n")}`
          : "(no canonical finish recommendations available for this chroma)";

      const mixBlock =
        mixedMetalsCombinations.length > 0
          ? `Mixed-metal combinations for ${bestMetalAssessment.metalName} (canonical, do not invent):
${mixedMetalsCombinations.map((c) => `- ${c}`).join("\n")}

Mixing rules (canonical):
${mixedMetalsRules.map((r) => `- ${r}`).join("\n")}`
          : "(no canonical mixed-metal combinations available)";

      const watchBlock = watchGuidance
        ? `Watch guidance for ${portrait.faceShape.value} faces (canonical):
- Best case sizes: ${watchGuidance.bestCaseSizes}
- Best case shapes: ${watchGuidance.bestCaseShapes.join(", ")}
- Best strap materials: ${watchGuidance.bestStrapMaterials.join(", ")}
- Use carefully: ${watchGuidance.useCarefully}`
        : `(no canonical watch guidance available for face shape "${portrait.faceShape.value}")`;

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 photorealistic Accessory & Jewelry Metals Guide. Identity-required mode: render the SAME person from Image 1 in 4 metal-comparison tiles. The page combines visual metal try-ons (top) with canonical finish guidance, mixed-metal rules, and face-shape watch guidance (bottom).`,
        lockedFragment,
        `Per-metal canonical details (do not modify):

${metalDetails}`,
        `Best metal direction (model + canonical agreement): ${bestMetalAssessment.metalName} (${bestMetalAssessment.legacyName}) — canonical fit "${bestMetalAssessment.canonicalMatch}", model verdict "${bestMetalAssessment.modelVerdict}".`,
        finishBlock,
        mixBlock,
        watchBlock,
        `Use these analysis values exactly. Do not re-derive them:
- Undertone: ${portrait.undertone.displayLabel} (canonical: ${userUndertone})
- Locked-palette chroma: ${userChroma}
- Contrast: ${portrait.contrast.value}
- Face shape: ${portrait.faceShape.value}
- Hair color (preserve in render): ${portrait.hairColor}
- Eye color (preserve in render): ${portrait.eyeColor}
- Visible presentation: ${portrait.presentation.value}
- Facial hair (preserve exactly): ${portrait.facialHair.value}`,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~7% canvas height): small-caps eyebrow "JEWELRY & METALS GUIDE", thin horizontal divider below. Right side: monospace small-caps chip "${bestMetalAssessment.legacyName.toUpperCase()}" labeled "BEST DIRECTION" in tiny mono.
- Main metal-comparison grid (~46% canvas height): 4 photorealistic portrait tiles in a 2-column × 2-row arrangement. Each tile shows the SAME person from Image 1, head-and-shoulders, wearing visible earrings, a delicate pendant chain, and a wristwatch (when visible at the crop) in that tile's metal tone. The user's face, expression, hair, skin tone, and crop are IDENTICAL across all 4 tiles — only the metal tone of the jewelry changes.
- Tile order top-left to bottom-right: ${metalsToCompare.map((m) => m.legacyName).join(", ")}.
- Below each tile, on a thin label band:
  - Metal name in bold small-caps (matches legacy name exactly: "${metalsToCompare.map((m) => m.legacyName).join('", "')}").
  - Two stacked chips (small mono caps):
    - Canonical fit: "PRIMARY" / "SUPPORTING" / "USE CAREFULLY" — based on the canonical match listed above.
    - Model verdict: "BEST" / "STRONG" / "GOOD" / "SKIP" — based on the model verdict listed above.
  - One short rationale line (under 14 words) connecting metal to user's undertone "${userUndertone}" and locked-palette chroma "${userChroma}".
- Finishes card (~14% canvas height): small-caps heading "RECOMMENDED FINISHES (${userChroma.toUpperCase()} CHROMA)" + a horizontal row of finish chips, one per recommended finish from the canonical list. Each chip shows the finish name in small caps and a tiny one-line "pairs with ..." note.
- Mixed-metals callout (~12% canvas height): small-caps heading "MIXED-METAL COMBINATIONS". List the canonical combinations as numbered short lines, with the rationale text directly from canonical (do not paraphrase liberally).
- Watch guidance footer (~12% canvas height): small-caps heading "WATCH FOR ${portrait.faceShape.value.toUpperCase()} FACES". Three short lines: case sizes, case shapes, strap materials, and a final tiny "use carefully" line — all from canonical.
- Bottom band (~3%): single italic concluding line: "Mix metals with intent: one anchor, one accent, finish-aligned."`,
        tileAnchor("metal (face is identical across tiles; only the jewelry metal tone changes)"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Identity-required mode: render the SAME person from Image 1 in every tile. Same crop, camera angle, lighting, neutral expression. ONLY the metal tone changes.
- The 4 metals must match the listed legacy names exactly: ${metalsToCompare.map((m) => m.legacyName).join(", ")}. Do not add a 5th metal, swap names, or invent variants.
- Canonical fit chips and model verdict chips MUST match the per-metal details above. Do not improvise the verdicts.
- Finishes, mixed-metal combinations, and watch guidance use the EXACT canonical content listed above. Do not invent new finishes, combinations, or sizes.
- Preserve facial identity, hair color (${portrait.hairColor}), facial hair (${portrait.facialHair.value}), and skin texture. Do not over-retouch.
- "Use Carefully" / "Use Carefully" sections must NOT use words like "Avoid", "Bad", or "Wrong". Frame as conditional.
- No brand names, no prices, no fake product codes or SKUs.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          "Same person across all 4 metal-comparison tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features.",
          "Identical head-and-shoulders crop, same camera angle, same neutral expression in every tile.",
          `Best metal chip in the top band reads: ${bestMetalAssessment.legacyName.toUpperCase()}.`,
          `4 metals shown, in this order: ${metalsToCompare.map((m) => m.legacyName).join(", ")}.`,
          "Canonical fit chips per tile match the per-metal details (PRIMARY / SUPPORTING / USE CAREFULLY).",
          "Model verdict chips per tile match the per-metal details (BEST / STRONG / GOOD / SKIP).",
          `Hair color preserved exactly: ${portrait.hairColor}.`,
          `Facial hair preserved exactly: ${portrait.facialHair.value}.`
        ])
      ]);
    }
  },
  {
    // === STEP: Eyeglasses / Frames Guide ===
    title: "Eyeglasses / Frames Guide",
    description: "Six identity-preserved frame try-ons selected from a 30-entry catalog: 5 flattering picks + 1 use-carefully educational example.",
    reference: "portrait",
    requires: { portrait: true },
    buildPrompt: ({ portrait, userProfile }) => {
      const { flattering, useCarefully, candidateCount } = selectFrames(portrait, userProfile);
      const allEntries = [...flattering];
      if (useCarefully) allEntries.push(useCarefully);
      const N = allEntries.length;

      const decisions = allEntries.map((entry) => ({
        label: entry.name,
        details:
          entry === useCarefully
            ? `USE CAREFULLY — ${entry.useCarefullyIf || "see notes"}`
            : entry.notes || `${entry.shapeCategory}, ${entry.material}, ${entry.colorTone}`
      }));

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "frames",
        decisions,
        doNotInventClause:
          "Render exactly these frames in the order given. Do not invent new frame archetypes, swap colors, change materials, or substitute thicknesses."
      });

      const frameDetails = allEntries
        .map((entry, i) => {
          const isUseCarefully = entry === useCarefully;
          const reasonLabel = isUseCarefully ? "Reason for use-carefully designation" : "Why this works";
          const reasonText = isUseCarefully
            ? entry.useCarefullyIf || `Shape category "${entry.shapeCategory}" sits in the use-carefully list for ${portrait.faceShape.value} faces.`
            : entry.notes || `${entry.shapeCategory} works for ${portrait.faceShape.value} faces; ${entry.colorTone} harmonizes with this user's coloring.`;
          return `Frame ${i + 1}: ${entry.name}${isUseCarefully ? " [USE CAREFULLY EXAMPLE]" : ""}
- Shape category: ${entry.shapeCategory}
- Material: ${entry.material} (${entry.thickness} thickness)
- Color tone: ${entry.colorTone}
- Bridge style: ${entry.bridgeStyle}
- Reads as: ${entry.readsAs}
- ${reasonLabel}: ${reasonText}`;
        })
        .join("\n\n");

      const faceShapeId = portrait.canonicalFaceShape?.id;
      const faceRules = faceShapeId ? EYEWEAR_RULES.byFaceShape[faceShapeId] : undefined;
      const faceRulesBlock = faceRules
        ? `Face-shape-specific guidance for ${portrait.faceShape.value} (apply to every tile):
- Best frame shapes overall: ${faceRules.bestFrameShapes.join(" / ")}
- Material guidance: ${faceRules.materialGuidance.join(" / ")}
- Bridge style guidance: ${faceRules.bridgeStyleGuidance.join(" / ")}
- Brow line guidance: ${faceRules.browLineGuidance.join(" / ")}
- Color/contrast guidance: ${faceRules.colorContrastGuidance.join(" / ")}
- Frame width guidance: ${faceRules.frameWidthGuidance.join(" / ")}
- Lens height guidance: ${faceRules.lensHeightGuidance.join(" / ")}`
        : "";

      const universalRulesBlock = `Universal eyewear rules (apply to every tile, regardless of face shape):
${EYEWEAR_RULES.universalRules.map((r) => `- ${r}`).join("\n")}`;

      const planNote = `Planner: ${candidateCount} catalog entries passed the deterministic filter (face shape ${portrait.faceShape.value} ∩ presentation ${portrait.presentation.value} ∩ user hard avoids). Top ${flattering.length} selected by score (style preference + color-tone harmony with ${portrait.undertone.value} undertone + face-shape versatility); ${useCarefully ? 1 : 0} use-carefully educational example added.`;

      return compose([
        imageRoles(null),
        personLock(portrait),
        IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 photorealistic Eyeglasses / Frames Guide. Identity-required mode: render the SAME person from Image 1 in ${N} frame try-on tiles. ${flattering.length} are strong matches; ${useCarefully ? 1 : 0} is an educational "use carefully" example for contrast.`,
        lockedFragment,
        `Per-frame canonical details (do not modify):

${frameDetails}`,
        universalRulesBlock,
        faceRulesBlock,
        `Use these analysis values exactly. Do not re-derive them:
- Face shape: ${portrait.faceShape.value}
- Hair color (preserve in render): ${portrait.hairColor}
- Eye color (preserve in render): ${portrait.eyeColor}
- Visible presentation: ${portrait.presentation.value}
- Facial hair (preserve exactly): ${portrait.facialHair.value}
- Undertone: ${portrait.undertone.displayLabel}`,
        planNote,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~7% canvas height): small-caps eyebrow "FRAMES GUIDE", thin horizontal divider below, monospace small-caps chip "${portrait.faceShape.value.toUpperCase()}" right-aligned next to the eyebrow.
- Main region: ${N} photorealistic head-and-shoulders portrait tiles in a 3-column × 2-row grid. Each tile shows the SAME person from Image 1, neutral cream background, soft warm studio lighting, neutral expression. Only the frames change between tiles.
- Tile order matches the per-frame details list above (top-left to bottom-right).
- Below each tile, on a thin label band:
  - Frame name in bold small-caps, matching the canonical name exactly.
  - Tiny secondary line in regular type: shape category + material (e.g. "Wayfarer · Acetate").
  - One short reason line (under 12 words) explaining the match — for the use-carefully tile, this is the reason it's flagged.
  - For the use-carefully tile (the last tile, position ${N}): a small monospace badge "USE CAREFULLY" in tiny mono caps to the right of the frame name. The badge color is warm gray, not red — this is educational, not a warning.
- Bottom band (~6%): single italic concluding line: "Frames balance face shape, hair color, and intended impression — fit-test in person before committing."`,
        tileAnchor(
          "frames (face is identical across tiles; only the eyeglasses change; lens transparency is identical)"
        ),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Identity-required mode: render the SAME person from Image 1 in every tile. Same crop, same camera angle, same lighting, same neutral expression.
- The ${N} frames must match the listed canonical names exactly; do not invent variations, swap shapes, or substitute materials/colors/thicknesses.
- EYES MUST BE VISIBLE in every tile. No opaque lenses, no extreme tint, no dark sunglasses, no thick glossy frames covering the eye line.
- Brow line: top of frames sits at or just below the natural brow (cat-eye and browline categories are the intentional exceptions and rise above the brow).
- Frame colors must match the canonical color tone described for each frame (e.g. "warm tortoise" stays warm tortoise; "jet black" stays jet black). Do not improvise.
- Preserve facial hair exactly as analyzed (${portrait.facialHair.value}). Every tile shows the same facial-hair level.
- The "USE CAREFULLY" tile renders with the same identity-preserve quality as flattering tiles; it is labeled with the badge but otherwise rendered cleanly.
- The "USE CAREFULLY" badge MUST NOT use red, "Avoid", "Bad", "Wrong", or "Skip" wording — use neutral warm-gray "USE CAREFULLY" only.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Same person across all ${N} tiles. Same eyes, brows, nose, mouth, skin tone, ethnic features, age.`,
          "Identical head-and-shoulders crop, same camera angle, same neutral expression in every tile.",
          "Eyes are clearly visible in every tile — frames do not cover the eye line.",
          `${flattering.length} flattering tile${flattering.length === 1 ? "" : "s"} + ${useCarefully ? 1 : 0} use-carefully tile = ${N} total. No more, no fewer.`,
          `Hair color preserved exactly: ${portrait.hairColor}.`,
          `Facial hair preserved exactly: ${portrait.facialHair.value}.`,
          "Frame names and color tones match the canonical entries; no substitutions."
        ])
      ]);
    }
  },
  {
    // === STEP: Silhouette Balance Guide ===
    title: "Silhouette Balance Guide",
    description: "Body shape identified, paired with canonical balancing principles for waist, vertical line, rises, hemlines, necklines, sleeves, layering, and fabric.",
    reference: "body",
    requires: { portrait: true, body: true },
    buildPrompt: ({ portrait, body }) => {
      if (!body) {
        return "Body analysis missing. Cannot generate Silhouette Balance Guide.";
      }
      const hedged =
        body.bodyShape.confidence === "high"
          ? body.bodyShape.value
          : `${body.bodyShape.value} (most likely)`;

      const canonical = body.canonicalSilhouette;
      const principleCards = canonical
        ? `Render exactly these 5 principle cards in the right panel. Use the canonical content provided; paraphrasing for legibility is fine, but do not invent new principles or merge cards.

CARD 1 — WAIST & VERTICAL LINE
- Waist Strategy: ${canonical.waistStrategy.join(" / ")}
- Vertical Line: ${canonical.verticalLine.join(" / ")}

CARD 2 — RISES & HEMLINES
- Best Rises: ${canonical.bestRises.join(" / ")}
- Best Hemlines: ${canonical.bestHemlines.join(" / ")}

CARD 3 — NECKLINES & SLEEVES
- Necklines: ${canonical.necklines.join(" / ")}
- Sleeves: ${canonical.sleeves.join(" / ")}

CARD 4 — LAYERING & FABRIC
- Layering: ${canonical.layeringRules.join(" / ")}
- Fabric & Structure: ${canonical.fabricAndStructure.join(" / ")}

CARD 5 — USE CAREFULLY
- ${canonical.useCarefully.join(" / ")}

Do not add a 6th card. Do not omit a card. Render only the canonical content above.`
        : `Canonical silhouette principles unavailable for "${body.bodyShape.value}". Fall back to per-photo observations:
- Shoulder/hip balance: ${body.shoulderHipBalance}
- Waist: ${body.waistDefinition}
- Torso/leg balance: ${body.torsoLegBalance}
- Silhouette rules: ${body.silhouetteRules.join(" / ")}`;

      const diagnosticBlock = canonical
        ? `Why this shape (canonical diagnostic cues for ${canonical.name}):
- ${canonical.diagnosticCues.join("\n- ")}`
        : "";

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
        BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT,
        "Generate a 1024x1536 Silhouette Balance Guide. The page identifies the user's body shape and leads with canonical balancing principles. Image 1 is the user's face identity reference; the final user image is the full-body standing photo for body proportions. The body shape name appears as a tag — the principles do the visible work.",
        `Use these analysis values exactly. Do not re-derive them:
- Body shape: ${hedged}
- Shoulder/hip balance (per-photo observation): ${body.shoulderHipBalance}
- Waist (per-photo observation): ${body.waistDefinition}
- Torso/leg balance (per-photo observation): ${body.torsoLegBalance}
- Best features (per-photo observation): ${body.bestFeatures.join(", ")}`,
        diagnosticBlock,
        principleCards,
        `LAYOUT (build from these instructions, no layout reference image):
- Top band (~8% canvas height): small-caps eyebrow "SILHOUETTE BALANCE GUIDE", thin horizontal divider below.
- Tag row (~4% canvas height): a single small chip in small-caps showing "${body.bodyShape.value.toUpperCase()}" — this is the shape tag, not the headline.
- Main region: split horizontal:
  - LEFT (~45% width): a full-body photorealistic render using the user's face identity from Image 1 and body proportions from the full-body photo, standing, neutral cream background, soft warm studio light. Overlay two thin guide lines on top of the figure: a vertical centerline from crown to feet, and a horizontal line at the natural waist. Both lines are subtle (low-opacity warm gray, 1px), labeled in tiny small-caps ("VERTICAL LINE" / "WAIST").
  - RIGHT (~55% width): 5 stacked principle cards as specified above. Each card is a soft-shadow rounded card on slightly lighter cream. Card heading in small-caps. Card body uses bullet lines (one bullet per principle group). Card height is roughly equal across the 5; truncate gracefully if content is dense.
- Bottom band (~10% canvas height): a thin row with two parts:
  - LEFT half: small-caps "PER-PHOTO OBSERVATIONS" — three short lines from shoulderHipBalance, waist, torso/leg balance.
  - RIGHT half: small-caps "COMMON MISIDENTIFICATIONS" — one line summarizing the canonical commonMisidentifications field${canonical && canonical.commonMisidentifications.length > 0 ? ` (canonical content: "${canonical.commonMisidentifications[0].slice(0, 200)}")` : ""}.`,
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Supportive, balance-focused language only. NO weight claims, NO body criticism, NO numeric body measurements, NO "flaws" wording.
- Body shape chip text must read exactly: "${body.bodyShape.value.toUpperCase()}".
- The 5 principle cards must follow the canonical content above; do not invent or paraphrase liberally.
- The full-body figure preserves the user's identity (face from Image 1) and body proportions (from full-body photo) exactly. Do not slim, widen, lengthen, shorten, or glamorize.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `Body shape chip is exactly: ${body.bodyShape.value.toUpperCase()}.`,
          "Left-region figure preserves face identity from Image 1 and body proportions from the full-body photo without exaggeration.",
          "Right-region renders exactly 5 principle cards with the canonical content; no extras, no omissions.",
          "Vertical and waist guide lines are thin and subtle; they do not dominate the figure.",
          "No weight, size, or numeric body language anywhere on the page."
        ])
      ]);
    }
  },
  {
    // === STEP: Outfit Style Guide ===
    title: "Outfit Style Guide",
    description: "Three identity-preserved full-body outfits (work / casual / event) grounded in canonical silhouette principles and the user's locked palette.",
    reference: "body",
    requires: { portrait: true, body: true },
    buildPrompt: ({ portrait, body, session }) => {
      if (!body) {
        return "Body analysis missing. Cannot generate Outfit Style Guide.";
      }
      const outfitGuidance = outfitPresentationGuidance(portrait);
      const canonical = body.canonicalSilhouette;
      const locked = portrait.paletteHypotheses[0];

      const FULL_OCCASION_ORDER: OccasionId[] = ["work", "casual", "event"];
      // Subset by SessionContext.occasions if the user picked a subset for this run.
      const requestedOccasions =
        session?.occasions && session.occasions.length > 0
          ? FULL_OCCASION_ORDER.filter((id) => session.occasions!.includes(id))
          : FULL_OCCASION_ORDER;
      const occasionOrder = requestedOccasions.length > 0 ? requestedOccasions : FULL_OCCASION_ORDER;
      const occasionData = occasionOrder.map((id) => OUTFIT_RULES.occasions[id]);
      const N = occasionData.length;
      const orderHumanList = occasionData.map((o) => o.name).join(" / ");

      const occasionDecisions = occasionData.map((o) => ({
        label: o.name,
        details: `${o.compositionTarget} — ${o.goal}`
      }));

      const lockedFragment = renderLockedDecisions({
        itemNounPlural: "outfits",
        decisions: occasionDecisions,
        doNotInventClause: `Render exactly these ${N} outfit column${N === 1 ? "" : "s"}, in the order ${orderHumanList}. Each column follows its canonical occasion rules below; do not collapse, merge, or add ${N === 1 ? "a second" : "extra"} outfit${N === 1 ? "" : "s"}.`
      });

      const sessionNoteBlock =
        session?.freeTextNote && session.freeTextNote.trim().length > 0
          ? `Occasion context (this run, from the user): "${session.freeTextNote.trim()}". Treat this as soft guidance — let it nudge fabric weight, formality, color choice, or layering within the canonical rules; do not invent garments unrelated to the occasion's canonical example shapes.`
          : null;

      const occasionRulesBlock = `Per-occasion canonical rules (apply each occasion's rules to its own column; do not invent):

${occasionData
  .map(
    (o) => `${o.name} (id: ${o.id}):
- Composition target: ${o.compositionTarget}
- Goal: ${o.goal}
- Palette approach: ${o.paletteApproach.join(" / ")}
- Occasion-specific silhouette principles (layered on top of body-shape principles): ${o.silhouettePrinciples.join(" / ")}
- Layering strategy: ${o.layeringStrategy.join(" / ")}
- Fabric guidance: ${o.fabricGuidance.join(" / ")}
- Example outfit shapes (palette-agnostic; just garment categories): ${o.exampleOutfitShapes.slice(0, 3).join(" | ")}
- Use carefully: ${o.useCarefully.join(" / ")}`
  )
  .join("\n\n")}`;

      const silhouetteGuidance = canonical
        ? `Body-shape silhouette guidance (apply consistently across all 3 outfits; this is the canonical principle set for ${canonical.name}; combine with each occasion's rules above):
- Waist strategy: ${canonical.waistStrategy.join(" / ")}
- Best rises: ${canonical.bestRises.join(" / ")}
- Best hemlines: ${canonical.bestHemlines.join(" / ")}
- Necklines that work: ${canonical.necklines.join(" / ")}
- Sleeves that work: ${canonical.sleeves.join(" / ")}
- Layering rules: ${canonical.layeringRules.join(" / ")}
- Fabric and structure: ${canonical.fabricAndStructure.join(" / ")}
- Use carefully: ${canonical.useCarefully.join(" / ")}`
        : `Canonical silhouette principles unavailable. Fall back to model-emitted silhouette rules for ${body.bodyShape.value}:
- ${body.silhouetteRules.join("\n- ")}`;

      return compose([
        imageRoles(null, {
          primaryReference: "the user's primary portrait",
          primaryUse:
            "Use it as the FACE IDENTITY, visible presentation, hair, skin tone, hair shape, expression family, and styling anchor for every photorealistic outfit portrait.",
          intermediateReferences:
            "Any images after Image 1 include optional additional portrait angles followed by the user's FULL-BODY PHOTO. Use additional portraits to stabilize face identity. Use the final user image as the BODY PROPORTIONS, FULL-BODY SILHOUETTE, posture, and scale reference for every full-body outfit portrait.",
          separationRule:
            "do NOT copy the body, outfit, pose, measurements, or person from the layout reference"
        }),
        personLock(portrait),
        BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT,
        `Generate a 1024x1536 photorealistic identity-preserving Outfit Style Guide. The board shows the same real person from the uploaded references wearing ${N} different outfit${N === 1 ? "" : "s"} across ${N === 1 ? "one occasion" : `${N} occasions`}: ${orderHumanList}. Identity preservation and body-scale preservation are the primary rules; this is not a fashion-illustration page.`,
        lockedFragment,
        `Use these analysis values exactly. Do not re-derive them:
- Body shape: ${body.bodyShape.value}
- Locked palette direction: ${locked.name} (id: ${locked.id})
- Best metal (for jewelry/hardware): ${portrait.bestMetal.value}
- Visible presentation: ${portrait.presentation.value}`,
        `Approved outfit colors (canonical hex from the locked palette; render exactly these values):
- Best neutrals: ${swatchList(locked.palette.bestNeutrals)}
- Signature colors: ${swatchList(locked.palette.signatureColors)}
- Accent colors (use sparingly): ${swatchList(locked.palette.accentColors)}
- Use carefully (conditional, not for primary garments): ${swatchList(locked.palette.useCarefully)}`,
        outfitGuidance,
        occasionRulesBlock,
        silhouetteGuidance,
        sessionNoteBlock,
        `LAYOUT (identity-preserving mode, build from these instructions, no layout reference image):
- Top band (~7% canvas height): small-caps eyebrow "OUTFIT STYLE GUIDE", thin horizontal divider below.
- Main region: ${N} photorealistic full-body outfit portrait${N === 1 ? "" : "s"} arranged in a single horizontal row of ${N} column${N === 1 ? "" : "s"}, top-to-bottom matching the occasion order (${orderHumanList}). Each column shows the SAME person from Image 1, using body proportions from the full-body photo. The person has the same face, hair, skin tone, facial features, visible presentation, hair color, hair length, and natural body scale in every column. Only the outfit and the implied pose context change.
- Use the final user image only for body proportions and stance reference. Do not widen, slim, lengthen, shorten, or glamorize the body.
- Each outfit column should be composed from BOTH the body-shape silhouette guidance AND the occasion-specific rules above. Each column draws ONLY from its own occasion's palette approach, layering strategy, and example shapes. No single occasion's rules cross into another column.
- Below each column, on a thin label band:
  - Occasion in bold small-caps (${occasionData.map((o) => `"${o.id.toUpperCase()}"`).join(" / ")}).
  - Tiny secondary line in regular type: the occasion's composition target (e.g. "1 top + 1 bottom + 1 structured layer + 1 polished shoes + 2-3 accessories" for Work).
  - One short rationale line (under 16 words) referencing one occasion-specific principle AND one body-shape silhouette principle the outfit honors, plus a palette swatch reference. Compose fresh per column.
- Bottom band (~9% canvas height): "WHY THIS WORKS" small-caps heading, then one canonical "Example outfit shape" per occasion (drawn from the canonical lists above) rendered as a single line in regular type with the occasion as a small chip prefix.`,
        tileAnchor("outfit (face, hair, body proportions, and scale identical across columns; only the outfit changes)"),
        STYLE_BLOCK,
        `Hard rules:
- All text must be legible English. No gibberish, no warped letters.
- Identity preservation is mandatory: same face, same hair, same skin tone, same age, same visible presentation across all ${N} outfit portrait${N === 1 ? "" : "s"}.
- DO NOT CHANGE BODY SCALE: do not slim, widen, lengthen, shorten, or glamorize the user's body in any column. Body proportions are the user's, not a fashion-model archetype.
- No weight claims, body criticism, or numeric body language anywhere on the page.
- Every garment color uses an exact hex from the approved swatches above. Never use a "use carefully" color from the locked palette.
- Hardware (belts, buckles, jewelry) consistently in ${portrait.bestMetal.value}.
- No brand names, no prices, no fake product codes.
- Compose outfits from the user's visible presentation, body shape, the canonical silhouette guidance, AND the occasion-specific canonical rules above. Each occasion gets its OWN column; rules from one occasion must not bleed into another.
- "Use carefully" entries from each occasion's canonical rules must NOT appear in that occasion's column unless paired with intentional context.
- Do not default to dresses, suits, skirts, heels, or any fixed fashion archetype unless the user's presentation and body shape clearly support it.
- Render exactly ${N} outfit column${N === 1 ? "" : "s"} (${orderHumanList}). Do not add any unrequested occasion.
- Do not mention that this is AI-generated.`,
        preserveRepeat([
          `${N} full-body outfit portrait${N === 1 ? "" : "s"} in a single row, matching ${orderHumanList} order exactly.`,
          "Same person in every outfit portrait: face from Image 1, body proportions from the full-body photo, identical scale.",
          "Do not alter or exaggerate the user's body size or shape.",
          "Every garment color matches one of the approved hex values; no use-carefully colors.",
          `Hardware across the entire image is rendered in ${portrait.bestMetal.value}.`,
          "Each per-column rationale references at least one occasion-specific principle (palette / silhouette / layering / fabric) AND one body-shape silhouette principle from the guidance above.",
          "Bottom 'Why this works' band lists exactly one canonical 'Example outfit shape' per occasion, drawn from the canonical lists, with the occasion as a small chip prefix."
        ])
      ]);
    }
  },
  // "Makeup Feature Guide" was retired here — replaced by the Makeup Shade Guide
  // rewrite, which presentation-gates to 7 makeup sections or 5 grooming sections
  // and pulls all guidance from canonical MAKEUP_RULES data.
  // "Use Carefully Guide" was retired here — its content has been folded into the
  // Palette Direction Report's "USE CAREFULLY (CONDITIONAL)" section, which renders
  // canonical use-carefully swatches with conditional language and replacement
  // guidance. Keeping a separate hidden step adds no value.
];

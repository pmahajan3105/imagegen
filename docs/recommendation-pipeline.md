# Recommendation Pipeline

Canonical design document. Replaces `docs/recommendation-pipeline-proposal.md` and `docs/per-report-improvements.md`.

This document explains how the app should move from fixed image-generation prompts to a grounded recommendation system that analyzes, plans, then renders. It defines the data model, the render convention, the per-report behavior, and the build phases.

> **Build status (2026-04-26):** Phase 1A, 1B, 1.5, 2, and 3 are shipped. Phase 4 (heavy measurement) and Phase 5+ are deferred. See [`status.md`](status.md) for the exhaustive accounting and [`flow.md`](flow.md) for the runtime data flow.

## 1. Goals

The current app generates reports by asking the image model to do everything in one shot — analyze the person, decide recommendations, design the layout, preserve identity, and render the image. That produces four problems:

1. **Inconsistent decisions.** One report may imply Deep Autumn while another behaves like Dark Winter.
2. **Generic choices.** The model defaults to familiar fashion-board archetypes, especially feminine-coded hairstyles and outfits.
3. **Weak evidence.** Season, undertone, and body-shape conclusions from a single casual photo are not reliable enough to treat as facts.
4. **No learning loop.** If the user dislikes a palette or hairstyle, the app does not store that as signal.

The new approach moves choice-making into structured data before rendering. The image model becomes a *renderer* that arranges and visualizes selected decisions; it does not invent recommendations.

The final image prompt should mostly say: *"Render these selected decisions clearly."* It should not say: *"Figure out what colors, hairstyles, outfits, frames, and makeup are best."*

## 2. Pipeline Shape

```text
A. Measure              (image quality, optional MediaPipe later)
B. Capture User Context (profile + session)
C. Ground               (canonical rules from app/data/)
D. Hypothesize          (2-3 candidates per axis)
E. Plan Recommendations (deterministic candidate generation, filtering, scoring)
F. Render Reports       (RenderLockedDecisions only)
G. Present              (with rationale)
H. Log                  (picks, rejections, locked plans)
```

The important separation:

```text
recommendation planning decides what should appear
image generation only renders those selected decisions
```

The model can help write and score recommendations, but it consumes grounded inputs rather than inventing the full system from memory.

## 3. Color System Decision

The app anchors on **Sci/Art 12-season**, as documented in Christine Scaman's [12 Blueprints](https://www.12blueprints.com/). One system, picked once, committed to. Mixing systems is the single biggest cause of incoherent output.

### Why Sci/Art

- Scaman's 12 Blueprints is the highest-quality public reference for any 12-season system: per-season write-ups with celebrity examples, fabric swatch photos, and explicit color logic.
- Most academically grounded — built on the Munsell color system's three explicit dimensions (Hue × Value × Chroma).
- Palettes are consistent across practitioners because the system has formal definitions; House of Colour palettes vary by stylist and are largely held in proprietary fabric fans.
- Free and citable; no trademark friction for an app that displays palettes.

### Season IDs

The canonical 12 seasons. IDs are kebab-case stable identifiers used as keys in `app/data/colorSystem.ts`:

| Season ID | Display name | Family |
|---|---|---|
| `light-spring` | Light Spring | Spring |
| `true-spring` | True Spring | Spring |
| `bright-spring` | Bright Spring | Spring |
| `light-summer` | Light Summer | Summer |
| `true-summer` | True Summer | Summer |
| `soft-summer` | Soft Summer | Summer |
| `soft-autumn` | Soft Autumn | Autumn |
| `true-autumn` | True Autumn | Autumn |
| `dark-autumn` | Dark Autumn | Autumn |
| `true-winter` | True Winter | Winter |
| `bright-winter` | Bright Winter | Winter |
| `dark-winter` | Dark Winter | Winter |

### Aliases

Common synonyms from other systems (especially House of Colour, which uses "Warm/Cool/Clear/Deep" prefixes instead of Sci/Art's "True/Bright/Dark") map to Sci/Art canonical IDs at parse time. The model's analysis output may use any synonym; the app normalizes to the canonical ID before storing or rendering.

| Alias | Canonical |
|---|---|
| `warm-spring` | `true-spring` |
| `clear-spring` | `bright-spring` |
| `cool-summer` | `true-summer` |
| `warm-autumn` | `true-autumn` |
| `deep-autumn` | `dark-autumn` |
| `cool-winter` | `true-winter` |
| `clear-winter` | `bright-winter` |
| `deep-winter` | `dark-winter` |

The full alias map is maintained in `app/data/colorSystem.ts` next to the season records.

### Source pipeline

Canonical palettes (hex codes per season) and rule strings are populated from `research/color-theory.md`, generated offline (any capable research model) and hand-curated into `app/data/colorSystem.ts`. The data file is the source of truth; the research markdown is reference material.

The rule: **research informs the recommendation engine, not the image prompt.**

## 4. Core Data Objects

### 4.1 `AnalysisProfile`

The factual + interpreted extraction layer.

```ts
type AnalysisProfile = {
  imageQuality: ImageQualitySignals;
  measuredSignals?: MeasuredSignals;       // populated when MediaPipe / canvas sampling runs
  interpretedTraits: PortraitAnalysis;     // model interpretation
  body?: BodyAnalysis;
};

type ImageQualitySignals = {
  faceSize: "small" | "good" | "large";
  eyesVisible: boolean;
  lighting: "poor" | "mixed" | "good";
  portraitAngle: "front" | "slight-angle" | "strong-angle";
  confidencePenalty: number;               // 0–1, applied to all downstream confidence
};

type MeasuredSignals = {
  skinLabSamples: Array<{ l: number; a: number; b: number }>;
  contrastScore: number;
  chromaScore: number;
  faceRatios?: FaceRatios;
};
```

`PortraitAnalysis` already exists in `app/lib/analysis.ts`. The migration adds `imageQuality` (required) and `paletteHypotheses?: PaletteHypothesis[]` (optional in Phase 1A, populated in Phase 1B).

Image quality is measured early because it affects every downstream confidence label. A wide selfie may still be useful for broad color guidance but weak for identity-preserved outfit rendering.

### 4.2 `UserProfileContext` and `SessionContext`

User input is split. Profile is person-level and persists; session is run-level and is cleared by default.

```ts
type UserProfileContext = {
  presentation?: "masculine" | "feminine" | "androgynous";
  stylePreferences: string[];              // "minimal", "classic", "workwear"
  hardAvoids: string[];                    // "no leather", "no off-shoulder"
  softPreferences: string[];               // "lean warmer than canonical"
  maintenance?: "low" | "medium" | "high";
  hairChangeTolerance?: "keep-current" | "small-change" | "open-to-change";
  wearsMakeup?: boolean;
};

type SessionContext = {
  occasion?: string;                       // "fall wedding guest, October"
  freeTextNote?: string;                   // arbitrary current context
};
```

**Profile** is keyed by portrait hash and stored persistently in IndexedDB. It survives across runs and reports for the same person.

**Session** is per-run. It is not persisted by default; it lives in app state and is included in the recommendation plan but not written back to IndexedDB unless the user explicitly saves it.

The pattern fixes a real failure mode: occasional context like "fall wedding guest" must not overwrite the person's default style profile.

### 4.3 Canonical Rules

Repo-owned data, never invented by the model.

```ts
type ColorSeasonRule = {
  id: string;                              // "soft-autumn"
  name: string;                            // "Soft Autumn"
  family: "spring" | "summer" | "autumn" | "winter";
  aliases: string[];
  traits: {
    undertone: "warm" | "cool" | "neutral" | "olive";
    depth: "light" | "medium" | "deep";
    chroma: "soft" | "clear" | "bright";
    contrast: "low" | "medium" | "high";
  };
  palette: {
    bestNeutrals: Swatch[];
    signatureColors: Swatch[];
    accentColors: Swatch[];
    useCarefully: Swatch[];
  };
  rules: string[];                         // human-readable
};
```

This lives in `app/data/colorSystem.ts`.

The broader style knowledge base now lives in domain-specific data files under `app/data/`, not in generic scaffolds. Examples:

- `hairstyleLibrary.ts`
- `faceShapeRules.ts`
- `eyewearLibrary.ts`
- `wardrobeCapsules.ts`
- `silhouetteRules.ts`
- `outfitRules.ts`
- `jewelryRules.ts`
- `makeupRules.ts`

Scoring lives close to each planner (`hairstylePlanner.ts`, `eyewearPlanner.ts`, etc.) because the rules are domain-specific and easier to audit beside their filters.

### 4.4 `PaletteHypothesis`

Instead of one brittle season result, keep two or three plausible hypotheses.

```ts
type PaletteHypothesis = {
  id: string;                              // canonical season id, e.g. "soft-autumn"
  name: string;
  confidence: "low" | "medium" | "high";
  supportingSignals: string[];
  riskNotes: string[];
  palette: ColorSeasonRule["palette"];     // copied from canonical at creation
};
```

### 4.5 `LockedPalette`

```ts
type LockedPalette = {
  hypothesisId: string;
  source: "user" | "model-default";
  lockedAt: string;                        // ISO timestamp
};
```

Stored per portrait hash. If absent, downstream reports use the top hypothesis but render with "not calibrated" language.

### 4.6 `RecommendationPlan`

The structured decisions per report. Render prompts consume this directly.

```ts
type RecommendationPlan = {
  palette: {
    selectedHypothesisId: string;
    status: "model-suggested" | "user-locked";
    bestColors: Swatch[];
    useCarefully: Swatch[];
    explanation: string;
  };
  hairstyles?: Array<{
    name: string;
    score: number;
    reason: string;
    constraints: string[];
    disallowedIf?: string[];
  }>;
  frames?: Array<{
    name: string;
    material: string;
    color: string;
    score: number;
    reason: string;
  }>;
  outfitLooks?: Array<{
    label: string;
    garments: Array<{ type: string; color: string; reason: string }>;
    score: number;
    whyItWorks: string;
  }>;
};
```

## 5. Migration & Versioning

Phase 1A introduces a schema-breaking change. The migration must be explicit.

### Analysis schema

- `ANALYSIS_SCHEMA_VERSION` in `app/lib/analysis.ts` increments **2 → 3**.
- `PortraitAnalysis` adds required `imageQuality: ImageQualitySignals`.
- `paletteHypotheses?: PaletteHypothesis[]` is added as optional in Phase 1A; populated in Phase 1B.
- `colorSeason: Verdict<string>` becomes a temporary compatibility field. Phase 1B reads from `paletteHypotheses` first, falling back to `colorSeason` for one schema version, then it is removed.
- Cached analyses (`analyses` IndexedDB store) keyed by old schema version are invalidated on read. `analyzePortrait` regenerates them on next use.

### IndexedDB

- DB version `imagegen-history` increments **2 → 3**.
- New object store: `portraitMetadata`. Keyed by portrait hash. Holds `LockedPalette`, `UserProfileContext`, and future per-portrait state.
- Existing stores (`state`, `analyses`) unchanged in shape; their version-bump trigger only adds the new store.

### Cached analysis behavior

`getCachedAnalysis` checks `schemaVersion` against `ANALYSIS_SCHEMA_VERSION`. Mismatch returns `null`. The caller treats `null` as "no cached value" and re-analyzes.

This is a clean break. Acceptable because the app is personal use; no user-facing data is lost beyond a re-analysis call.

## 6. Render Convention: `RenderLockedDecisions`

Every report rendering prompt follows one named convention.

**Rule:**

> Image prompts may arrange and visualize decisions, but may not invent new recommendations.

**Bad:**

```text
Create the best hairstyles for this person.
```

**Better:**

```text
Render these four selected hairstyles:
1. Textured crop...
2. Brushed-back waves...
3. Shoulder-length flow...
4. Clean taper...
Do not invent other hairstyles.
```

Applies across reports:

- Palette Direction renders the locked palette.
- Hairstyles renders the selected hairstyle plan.
- Frames renders the selected frame plan.
- Wardrobe renders the selected capsule plan.
- Outfit Style renders the selected outfit plan.

The render prompt fragment is centralized as a shared helper (built in Phase 1B alongside the first plan-driven render).

## 7. Cross-Cutting Rules

These extend the pipeline rails. Build once, every report benefits.

1. **`RenderLockedDecisions` for every report.** No render prompt may invent recommendations; only arrange the `RecommendationPlan`.

2. **Identity-preserve prompt fragments.** Portrait-only reports use `IDENTITY_PRESERVE_FRAGMENT`, where Image 1 is the identity source. Body reports use `BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT`, where Image 1 is the face identity source and the uploaded full-body photo is the body-scale/proportion source.

3. **Palette-adherence post-check.** After every render that depends on `LockedPalette`, sample dominant colors from the output, compute LAB distance to the nearest locked-palette swatch, surface a "color fidelity" indicator. Below threshold → one-click stricter regen.

4. **Cross-report consistency state machine.** Every downstream report reads `LockedPalette` and `UserProfileContext` through the same access path. If Calibration is unlocked, downstream reports use the model's top palette hypothesis and label it as model-suggested rather than user-locked. `SessionContext` is typed but not plumbed yet.

5. **Photo-quality propagation.** `imageQuality.confidencePenalty` surfaces as a per-report header.

6. **Tile-count rule.** Identity-critical reports use fewer tiles to preserve quality:
   - Hairstyles: 4
   - Outfits: 3
   - Frames: 6
   - Jewelry metal swap: single portrait crop, 4 metal overlays
   Non-identity (cutout) reports can be denser.

7. **Per-tile edit-and-regen** *(v2)*. User marks any tile "no" with a reason; system regenerates only that tile with the reason as added constraint. Rejections feed the pick log.

## 8. Per-Report Plans

Each report follows the same structure: goal, render mode, plan, render, hard guards, v1 cuts.

### 8.1 Palette Calibration

**Goal:** trust layer. Establish the lock.
**Render mode:** identity-required (drape strips).

**Plan:**
- 2–3 palette hypotheses with `supportingSignals` + `riskNotes`
- `imageQuality` block surfaced

**Render:**
- Side-by-side drape strips: subject's face vignetted by each candidate palette
- Each strip labeled with hypothesis name and confidence

**Hard guards:**
- Identity-preserve fragment
- Palette-adherence post-check (verify rendered swatches against canonical hex)
- If `confidencePenalty` above threshold, surface "second photo recommended" before allowing lock

**Lock UX:**
- "Lock this season" button per strip
- Locked hypothesis written to IndexedDB keyed by portrait hash
- Rejected hypotheses preserved for Palette Direction Report's "Also tested / Why rejected"

**v1 cuts:** LAB measurement evidence panel (defer until canvas sampling lands).

### 8.2 Palette Direction Report

**Goal:** personal color rule sheet from the locked palette.
**Render mode:** cutout (color tiles, swatches).

**Plan:**
- Practical rule outputs from canonical: best white, best dark, denim, metals, hair color direction, grooming tonics
- "Also tested / Why rejected" sourced from Calibration's rejected hypotheses
- Per-swatch annotations from canonical rule data

**Render:**
- Canonical hex codes only, never invented
- "Use Carefully" subsection folded inline (no separate report)

**Hard guards:**
- Palette-adherence post-check
- No certainty language; replace "you are X" with "your locked direction is X"

**v1 cuts:** Use-case grouping (office / statement / knitwear / athleisure) — defer.

### 8.3 Face Balance Map (renamed from Face Shape And Feature Map)

**Goal:** styling map, not biometric diagnosis.
**Render mode:** identity-required (annotated portrait).

**Plan:**
- 1–2 candidate face shapes with confidence
- Styling principles per shape (necklines, earrings, frames, haircut direction)
- Measured ratios surfaced **only** when actually measured; otherwise qualitative observations only

**Render:**
- Annotated photo overlay (no fake illustrated map)
- Principles panel beside the photo

**Hard guards:**
- Identity-preserve fragment
- No fake precision: ratios appear only when measured

**v1 cuts:** MediaPipe integration itself (qualitative-only is acceptable for v1).

### 8.4 Best Hairstyles Board

**Goal:** realistic, identity-preserved, presentation-aware options.
**Render mode:** identity-required (4 tiles).

**Pre-question UX (before plan):**
- Willing to cut current length? (yes / no / open)
- Maintenance tolerance? (low / medium / high)
- Professional / bold preference?

These flow into `UserProfileContext.hairChangeTolerance`, `maintenance`, `stylePreferences`.

**Plan:**
- Text LLM (not image model) generates 10–12 hairstyle candidates as JSON
- Deterministic filter: presentation conflict, face-shape exclusion, current-hair conflict, facial-hair conflict, `hairChangeTolerance` conflict
- Score remaining candidates; select 4
- Each selected style: `reason`, `constraints`, `disallowedIf`

**Render:**
- Exactly 4 tiles, one per selected style
- Per-tile rationale caption

**Hard guards:**
- Identity-preserve fragment (critical here)
- Explicit "do not invent other styles" clause
- Presentation gate enforced at filter step, not just in prompt

**v1 cuts:** Growth-path render — defer.

### 8.5 Wardrobe Capsule Board

**Goal:** usable capsule, not generic fashion grid.
**Render mode:** cutout (no person, no body).

**Pre-question UX:**
- Style preference: casual / workwear / minimal / bold / classic / street
- Climate context (optional)

**Plan:**
- Capsule structure: 4 tops + 3 bottoms + 3 layers + 3 shoes + 5 accessories = 18 items
- Each item tagged with: locked-palette swatch, silhouette rule satisfied, garment type
- Items selected from canonical rules + `UserProfileContext.stylePreferences`

**Render:**
- Product cutouts only — neutral background, no model, soft drop shadow
- 5-column grid by category, items aligned by row

**Hard guards:**
- Locked palette only
- Explicit "do not include a model or person" clause
- Palette-adherence post-check on each cutout

**v1 cuts:** "Already own" toggle, outfit-math companion table — defer.

### 8.6 Grooming & Shade Guide (presentation-gated rename)

**Goal:** shade direction, not foundation matching.
**Render mode:** cutout (swatches + product silhouettes), with optional one identity-required look tile.

**Title rule:**
- `presentation === "feminine"` → "Makeup Shade Guide"
- `presentation === "masculine"` → "Grooming & Shade Guide"
- `"androgynous"` → user picks framing at first run

**Plan:**
- Shade ranges from locked palette: depth, undertone, finish, contrast
- Separate "safe everyday" vs "statement" lists
- Grooming variant adds: tinted lip balm tones, beard oil tones, sunscreen tints, eyebrow direction

**Render:**
- Swatch grid grouped by category (lips / cheeks / eyes / brows / skin tonics)
- Optional one identity-required "look" tile at the bottom

**Hard guards:**
- No invented brand names or SKUs
- No exact foundation numbers — ranges only
- Locked palette adherence

**v1 cuts:** Hex-to-real-product lookup — defer.

### 8.7 Accessory & Jewelry Metals Guide

**Goal:** visual metal comparison + finish + mixing rules.
**Render mode:** identity-required (single portrait crop, multiple metal overlays).

**Plan:**
- Best metal direction from locked palette
- Best finish: matte / polished / brushed / antique
- Mix-metals rule (which combinations work for this user)
- Item coverage: chain, earrings, ring, watch, glasses hardware

**Render:**
- Same portrait crop reused with each metal overlaid (gold / silver / rose / bronze)
- Below: finish examples + mix-metals callout

**Hard guards:**
- Identity-preserve fragment
- Locked palette adherence
- Single crop reused — do not regenerate the face per metal

**v1 cuts:** Body-scale-aware jewelry sizing (requires MediaPipe) — defer.

### 8.8 Eyeglasses / Frames Guide

**Goal:** practical try-on board.
**Render mode:** identity-required (6 tiles, not 8).

**Plan:**
- Frame plan dimensions: shape, thickness, material, color, bridge style
- Score each candidate against: face balance, brow line, contrast, locked palette, `stylePreferences`
- Select 6
- Include 1 explicit "use carefully" frame with reason

**Render:**
- 6 tiles, head-and-shoulders, neutral lighting, only frames change
- Per-tile reason caption

**Hard guards:**
- Identity-preserve fragment
- Frames must not hide eyes (no thick glossy frames covering eye line)
- Locked palette adherence on frame color

**v1 cuts:** Strong-prescription branch, sunglasses as separate render — defer.

### 8.9 Silhouette Balance Guide (renamed from Body Shape Guide)

**Goal:** identify the user's body shape and lead with how to balance it.
**Render mode:** annotated full-body photo + principles panel.

**Plan:**
- Body shape identified (one of: Hourglass, Pear, Apple, Rectangle, Inverted Triangle); 1–2 candidates if borderline
- Output: waist strategy, shoulder/hip balance, vertical line, best rises/lengths, use-carefully silhouettes
- Body shape name appears as a tag; principles do the visible work
- No weight, measurements, or "flaws" language

**Render:**
- Annotated full-body photo with overlay lines for vertical / waist
- Body shape label + principles panel beside it

**Hard guards:**
- No weight or size language
- Pose warning if pose distorts the silhouette read

**v1 cuts:** Body segmentation measurement — defer.

### 8.10 Outfit Style Guide

**Goal:** believable identity-preserved outfits.
**Render mode:** identity-required (3 outfits, not 5).

**Pre-question UX:**
- Occasions in scope: work / casual / event (default all three, user can subset)

**Plan:**
- Pull garments from Wardrobe Capsule items — do not invent new ones
- One outfit per requested occasion
- Each outfit: `garments[]`, `whyItWorks` (palette rule + silhouette rule + UserProfileContext)

**Render:**
- 3 tiles, same pose / crop / lighting, only outfit changes
- Per-tile rationale caption

**Hard guards:**
- Identity-preserve fragment + explicit "do not change body scale"
- Locked palette adherence
- Garments must match items in Wardrobe Capsule (cross-report consistency)

**v1 cuts:** Weather variant — defer.

### 8.11 Retired Reports

- **Nail Color Guide:** retired. It required a hand-photo upload and legacy palette fields.
- **Makeup Feature Guide:** retired. Its useful close-up idea was folded into Makeup Shade Guide.
- **Use Carefully Guide:** folded into Palette Direction Report as a subsection — no longer a separate report.

## 9. Phases

The build order. Each phase produces a working, testable increment.

### Phase 1A: Rails — ✅ shipped

Land all new types, data scaffolds, and schema/DB version bumps. Existing reports must render identically before and after.

**Created:**
- `app/data/colorSystem.ts` — 12 Sci/Art seasons, fully populated from the offline research pass.
- Domain-specific rule files under `app/data/` for hair, face shape, eyewear, wardrobe, silhouette, outfit composition, jewelry, and makeup/grooming.
- Split type files for grep-ability: `paletteTypes.ts`, `userContext.ts`, `imageQuality.ts`, and domain-specific `*Types.ts`.
- `research/README.md` — documents the `research/*.md → app/data/*.ts` pipeline and the rule that research informs the planner, never the render prompt.

**Modify:**
- `app/lib/analysis.ts`:
  - `ANALYSIS_SCHEMA_VERSION` 2 → 3
  - `PortraitAnalysis` adds `imageQuality: ImageQualitySignals` (required) and `paletteHypotheses?: PaletteHypothesis[]` (optional, populated in Phase 1B)
  - `PORTRAIT_PROMPT` and `PORTRAIT_JSON_SCHEMA` extended for `imageQuality`
  - New `computeImageQuality(file)` helper — canvas-based: face-area estimate, lighting variance, eyes-visible heuristic, portrait angle, `confidencePenalty`
  - Schema-mismatch invalidation in `getCachedAnalysis`
- `app/lib/persistence.ts`:
  - DB version 2 → 3
  - New `portraitMetadata` store
  - New: `saveLockedPalette / loadLockedPalette / saveUserProfileContext / loadUserProfileContext`, each keyed by portrait hash. Used by Phase 2; defined now to lock the storage shape.

**Verify:** lint, build, dev server upload and existing-report render unchanged, `imageQuality` populates in IndexedDB, new `portraitMetadata` store exists.

### Phase 1B: Palette Calibration consumes hypotheses — ✅ shipped

Behavior change: analysis emits hypotheses; Calibration renders drape strips against them.

- Modify `PORTRAIT_PROMPT` and `PORTRAIT_JSON_SCHEMA` to require `paletteHypotheses` (2–3 items, with `supportingSignals` and `riskNotes`).
- Normalize season names against the alias map.
- Rewrite Palette Calibration prompt in `app/lib/portraitSteps.ts` to render side-by-side drape strips, one per hypothesis.
- Add the shared identity-preserve fragment as a constant in `portraitSteps.ts` and apply it to Calibration first.

### Phase 1.5: Capture User Context — ✅ shipped (minimal subset)

Lightweight form before recommendation planning. Profile is person-level and keyed by portrait hash.

**Shipped scope:** `UserProfileContext` form with `hardAvoids`, `maintenance`, `hairChangeTolerance`, `wearsMakeup`, `stylePreferences`, and `presentation` override. Profile is loaded on portrait hash change and persisted on every edit. Profile flows into all 5 planners.

**Deferred:** `softPreferences` and `SessionContext` (occasion, free-text). `softPreferences` is intentionally not shown until a planner consumes it. `SessionContext` is typed but not yet wired through `PortraitStepInput`.

### Phase 2: Lock Palette — ✅ shipped

- Lock UI per drape strip in Calibration output.
- `LockedPalette` written to `portraitMetadata` keyed by portrait hash.
- Palette Direction Report rewritten to consume `LockedPalette` (or fall back to top hypothesis with "not calibrated" language).
- "Also tested / Why rejected" subsection sourced from rejected hypotheses.
- The lock event is the first pick-log entry. Phase 5 expands logging; it does not introduce it.

**Implementation note:** rather than threading `lockedPalette` through every step's prompt builder, `app/lib/portraitSteps.ts` exports `reorderForLock(portrait, lockedPalette)` which moves the locked hypothesis to `paletteHypotheses[0]`. Steps continue to use index-zero access; only the Palette Direction Report reads `lockedPalette` directly to swap its `LOCKED BY YOU` vs `MODEL-SUGGESTED` chip. This keeps all 10 steps functional whether or not a lock exists.

### Phase 3: Recommendation Plans — ✅ shipped

Start with **Best Hairstyles Board** as the flagship.

Flow:
1. Planner starts from a pre-curated canonical catalog.
2. Deterministic code applies hard filters: presentation, current hair, hard avoids, face-shape compatibility, length tolerance, maintenance, and domain-specific exclusions.
3. Rules-based scorer ranks survivors.
4. Planner selects the required count.
5. Render exactly those selections with `RenderLockedDecisions`.

The model never enumerates options — it only renders the planner's selection. This is stricter than the original model-proposed candidate idea: the catalog is research-backed and the filtering is fully deterministic.

All 5 planners (`hairstylePlanner`, `eyewearPlanner`, `wardrobePlanner`, `jewelryPlanner`, `makeupPlanner`) accept `UserProfileContext` and apply at minimum `hardAvoids`. See [`flow.md`](flow.md) for the per-planner input surface.

### Phase 4: Heavy Measurement — ⏸ deferred

Add deterministic measurement only after the grounded pipeline exists. Do not start here unless palette hypotheses are still too noisy.

Targets:
- Skin LAB sampling at face landmarks
- Contrast / chroma scoring
- Full MediaPipe face landmarks
- Body segmentation
- Wrist vein hue

These are useful but heavier than the early image-quality checks already in Phase 1A.

### Phase 5: Expanded Pick Log — ⏸ deferred

Store per-portrait:
- portrait hash
- hypotheses shown
- user-selected hypothesis
- rejected hypotheses
- generated report ids
- optional notes
- user constraints active at the time
- selected recommendation plan ids

Stays in IndexedDB. Backend only if shared use or cross-device matters.

### Phase 6+: Visual Reference Corpus (Future Bet) — ⏸ deferred

A small curated set of expert-labeled portraits embedded with a vision model (CLIP or SigLIP), stored in pgvector. At runtime, embed the user's portrait and find nearest neighbors — their labels become a strong prior on the hypothesis space.

The only piece that introduces *new visual judgment*, not just better text. Also the most expensive to build (sourcing portraits with valid licensing, expert labeling) and the only piece that justifies a backend.

Defer until the pick log proves grounding plus user lock plus measurement still hits a ceiling.

## 10. What Not To Do

### No web research per user

The missing piece is consistent rules and user-specific evidence, not web browsing. Curated rules in `app/data/` beat live research at runtime.

### No "GPT Image decides"

Use `RenderLockedDecisions` for every report. The image model never picks recommendations; it renders the plan.

### No premature backend

Personal, browser-only. Keep Phases 1–3 local. Backend becomes useful only when shared use, cross-device history, or long-running jobs require it.

### No auto-judge in v1

VLM scoring of its own image outputs is noisy. The user's pick is the ground-truth signal. Auto-judge can return as a v2 reranker once pick-log volume validates it.

### No multi-agent framework

"Specialists" are decomposed prompts with retrieved context. No orchestration framework, message bus, or agent runtime. Plain function calls between deterministic steps.

### No fine-tuning

Few-shot examples drawn from the pick log update for free and are sufficient. Fine-tuning needs thousands of labeled examples this app will never accumulate, and goes stale every taxonomy change.

## 11. Maybe Later (Parked)

Valid ideas held back from v1 to keep the core focused. Pull from this list when the rails are in place and the core reports are stable.

- Growth-path hairstyle render (now / 2 months / 6 months)
- "Already own" wardrobe toggle with gap highlighting
- Outfit-math table (capsule items → combination count)
- Cost-tier slider on Wardrobe Capsule
- Weather variant on Outfit Style Guide
- Use-case grouping in Palette Direction (office / statement / knitwear / athleisure)
- Hex-to-real-product lookup in Grooming & Shade Guide
- Body-scale-aware jewelry sizing (requires MediaPipe)
- Strong-prescription branch in Frames Guide
- Sunglasses as a separate render
- Body segmentation measurement in Silhouette Balance Guide
- Per-tile edit-and-regen with rejection logging (v2 of pick log)
- LAB measurement evidence panels in Calibration and Face Balance Map
- Visual reference corpus + nearest-neighbor lookup (Phase 6+)

## 12. Resolved Decisions

- Use split type files instead of one large `app/lib/types.ts`.
- Store locked palette and user profile in a separate `portraitMetadata` IndexedDB store.
- Fully populate `colorSystem.ts` from the offline research pass before relying on palette hypotheses downstream.
- Use rules-based planners first. Add model-based scoring only if real output testing shows the deterministic planners are insufficient.

## 13. Open Questions

- Should `SessionContext` support single occasion selection, multiple occasion selection, or a free-text occasion note first?
- Should climate become a persistent profile field or a per-session wardrobe/outfit question?

# Build Status

Snapshot of what's shipped vs. deferred against the design in [`recommendation-pipeline.md`](recommendation-pipeline.md). Last updated 2026-04-26.

## TL;DR

**Shipped:** Phases 1A, 1B, 1.5 (minimal subset), 2, and 3.
**Deferred:** Phases 4 (heavy measurement), 5 (expanded pick log), 6+ (visual reference corpus).
**Net:** the canonical-data architecture is built end-to-end; the UI wires user inputs into all 5 planners; the lock UX exists.

## Phase-by-phase status

### Phase 1A — Rails ✅

| Item | Status | Location |
|---|---|---|
| `app/data/colorSystem.ts` (12 Sci/Art seasons) | ✅ Fully populated | 320 lines, includes traits, palette, rules, sister seasons, descriptive notes |
| `app/data/styleKnowledge.ts` | ❌ Deleted | Empty scaffold; content moved to per-domain data files |
| `app/data/recommendationScoring.ts` | ❌ Deleted | Empty scaffold; scoring is implemented inline in each planner |
| `PaletteHypothesis`, `LockedPalette` types | ✅ | `app/lib/paletteTypes.ts` |
| `UserProfileContext`, `SessionContext` | ✅ | `app/lib/userContext.ts` |
| `RecommendationPlan` type | ❌ Deleted | `app/lib/recommendationPlan.ts` had zero importers; planners settled on per-domain shapes |
| `ImageQualitySignals` | ✅ | `app/lib/imageQuality.ts`, persisted in `PortraitAnalysis` |
| `ANALYSIS_SCHEMA_VERSION` bump (2 → 3) | ✅ — and onward to **v7** through subsequent cleanups |
| IndexedDB DB version bump (2 → 3) | ✅ | New `portraitMetadata` store live |
| `loadLockedPalette` / `saveLockedPalette` / `loadUserProfileContext` / `saveUserProfileContext` | ✅ | `app/lib/persistence.ts:135-194` |
| `research/README.md` documenting the research-to-data pipeline | ✅ | Documents `research/prompts/*.md → research/*.md → app/data/*.ts` |

### Phase 1B — Palette Calibration consumes hypotheses ✅

| Item | Status |
|---|---|
| `PORTRAIT_PROMPT` + JSON schema require `paletteHypotheses` | ✅ |
| Alias-to-canonical normalization | ✅ (in `colorSystem.ts`) |
| Palette Calibration prompt rewritten to drape strips | ✅ |
| Shared `IDENTITY_PRESERVE_FRAGMENT` | ✅ — applied to every identity-required step |

### Phase 1.5 — Capture User Context ✅ (minimal)

| Field | Captured by UI | Read by planners |
|---|---|---|
| `hardAvoids` | ✅ textarea (comma-separated) | ✅ hair, eyewear, jewelry |
| `maintenance` | ✅ 3 radios | ✅ hair |
| `hairChangeTolerance` | ✅ 3 radios | ✅ hair |
| `wearsMakeup` | ✅ checkbox | ✅ makeup |
| `stylePreferences` | ✅ chip-select (6 choices: casual / classic / minimal / workwear / bold / street) | ✅ hair, eyewear, wardrobe (drives capsule preset), jewelry (TODO scoring) |
| `presentation` (override) | ✅ 4 radios (auto / masculine / feminine / androgynous) | ✅ hair, eyewear, makeup |
| `climate` | ✅ 5 radios (unspecified / tropical / temperate / cold / variable) | ✅ wardrobe planner — surfaces a Climate context line in the prompt nudging fabric weight and layering (v1 context-only; v2 would tag slots) |
| `softPreferences` | ❌ not captured | ❌ no planner reads it — defer until a planner needs it |
| `SessionContext.occasions` | ✅ checkboxes (Work / Casual / Event, default all) when active step is Outfit Style Guide | ✅ Outfit Style Guide subsets to the requested occasions; renders 1–3 columns |
| `SessionContext.freeTextNote` | ✅ textarea on Outfit step | ✅ appended as an "Occasion context" block to the Outfit prompt |

The form is collapsible, gated on portrait being uploaded, and persists through `saveUserProfileContext` on every edit.

### Phase 2 — Lock Palette ✅

| Item | Status |
|---|---|
| Lock UI per drape strip | ✅ Sidebar radio panel when active step is Palette Calibration |
| `LockedPalette` written to `portraitMetadata` | ✅ |
| Palette Direction Report consumes lock | ✅ — chip swaps `LOCKED BY YOU` vs `MODEL-SUGGESTED`, source line updates |
| "Also tested / Why rejected" subsection from rejected hypotheses | ✅ — pulls from `hypotheses.slice(1)` post-reorder |
| Pick-log entry for the lock event | 🟡 Implicit only — saved to `portraitMetadata` but not in a dedicated log |

**Implementation note:** `reorderForLock(portrait, lockedPalette)` in `portraitSteps.ts` shifts the locked hypothesis to index 0, so every step's `paletteHypotheses[0]` access stays correct under both lock states. Only Palette Direction Report reads `lockedPalette` directly to render the chip.

### Phase 3 — Recommendation Plans ✅

All 5 planners shipped. Each filters from a canonical catalog (not LLM-generated candidates) and renders via `renderLockedDecisions`.

| Domain | Catalog size | Planner | UserProfile inputs honored |
|---|---|---|---|
| Hairstyles | 100 entries | `hairstylePlanner.ts` | hardAvoids, presentation, hairChangeTolerance, maintenance, stylePreferences |
| Eyewear | 30 catalog + 5 universal + 8 face-shape rule sets | `eyewearPlanner.ts` | hardAvoids, presentation, stylePreferences |
| Wardrobe | 6 capsules × 18 slots | `wardrobePlanner.ts` | stylePreferences |
| Jewelry | 8 metals + 5 finishes + watch guidance | `jewelryPlanner.ts` | hardAvoids |
| Makeup | 7 makeup + 5 grooming sections | `makeupPlanner.ts` | wearsMakeup, presentation |

Reports rewritten on canonical data: all 10 visible reports.

### Phase 4 — Heavy Measurement ⏸ Deferred

MediaPipe face landmarks, LAB skin sampling, contrast/chroma scoring, body segmentation, wrist-vein hue. Per the design doc, only start this if hypotheses prove too noisy in practice. No work done.

### Phase 5 — Expanded Pick Log ⏸ Deferred

Today only the lock event is captured (in `portraitMetadata`). The wider log (hypotheses shown, generated report ids, active constraints) is not implemented.

### Phase 6+ — Visual Reference Corpus ⏸ Deferred

CLIP/SigLIP embeddings, pgvector, expert-labeled portraits. Out of scope; would require a backend.

## Cross-cutting rules from §7 of the design

| Rule | Status |
|---|---|
| 1. `RenderLockedDecisions` for every report | ✅ — shared helper in `promptFragments.ts`, used in all relevant steps |
| 2. Identity-preserve prompt fragment | ✅ — `IDENTITY_PRESERVE_FRAGMENT` const in `promptFragments.ts` |
| 3. Palette-adherence post-check (LAB sampling on output) | ❌ Deferred — not implemented |
| 4. Cross-report consistency state machine | ✅ — `reorderForLock` + reading `paletteHypotheses[0]` everywhere |
| 5. Photo-quality propagation (`confidencePenalty` in headers) | ✅ Surfaced in `personLock` for every report (every report now has identity content); soft note at ≥ 0.3, strong warning at ≥ 0.5 (with bottom-band callout instruction) |
| 6. Tile-count rule (4 hairstyles, 3 outfits, 6 frames) | ✅ Per-report tile counts honored |
| 7. Per-tile edit-and-regen | ❌ v2, deferred |

## "What Not To Do" rules from §10

All still honored:

| Rule | Honored? |
|---|---|
| No web research per user | ✅ Pure browser-side |
| No "GPT Image decides" | ✅ Render-only |
| No premature backend | ✅ |
| No auto-judge in v1 | ✅ |
| No multi-agent framework | ✅ |
| No fine-tuning | ✅ |

## Architectural inventory

### Canonical data (all in `app/data/`)

| File | Lines | Contents |
|---|---|---|
| `colorSystem.ts` | 320 | 12 Sci/Art seasons with traits, palette, rules, sister seasons, descriptive notes |
| `hairstyleLibrary.ts` | 1407 | 100 hairstyles tagged by length, texture, presentation, face-shape support, maintenance |
| `silhouetteRules.ts` | 293 | 5 body shapes + 15 variants + universal principles |
| `faceShapeRules.ts` | 239 | 8 face shapes with neckline / earring / haircut / frame guidance |
| `eyewearLibrary.ts` | 556 | 5 universal rules + 8 face-shape rule sets + 30 catalog entries |
| `wardrobeCapsules.ts` | 125 | 6 capsule presets (casual / classic / minimal / workwear / bold / street) × 18 slots |
| `outfitRules.ts` | 46 | 3 occasions × 6 subsections |
| `jewelryRules.ts` | 41 | 8 metals + 5 finishes + 3 scales + mixed-metal rules + 8 watch entries |
| `makeupRules.ts` | 119 | 7 makeup + 5 grooming sections with shade grids |

### Code (all in `app/lib/`)

| File | Role |
|---|---|
| `analysis.ts` (947 LOC) | Central type, prompt schema, validators, version constant |
| `portraitSteps.ts` (1413 LOC) | All 10 step `buildPrompt` functions, `reorderForLock`, `PortraitStepInput` type |
| `promptFragments.ts` | `IDENTITY_PRESERVE_FRAGMENT`, `BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT`, `renderLockedDecisions`, `swatchList`, `presentationDirective`, `outfitPresentationGuidance` |
| `persistence.ts` | IndexedDB DB v3: `state`, `analyses`, `portraitMetadata` |
| `userContext.ts` | `UserProfileContext`, `SessionContext`, empties |
| `paletteTypes.ts` | `PaletteHypothesis`, `LockedPalette`, `PaletteSwatchGroup` |
| `imageQuality.ts` | `ImageQualitySignals` type |
| `*Planner.ts` × 5 | Filter+score for hairstyles, eyewear, wardrobe, jewelry, makeup |
| `*Types.ts` × 7 | Per-domain rule shapes |

### UI (`app/page.tsx`, ~2.2k LOC)

Single client component. Holds all state. Key state additions in this build cycle:

```ts
const [userProfile, setUserProfile] = useState<UserProfileContext>(EMPTY_USER_PROFILE_CONTEXT);
const [lockedPalette, setLockedPalette] = useState<LockedPalette | null>(null);
const [showPreferencesForm, setShowPreferencesForm] = useState(false);
const userProfileHydratedHashRef = useRef<string | null>(null);
```

Two effects:

- `[portraitHash]` → `loadPortraitMetadata` → hydrate profile + lock
- `[portraitHash, userProfile]` → `saveUserProfileContext` (skips if not yet hydrated for this hash)

Two UI panels added:

- **Palette lock** — appears in sidebar when active step is "Palette Calibration"; one radio per hypothesis with confidence chip and `Locked` / `Model-suggested` indicators
- **Your preferences (optional)** — collapsible panel after Uploads; gated on portrait upload; persists on every edit

## Tooling

| Check | Status |
|---|---|
| `npx tsc --noEmit` | ✅ Clean |
| `npm run lint` | ✅ Clean |
| `npm run build` | ✅ Compiles successfully |
| `npx tsx scripts/smoke-prompts.ts` | ✅ Passes — 2 passes (default + populated profile + user lock) × 10 reports |

The smoke test specifically asserts:
- Every step builds without throwing
- `Image 1` framing is present
- No prompt refers to a layout reference unless one is actually provided
- Prompts exceed 800 chars
- Palette Direction Report contains `MODEL-SUGGESTED` (no-lock pass) or `LOCKED BY YOU` (lock pass)

## Identity coverage across reports

All 10 reports now show the user's actual face somewhere on the page. The two formerly-cutout reports (Palette Direction Report, Wardrobe Capsule Board) gained a small identity hero band at the top, with the rest of the page remaining cutout/swatch infographics. Identity content per report:

| Report | Identity element |
|---|---|
| Palette Direction Report | Hero band (head-and-shoulders portrait, top left) |
| Face Balance Map | Annotated portrait |
| Best Hairstyles Board | 4 identity-preserved tiles |
| Wardrobe Capsule Board | Hero band (head-and-shoulders portrait, top left) |
| Palette Calibration | Drape-strip photos |
| Makeup Shade Guide | 4 identity-preserved feature close-ups |
| Accessory & Jewelry Metals Guide | Single portrait crop with metal overlays |
| Eyeglasses / Frames Guide | 6 identity-preserved frame try-on tiles |
| Silhouette Balance Guide | Annotated full-body photo |
| Outfit Style Guide | 3 identity-preserved full-body outfit portraits |

## Research utilization

All ported research metadata is now consumed by at least one prompt. Earlier audits incorrectly listed face-shape `notes` and eyewear per-entry `notes` as unused — they were already wired (`Face Balance Map` reads `notesLine`; `Eyeglasses / Frames Guide` reads each entry's `notes` for both the `decisions` details and the per-tile `Why this works` line). Confirmed by re-reading the prompt sources.

| File | Field | Read by prompts? |
|---|---|---|
| `colorSystem.ts` | `traitNotes` (per-axis) | ✅ Palette Direction Report's "Direction Story" panel |
| `colorSystem.ts` | `descriptiveNotes` | ✅ Palette Direction Report (top 2 lines of Direction Story) |
| `colorSystem.ts` | `sisterSeasons` | ✅ Palette Direction Report (italic footer of Direction Story) |
| `colorSystem.ts` | `munsellPositioning` | ✅ Palette Calibration per-panel italic positioning sub-line |
| `colorSystem.ts` | `skinTextureMetaphor` | ✅ Palette Calibration per-panel italic positioning sub-line (alternative to Munsell) |
| `colorSystem.ts` | `confidenceNote` | ✅ Palette Calibration per-panel monospace badge (e.g. "TRAITS HIGH · HEX MEDIUM") |
| `faceShapeRules.ts` | `notes` (per-shape) | ✅ Face Balance Map "Notes band" (was already wired) |
| `eyewearLibrary.ts` | per-entry `notes` | ✅ Frames Guide per-tile reason line (was already wired) |

## Tech debt

Items worth addressing but not blocking are now tracked in [`page-refactor-plan.md`](page-refactor-plan.md) and the natural next-step backlog below.

Closed in this build cycle:
- ❌ ~~TOC line numbers drift~~ — replaced with `// === STEP: Title ===` markers; search "STEP:" to navigate.
- ❌ ~~Empty `referenceImages.ts` map~~ — file deleted; callers in `page.tsx` and `smoke-prompts.ts` simplified.

## Answer to "are all the phases we planned done?"

**No — but the in-scope phases for this build cycle are done.**

- **Done:** 1A, 1B, 1.5 (minimal subset), 2, 3
- **Deliberately deferred per the design doc:** 4 (heavy measurement), 5 (pick log), 6+ (visual corpus)

The deferred phases were all marked "do not start unless X" in the original design (`recommendation-pipeline.md` §9):

- Phase 4 starts only if "palette hypotheses are still too noisy" — they aren't.
- Phase 5 wants pick-log volume that doesn't yet exist (single-user app).
- Phase 6+ requires backend infrastructure and licensed labeled portraits.

The pipeline is complete enough that all 10 reports run end-to-end with user-profile-aware filtering and a real lock UX. Further phases are optional infrastructure, not gating work.

## Natural next-step backlog

Ordered by leverage, not priority:

1. **`softPreferences` capture** — only after at least one planner reads it. Today no planner does; adding a form field now is busywork.
2. **Climate v2 (data-tag-driven gating)** — tag each capsule slot with climate suitability so the wardrobe planner can filter the catalog rather than just nudging the prompt. Today's v1 surfaces a Climate context line; v2 changes which items get rendered.
3. **Pick log expansion (Phase 5)** — capture per-portrait history of hypotheses shown / picked / rejected, generated report ids, active constraints.
4. **Photo-quality / palette-adherence post-checks** — canvas-based LAB sampling on rendered output (extends the photo-quality propagation from text-warning into measured fidelity).
5. **Phase 4 heavy measurement** — MediaPipe / LAB skin sampling — only if hypotheses prove too noisy in interactive testing.

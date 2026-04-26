# Runtime Data Flow

How a click in the UI turns into a rendered report. Read this alongside [`recommendation-pipeline.md`](recommendation-pipeline.md) (the design) and [`status.md`](status.md) (what's built).

## End-to-end sequence

```
┌─────────────┐    ┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User upload │ →  │ analyzePortrait│ → │  IndexedDB cache │ → │ portraitMetadata │
│ (portrait)  │    │  (gpt-5.5)     │   │  (analyses)      │   │  hydrate         │
└─────────────┘    └───────────────┘    └──────────────────┘    └─────────────────┘
                                                                          │
                          ┌───────────────────────────────────────────────┘
                          ↓
                   ┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
                   │ User locks      │ →  │ saveLockedPalette│ → │ Reorder        │
                   │ palette         │    │ (portraitHash)   │   │ paletteHypothes│
                   └─────────────────┘    └──────────────────┘   │ es so locked   │
                                                                  │ is index 0     │
                                                                  └────────┬───────┘
                                                                           │
              ┌────────────────────────────────────────────────────────────┘
              ↓
     ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
     │ buildPrompt({    │ →  │ Planner runs:    │ →  │ renderLocked     │
     │   portrait,      │    │ filter +        │    │ Decisions block  │
     │   body,          │    │ score +         │    │ enumerates exact │
     │   userProfile,   │    │ select N        │    │ N items          │
     │   lockedPalette  │    └─────────────────┘    └────────┬─────────┘
     │ })               │                                     │
     └──────────────────┘                                     │
                                                              ↓
                                                   ┌──────────────────┐
                                                   │ gpt-image-2      │
                                                   │ /v1/images/edits │
                                                   │ (1024x1536, png) │
                                                   └────────┬─────────┘
                                                            │
                                                            ↓
                                                   ┌──────────────────┐
                                                   │ HistoryEntry +   │
                                                   │ preview pane     │
                                                   └──────────────────┘
```

## Layer-by-layer

### 1. Upload & analysis

`runPortraitAnalysis(file)` in `app/page.tsx`:

1. `hashFile(file)` produces a content hash → `setPortraitHash(hash)`.
2. `getCachedAnalysis<PortraitAnalysis>(portraitCacheKey(hash))` — cache key encodes `ANALYSIS_SCHEMA_VERSION`, so schema bumps invalidate stale entries automatically.
3. On miss: `analyzePortrait(file, apiKey)` (`app/lib/analysis.ts`) calls OpenAI Responses API with `gpt-5.5` and the `PORTRAIT_JSON_SCHEMA`. Validates → emits `PortraitAnalysis` with:
   - `imageQuality` signals (face size, eyes visible, lighting, portrait angle, confidence penalty)
   - `paletteHypotheses[]` — 2–3 candidates with supporting signals + risk notes, palette swatches attached from canonical `colorSystem.ts`
   - `canonicalFaceShape` — model emits an id, validator looks up rules from `faceShapeRules.ts`
   - Per-trait fields: depth, contrast, undertone, clarity, hairColor, eyeColor, presentation, facialHair, currentHair, styleGuardrails, bestMetal, metalVerdicts
4. `saveCachedAnalysis(...)` writes to IndexedDB.

Body analysis follows the same shape via `analyzeBody → BodyAnalysis` with `canonicalSilhouette`.

### 2. Metadata hydration

`useEffect([portraitHash])` in `page.tsx`:

1. Calls `loadPortraitMetadata(portraitHash)` from `app/lib/persistence.ts:135`.
2. Hydrates `userProfile` (default = `EMPTY_USER_PROFILE_CONTEXT`) and `lockedPalette` (default = `null`).
3. Stores the hydrated hash in `userProfileHydratedHashRef` so the persistence-write effect can tell hydration apart from a user edit.

A second effect persists user-profile edits via `saveUserProfileContext(portraitHash, userProfile)`.

### 3. User-context capture

The "Your preferences (optional)" panel writes through `updateUserProfile(key, value)` to four fields:

| Field | Type | Consumers |
|---|---|---|
| `hardAvoids` | `string[]` | hair, eyewear, jewelry planners (substring match against name/family) |
| `maintenance` | `"low" \| "medium" \| "high"` | hair planner (`passesMaintenance`) |
| `hairChangeTolerance` | `"keep-current" \| "small-change" \| "open-to-change"` | hair planner (`passesLengthTolerance`) |
| `wearsMakeup` | `boolean` | makeup planner (variant gating) |
| `stylePreferences` | `string[]` (chip-select; 6 choices: casual / classic / minimal / workwear / bold / street) | hair, eyewear (scoring); wardrobe (drives capsule preset via `matchCapsulePreset`); jewelry (TODO) |
| `presentation` (override) | `"masculine" \| "feminine" \| "androgynous" \| undefined` | hair, eyewear, makeup — overrides the model's read |
| `climate` | `"tropical" \| "temperate" \| "cold" \| "variable" \| undefined` | wardrobe planner — surfaces a Climate context line nudging fabric weight + layering (v1 context-only) |

## Per-run session context

`SessionContext` is per-run (not persisted). It's plumbed through `PortraitStepInput.session`. UI lives on the Outfit Style Guide step's sidebar:

| Field | Type | Consumer |
|---|---|---|
| `occasions` | `OccasionId[] \| undefined` (default = all three: work / casual / event) | Outfit Style Guide subsets its grid to render 1–3 columns matching the user's selection for this run |
| `freeTextNote` | `string \| undefined` | Outfit Style Guide appends an "Occasion context" block as soft guidance |

`softPreferences` exists on `UserProfileContext` but is not captured by the form and not read by any planner yet — defer until a planner needs it.

### 4. Palette lock

The Palette Calibration step in the sidebar shows a radio per `paletteHypothesis`. Selecting one calls `handleLockHypothesis(id)`:

1. Builds `LockedPalette = { hypothesisId, source: "user", lockedAt }`.
2. `setLockedPalette(...)` and `saveLockedPalette(portraitHash, ...)`.

Without a lock, `lockedPalette` is `null` and downstream reports use `paletteHypotheses[0]` (the model's top guess). The Palette Direction Report's chip reads `MODEL-SUGGESTED` in this state and `LOCKED BY YOU` once a user lock exists.

### 5. Render — `buildPrompt`

When the user clicks Generate (single report) or Generate All:

```ts
step.buildPrompt({
  portrait: reorderForLock(portraitAnalysis, lockedPalette),
  body: bodyAnalysis ?? undefined,
  userProfile,
  lockedPalette: lockedPalette ?? undefined
});
```

`reorderForLock` (in `portraitSteps.ts`) moves the locked hypothesis to index 0 if a user lock exists, so every step's `paletteHypotheses[0]` access stays correct under both lock states.

Inside each step:

1. The step calls its **planner** (where applicable). E.g., `Best Hairstyles Board` calls `selectHairstyles(portrait, userProfile)`:
   - Filter: hard-avoids → presentation → length tolerance → maintenance → face-shape exclusion → `disallowedIf`
   - Score: per-criterion rules-based scoring against portrait + profile
   - Select: top N (4 for hairstyles, 6 for frames + 1 use-carefully, etc.)
2. The step composes a prompt with these pieces (in order):
   - `IMAGE INPUTS` framing (which slot is identity, which is body)
   - `PERSON LOCK` (identity facts from the analysis values)
   - Report-specific instructions
   - `RenderLockedDecisions` block (enumerates the planner's exact picks)
   - `LAYOUT` block (canvas regions with %-height allocations)
   - `STYLE_BLOCK` (typography and palette)
   - Hard rules
   - `PRESERVE` reminder
   - `IDENTITY_PRESERVE_FRAGMENT` for identity-required reports

### 6. Image generation

`editImage(imageInputs, prompt, signal)` posts to `https://api.openai.com/v1/images/edits` with `model=gpt-image-2`, `quality=high`, `size=1024x1536`, and `output_format=png`. The code intentionally does **not** send `response_format`; current GPT image endpoints return `b64_json` by default and do not support that field on this request shape. The first input is the user's portrait. Additional inputs are extra portrait angles and, for body reports, the full-body photo. Layout-reference images are not currently sent.

### 7. Persistence & display

The base64 result is stored in `HistoryEntry.imageUrl` (as a `data:image/png;base64,...` URL) and saved to IndexedDB via the `[history]` `useEffect`. The preview pane renders directly from the data URL.

## Per-planner input surface

| Planner | Reads from `PortraitAnalysis` | Reads from `BodyAnalysis` | Reads from `UserProfileContext` |
|---|---|---|---|
| `hairstylePlanner` | presentation, faceShape, hairColor, currentHair, facialHair | — | presentation, hardAvoids, hairChangeTolerance, maintenance, stylePreferences |
| `eyewearPlanner` | presentation, canonicalFaceShape, hairColor | — | presentation, hardAvoids, stylePreferences |
| `wardrobePlanner` | paletteHypotheses[0] (locked), presentation | bodyShape, silhouetteRules | stylePreferences |
| `jewelryPlanner` | paletteHypotheses[0] (locked), bestMetal, metalVerdicts, canonicalFaceShape | — | hardAvoids |
| `makeupPlanner` | presentation, facialHair, paletteHypotheses[0] (locked) | — | presentation, wearsMakeup |

## Schema versioning & cache invalidation

`ANALYSIS_SCHEMA_VERSION` (currently `7`, in `app/lib/analysis.ts`) is the bump-to-invalidate switch. Every cache key is `portrait:${hash}:v${ANALYSIS_SCHEMA_VERSION}`, so old cached analyses become unreachable and the next fetch goes through `analyzePortrait` again. When you change a model-emitted field, bump this and update the smoke test's `mockPortrait`.

`portraitMetadata` (locked palette + user profile) is keyed by portrait hash without a schema suffix — its shape is small and forwards-compatible. If a breaking change is needed, bump the IndexedDB `DB_VERSION` in `persistence.ts` and migrate in `onupgradeneeded`.

## Photo quality propagation

`portrait.imageQuality.confidencePenalty` (0–1, computed deterministically from `faceSize`, `eyesVisible`, `lighting`, `portraitAngle` in `app/lib/imageQuality.ts`) is surfaced inside `personLock`:

- `≥ 0.3` → soft note injected: "render conservatively on identity-sensitive details; do not invent features the photo doesn't clearly show."
- `≥ 0.5` → strong warning + instruction to add a small italic "Photo quality limited — consider a closer, evenly-lit front-facing photo for stronger identity preservation." line in the rendered output's bottom band.

The cutout-only Wardrobe Capsule Board doesn't apply (no person rendered, no `personLock`).

## Why this flow works

- **Identity is on every report.** Every one of the 10 reports renders the user's face somewhere — either as a hero band (Palette Direction, Wardrobe Capsule), feature close-ups (Makeup Shade Guide), drape strips (Palette Calibration), annotated portrait/body (Face Balance, Silhouette), or full identity-preserved tiles (Hairstyles, Frames, Jewelry, Outfit). `PERSON_LOCK` reads facts from the analysis JSON (presentation, facial hair, current hair, eye color), not from whichever image happens to be in slot 1, so identity values stay correct even when the photo doesn't show the face directly.
- **The image model never invents recommendations.** Every plan is computed deterministically from canonical data + analysis + profile. The render prompt's `RenderLockedDecisions` block names the exact items.
- **The user has one canonical knob: the lock.** All downstream reports re-derive from the locked hypothesis automatically because the array is reordered before `buildPrompt`.
- **Cache invalidation is automatic.** Schema bumps don't leave stale entries behind.

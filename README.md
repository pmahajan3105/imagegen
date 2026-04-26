# imagegen

A browser-only Next.js 16 app that drives OpenAI's image generation API directly from the client using a user-supplied API key. The current default (and only selectable) flow is a multi-step **portrait analysis** pipeline — palette calibration, palette direction, face shape, hairstyles, wardrobe capsule, makeup, etc.

Personal-use tool. There is no backend. The user's API key is sent directly from the browser to `api.openai.com`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000 — Next.js dev (Webpack, not Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint-config-next (core-web-vitals + typescript)
```

There is no test runner. There is no `.env` — the API key is entered in the UI and stored in `localStorage`.

## Architecture at a glance

```
app/
  layout.tsx            Root layout
  page.tsx              ~2.2k-line "use client" component — ALL UI and state lives here
  globals.css           Tailwind v4 entry
  data/                 Canonical rule books (color seasons, hair, frames, wardrobe, …)
  lib/
    portraitSteps.ts    PORTRAIT_ANALYSIS_STEPS — buildPrompt per step, consumes planners
    *Planner.ts         Deterministic candidate filter+score (hair/eyewear/wardrobe/jewelry/makeup)
    promptFragments.ts  Shared prompt helpers (identity-preserve, RenderLockedDecisions, swatchList)
    persistence.ts      IndexedDB helpers (history, cached analyses, portraitMetadata)
    analysis.ts         Portrait / body analysis types, schema, validators
    userContext.ts      UserProfileContext + SessionContext types
    paletteTypes.ts     PaletteHypothesis + LockedPalette
docs/                   Pipeline, flow, and status notes
```

The canonical-data architecture is documented in [`docs/recommendation-pipeline.md`](docs/recommendation-pipeline.md). Runtime data flow is in [`docs/flow.md`](docs/flow.md). Current build status is in [`docs/status.md`](docs/status.md).

Path aliases are **not** configured. All imports are relative.

### One component, two modes

`Home` in `app/page.tsx` drives both flows through a single `handleSubmit`:

| Mode | `appMode` | Endpoint | Notes |
|---|---|---|---|
| Portrait | `"portrait"` (default, currently the only selectable mode) | `/v1/images/edits` | 10 steps from `PORTRAIT_ANALYSIS_STEPS`. Each step has a `buildPrompt` that pulls from canonical data + planners and a required reference type: `"portrait"` or `"body"`. |
| Freeform | `"freeform"` | `/v1/images/generations` for the first call, `/v1/images/edits` for follow-ups | Follow-ups wrap the user prompt with `buildFollowUpPrompt` to preserve identity/composition. **Currently parked** — the UI does not let you switch into this mode, but the code paths must remain. |

Two file inputs feed the pipeline:

- `fileInputRef` — primary portrait
- `bodyInputRef` — full-body shot (only some reports require it)

`handleGenerateAllReports` runs the visible pipeline sequentially. `VISIBLE_PORTRAIT_ANALYSIS_STEPS` in `app/page.tsx` is currently identical to the full step list — `HIDDEN_REPORT_TITLES` is empty since the legacy hidden reports were retired.

### Report strategy

The palette flow is intentionally split:

- `Palette Calibration` is the evidence/testing report. It compares colors near the face and appears first. The user **locks** one of the model's `paletteHypotheses` here; the lock persists per-portrait and drives every downstream report.
- `Palette Direction Report` is the summary report. It renders the locked palette's canonical swatches and rules and labels itself "LOCKED BY YOU" or "MODEL-SUGGESTED" depending on whether the user has clicked a lock.

Retired reports (fully removed from `PORTRAIT_ANALYSIS_STEPS`, with tombstone comments at the bottom of the file):

- `Nail Color Guide` — required a hand photo and legacy palette fields
- `Makeup Feature Guide` — replaced by the rewritten Makeup Shade Guide (which now embeds 4 identity-preserved feature close-ups)
- `Use Carefully Guide` — folded into Palette Direction Report as a subsection

See [`docs/recommendation-pipeline.md`](docs/recommendation-pipeline.md) for the canonical pipeline design and [`docs/status.md`](docs/status.md) for what's built today vs. deferred.

### Image preprocessing — do not bypass

Every uploaded file goes through `normalizeImageForOpenAI` (in `app/page.tsx`), which re-encodes to JPEG ≤2048px on a canvas with a white background. The OpenAI edits endpoint rejects some original formats and very large files; skipping this step will produce intermittent 4xx errors.

### OpenAI request constants (intentionally hardcoded)

Defined at the top of `app/page.tsx`:

- model: `gpt-image-2`
- quality: `high`
- size: `1024x1536`
- output format: `png`

These are not user-configurable. The API is configured to never return URLs — `parseOpenAIResponse` → `getImageFromResponse` expects `data[0].b64_json`, and a `url` response is treated as an error.

### Persistence

| Data | Where | Key |
|---|---|---|
| OpenAI API key | `localStorage` | `personal-gpt-image-api-key` |
| History + selected preview | IndexedDB `imagegen-history` / store `state` | `latest` |
| Cached portrait/body analyses | IndexedDB `imagegen-history` / store `analyses` | content hash + schema version |
| Locked palette + user profile | IndexedDB `imagegen-history` / store `portraitMetadata` | portrait content hash |

Cached analyses are invalidated automatically when `ANALYSIS_SCHEMA_VERSION` (currently `7`, in `app/lib/analysis.ts`) bumps — the cache key encodes the version.

History entries store the full image inline as `data:image/png;base64,...` — that's also what the preview pane renders.

The `hasLoadedPersistedState` ref gates the save effect so the initial empty render does not overwrite restored state on mount. Don't remove this guard.

### Bundle / export

- `handleDownloadAll` dynamically imports `jszip` to keep it out of the initial bundle. Splits the data URL to recover raw base64 before zipping.
- `jspdf` is dynamically imported by `handleDownloadPdf` after a Generate All run. The UI shows Download PDF when batch results exist.

## Conventions

- Single client component. All state lives in `Home`. New features should generally extend the existing state machine rather than adding new top-level routes — this app is intentionally a one-page tool.
- Tailwind v4 via `@tailwindcss/postcss`. Styles are inline class strings. Helper `cx(...)` joins conditionals.
- Comments are sparse on purpose. Only add one when the *why* is non-obvious.

## Things to know before changing code

1. **`appMode` is hardcoded to `"portrait"` and the freeform branch is intentionally kept.** `useState<AppMode>("portrait")` has no setter. The `!isPortraitMode` branches throughout `handleSubmit` and the JSX are parked, not dead. Do not delete them.
2. **PDF export is batch-only.** `handleDownloadPdf` uses the current `batchResults`; it is not a general history-to-PDF export.
3. **The OpenAI key is in `localStorage` and rides on every `Authorization` header.** This is an accepted tradeoff for a personal-use tool. It does not need to be "fixed" or refactored into a server route.
4. **Don't bypass `normalizeImageForOpenAI`.** Every code path that uploads a file to OpenAI must go through it.
5. **`next.config.ts` has a `turbopack` block, but `npm run dev` runs with `--webpack`.** This is intentional. Don't switch the dev script to Turbopack without checking.
6. **No backend, no server actions, no API routes.** Every fetch in this app goes to `https://api.openai.com` from the browser.

## Adding a new portrait step

1. Append a new entry to `PORTRAIT_ANALYSIS_STEPS` in `app/lib/portraitSteps.ts` with `title`, `description`, `reference` (`"portrait" | "body"`), `requires`, and `buildPrompt`.
2. If the new report needs deterministic candidate selection (e.g. "pick 4 of 100 hairstyles"), add a `*Planner.ts` and put canonical data in `app/data/`. The render prompt should consume the planner's output and use `renderLockedDecisions` from `promptFragments.ts`.
3. Use `IDENTITY_PRESERVE_FRAGMENT` for portrait-only reports. Use `BODY_AWARE_IDENTITY_PRESERVE_FRAGMENT` for reports where face identity comes from the portrait and body scale/proportions come from the full-body photo.
4. Decide whether it should be visible. The active UI and Generate All flow use `VISIBLE_PORTRAIT_ANALYSIS_STEPS` in `app/page.tsx`.
5. Bump `ANALYSIS_SCHEMA_VERSION` in `app/lib/analysis.ts` if you added new fields the model must emit, and update the `mockPortrait` in `scripts/smoke-prompts.ts` to match. Run `npx tsx scripts/smoke-prompts.ts` to verify all prompts still build.

UI listing is data-driven from the visible step list.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + `@tailwindcss/postcss`
- TypeScript 5.9
- `lucide-react` for icons
- `jszip` for ZIP export (dynamic import)
- `jspdf` for PDF export (WIP)

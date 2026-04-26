# Page Refactor Plan

`app/page.tsx` is intentionally still one client page, but it has grown into the orchestration layer for uploads, analysis, persistence, generation, downloads, history, and UI. This plan keeps the app small while giving us a path to split it safely later.

## Goal

Make `page.tsx` easier to change without turning the personal app into a framework-heavy codebase.

The rule: extract stable seams only after behavior is proven. No route split, no backend, no global state library, no component abstraction for its own sake.

## Current Responsibilities

- API key storage and direct browser OpenAI calls
- image normalization and upload state
- portrait/body analysis orchestration
- IndexedDB hydration and persistence
- user profile and palette lock state
- single-report generation
- Generate All batch generation
- preview/history/download/ZIP/PDF actions
- all rendered form and report UI
- parked freeform mode

## Target Shape

Keep `app/page.tsx` as the composition root:

```text
page.tsx
  useApiKey()
  useUploads()
  useAnalysis()
  usePortraitMetadata()
  useGeneration()
  useHistoryDownloads()
  <SidebarControls />
  <PreviewPanel />
  <HistoryPanel />
```

The page should still read like the app's story, but it should not contain every implementation detail.

## Phase 0: Do Nothing Until Needed

Do not refactor while behavior is still moving quickly. The current file is large, but it is explicit and working. Refactor when one of these becomes true:

- adding a small feature requires touching unrelated upload/download/history code
- generation bugs are hard to isolate
- UI changes create long merge conflicts
- tests/smoke checks need direct access to logic trapped inside the component

## Phase 1: Extract Pure Helpers First

Low risk because these do not hold React state.

- Move download helpers into `app/lib/downloads.ts`
- Move OpenAI image request helpers into `app/lib/openaiImages.ts`
- Move image normalization helpers into `app/lib/imageFiles.ts`
- Move image-input assembly (`buildReportImageInputs`) into `app/lib/reportRuntime.ts`

Note: report blockers (`stepBlockers`) read React state (uploaded portrait, body, additional portraits) and are *not* pure helpers. They belong in `useUploads` (Phase 2), not in `reportRuntime.ts`. Don't smuggle them into Phase 1 — that's exactly the leakage this phase is meant to avoid.

Expected result: `page.tsx` still owns state, but side-effect helpers are easier to test and read.

## Phase 2: Extract Hooks Around State Machines

Only after Phase 1 settles.

- `useUploads` owns portrait/body/additional portrait files and previews; also exposes `stepBlockers(step)` since blockers are derived from upload state
- `useAnalysis` owns portrait/body analysis runs, aborts, cache lookup, and re-analyze
- `usePortraitMetadata` owns locked palette + user profile hydration/persistence
- `useActiveRun` owns the runId ref, abort controller, and cancel — shared infrastructure for both single and batch generation
- `useGenerateOne` builds on `useActiveRun` and owns the single-report flow
- `useBatchGeneration` builds on `useActiveRun` and owns Generate All, completed-count, failed-titles, and batch results
- `useHistoryDownloads` owns history, preview selection, download fallback, ZIP, PDF

The elapsed timer is a thin UI concern — keep it inline in `page.tsx` or fold it into `useActiveRun` if it ends up shared.

Each hook should expose a small explicit API. Avoid a giant `useGeneration()` or `useImagegenApp()` hook that just moves the same complexity somewhere else — splitting `useGeneration` into `useActiveRun` + `useGenerateOne` + `useBatchGeneration` is deliberate for exactly this reason.

## Phase 3: Extract UI Components

After hooks exist, split presentation. Order by state-isolation depth so early extractions don't ripple into later ones:

1. `ApiKeyPanel` — talks only to `useApiKey()`, zero coupling to other state
2. `AnalysisChips` — read-only derivation of `useAnalysis()`
3. `UploadsPanel` — owns its hook (`useUploads`) end-to-end
4. `PreferencesPanel` and `PaletteLockPanel` — both gated on `usePortraitMetadata()`
5. `PreviewPanel` and `HistoryPanel` — both consume `useHistoryDownloads()`
6. `ReportSelect`, `GenerateControls`, `BatchProgressPanel` — last, because they cross-cut hooks (active step, generation flow, batch progress)

Components should be mostly props-in/events-out. They should not import planners or OpenAI helpers.

What stays in `lib/`, not in components: `PORTRAIT_ANALYSIS_STEPS` and the per-step `buildPrompt` functions stay in `app/lib/portraitSteps.ts`. Don't smuggle step metadata or prompt-building into a component file as a refactor side-effect — `ReportSelect` consumes the step list as data, not as code.

## Phase 4: Optional Freeform Boundary

Freeform is parked but preserved. If it returns, isolate it behind:

- `FreeformControls`
- `useFreeformGeneration`

Do not mix freeform prompt state into portrait report state beyond shared preview/history.

## What Not To Do

- Do not introduce Redux, Zustand, XState, or server actions for the current app.
- Do not split routes unless there is a real navigation/product reason.
- Do not create generic component libraries beyond repeated local UI pieces.
- Do not refactor prompts and page state in the same change.
- Do not refactor planners and `page.tsx` in the same change. Planner shape changes ripple through every step's `buildPrompt`; mixing that with a hook extraction makes regression triage painful.
- Do not move user API key handling server-side; this app remains user-key/client-only.

## Recommended First Refactor When Ready

Start with `app/lib/downloads.ts`. Then `app/lib/openaiImages.ts`.

`downloads` is the cleanest seam — pure base64 munging, jszip dynamic import, jspdf, `showSaveFilePicker`. Zero React state, zero abort plumbing. Extracting it proves the seam pattern works without coupling to anything else.

`openaiImages` is harder than it looks: it's entangled with `parseOpenAIResponse`, `getImageFromResponse`, the elapsed-timer, and the abort-controller refs. Don't tackle it until `downloads` is extracted and you've decided how state-free helper files want to expose async APIs (signal in, base64 out, errors thrown).

Together, these are high-churn side-effect-heavy areas that do not need React state. Extracting them first gives the biggest readability win with the least behavior risk — but only in this order.

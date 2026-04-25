# imagegen

A browser-only Next.js 16 app that drives OpenAI's image generation API directly from the client using a user-supplied API key. The current default (and only selectable) flow is a multi-step **portrait analysis** pipeline — color season, face shape, hairstyles, wardrobe capsule, makeup, etc.

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
  page.tsx              ~1.8k-line "use client" component — ALL UI and state lives here
  globals.css           Tailwind v4 entry
  lib/
    portraitSteps.ts    PORTRAIT_ANALYSIS_STEPS — hardcoded prompt + reference type per step
    persistence.ts      IndexedDB helpers (history + cached analyses)
    analysis.ts         Portrait / body analysis types and helpers
    referenceImages.ts  Static reference images bundled with each step
public/references/      Reference images shown in the UI (color season chart, face shape chart, etc.)
```

Path aliases are **not** configured. All imports are relative.

### One component, two modes

`Home` in `app/page.tsx` drives both flows through a single `handleSubmit`:

| Mode | `appMode` | Endpoint | Notes |
|---|---|---|---|
| Portrait | `"portrait"` (default, currently the only selectable mode) | `/v1/images/edits` | Fixed pipeline of steps from `PORTRAIT_ANALYSIS_STEPS`. Each step has a hardcoded prompt and a required reference type: `"portrait"`, `"body"`, or `"hand"`. |
| Freeform | `"freeform"` | `/v1/images/generations` for the first call, `/v1/images/edits` for follow-ups | Follow-ups wrap the user prompt with `buildFollowUpPrompt` to preserve identity/composition. **Currently parked** — the UI does not let you switch into this mode, but the code paths must remain. |

Three independent file inputs feed the pipeline:

- `fileInputRef` — primary portrait
- `bodyInputRef` — full-body shot
- `handInputRef` — hand photo

`handleGenerateAllReports` runs the entire pipeline sequentially.

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
| Cached portrait/body analyses | IndexedDB `imagegen-history` / store `analyses` | content hash |

History entries store the full image inline as `data:image/png;base64,...` — that's also what the preview pane renders.

The `hasLoadedPersistedState` ref gates the save effect so the initial empty render does not overwrite restored state on mount. Don't remove this guard.

### Bundle / export

- `handleDownloadAll` dynamically imports `jszip` to keep it out of the initial bundle. Splits the data URL to recover raw base64 before zipping.
- `jspdf` is a dependency and `handleDownloadPdf` exists, but it is **WIP and not yet wired to a UI trigger**. Don't delete it.

## Conventions

- Single client component. All state lives in `Home`. New features should generally extend the existing state machine rather than adding new top-level routes — this app is intentionally a one-page tool.
- Tailwind v4 via `@tailwindcss/postcss`. Styles are inline class strings. Helper `cx(...)` joins conditionals.
- Comments are sparse on purpose. Only add one when the *why* is non-obvious.

## Things to know before changing code

1. **`appMode` is hardcoded to `"portrait"` and the freeform branch is intentionally kept.** `useState<AppMode>("portrait")` has no setter. The `!isPortraitMode` branches throughout `handleSubmit` and the JSX are parked, not dead. Do not delete them.
2. **PDF export is WIP.** `handleDownloadPdf` and `jspdf` exist without a current trigger. The user is actively wiring this up.
3. **The OpenAI key is in `localStorage` and rides on every `Authorization` header.** This is an accepted tradeoff for a personal-use tool. It does not need to be "fixed" or refactored into a server route.
4. **Don't bypass `normalizeImageForOpenAI`.** Every code path that uploads a file to OpenAI must go through it.
5. **`next.config.ts` has a `turbopack` block, but `npm run dev` runs with `--webpack`.** This is intentional. Don't switch the dev script to Turbopack without checking.
6. **No backend, no server actions, no API routes.** Every fetch in this app goes to `https://api.openai.com` from the browser.

## Adding a new portrait step

1. Append a new entry to `PORTRAIT_ANALYSIS_STEPS` in `app/lib/portraitSteps.ts` with `title`, `prompt`, and `reference` (`"portrait" | "body" | "hand"`).
2. If it needs a new reference image, drop it in `public/references/` and wire it through `app/lib/referenceImages.ts`.
3. The pipeline picks it up automatically — `handleGenerateAllReports` iterates the array.

No other changes are needed for the request side; UI listing is also data-driven.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + `@tailwindcss/postcss`
- TypeScript 5.9
- `lucide-react` for icons
- `jszip` for ZIP export (dynamic import)
- `jspdf` for PDF export (WIP)

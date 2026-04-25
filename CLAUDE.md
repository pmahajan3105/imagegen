# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (uses Webpack via `--webpack`, not Turbopack, despite the `turbopack` block in `next.config.ts`).
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + typescript presets).

There is no test runner configured.

## Architecture

This is a **browser-only** Next.js 16 App Router app (React 19, Tailwind v4). There is no backend route or server action — the client calls the OpenAI API directly with a user-supplied API key. Effectively the entire app is `app/page.tsx` (~1.8k lines), a single `"use client"` component.

### Two modes, one form

`Home` in `app/page.tsx` drives two flows through a single `handleSubmit`:

1. **Freeform** (`appMode === "freeform"`) — text-to-image via `POST https://api.openai.com/v1/images/generations`, or follow-up edits on the latest result / an uploaded image via `POST https://api.openai.com/v1/images/edits`. After the first generation, subsequent submits use `buildFollowUpPrompt` to wrap the user's instruction so identity/composition is preserved.
2. **Portrait** (`appMode === "portrait"`, currently the default and only selectable mode) — a fixed pipeline defined by `PORTRAIT_ANALYSIS_STEPS` (Color Season Report, Face Shape Map, Hairstyles Board, Wardrobe Capsule, etc.). Each step has a hardcoded prompt and a required `reference` image — `"portrait"`, `"body"`, or `"hand"` — backed by three independent file inputs (`fileInputRef`, `bodyInputRef`, `handInputRef`). `handleGenerateAllReports` runs the full pipeline sequentially.

The model, quality, size, and output format are constants at the top of the file (`gpt-image-2`, `high`, `1024x1536`, `png`); they are not user-configurable.

### Image preprocessing

`normalizeImageForOpenAI` re-encodes uploads as JPEG ≤2048px on a canvas with a white background before sending. Uploads always go through this — don't bypass it, as the OpenAI edits endpoint rejects some original formats and very large images.

### Persistence

- **API key** → `localStorage` under `personal-gpt-image-api-key`.
- **History + selected preview** → IndexedDB (`imagegen-history` DB, `state` store, key `latest`) via `openPersistenceDb` / `savePersistedState` / `loadPersistedState`. The `hasLoadedPersistedState` ref gates the save effect so the initial empty render doesn't overwrite restored state.

History entries store the full image as a `data:image/png;base64,...` URL inline, which is also what the preview pane renders. ZIP export (`handleDownloadAll`) splits the data URL to get raw base64 and dynamically imports `jszip` to keep it out of the initial bundle. `jspdf` is a dependency but not currently imported.

### Response handling

All OpenAI calls funnel through `parseOpenAIResponse` → `getImageFromResponse`, which expects `data[0].b64_json`. The API is configured to never return URLs, so a `url` response is treated as an error.

## Conventions

- Single client component; all state lives in `Home`. New features should generally extend the existing state machine rather than adding new top-level routes — this app is intentionally a one-page tool.
- Tailwind v4 via `@tailwindcss/postcss`; styles are inline class strings, helper `cx(...)` joins conditionals.
- Path aliases are not configured. Imports are relative.

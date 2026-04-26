# Pipeline Redesign

## Goal

Turn the portrait flow from a fixed-prompt template into a small reasoning pipeline that does real analysis before generation, surfaces grounded options, and learns from the user's picks over time.

## Current state

`PORTRAIT_ANALYSIS_STEPS` runs hardcoded prompts against `gpt-image-2`. The model classifies and generates in one shot — no measurement, no grounding against a canonical reference, no candidate exploration, no feedback loop. Output drift across runs is high because palettes and rules are reconstructed from the model's training data each time.

## Core insight

The VLM should be a *renderer*, not an *oracle*. Deterministic code does the measurement, curated reference data does the grounding, and the model interprets numbers and writes prose. It does not estimate things that can be computed.

## Pipeline shape

```
Uploads (portrait, body, hand)
  │
  ▼
A. Measure          → deterministic features
B. Ground           → canonical rules per candidate
C. Hypothesize      → branch only when measurements are ambiguous
D. Generate         → existing PORTRAIT_ANALYSIS_STEPS, parameterized
E. Present          → variants + rationale, user picks
F. Log              → persist features + picks for future signal
```

### A. Measure (browser-side, no model call)

- Skin pixel sampling on forehead/cheek regions: RGB to LAB; `b*` channel for warm/cool, `L*` for light/deep, chroma for clear/muted.
- Wrist vein hue sampling on the hand image: an independent undertone signal.
- Face landmarks via MediaPipe (in-browser): forehead/cheek/jaw ratios, length-to-width, jaw angle, mapped to shape candidates with confidence.
- Body silhouette ratios via segmentation: shoulder/waist/hip, mapped to body shape candidates.

Output: a structured analysis JSON with a confidence value per axis.

### B. Ground

- One canonical color system, picked once and committed to. Recommend House of Colour 12-season; Sci/Art 12-season is the alternative. Mixing systems is the single biggest cause of incoherent output today.
- Encoded as a JSON constant in the repo: `COLOR_SYSTEM[season] = { palette: [hex...], avoid: [hex...], rules: [...] }`.
- Same pattern for face shape rules and body shape rules.
- Curated data, not a database. Roughly 200 entries total. Lives in `data/`.

### C. Hypothesize

- For each axis, if confidence is high, pick the top candidate.
- If borderline (top two within ~0.15 confidence), keep both alive.
- Combine into 2–3 candidate scenarios. Not a full Cartesian product.

### D. Generate

- Existing `PORTRAIT_ANALYSIS_STEPS` stay, but each step's prompt is templated against the grounded palette/rules for the current hypothesis.
- Run once per alive hypothesis.
- Same model, same params as today.

### E. Present

- UI shows the candidate hypotheses side by side with one-line rationale per axis (e.g. "Soft Autumn because skin b\* = 8.2, sits in the muted-warm band").
- User picks the winner.
- No automated judge in v1. The user is the judge.

### F. Log

- Phase 1: IndexedDB, alongside the existing history store.
- Phase 2 (only if needed): backend + Postgres.
- What to log: input features, candidate hypotheses, user pick, generated image hashes.
- This becomes few-shot fuel for later phases.

## Phased rollout

| Phase | Adds | Skips |
|---|---|---|
| 1. Ground + decompose | Hardcoded color system JSON, per-axis prompt templates | Measurement, variants |
| 2. Measure | LAB sampling, MediaPipe landmarks, structured analysis JSON | Variants, log |
| 3. Variants + log | Multi-hypothesis generation, picker UI, IndexedDB pick log | Backend |
| **Decision point** | — | — |
| 4. Backend (only if needed) | Vercel + Neon Postgres for the shared pick log | — |
| 5. Visual reference corpus | Curated labeled portrait set + pgvector + nearest-neighbor lookup | Fine-tuning |

Phases 1–3 are roughly a week of focused work. The decision point is where we look at real pick data and decide which axis is failing most before investing further. Phase 5 is the real upgrade and is only worth it if grounding plus measurement still hits a ceiling.

## What we are explicitly not doing

- **No fine-tuning.** In-context few-shot examples from the pick log update for free and are sufficient for this domain.
- **No "deep research" web scrape.** Most of that content is already in the VLM's training data; marginal value is near zero. Curated rules beat scraped volume.
- **No auto-judge in v1.** VLM scoring of its own outputs is noisy. User picks are the ground truth signal we actually need.
- **No multi-agent framework.** "Specialists" are decomposed prompts with retrieved context. No orchestration framework required.
- **No backend in Phases 1–3.** Browser-only is sufficient until real data tells us what to centralize.
- **No multiple color systems.** Pick one, ship with it.

## The one bet worth flagging

The **visual reference corpus** (Phase 5) is the move that would make this system meaningfully smarter than well-grounded prompting. A few hundred portraits, expert-labeled by season and shape, embedded with a vision model (CLIP or SigLIP), stored in pgvector. At runtime: embed the user's portrait, find nearest neighbors, use their labels as a strong prior on the hypothesis space. This is the only piece that is hard to copy and that introduces *new visual judgment*, not just better text.

It is also the most expensive to build (sourcing portraits with valid licensing, expert labeling). Defer until the pick log proves it is needed.

## Open questions

- Which color system to anchor on: House of Colour vs Sci/Art vs Korean Personal Color?
- How should user picks interact with the canonical system over time — override the rules, or just bias the hypothesis ranking?
- Is the "hand" reference image purely for vein-hue sampling, or do we also want it to drive jewelry and nail recommendations?
- For variant rendering: regenerate all `PORTRAIT_ANALYSIS_STEPS` per hypothesis, or just one "preview tile" per hypothesis with the full deck only after picking? The latter is much cheaper.

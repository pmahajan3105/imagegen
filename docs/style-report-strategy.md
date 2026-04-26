# Style Report Strategy

This app is a personal style-report generator, not a professional color-analysis or body-analysis tool. The report flow avoids pretending that one uploaded photo can produce exact, objective conclusions.

For the canonical design, see [`recommendation-pipeline.md`](recommendation-pipeline.md). For runtime data flow, see [`flow.md`](flow.md). For current build status, see [`status.md`](status.md).

## Active Reports (10)

The visible report flow as defined in `app/lib/portraitSteps.ts` and ordered by `VISIBLE_REPORT_ORDER` in `app/page.tsx`:

1. Palette Calibration
2. Palette Direction Report
3. Face Balance Map
4. Best Hairstyles Board
5. Wardrobe Capsule Board
6. Makeup Shade Guide *(presentation-gated; renders as a 7-section grid for makeup variant or 5-section grid for grooming variant, with 4 identity-preserved feature close-ups in either mode)*
7. Accessory & Jewelry Metals Guide
8. Eyeglasses / Frames Guide
9. Silhouette Balance Guide
10. Outfit Style Guide

`HIDDEN_REPORT_TITLES` in `app/page.tsx` is currently empty — every step in `PORTRAIT_ANALYSIS_STEPS` is visible.

## Retired Reports

The following reports have been **fully removed** from `PORTRAIT_ANALYSIS_STEPS` (tombstone comments at the bottom of `portraitSteps.ts` document each retirement and its reason):

- **Nail Color Guide** — required a hand-photo upload and legacy palette fields. The hand reference type was retired; the legacy fields were dropped in the v7 schema cleanup.
- **Makeup Feature Guide** — its identity-preserved feature close-ups were folded into the rewritten Makeup Shade Guide (now a hybrid mode).
- **Use Carefully Guide** — content folded into Palette Direction Report's `USE CAREFULLY (CONDITIONAL)` subsection.

## Palette Flow

Season detection from a single uploaded portrait is not reliable enough to treat as ground truth. Lighting, camera white balance, skin reflection, makeup, filters, shadows, and hair dye can all shift the apparent season.

The product language separates two ideas:

- **Palette Calibration** is the evidence report. The portrait analyzer emits 2–3 `paletteHypotheses` with supporting signals and risk notes. Calibration renders drape strips for each. The user **locks** one hypothesis here; the lock is stored per-portrait in IndexedDB (`portraitMetadata` store).
- **Palette Direction Report** is the summary. It pulls canonical Sci/Art-12 swatches and rules for the locked direction and labels itself `LOCKED BY YOU` (user picked) or `MODEL-SUGGESTED` (no user lock; falling back to the top hypothesis).

Lock UX shipped with Phase 1.5 + Phase 2 (see [`status.md`](status.md)).

## Recommendation Engine

The recommendation engine is **built**. Each domain has:

- A **canonical data file** in `app/data/` with rule books, palettes, and catalog entries.
- A **planner** in `app/lib/` that filters and scores candidates deterministically against `PortraitAnalysis`, `BodyAnalysis`, and `UserProfileContext`.
- A **render prompt** that uses `renderLockedDecisions` from `promptFragments.ts` to instruct the image model to render exactly N selected items, no inventions.

Domains covered:

| Domain | Canonical data | Planner |
|---|---|---|
| Color seasons | `colorSystem.ts` (12 Sci/Art seasons) | (validator-attached, not a separate planner) |
| Hairstyles | `hairstyleLibrary.ts` (100 entries) | `hairstylePlanner.ts` |
| Eyewear | `eyewearLibrary.ts` (5+8+30) | `eyewearPlanner.ts` |
| Wardrobe | `wardrobeCapsules.ts` (6 capsules × 18 slots) | `wardrobePlanner.ts` |
| Jewelry | `jewelryRules.ts` (8 metals + finishes + watch guidance) | `jewelryPlanner.ts` |
| Makeup | `makeupRules.ts` (7 makeup + 5 grooming sections) | `makeupPlanner.ts` |
| Silhouette | `silhouetteRules.ts` (5 shapes + 15 variants) | (validator-attached) |
| Face shapes | `faceShapeRules.ts` (8 shapes) | (validator-attached) |
| Outfit composition | `outfitRules.ts` (3 occasions × 6 subsections) | (consumed inline by the Outfit Style Guide step) |

The image model never invents recommendations — it renders the planner's output. The principle from the original strategy doc holds: **"The image model should render selected recommendations, not decide the recommendations inside the visual report prompt."**

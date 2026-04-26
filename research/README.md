# Research

Source-of-record for the curated knowledge that feeds `app/data/*.ts`.

## Pipeline

```
research/prompts/*.md   →   research model   →   research/*.md   →   curation pass   →   app/data/*.ts
(input prompts)             (research model)                 (raw output)        (hand-edited)        (source of truth
                                                                                                        consumed by code)
```

The principle: **research informs the recommendation engine, not the image prompt.** The image model receives a `RecommendationPlan` derived from `app/data/*.ts`; it never reads the markdown here, and never browses the web at runtime.

## Folder layout

```
research/
├── README.md                                       (this file)
├── prompts/                                        (input prompts to paste into the research model)
│   ├── color-theory-prompt.md
│   ├── hairstyle-library-prompt.md
│   ├── face-shape-principles-prompt.md
│   ├── eyewear-fit-rules-prompt.md
│   ├── silhouette-balance-principles-prompt.md
│   ├── wardrobe-capsule-structures-prompt.md
│   ├── outfit-composition-rules-prompt.md
│   ├── jewelry-metals-rules-prompt.md
│   └── makeup-grooming-rules-prompt.md
└── *.md                                            (output of the research model, one per topic)
    ├── color-theory.md                             (target — populates app/data/colorSystem.ts)
    ├── hairstyle-library.md                        (target — populates app/data/hairstyleLibrary.ts)
    ├── face-shape-principles.md                    (target — populates app/data/faceShapeRules.ts)
    ├── eyewear-fit-rules.md                        (target — populates app/data/eyewearLibrary.ts)
    ├── silhouette-balance-principles.md            (target — populates app/data/silhouetteRules.ts)
    ├── wardrobe-capsule-structures.md              (target — populates app/data/wardrobeCapsules.ts)
    ├── outfit-composition-rules.md                 (target — populates app/data/outfitRules.ts)
    ├── jewelry-metals-rules.md                     (target — populates app/data/jewelryRules.ts)
    └── makeup-grooming-rules.md                    (target — populates app/data/makeupRules.ts)
```

## Workflow per research topic

1. Open the relevant prompt file under `research/prompts/`.
2. Copy the body between the two `---` markers (the "Prompt" section).
3. Paste into your chosen research model.
4. Save the response verbatim as `research/<topic>.md` (sibling to README, NOT inside `prompts/`).
5. Skim the output for sanity (correct sections, defensible values, no `TBD` slots in must-have fields).
6. Hand off to Claude (or next agent) to port relevant entries into the corresponding `app/data/*.ts` file and flip any `populated` flags.

## Research targets

| Prompt | Output | Data destination | Status |
|---|---|---|---|
| `prompts/color-theory-prompt.md` | `color-theory.md` | `app/data/colorSystem.ts` | **Landed and ported (all 12 seasons populated)** |
| `prompts/hairstyle-library-prompt.md` | `hairstyle-library.md` | `app/data/hairstyleLibrary.ts` | **Landed and ported (100 entries)** |
| `prompts/face-shape-principles-prompt.md` | `face-shape-principles.md` | `app/data/faceShapeRules.ts` | **Landed and ported (8 shapes with necklines / earrings / frames / haircut advice)** |
| `prompts/eyewear-fit-rules-prompt.md` | `eyewear-fit-rules.md` | `app/data/eyewearLibrary.ts` | **Landed and ported (5 universal rules + 8 face-shape rule sets + 30 catalog entries)** |
| `prompts/silhouette-balance-principles-prompt.md` | `silhouette-balance-principles.md` | `app/data/silhouetteRules.ts` | **Landed and ported (5 shapes + 15 variants + universal principles)** |
| `prompts/wardrobe-capsule-structures-prompt.md` | `wardrobe-capsule-structures.md` | `app/data/wardrobeCapsules.ts` | **Landed and ported (6 capsules × 18 slots; v2 schema with slot IDs, intent tags, formality ranges, outfit formulas, substitution rules)** |
| `prompts/outfit-composition-rules-prompt.md` | `outfit-composition-rules.md` | `app/data/outfitRules.ts` | **Landed and ported (3 occasions × 6 subsections each)** |
| `prompts/jewelry-metals-rules-prompt.md` | `jewelry-metals-rules.md` | `app/data/jewelryRules.ts` | **Landed and ported (8 metals + 5 finishes + 3 scales + mixed-metals rules + 8 watch-by-face-shape entries)** |
| `prompts/makeup-grooming-rules-prompt.md` | `makeup-grooming-rules.md` | `app/data/makeupRules.ts` | **Landed and ported (7 makeup sections × 9 grid entries + 5 grooming sections; glasses/frame and hair-color cross-references captured)** |

## What goes where

| Belongs in `research/` | Belongs in `app/data/` |
|---|---|
| Long-form prose, citations, debate | Structured TypeScript values |
| Multiple competing systems | One canonical chosen system |
| Source URLs, paper references | Stable IDs, hex codes, rule strings |
| Drafts, edits, notes | Production code |

## What does NOT belong here

- Live web research at runtime
- Per-user research lookups
- Unstructured raw scrapes — curate before committing

See [`../docs/recommendation-pipeline.md`](../docs/recommendation-pipeline.md) for the full design.

# Style Report Strategy

This app is a personal style-report generator, not a professional color-analysis or body-analysis tool. The report flow should avoid pretending that one uploaded photo can produce exact, objective conclusions.

## Current Active Reports

The visible report flow intentionally focuses on the reports that are most useful or still worth improving:

1. Palette Calibration
2. Palette Direction Report
3. Face Shape And Feature Map
4. Best Hairstyles Board
5. Wardrobe Capsule Board
6. Makeup Shade Guide
7. Accessory & Jewelry Metals Guide
8. Eyeglasses / Frames Guide
9. Body Shape Guide
10. Outfit Style Guide

These are filtered in `app/page.tsx` through `VISIBLE_PORTRAIT_ANALYSIS_STEPS`.

## Hidden Reports

The following reports are intentionally hidden from the dropdown and Generate All flow, but their prompt code remains in `app/lib/portraitSteps.ts` so they can be restored later:

- Nail Color Guide
- Makeup Feature Guide
- Use Carefully Guide

Reasoning:

- Nail Color Guide is useful but lower priority and requires a hand photo.
- Makeup Feature Guide overlaps with Makeup Shade Guide.
- Use Carefully Guide is better as a section inside palette guidance than as a standalone negative report.

## Palette Flow Decision

Season detection from a single uploaded portrait is not reliable enough to treat as ground truth. Lighting, camera white balance, skin reflection, makeup, filters, shadows, and hair dye can all shift the apparent season.

The product language now separates two ideas:

- `Palette Calibration` is the evidence report. It compares colors near the face and should be treated as the first thing to inspect.
- `Palette Direction Report` is the summary report. It presents the most likely palette direction, color rules, metals, and use-carefully colors. It should be phrased as "most likely" or "palette direction", not a definitive diagnosis.

Future work should make Palette Calibration interactive: show likely palette hypotheses, let the user choose the best-looking row, then lock that palette before rendering the summary and downstream reports.

## Recommendation Engine Future

The current app still relies heavily on prompt instructions plus the cached `PortraitAnalysis` and `BodyAnalysis`.

A stronger version should add a structured recommendation layer before rendering:

1. Generate many candidate options for a report.
2. Score them against the analyzed person and any user preferences.
3. Select the best few options.
4. Send those locked decisions to GPT Image for rendering.

The image model should render selected recommendations, not decide the recommendations inside the visual report prompt.

Possible future cached shape:

```ts
type RecommendationPlan = {
  paletteHypotheses: Array<{
    name: string;
    confidence: "low" | "medium" | "high";
    reason: string;
  }>;
  hairstyles: Array<{
    name: string;
    score: number;
    reason: string;
    constraints: string[];
  }>;
  outfitLooks: Array<{
    label: string;
    garments: string[];
    colors: string[];
    whyItWorks: string;
  }>;
};
```

Keep this as a later step. Palette reliability should be improved before building a broader recommendation engine.


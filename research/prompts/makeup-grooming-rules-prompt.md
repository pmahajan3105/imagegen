# Research Prompt: Makeup / Grooming Rules

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/makeup-grooming-rules.md` and will then be ported into `app/data/makeupRules.ts`.

---

## Prompt (copy from here)

You are producing structured makeup-and-grooming shade-direction guidance for a personal styling app. The app gates this report by visible presentation: feminine and feminine-leaning users see the "Makeup Direction" variant; masculine and masculine-leaning users see the "Grooming Direction" variant. Your output covers both.

The rules reference **undertone (warm/cool/neutral), depth (light/medium/deep), chroma (soft/clear/bright), and contrast (low/medium/high)** in the abstract — the app maps the user's locked palette into these dimensions.

The output is **brand-agnostic**, **SKU-agnostic**, and **shade-range-only** (never exact foundation numbers, never invented brand names). Shade families and descriptive ranges only.

### Output structure

The file has 2 parts.

### Part 1: Makeup Direction (feminine / feminine-leaning)

7 sections, in this order: foundation-and-complexion, concealer, blush, eyeshadow, eyeliner-and-mascara, brow, lip.

For each section, two sub-blocks: **Safe everyday** and **Statement**. Each sub-block is keyed by undertone × depth and gives shade-family direction (not specific products).

Section template per section:

```md
## {Section display name}

**ID:** `{id}`
**Goal:** {one-line objective for this category}

### Safe everyday
- **Warm × light:** {shade-family description}
- **Warm × medium:** ...
- **Warm × deep:** ...
- **Cool × light:** ...
- **Cool × medium:** ...
- **Cool × deep:** ...
- **Neutral × {depth}:** {note that neutrals can borrow from either side}

### Statement
- **Warm × any depth:** {bolder shade-family direction}
- **Cool × any depth:** {bolder shade-family direction}
- **Neutral × any depth:** ...

### Finish guidance
- {Matte / dewy / satin guidance keyed to chroma — soft chroma → satin, bright chroma → dewy or matte, etc.}

### Use carefully
- {Shade families to use carefully and why}
```

The 7 sections (with IDs):

| ID | Display name | Goal |
|---|---|---|
| `foundation-complexion` | Foundation & Complexion | Match skin without over-correcting; finish keyed to chroma |
| `concealer` | Concealer | Brighten under-eye and even tone without depositing chalk |
| `blush` | Blush | Add warmth or cool flush; placement varies by face shape (note this) |
| `eyeshadow` | Eyeshadow | Define and complement eye color; harmonize with locked-palette accent colors |
| `eyeliner-mascara` | Eyeliner & Mascara | Define lash and eye line; intensity keyed to contrast |
| `brow` | Brow | Frame the face; tone keyed to hair color |
| `lip` | Lip | Anchor or accent the look; intensity keyed to contrast and presence of other statement makeup |

### Part 2: Grooming Direction (masculine / masculine-leaning)

5 sections, in this order: skin-tonics, lip-balm, beard-care, eyebrow-direction, complexion-enhancers.

Section template:

```md
## {Section display name}

**ID:** `{id}`
**Goal:** {one-line objective}

### Direction by undertone
- **Warm:** {shade-family direction}
- **Cool:** {shade-family direction}
- **Neutral:** {shade-family direction}

### Use carefully
- {Cautions framed as conditional}

### Notes
- {Optional 1-line cue}
```

The 5 sections (with IDs):

| ID | Display name | Goal |
|---|---|---|
| `skin-tonics` | Skin Tonics & Sunscreen Tints | Even tone, healthy finish, sunscreen with skin-tone tints |
| `lip-balm` | Lip Balm Tones | Tinted balm direction (no full lipstick); subtle warmth or cool |
| `beard-care` | Beard Care Tones | Beard oil, beard balm, dye direction (if applicable) |
| `eyebrow-direction` | Eyebrow Direction | Brow grooming, fill (if applicable), tone keyed to hair color |
| `complexion-enhancers` | Complexion Enhancers | Light bronzer, healthy flush, tinted moisturizer — subtle, not glam |

### Rules of engagement

1. **No brand names, no SKUs, no exact foundation numbers.** Say "warm light beige" not "Estée Lauder Double Wear 2W1 Dawn." Shade families only.
2. **Brand-agnostic descriptions** that map to many products: e.g. "warm peach with a soft golden undertone" works across product lines.
3. **Undertone × depth grid is the primary key.** Always provide guidance for warm, cool, and neutral, plus all three depths where the section's variation matters.
4. **Statement vs Safe everyday is the secondary key.** Safe everyday is muscle memory; Statement is the bolder choice for accent moments.
5. **Finish guidance** in Part 1 keys finish (matte / dewy / satin) to chroma. Soft chroma → satin/matte; clear or bright chroma → dewy or polished.
6. **"Use carefully" not "avoid."** Frame conditional cautions.
7. **Grooming variant must NOT include full makeup categories.** No eyeshadow, no full lipstick, no blush. Skin tonic, lip balm, beard care, eyebrow grooming, subtle complexion enhancement only.
8. **Skin-concerns awareness is fine but optional.** Not required for the file.
9. **No essays.** Each section ~25 lines max.

### Reference examples

```md
## Foundation & Complexion

**ID:** `foundation-complexion`
**Goal:** Match skin without over-correcting; finish keyed to chroma.

### Safe everyday
- **Warm × light:** ivory-to-warm-beige range; golden undertone descriptor; sheer-to-medium coverage.
- **Warm × medium:** warm-honey to warm-toffee; golden or peach base; medium coverage.
- **Warm × deep:** warm-mahogany to warm-espresso; golden or red base; medium coverage.
- **Cool × light:** porcelain-to-cool-beige; pink or rosy undertone; sheer-to-medium coverage.
- **Cool × medium:** rose-beige to cool-tan; pink or neutral-pink base; medium coverage.
- **Cool × deep:** cool-mahogany to cool-espresso; red or red-violet base; medium coverage.
- **Neutral × any depth:** neutral-balanced bases; pull from warm or cool side as the season day demands.

### Statement
- **Warm × any depth:** dewy-glow finish that catches the chroma of the locked palette's signature.
- **Cool × any depth:** satin-to-dewy with subtle pink wash; never matte-flat.
- **Neutral × any depth:** balanced satin; lean either direction by occasion.

### Finish guidance
- Soft chroma → satin (skin-like) finish.
- Clear / bright chroma → dewy or luminous finish.
- Avoid heavy matte unless the user specifically wants the editorial look.

### Use carefully
- Foundation that's a half-shade off in undertone reads dramatically wrong; better undershade than over.
- Heavy matte coverage on dry/older skin (cakes in lines).
- "One shade lighter for highlight" trick — only works if undertone matches.
```

```md
## Lip Balm Tones

**ID:** `lip-balm`
**Goal:** Tinted balm direction (no full lipstick); subtle warmth or cool.

### Direction by undertone
- **Warm:** golden-peach, warm-coral, soft-amber tints — skin-toned plus warmth, not pigmented color.
- **Cool:** rose, plum-tinted, cool-berry tints — soft pink-leaning, never neon or bright.
- **Neutral:** clear or skin-toned with very faint pigment; "your lips but better."

### Use carefully
- Bright pigmented lipsticks (those belong in the Makeup variant).
- Heavy gloss in non-event contexts (reads performative).

### Notes
- Tinted lip balms are the right grooming move for everyday polish without makeup signaling.
```

### Deliverable

A single markdown file titled `makeup-grooming-rules.md` with:
1. Optional one-paragraph header noting sourcing approach.
2. **Part 1: Makeup Direction (feminine / feminine-leaning)** — 7 sections.
3. **Part 2: Grooming Direction (masculine / masculine-leaning)** — 5 sections.

Use clear `# Part 1` and `# Part 2` dividers.

Nothing else.

### Sources to prefer

- Makeup-artist publications and color-theory educators (Lisa Eldridge, Wayne Goss, Sephora education pages).
- Stylist publications on undertone × shade matching.
- Men's grooming references on skin tone × tinted product (Aesop, Bevel, Beardbrand education content).

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/makeup-grooming-rules.md`.
3. Verify both parts are present, all 7 + 5 sections populated, undertone × depth grid filled where applicable.
4. Hand off to Claude (or next agent) to port into `app/data/makeupRules.ts`.

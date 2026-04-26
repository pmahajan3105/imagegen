# Research Prompt: Eyewear Fit Rules

This is the prompt to paste into a research model. Output saved as `research/eyewear-fit-rules.md`, ported into `app/data/eyewearLibrary.ts`.

---

## Prompt (copy from here)

You are producing two structured outputs in one markdown file:

1. **Frame guidance per face shape** (8 face shapes, what frame characteristics work).
2. **A frame catalog** (~30 entries) tagged by face shape, presentation, and material.

The app uses both to recommend 6 frames per user after filtering on face shape, presentation, current hair color, and locked palette.

### Part 1: Frame Rules by Face Shape

For each of the 8 face shapes (`oval`, `round`, `square`, `rectangle`, `oblong`, `heart`, `diamond`, `triangle`), produce:

```md
## {Face Shape}

**ID:** `{id}`

### Best frame shapes
- {list of frame shape categories that flatter this face}

### Use carefully
- {frame shape categories that amplify rather than balance the face shape}

### Material guidance
- {acetate vs metal vs titanium vs mixed; thickness preferences}

### Bridge style guidance
- {keyhole, saddle, adjustable nose pads — when which works best}

### Brow line guidance
- {how the top of the frame should relate to the natural brow}

### Color/contrast guidance
- {how frame color should relate to hair color, skin tone, and face contrast}
```

### Part 2: Frame Catalog (~30 entries)

For each catalog entry, use:

```md
## {Frame Display Name}

**ID:** `{kebab-case-id}`
**Shape category:** {Round | Square | Rectangle | Aviator | Cat-eye | Oval | Geometric | Browline | Wayfarer | Other}
**Material:** {Acetate | Metal | Titanium | Mixed}
**Thickness:** {thin | medium | thick}
**Color tone:** {Warm | Cool | Neutral} — describe in palette terms (e.g. "warm tortoise", "cool gunmetal")
**Bridge style:** {Saddle | Keyhole | Adjustable pads}
**Compatible face shapes:** {comma-separated list}
**Compatible presentations:** {masculine | feminine | androgynous, comma-separated}
**Reads as:** {classic | modern | bold | minimal | retro}
**Use carefully if:** {free-form short clause, or "(none)"}
**Notes:** {optional styling note; omit if nothing useful}
```

Spread the catalog across:
- 8–10 classic/conservative frames
- 8–10 modern/minimal frames
- 6–8 bold/statement frames
- 4–6 retro/throwback frames

Include both metal and acetate, both warm-tone and cool-tone, both standard and modern bridge styles.

### Rules of engagement

1. **Frame shapes are categorical, not branded.** Don't list "Ray-Ban Wayfarer"; list "wayfarer-style rectangle."
2. **Compatibility means flattering**, not "wearable." A frame should appear under a face shape only if it genuinely balances the face.
3. **Color/contrast guidance** in Part 1 should give actionable palette rules ("warm tortoise harmonizes with warm hair; cool gunmetal pairs with cool hair"), not vague "match your tone."
4. **Brow line rule:** the top of most frames should follow or sit just below the natural brow line. Note exceptions (cat-eye, browline).
5. **Frames must not hide eyes.** Note in Part 1 that thick glossy frames covering the eye line are problematic regardless of face shape.
6. **No essays.** Per-section ~20 lines.

### Reference example (Part 1)

```md
## Square

**ID:** `square`

### Best frame shapes
- Round, oval, geometric (curved), aviator (with rounded edges)

### Use carefully
- Hard rectangle, sharp wayfarer (amplifies jaw), strict square frames

### Material guidance
- Thin metal or titanium softens the angular jaw; thick chunky acetate can compete with strong jawline.

### Bridge style guidance
- Adjustable pads or saddle; keyhole works for retro looks.

### Brow line guidance
- Frame top should sit at or just below natural brow; avoid frames that arch above the brow.

### Color/contrast guidance
- Cool tones (gunmetal, silver, slate) and warm tortoise both work; very dark frames can over-anchor the strong jaw.
```

### Reference example (Part 2)

```md
## Rounded Acetate Tortoise

**ID:** `rounded-acetate-tortoise`
**Shape category:** Round
**Material:** Acetate
**Thickness:** medium
**Color tone:** Warm — warm tortoise pattern
**Bridge style:** Saddle
**Compatible face shapes:** Square, Rectangle, Diamond, Heart
**Compatible presentations:** masculine, feminine, androgynous
**Reads as:** classic
**Use carefully if:** Very round face (can amplify roundness)
**Notes:** Versatile go-to; warm tortoise harmonizes with warm hair colors.
```

### Deliverable

One markdown file titled `eyewear-fit-rules.md` with:
1. Optional one-paragraph header noting sourcing.
2. **Part 1: Frame Rules by Face Shape** — 8 sections, one per face shape.
3. **Part 2: Frame Catalog** — ~30 entries, grouped by shape category if helpful.

Use clear `# Part 1: Frame Rules by Face Shape` and `# Part 2: Frame Catalog` dividers.

Nothing else.

### Sources to prefer

- Optical industry frame-fit guides (Warby Parker, EyeBuyDirect, Zenni style guides).
- Vintage eyewear catalogs for retro classifications.
- Fashion publications with face-shape × frame-shape compatibility tables.

---

## Usage notes (after paste)

1. Paste into your chosen research model.
2. Save output as `research/eyewear-fit-rules.md`.
3. Verify each face shape has guidance for all 6 sub-sections in Part 1, and that the catalog spans the four "reads as" categories (classic/modern/bold/retro).
4. Hand off for porting into `app/data/eyewearLibrary.ts`.

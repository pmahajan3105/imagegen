# Research Prompt: Hairstyle Library

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/hairstyle-library.md` and will then be ported into `app/data/hairstyleLibrary.ts`.

---

## Prompt (copy from here)

You are populating a catalog of hairstyles for a personal styling app. The app uses this catalog to generate 4 recommended hairstyles per user, after deterministic filtering by face shape, presentation, hair length, hair texture, facial hair, maintenance tolerance, and user constraints. Your job is to produce one markdown file (`hairstyle-library.md`) with **80–100 hairstyle entries** tagged with the dimensions the app filters on.

### Tagging dimensions

Each hairstyle must be tagged with:

- **Presentation:** any of `masculine`, `feminine`, `androgynous` (one or more)
- **Compatible face shapes:** any of `Oval`, `Round`, `Square`, `Rectangle`, `Oblong`, `Heart`, `Diamond`, `Triangle`
- **Hair length required:** any of `Buzz`, `Short`, `Medium`, `Shoulder`, `Long` (the starting length the cut requires; if achievable from multiple, list them all)
- **Hair textures:** any of `Straight`, `Wavy`, `Curly`, `Coily`
- **Facial hair compatible:** any of `None`, `Stubble`, `Mustache`, `Goatee`, `Beard`, `Full Beard` (which facial-hair levels pair cleanly with this style; use `None` if the style only works clean-shaven)
- **Maintenance:** one of `low`, `medium`, `high`
- **Tone:** one of `professional`, `neutral`, `bold` (how the style reads in workplace/social contexts)

Be conservative with face-shape compatibility — list only shapes the style genuinely flatters, not "all shapes." If a style works for most shapes, list 4–6, not all 8.

### Coverage targets (≈80–100 entries total)

Spread entries across:

- **Short cuts** (Buzz, Short): buzz, crew cut, ivy league, taper fade, mid fade, low fade, French crop, textured crop, classic side part, slicked side part, undercut, modern pompadour, etc.
- **Medium cuts**: brushed-back medium, layered medium, side-swept medium, modern shag, curtain bangs, blunt bob, asymmetrical bob, pixie variants, etc.
- **Shoulder/Long cuts**: long layers, beach waves, loose waves, blunt long, lob, shag (long), curtain layers, half-up styles, blowout, etc.
- **Texture-specific**: defined curl cut, curly bob, coily fade, coily afro, shaped natural, etc.
- **Modern/contemporary**: modern mullet, wolf cut, butterfly cut, etc.

Spread across presentations: roughly 30–40% masculine, 30–40% feminine, 20–30% androgynous (or styles that span multiple presentations).

### Section template (use verbatim per hairstyle)

```md
## {Display Name}

**ID:** `{kebab-case-id}`
**Description:** {1–2 sentence visual description}
**Presentation:** {masculine | feminine | androgynous, comma-separated if multiple}
**Face shapes:** {comma-separated list}
**Hair length required:** {comma-separated list}
**Hair textures:** {comma-separated list}
**Facial hair compatible:** {comma-separated list}
**Maintenance:** {low | medium | high}
**Tone:** {professional | neutral | bold}
**Disallowed if:** {free-form short clause, or "(none)"}
**Notes:** {optional styling tip; omit if nothing useful}
```

### Rules of engagement

1. **Be specific with names.** "Textured Crop" beats "modern men's haircut." Names appear in app UI.
2. **Tag compatibility, don't gatekeep.** Every style should be wearable by someone; tags filter to the right someones.
3. **`disallowedIf` is for hard exclusions** like "very curly hair" on a slick-back, or "facial hair below stubble" on a clean-cut style.
4. **No celebrity references in the catalog.** Mentioning "1970s Bowie" in a description is fine; the catalog itself should feel timeless.
5. **No overlapping IDs.** Each `id` is unique kebab-case.
6. **No essays.** Each entry ~12 lines max.

### Reference example

```md
## Textured Crop

**ID:** `textured-crop`
**Description:** Short on sides with a longer textured top, slightly tousled finish; reads modern and structured.
**Presentation:** masculine, androgynous
**Face shapes:** Oval, Round, Square, Diamond
**Hair length required:** Short, Medium
**Hair textures:** Straight, Wavy
**Facial hair compatible:** None, Stubble, Mustache, Goatee, Beard
**Maintenance:** medium
**Tone:** neutral
**Disallowed if:** Very curly or coily hair
**Notes:** Use a matte clay or paste; works best with 2–4 inches of length on top.
```

### Deliverable

A single markdown file titled `hairstyle-library.md` containing:
1. An optional one-paragraph header noting your sourcing approach.
2. 80–100 hairstyle entries, each following the section template exactly.

Group entries by length with `### Length: Short`, `### Length: Medium`, etc. subheadings. Keep section formatting consistent.

Nothing else. No JSON, no code, no commentary outside section blocks.

### Sources to prefer

- Barber and stylist publications (American Crew, Goldwell, Sassoon editorial archives).
- Fashion-industry references with explicit face-shape tagging.
- Long-running stylist YouTube channels and blogs with documented style libraries.

Avoid fad-only entries unless they have staying power.

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/hairstyle-library.md`.
3. Skim entries: confirm tags are sensible, no overlapping IDs, every face-shape claim is defensible.
4. Hand off to Claude (or next agent) to port into `app/data/hairstyleLibrary.ts`.

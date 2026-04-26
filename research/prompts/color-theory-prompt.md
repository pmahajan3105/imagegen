# Research Prompt: Sci/Art 12-Season Palettes

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/color-theory.md` and will then be ported into `app/data/colorSystem.ts`.

---

## Prompt (copy from here)

You are populating a structured reference document for a personal styling app. The app is committed to the **Sci/Art 12-season system**, as documented in Christine Scaman's *12 Blueprints* (https://www.12blueprints.com/), as its canonical color taxonomy. Your job is to produce one markdown file (`color-theory.md`) that lists, for each of the 12 seasons, the canonical palette with hex codes, the diagnostic traits, short styling rules, and your sources.

### The 12 seasons (use exactly these names and IDs)

| ID | Name | Family |
|---|---|---|
| `light-spring` | Light Spring | Spring |
| `true-spring` | True Spring | Spring |
| `bright-spring` | Bright Spring | Spring |
| `light-summer` | Light Summer | Summer |
| `true-summer` | True Summer | Summer |
| `soft-summer` | Soft Summer | Summer |
| `soft-autumn` | Soft Autumn | Autumn |
| `true-autumn` | True Autumn | Autumn |
| `dark-autumn` | Dark Autumn | Autumn |
| `true-winter` | True Winter | Winter |
| `bright-winter` | Bright Winter | Winter |
| `dark-winter` | Dark Winter | Winter |

Output the 12 sections in the order shown in this table.

### Section template (use verbatim)

```md
## {Name}

**ID:** `{id}`
**Family:** {spring | summer | autumn | winter}
**Aliases:** {comma-separated list of common synonyms from other systems, or "(none)"}
**Traits:**
- Undertone: {warm | cool | neutral | olive}
- Depth: {light | medium | deep}
- Chroma: {soft | clear | bright}
- Contrast: {low | medium | high}

### Best Neutrals (6–7)
- {Name} `#HEXHEX`
- ...

### Signature Colors (6–8)
- ...

### Accent Colors (4–5)
- ...

### Use Carefully (5–6)
- ...

### Rules (4–6 short imperative lines)
- ...

### Sources
- {URL or reference}
- {URL or reference}
```

### Rules of engagement

1. **Sci/Art only.** Anchor on Christine Scaman's 12 Blueprints as the primary source. Do not mix in House of Colour, Korean Personal Color, or Color Me Beautiful palettes. If House of Colour or Sci/Art differ for the same season name, follow Sci/Art (Scaman).
2. **Hex codes must trace to Scaman's 12 Blueprints or aligned Munsell-based sources.** Look at the swatch photographs and palette descriptions on 12blueprints.com (and stylists trained in Sci/Art) and pick hex values that are defensibly representative. List the references you used in the Sources block of each section.
3. **Do not invent hex codes.** If you cannot find a defensible reference for a slot, leave it as `- TBD #?????? (need reference)` rather than guessing.
4. **Names should be practical.** Prefer "Warm Beige" over "Cocoa Whisper". The names appear in app UI as swatch labels.
5. **Use Carefully ≠ Avoid.** These are colors that work in narrow contexts (specific fabric, specific intensity, specific season-of-year). Frame them as conditional, not forbidden.
6. **Rules must be actionable.** "Polished silver over warm gold" beats "cool tones harmonize". Each rule should map to a recommendation the app can produce.
7. **Aliases** should list common synonyms from other systems that resolve to this Sci/Art name. House of Colour's "Warm/Cool/Clear/Deep" prefixes are the most common alternates: e.g. `warm-spring` is an alias for `true-spring`, `deep-winter` is an alias for `dark-winter`. Use lowercase kebab-case for alias IDs.
8. **Hex format:** 6-digit uppercase with leading `#`, e.g. `#F2EAD8`. No 3-digit shorthand, no rgb()/hsl().
9. **Munsell-aligned reasoning where helpful.** Sci/Art is built on the three Munsell dimensions — Hue, Value, Chroma. If you cite a season as having "low chroma", that's a Sci/Art-native description and should be reflected in palette saturation.
10. **No essays.** Each section is ~30 lines. The file is structured data with light prose. No introductions, no methodology paragraphs, no closing remarks beyond a one-paragraph header noting your sourcing approach if you wish.

### Reference: Soft Autumn (already drafted, refine if your sources support better values)

```md
## Soft Autumn

**ID:** `soft-autumn`
**Family:** autumn
**Aliases:** (none)
**Traits:**
- Undertone: warm
- Depth: medium
- Chroma: soft
- Contrast: low

### Best Neutrals (6–7)
- Ivory `#F2EAD8`
- Soft Cream `#E8DBC4`
- Warm Beige `#C5B398`
- Taupe `#A89784`
- Soft Olive `#8C8C72`
- Soft Brown `#8B6F4E`
- Espresso `#4F3E2A`

### Signature Colors (6–8)
- Dusty Terracotta `#BE8266`
- Sage Green `#93AC8E`
- Soft Gold `#C4A361`
- Warm Coral `#D08F7E`
- Dusty Teal `#6E8C8C`
- Peach `#E5B098`
- Muted Plum `#8B6F7E`
- Golden Yellow `#D4B25A`

### Accent Colors (4–5)
- Warm Rust `#B57451`
- Soft Burgundy `#8C5A5A`
- Golden Olive `#A4904D`
- Dusty Mauve `#9C7A82`

### Use Carefully (5–6)
- Pure White `#FFFFFF`
- Pure Black `#000000`
- Hot Pink `#FF1493`
- Electric Blue `#007FFF`
- Icy Pastel `#E0F0FF`

### Rules (4–6)
- Lean into muted, warm-leaning earth tones with soft edges.
- Avoid pure black and pure white at the face; substitute espresso and ivory.
- Keep contrast low — pair similar depth tones rather than stark light/dark.
- Bronze, antique gold, and rose gold flatter more than polished silver.

### Sources
- (TBD — currently model-drafted from general knowledge; please verify against Scaman's 12 Blueprints and either confirm or refine)
```

Dark Winter has a parallel draft in the codebase. You may revise either if better-sourced values exist; otherwise keep them.

### Sources to prefer

- Christine Scaman's 12 Blueprints blog (12blueprints.com) — primary source for season-by-season write-ups, swatch photography, and color logic.
- Stylists who explicitly cite Sci/Art training and reference Scaman's framework.
- Munsell color reference (where it grounds Hue / Value / Chroma claims).
- Archived Sci/Art–aligned Pinterest boards or stylist Instagram posts where the season tags are explicit and consistent.

If primary sources contradict each other for a given season, pick one defensible canonical and note the variance in Sources.

### Deliverable

A single markdown file titled `color-theory.md` containing:
1. An optional one-paragraph header noting sourcing approach and overall confidence (low/medium/high per season is fine).
2. The 12 season sections, in the order listed above, each following the section template exactly.

Nothing else. No JSON, no code, no commentary outside section blocks.

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/color-theory.md` (sibling to this file).
3. Skim each section: confirm hex values look plausible, names are usable, rules are actionable. Mark any `TBD` slots that need follow-up.
4. Hand off to Claude (or next agent) to port the populated seasons into `app/data/colorSystem.ts` and flip their `populated` flag to `true`.

The two reference seasons (Soft Autumn, Dark Winter) currently in `app/data/colorSystem.ts` are model-drafted; treat the research model's output as authoritative if its sources are stronger and replace those drafts in the porting step.

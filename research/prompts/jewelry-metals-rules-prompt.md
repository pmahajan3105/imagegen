# Research Prompt: Jewelry & Metals Rules

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/jewelry-metals-rules.md` and will then be ported into `app/data/jewelryRules.ts`.

---

## Prompt (copy from here)

You are producing structured jewelry-and-metals guidance for a personal styling app. The app needs **per-metal recommendations**, **finish guidance**, **scale rules**, **mixed-metals allowances**, and **watch guidance** keyed to face shape and undertone. The rules are palette-system-agnostic — they reference undertone (warm/cool/neutral), depth (light/medium/deep), and chroma (soft/clear/bright) in the abstract; the app maps user analysis values into these.

### Output structure

The file has 5 parts.

### Part 1: Metals by Undertone

For each of these 8 metals, produce a section:

| ID | Metal |
|---|---|
| `gold` | Yellow Gold |
| `rose-gold` | Rose Gold |
| `brass-bronze` | Brass / Bronze |
| `copper` | Copper |
| `silver` | Silver |
| `platinum` | Platinum |
| `white-gold` | White Gold |
| `pewter` | Pewter / Antiqued Silver |

Section template per metal:

```md
## {Metal display name}

**ID:** `{id}`
**Family:** {warm | cool}
**Best for undertones:** {comma-separated list of: warm | cool | neutral | warm-neutral | cool-neutral | olive}
**Best for depths:** {comma-separated list of: light | medium | deep | medium-deep}
**Best for chromas:** {comma-separated list of: soft | clear | bright}
**Finish options that work:** {comma-separated list from Part 2 finish IDs}
**Watch out:** {short cautionary note about when to use carefully}
**Notes:** {optional 1-2 line stylist note}
```

### Part 2: Finishes

For each of these finishes, produce a short rule block:

| ID | Finish |
|---|---|
| `polished` | Polished / High-Shine |
| `matte` | Matte |
| `brushed` | Brushed / Satin |
| `antiqued` | Antiqued / Oxidized |
| `hammered` | Hammered |

Section template per finish:

```md
## {Finish display name}

**ID:** `{id}`
**Best for chromas:** {comma-separated list}
**Best for occasions:** {comma-separated list of: casual | everyday | work | event}
**Pairs with metals:** {comma-separated list of metal IDs from Part 1}
**Use carefully:** {short caution}
```

### Part 3: Scale

For each scale, produce a section:

| ID | Scale |
|---|---|
| `delicate` | Delicate |
| `medium` | Medium |
| `chunky` | Chunky / Statement |

Section template per scale:

```md
## {Scale display name}

**ID:** `{id}`
**Best for body scale:** {short clause about petite/average/larger frame}
**Best for face features:** {short clause about fine vs strong features}
**Item categories typically at this scale:** {comma-separated list of: chain | earrings | ring | bracelet | watch | brooch}
**Use carefully:** {short clause}
```

### Part 4: Mixed Metals

A single section listing:
- Allowed combinations (which metal IDs can be mixed)
- Rules for mixing (e.g. "anchor with one dominant metal, accent with up to one other")
- Combinations to use carefully
- A 1-2 line stylist note

```md
## Mixed Metals

### Allowed combinations
- {Combination 1}: {rule}
- ...

### Rules
- {Rule 1}
- {Rule 2}
- ...

### Use carefully
- {Combination}: {why}
- ...

### Notes
- {Stylist note}
```

### Part 5: Watch Guidance

For each face shape (8 shapes), produce a short block keyed by face shape:

| ID | Face shape |
|---|---|
| `oval` | Oval |
| `round` | Round |
| `square` | Square |
| `rectangle` | Rectangle |
| `oblong` | Oblong |
| `heart` | Heart |
| `diamond` | Diamond |
| `triangle` | Triangle |

Section template:

```md
## Watch — {Face shape}

**ID:** `watch-{face-shape-id}`
**Best case sizes (mm):** {range, e.g. "36–40mm"}
**Best case shapes:** {comma-separated: round | tonneau | rectangle | square | cushion}
**Best strap materials:** {comma-separated: leather | metal-bracelet | nato | rubber | nylon}
**Use carefully:** {short caution}
```

### Rules of engagement

1. **No specific brands.** Say "round 38mm dress watch" not "Datejust 36." Brand-agnostic.
2. **Undertone, depth, chroma terms** are palette-system-agnostic — don't tie to House of Colour or Sci/Art specifically. The app maps from its locked palette.
3. **"Use carefully" not "avoid."** Frame conditional cautions throughout.
4. **Mixed-metals section is judgment-call rules**, not a forbidden list. Most modern styling allows some mixing — capture the rules under which it works.
5. **No essays.** Each section ~10-20 lines.
6. **Be concrete on watch sizes.** Real millimeter ranges, not vague "small" / "large."
7. **Stylist notes optional.** Use only when there's a real cue worth capturing.

### Reference examples

```md
## Yellow Gold

**ID:** `gold`
**Family:** warm
**Best for undertones:** warm, warm-neutral, olive
**Best for depths:** light, medium, medium-deep
**Best for chromas:** soft, clear, bright
**Finish options that work:** polished, brushed, hammered
**Watch out:** Very pale-pink-undertone skin can read mismatched against bright high-shine yellow gold; soften with brushed finish or pair with antiqued versions.
**Notes:** The default warm metal across most cultures and occasions.
```

```md
## Polished / High-Shine

**ID:** `polished`
**Best for chromas:** clear, bright
**Best for occasions:** event, work
**Pairs with metals:** gold, silver, platinum, white-gold
**Use carefully:** Soft / muted chroma palettes can read brittle with high-shine; lean brushed or matte instead.
```

```md
## Watch — Square

**ID:** `watch-square`
**Best case sizes (mm):** 36–40mm
**Best case shapes:** round, tonneau, cushion
**Best strap materials:** leather, metal-bracelet
**Use carefully:** Sharp square cases mirror the jaw and amplify it; round or cushion cases soften the line.
```

### Deliverable

A single markdown file titled `jewelry-metals-rules.md` with:
1. Optional one-paragraph header noting sourcing approach.
2. **Part 1: Metals by Undertone** — 8 metal sections.
3. **Part 2: Finishes** — 5 finish sections.
4. **Part 3: Scale** — 3 scale sections.
5. **Part 4: Mixed Metals** — 1 section.
6. **Part 5: Watch Guidance** — 8 face-shape sections.

Use clear `# Part 1`, `# Part 2`, etc. dividers between parts.

Nothing else.

### Sources to prefer

- Jewelry-industry educational pages (Mejuri, Catbird, Tiffany style guides).
- Watch-industry fit guides (Hodinkee, Worn & Wound, Watchfinder & Co. fit articles).
- Stylist publications on metals × undertone.
- Optical / eyewear sources for the face-shape × hardware compatibility (some overlap with eyewear-fit-rules).

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/jewelry-metals-rules.md`.
3. Verify all 5 parts are present and complete (8 metals, 5 finishes, 3 scales, 1 mixed-metals section, 8 watch sections).
4. Hand off to Claude (or next agent) to port into `app/data/jewelryRules.ts`.

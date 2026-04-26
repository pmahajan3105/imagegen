# Research Prompt: Outfit Composition Rules

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/outfit-composition-rules.md` and will then be ported into `app/data/outfitRules.ts`.

---

## Prompt (copy from here)

You are producing structured outfit-composition rules for three occasion contexts. The app already has body-shape silhouette principles (canonical) and a wardrobe-capsule structure (canonical). What it needs from you is **how to compose an outfit per occasion** — the proportions, the palette approach, the layering strategy, the fabric guidance, the items to include, and the example shapes.

The rules are palette-agnostic and brand-agnostic. The app fills in actual swatches and capsule items at render time.

### The 3 occasions (use exactly these names and IDs)

| ID | Name | Brief |
|---|---|---|
| `work` | Work / Polished | Professional, structured, client-facing |
| `casual` | Casual / Everyday | Relaxed daily wear; comfort + light polish |
| `event` | Event / Elevated | Occasion-appropriate; richer fabrics, statement details |

Output 3 sections in this order.

### Section template (use verbatim)

```md
## {Display name}

**ID:** `{id}`
**Composition target:** {numerical breakdown like "1 top + 1 bottom + 1 layer + 1 shoes + 2-3 accessories"}
**Goal:** {one-line objective for the silhouette and impression}

### Palette approach
- {Lead with what palette tier (best-neutrals / signature / accent / use-carefully) does the most work}
- {How many "loud" pieces vs quiet pieces}
- {Specific note on the role of metals and hardware}

### Silhouette principles
- {3-5 short principles for body proportion balance specific to this occasion}

### Layering strategy
- {How to stack tops/jackets/coats for this occasion}
- {Length and break rules}

### Fabric guidance
- {Preferred fabric weights and finishes}
- {Use-carefully fabrics for this occasion}

### Example outfit shapes (palette-agnostic, capsule-agnostic; just garment categories)
- {Example 1: e.g. "Oxford shirt + tailored trouser + single-breasted blazer + leather oxford + watch + belt"}
- {Example 2}
- {Example 3-5}

### Use carefully
- {Combinations or pieces that sit awkwardly in this occasion (framed conditional, not forbidden)}
```

### Rules of engagement

1. **Palette-agnostic.** Don't name specific colors. Refer to palette tiers ("best-neutrals", "signature", "accent", "use-carefully").
2. **Brand-agnostic.** No specific brands or product names. Use garment categories.
3. **Presentation-neutral.** Don't gender items by default. Use neutral category words (trouser/skirt where both apply, tee instead of "men's t-shirt").
4. **Silhouette principles** should be portable across body shapes — they apply *additionally* to whatever the body-shape canonical principles say. Don't repeat body-shape advice; speak to the occasion.
5. **"Use carefully" not "avoid."** Frame conditional cautions, never forbidden lists.
6. **Examples should span 3-5 distinct compositions** to show range within the occasion (e.g. for Work: a structured suit, a separates day, a softer knit-led day, etc.).
7. **No essays.** Each occasion section ~30 lines max.

### Reference example

```md
## Work / Polished

**ID:** `work`
**Composition target:** 1 top + 1 bottom + 1 layer + 1 shoes + 2-3 accessories
**Goal:** Read structured and confident; cleanest neutrals lead; one accent or signature piece grounds the personality.

### Palette approach
- Best-neutrals do 70-80% of the work — the suit, trouser, shirt, layer all sit in best-neutrals.
- One signature piece (often the tie, scarf, blouse, or shoe) carries the personality.
- Hardware (belt buckle, watch case, jewelry) is consistent in the user's best metal direction.
- Accent colors are reserved for accessories that come on and off (scarf, pocket square); not the lead garments.

### Silhouette principles
- Tailoring on at least one piece (jacket, trouser, or top). Avoid head-to-toe drape.
- Hemlines fall at the shoe vamp for trousers; at or just below the knee for skirts.
- Vertical line dominates: open jackets, column outfits, or matching separates.
- Shoulders read structured; soft drape is for the layer or the accessory, not the shoulder line.

### Layering strategy
- One layer at most for indoor work (blazer or cardigan, not both).
- Outdoor layer (trench, overcoat, structured wool coat) sits over the work outfit and ends mid-thigh or longer.
- Layer hem extends below the bottom hem of the inner layer (no broken layer-stack lines).

### Fabric guidance
- Wools (tropical, super 110s, flannel), cottons (poplin, oxford, twill), fine-gauge merino, lined cottons.
- Use carefully: stretch denim, jersey, sweatshirt fleece, exposed athletic synthetics, very glossy satin.

### Example outfit shapes (palette-agnostic, capsule-agnostic; just garment categories)
- Oxford shirt + tailored trouser + single-breasted blazer + leather oxford + watch + belt
- Fine knit + tailored trouser + structured cardigan + loafer + watch + minimal chain
- Blouse + pencil skirt + open trench + low pump + simple earrings + structured tote
- Polo + tailored chino + unstructured blazer + suede loafer + watch (smart-casual day)
- Knit dress + duster coat + ankle boot + minimal jewelry (knit-led day)

### Use carefully
- Cropped lengths that show the waist gap between top and bottom (reads casual at the waist).
- Athletic sneakers (only acceptable in tech-industry contexts; and only if explicitly minimal).
- Loud accent at both top and bottom — pick one anchor for the personality piece.
- Logos visible above the waist.
```

### Deliverable

A single markdown file titled `outfit-composition-rules.md` with:
1. Optional one-paragraph header noting sourcing approach.
2. 3 occasion sections in the order listed above (Work, Casual, Event).

Nothing else.

### Sources to prefer

- Heritage menswear and womenswear style guides (Permanent Style, Put This On, Inside Out Style, Effortless Gent).
- Wardrobe consultancy publications and credentialed stylist content.
- Tailoring industry references on proportion and break.

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/outfit-composition-rules.md`.
3. Verify each occasion has all 6 subsections populated and 3-5 example shapes.
4. Hand off to Claude (or next agent) to port into `app/data/outfitRules.ts`.

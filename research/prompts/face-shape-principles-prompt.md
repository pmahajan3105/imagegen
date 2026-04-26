# Research Prompt: Face Shape Principles

This is the prompt to paste into a research model. Output saved as `research/face-shape-principles.md`, ported into `app/data/faceShapeRules.ts`.

---

## Prompt (copy from here)

You are producing a structured reference for an app that generates per-face-shape styling guidance. For each of 8 face shapes, document how to identify the shape from a portrait, and provide balancing principles across four styling axes: necklines, earrings, frames (eyeglass shapes), and haircut direction.

### The 8 face shapes

Use exactly these names and IDs:

| ID | Name | Brief signature |
|---|---|---|
| `oval` | Oval | Length ~1.5× width, balanced features, softly tapered jaw |
| `round` | Round | Equal length and width, soft rounded jaw, full cheeks |
| `square` | Square | Equal length and width, strong angular jaw, broad forehead |
| `rectangle` | Rectangle | Length > width significantly, strong angular jaw, broad forehead |
| `oblong` | Oblong | Length > width significantly, softer jaw than rectangle |
| `heart` | Heart | Wide forehead, narrow chin (often pointed) |
| `diamond` | Diamond | Narrow forehead and jaw, widest at cheekbones |
| `triangle` | Triangle | Narrow forehead, wider jaw (inverse of heart) |

Output 8 sections in this order.

### Section template (use verbatim)

```md
## {Name}

**ID:** `{id}`
**Length-to-width ratio:** {e.g. "~1.5", "~1.0", "1.4–1.7"}
**Defining cues:**
- Forehead: {wide | narrow | balanced}
- Cheekbones: {prominent | average | narrow}
- Jawline: {angular | soft | narrow | wide}
- Chin: {pointed | rounded | square}

**Goal:** {one-line balancing objective, e.g. "soften jaw and add vertical length"}

### Necklines
- Best: {comma-separated list of necklines}
- Use carefully: {comma-separated list}

### Earrings
- Best: {styles/shapes}
- Use carefully: {styles/shapes}

### Frame shapes (eyeglasses)
- Best: {comma-separated list}
- Use carefully: {comma-separated list}

### Haircut direction
- Best: {styling cues — e.g. "soft side part with volume on top", "length below the jaw"}
- Use carefully: {styling cues to avoid amplifying the shape}

### Notes
- {edge cases, gendered considerations, common misidentifications}
```

### Rules of engagement

1. **No celebrity comparisons.** Use shape language, not "looks like X."
2. **"Use carefully" not "avoid."** Every choice can work in the right context; frame guidance as conditional, not forbidden.
3. **Length-to-width ratios** should be approximate ranges where the literature varies, not single values.
4. **Identification cues must be observational**, not requiring measurement. The user's photo will be assessed by a vision model; cues should be qualitative.
5. **Cross-shape symmetries are fine.** If Square and Rectangle share many recommendations, list them in both sections rather than referencing each other.
6. **No essays.** Each section ~25 lines max.

### Reference example

```md
## Oval

**ID:** `oval`
**Length-to-width ratio:** ~1.5
**Defining cues:**
- Forehead: balanced, slightly wider than chin
- Cheekbones: average to softly prominent, widest part of face
- Jawline: softly angled, not sharp
- Chin: rounded, not pointed

**Goal:** Maintain natural balance without exaggerating any feature.

### Necklines
- Best: V-neck, scoop, square, crew, off-shoulder
- Use carefully: turtleneck (can elongate already-balanced face)

### Earrings
- Best: most shapes work — drops, hoops, studs, geometric
- Use carefully: very elongated drops on already-elongated frames

### Frame shapes (eyeglasses)
- Best: rectangular, square, geometric, wayfarer, browline
- Use carefully: very round oversized frames (can soften balance too much)

### Haircut direction
- Best: most styles work; volume can sit anywhere
- Use carefully: extremely flat or extremely top-heavy looks that disrupt natural balance

### Notes
- Often considered the "default flattering" shape. Caveat: many people identify as Oval who are actually Oblong or Square.
```

### Deliverable

A single markdown file titled `face-shape-principles.md` with the 8 sections in the order listed above. Optional one-paragraph header noting sourcing approach.

Nothing else.

### Sources to prefer

- Fashion-industry style guides that explicitly cite the 8-shape system.
- Stylist publications.
- Optical-industry frame-fit guides for the frame-shape sections.

---

## Usage notes (after paste)

1. Paste into your chosen research model.
2. Save output as `research/face-shape-principles.md`.
3. Verify each shape has all four styling sections populated and the length-to-width ratios are sensible.
4. Hand off for porting into `app/data/faceShapeRules.ts`.

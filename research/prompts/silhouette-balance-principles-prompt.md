# Research Prompt: Silhouette Balance Principles

This is the prompt to paste into a research model. Output saved as `research/silhouette-balance-principles.md`, ported into `app/data/silhouetteRules.ts`.

---

## Prompt (copy from here)

You are producing styling principles for the 5 standard body shapes. The app names the shapes directly (Hourglass, Pear, Apple, Rectangle, Inverted Triangle), identifies the user's shape from a full-body photo, and then leads with **how to balance** the shape — not with the label as the entire headline. Your output documents how to identify each shape and the styling principles that balance it.

### The 5 body shapes

Use exactly these names and IDs:

| ID | Name | Visual signature |
|---|---|---|
| `hourglass` | Hourglass | Shoulders and hips read similar in width; waist visibly defined |
| `pear` | Pear | Hips read wider than shoulders |
| `inverted-triangle` | Inverted Triangle | Shoulders read wider than hips |
| `rectangle` | Rectangle | Shoulders, waist, and hips read similar in width; minimal taper |
| `apple` | Apple | Mid-section reads as the fullest part of the frame |

Output 5 sections in this order, then a closing "Universal Silhouette Principles" section.

### Section template (use verbatim per body shape)

```md
## {Name}

**ID:** `{id}`

**How to identify:** {visual cues observable from a full-body photo — shoulder/hip width comparison, waist definition, etc.}
**Goal:** {one-line balance objective, e.g. "lengthen vertically and add structure at the shoulder line"}

### Waist strategy
- {how to define, draw attention to, or de-emphasize the waist}

### Shoulder/hip balance
- {how to add visual weight, take it away, or maintain it}

### Vertical line
- {how to create or interrupt vertical lines through the silhouette}

### Best rises (pants/skirts)
- {high, mid, low — and which work for this shape}

### Best hemlines
- {where hemlines should fall; lengths to favor}

### Layering rules
- {how to stack tops/jackets/coats}

### Use carefully
- {silhouettes that amplify rather than balance}

### Notes
- {edge cases, common pitfalls, common misidentifications}
```

After the 5 body-shape sections, add this closing section:

```md
## Universal Silhouette Principles

### Proportion math
- {rules of thirds, golden-ratio approximations as they apply to outfit sectioning}

### Vertical line creation
- {techniques that work regardless of body shape}

### Layering hierarchy
- {rules for stacking layers without breaking proportions}

### Fit hierarchy
- {how fit choices ripple — fitted top + flowing bottom, etc.}
```

### Rules of engagement

1. **No weight, size, "flatter," or "flaw" language.** Frame everything as visual balance — "create" or "soften" or "draw vertical line." That's the actually-respectful part; don't lecture about body image, just stay positive in framing.
2. **Lead with principles, not just the label.** The body-shape name is a useful tag, but the value of the report is the styling guidance. The report renders the label and the principles together; principles do the work.
3. **"Use carefully" not "avoid."** Every silhouette can work; tag conditions where it amplifies rather than balances.
4. **Pose-neutral guidance.** The user's photo may show various poses; rules should apply to underlying proportions, not the photographed stance.
5. **No essays.** Each section ~25 lines.

### Reference example

```md
## Pear

**ID:** `pear`

**How to identify:** Hips read visibly wider than shoulders; the lower frame carries more visual weight than the upper frame. Waist is often defined.
**Goal:** Add visual weight at the shoulder line and create vertical balance.

### Waist strategy
- Define the waist with belts or fitted seams; emphasizes the narrower waist between fuller hips and balanced shoulders.

### Shoulder/hip balance
- Add structured shoulders (puff sleeves, structured blazers, boat necks).
- Avoid clingy tops with no shoulder structure paired with full skirts.

### Vertical line
- Use long open jackets, vertical stripes, or column dresses to draw the eye top-to-bottom.

### Best rises (pants/skirts)
- High and mid rises; emphasize the natural waist position.

### Best hemlines
- Hemlines that hit at the narrowest leg point — just below the knee or at the ankle. A-line skirts work; pencil skirts can amplify.

### Layering rules
- Open layers (cardigans, dusters) reaching mid-thigh or below create vertical line.
- Avoid layers that end at the hip line (shortens upper body, accentuates hip).

### Use carefully
- Skinny jeans with tight cropped tops; cropped jackets ending at hip line.

### Notes
- Common misidentification: many self-identify as Hourglass when proportions are actually Pear. The diagnostic cue is comparing shoulder width to hip width in a relaxed standing pose.
```

### Deliverable

One markdown file titled `silhouette-balance-principles.md` with:
1. Optional one-paragraph header noting sourcing approach.
2. 5 body-shape sections in the order listed (Hourglass, Pear, Inverted Triangle, Rectangle, Apple).
3. The closing "Universal Silhouette Principles" section.

Nothing else.

### Sources to prefer

- Costume design and fashion-illustration references on proportion.
- Wardrobe-consultancy publications and reputable stylist guides.
- Industry guides that discuss the 5-shape system explicitly.

---

## Usage notes (after paste)

1. Paste into your chosen research model.
2. Save output as `research/silhouette-balance-principles.md`.
3. Skim each shape: confirm "How to identify" cues are observational, principles are actionable, and language stays positive (no weight/flaw vocabulary).
4. Hand off for porting into `app/data/silhouetteRules.ts`.

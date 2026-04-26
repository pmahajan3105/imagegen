# Research Prompt: Wardrobe Capsule Structures

This is the prompt to paste into a research model. Its output should be saved verbatim as `research/wardrobe-capsule-structures.md` and will then be ported into `app/data/wardrobeCapsules.ts`.

---

## Prompt (copy from here)

You are producing structured wardrobe capsule presets for a personal styling app. The app uses these as **palette-agnostic skeletons** — at runtime, the app fills in actual swatches from the user's locked color palette and tags items with the user's body silhouette principles. Your job is to define **6 capsule structures**, each with **18 items** tagged with palette role and silhouette role, plus a guiding philosophy.

### The 6 capsule presets (use exactly these names and IDs)

| ID | Name | Lifestyle |
|---|---|---|
| `casual-everyday` | Casual / Everyday | Relaxed daily wear; weekends, errands, low-effort polish |
| `workwear-polished` | Workwear / Polished | Office, client meetings, professional contexts |
| `minimal-clean` | Minimal / Clean | Quiet luxury; few pieces, high quality, low contrast |
| `classic-timeless` | Classic / Timeless | Heritage shapes; investment-grade staples |
| `bold-statement` | Bold / Statement | Standout pieces, hue contrast, personality forward |
| `street-urban` | Street / Urban | Contemporary streetwear-influenced; sneakers, outerwear, layered |

Output 6 sections in this order.

### Item structure (18 per capsule)

Each capsule must define exactly:
- **4 tops**
- **3 bottoms**
- **3 layers** (outerwear: jacket, blazer, cardigan, coat, vest, etc.)
- **3 shoes**
- **5 accessories** (belt, watch, bag, scarf, hat, jewelry, glasses, etc.)

Each item is tagged with:
- **Type:** garment-category description (e.g. "Oxford shirt", "denim jeans", "leather sneakers"). Be specific but brand-agnostic.
- **Palette role:** one of `best-neutral` | `signature` | `accent` | `any`. This is which palette family the item should be cut from at render time. `any` means the item is acceptable in any palette role.
- **Silhouette role:** one short clause describing the silhouette function (e.g. "waist-defining", "vertical-line creating", "shoulder-structure adding", "balancing", "anchoring"). Optional — omit if generic.
- **Notes:** optional 1-line styling cue (omit if not useful).

### Section template (use verbatim per capsule)

```md
## {Display name}

**ID:** `{id}`
**Style preset:** {one of the 6 IDs}
**Lifestyle:** {one-line description}
**Philosophy:** {1-2 sentence guiding principle}

### Tops (4)
- {Type} — palette: {role} — silhouette: {role or "—"} — {notes or ""}
- ...

### Bottoms (3)
- ...

### Layers (3)
- ...

### Shoes (3)
- ...

### Accessories (5)
- ...

### Outfit math
- {Brief note on combination potential, e.g. "4 tops × 3 bottoms × 3 layers = 36 base outfits before accessory variation"}
```

### Rules of engagement

1. **Palette-agnostic.** Do not name colors. Use palette roles (`best-neutral`, `signature`, `accent`, `any`). The app fills in actual hex codes at render time.
2. **Brand-agnostic.** No Levi's 501, no Nike Air Force 1. Use category descriptions like "selvedge denim jean" or "leather low-top sneaker."
3. **Presentation-neutral.** Don't gender items in the description. The app handles presentation gating separately. "Trouser" not "men's slacks", "tee" not "men's t-shirt".
4. **Silhouette role optional.** Use it where the item has a clear silhouette function; omit (with `—`) where the role is generic. Don't force it.
5. **Notes are sparse.** Most items don't need a note. Add one only when there's a real styling cue worth capturing.
6. **Item types should be wearable across body shapes** unless explicitly noted. The capsule is a template; per-user adjustment happens at planner time using `silhouetteRules`.
7. **No essays.** Each capsule is ~30 lines max.

### Reference example

```md
## Workwear / Polished

**ID:** `workwear-polished`
**Style preset:** workwear-polished
**Lifestyle:** Office, client meetings, professional contexts where polish reads.
**Philosophy:** Cleanest neutrals lead; one signature accent piece per outfit. Structure beats softness; tailoring beats drape.

### Tops (4)
- Oxford button-down shirt — palette: best-neutral — silhouette: vertical-line — collar holds shape under a layer
- Fine-gauge merino crewneck — palette: best-neutral — silhouette: — pairs under a blazer
- Silk-blend or cotton blouse — palette: signature — silhouette: — solo or under a layer
- Tailored knit polo — palette: best-neutral — silhouette: — smart-casual fallback

### Bottoms (3)
- Tailored trouser in tropical wool — palette: best-neutral — silhouette: vertical-line — break at shoe vamp
- Pleated chino — palette: best-neutral — silhouette: — softer alternative to wool
- Pencil skirt or straight cut — palette: best-neutral — silhouette: waist-defining — knee-length anchor

### Layers (3)
- Single-breasted blazer — palette: best-neutral — silhouette: shoulder-structure — fitted, not boxy
- Cardigan in fine knit — palette: best-neutral — silhouette: — softer alternative to a blazer
- Trench coat or wool overcoat — palette: best-neutral — silhouette: vertical-line — full-length anchors the silhouette

### Shoes (3)
- Leather oxford or derby — palette: best-neutral — silhouette: — closed lace
- Loafer in leather — palette: best-neutral — silhouette: — slip-on alternative
- Mid-heel pump or low boot — palette: best-neutral — silhouette: — option for sharper days

### Accessories (5)
- Leather belt matching shoe tone — palette: best-neutral — silhouette: waist-defining
- Minimalist watch with leather or metal strap — palette: any — silhouette: —
- Structured leather tote or briefcase — palette: best-neutral — silhouette: —
- Silk pocket square or scarf — palette: signature — silhouette: — the one statement piece
- Simple gold or silver chain (presentation-appropriate) — palette: any — silhouette: —

### Outfit math
- 4 tops × 3 bottoms × 3 layers = 36 base outfits; accessory rotation adds ~5x permutation.
```

### Deliverable

A single markdown file titled `wardrobe-capsule-structures.md` with:
1. Optional one-paragraph header noting sourcing approach.
2. 6 capsule sections in the order listed above.

Nothing else.

### Sources to prefer

- Wardrobe-consultancy publications (Project 333, Lessons of a Stylist, etc.).
- Style-blog capsule references that explicitly itemize 15-25 piece capsules (e.g. UnFancy, Anuschka Rees).
- Heritage menswear and womenswear references for the Classic preset (Permanent Style, GQ Style).
- Streetwear curation sources for the Street preset (Highsnobiety, Hypebeast).

---

## Usage notes (after paste)

1. Paste the prompt above into your chosen research model.
2. Save the returned markdown verbatim as `research/wardrobe-capsule-structures.md`.
3. Skim each capsule: confirm 18 items per capsule (4+3+3+3+5), sensible palette roles, and silhouette roles where useful.
4. Hand off to Claude (or next agent) to port into `app/data/wardrobeCapsules.ts`.

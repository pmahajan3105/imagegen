# Wardrobe Capsule Structures v2

Sourcing approach: This version keeps the original six app-facing preset IDs but upgrades the schema from a flat item list into runtime-ready wardrobe slots. The design is grounded in capsule systems that emphasize small, mixable wardrobes, including Project 333, Anuschka Rees, and Un-Fancy, then cross-checked against lifestyle-specific guidance for professional wardrobes, heritage staples, quiet luxury, and streetwear. Sources were used directionally only; all output remains palette-agnostic, brand-agnostic, and presentation-neutral.

## Schema v2

**Core contract:** Six presets, 18 core slots each, and the same category balance as v1: 4 tops, 3 bottoms, 3 layers, 3 shoes, and 5 accessories. The schema now adds slot IDs, item intent, formality range, capsule-level logic, outfit formulas, and substitution rules.

**Palette roles:** `best-neutral`, `signature`, `accent`, `any`. Actual colors are resolved from the user's locked palette at render time.

**Formality range:** `1` very casual, `2` casual, `3` smart casual, `4` polished/professional, `5` event/formal. Ranges such as `2-4` mean the slot can be rendered up or down through fabric, finish, and styling.

**Intent tags:** `base`, `anchor`, `bridge`, `hero`, `polish`, `utility`, `weather`, `warm-weather`, `comfort`, `warmth`, `convenience`, `heritage`, `texture`, `finish`, `upgrade`, `casualize`, `sport`, `core`. These explain why the slot exists and help the app substitute intelligently.

**Runtime rule:** The item type is the semantic slot. The app can adjust fit, rise, neckline, hem, fabric weight, and presentation details using user-level silhouette rules without changing the slot identity.

## Casual / Everyday
**ID:** `casual-everyday`
**Style preset:** `casual-everyday`
**Lifestyle:** Relaxed daily wear for weekends, errands, travel days, and low-effort polish.
**Default formality:** 1-3
**Philosophy:** Comfort leads, but nothing is shapeless by accident. The capsule uses neutral anchors, one soft signature layer, and small accent moments so daily outfits feel easy without becoming anonymous.
**Capsule logic:** Straight anchors plus soft volume; use open layers and belts when the outfit needs more structure.
**Palette recipe:** Mostly best-neutral anchors; signature appears in soft tops and knitwear; accent is reserved for low-commitment pieces.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CE-T01` | Heavyweight crewneck tee | `best-neutral` | shoulder-balancing | `base` | `1-2` | Clean base for almost every outfit. |
| `CE-T02` | Ribbed tank or fitted sleeveless knit | `best-neutral` | torso-line defining | `base` | `1-2` | Balances relaxed bottoms and open layers. |
| `CE-T03` | Relaxed button-front shirt | `signature` | vertical-line creating | `bridge` | `2-3` | Wear open, half-tucked, or buttoned. |
| `CE-T04` | Soft crew sweatshirt | `signature` | volume-balancing | `comfort` | `1-2` | Keep hem placement intentional. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CE-B01` | Straight-leg denim jean | `best-neutral` | anchoring | `anchor` | `2-3` | Default full-length bottom. |
| `CE-B02` | Pull-on tapered pant | `best-neutral` | leg-line narrowing | `comfort` | `1-2` | Polished alternative to lounge pants. |
| `CE-B03` | Utility short or easy skirt | `best-neutral` | proportion-balancing | `warm-weather` | `1-2` | Choose the user-approved hem family. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CE-L01` | Soft chore jacket | `best-neutral` | shoulder-structure adding | `utility` | `2-3` | Pocket detail adds casual polish. |
| `CE-L02` | Button or zip cardigan | `signature` | frame-softening | `warmth` | `1-3` | Works over tees, tanks, and shirts. |
| `CE-L03` | Light field vest | `accent` | vertical-line creating | `hero` | `1-2` | Optional third-piece energy. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CE-S01` | Leather low-top sneaker | `best-neutral` | anchoring | `anchor` | `2-3` | The default repeat shoe. |
| `CE-S02` | Canvas slip-on or plimsoll | `any` | none | `convenience` | `1-2` | Fast, washable, and casual. |
| `CE-S03` | Walking loafer or moccasin | `best-neutral` | none | `upgrade` | `2-3` | Raises tees and denim without formality shock. |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CE-A01` | Webbing or leather belt | `best-neutral` | waist-defining | `finish` | `1-3` | Use when the top is tucked or cropped. |
| `CE-A02` | Crossbody sling or compact shoulder bag | `best-neutral` | none | `utility` | `1-3` | Hands-free default. |
| `CE-A03` | Baseball cap or soft brim cap | `signature` | face-framing | `finish` | `1-2` | Adds casual intent. |
| `CE-A04` | Simple watch or fitness band | `any` | none | `finish` | `1-3` |  |
| `CE-A05` | Lightweight scarf or bandana | `accent` | focal-point creating | `hero` | `1-3` | Smallest safe place for color drama. |

### Outfit formulas
- Base uniform: CE-T01 + CE-B01 + CE-L01 + CE-S01.
- Soft polished errand: CE-T03 + CE-B02 + CE-L02 + CE-S03.
- Warm-weather fallback: CE-T02 + CE-B03 + CE-S02 + CE-A05.

### Substitution rules
- Cold climate: replace CE-L03 with quilted liner jacket or compact insulated vest.
- No exposed-leg preference: replace CE-B03 with relaxed utility pant in the same palette role.
- Higher polish: promote CE-S03 and CE-L01 before changing the core top or bottom.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

## Workwear / Polished
**ID:** `workwear-polished`
**Style preset:** `workwear-polished`
**Lifestyle:** Office, client meetings, presentations, interviews, and professional contexts where polish reads.
**Default formality:** 3-5
**Philosophy:** Structure does most of the credibility work. Best-neutral tailoring carries the capsule, while signature pieces are controlled focal points rather than competing statements.
**Capsule logic:** Crisp collars, vertical trouser lines, defined shoulders, and low-friction shoes.
**Palette recipe:** Best-neutral dominates core tailoring; signature is limited to refined tops and one soft accessory.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `WP-T01` | Crisp Oxford button-down shirt | `best-neutral` | vertical-line creating | `base` | `3-5` | Collar holds shape under a layer. |
| `WP-T02` | Fine-gauge merino crewneck | `best-neutral` | torso-line smoothing | `base` | `3-4` | Use under tailored layers. |
| `WP-T03` | Silk-blend or polished cotton blouse | `signature` | frame-softening | `bridge` | `3-5` | Solo or under a blazer. |
| `WP-T04` | Tailored knit polo or shell | `best-neutral` | torso-line smoothing | `bridge` | `3-4` | Smart-casual fallback. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `WP-B01` | Tailored trouser in seasonless wool | `best-neutral` | vertical-line creating | `anchor` | `4-5` | Clean break at shoe. |
| `WP-B02` | Refined chino or cotton trouser | `best-neutral` | volume-balancing | `bridge` | `3-4` | Softer alternative to wool. |
| `WP-B03` | Pencil, straight, or column skirt | `best-neutral` | waist-defining | `anchor` | `4-5` | Length follows user hem rules. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `WP-L01` | Single-breasted blazer | `best-neutral` | shoulder-structure adding | `polish` | `4-5` | Fitted, not restrictive. |
| `WP-L02` | Fine-knit cardigan jacket | `best-neutral` | frame-softening | `bridge` | `3-4` | Softer alternative to a blazer. |
| `WP-L03` | Trench coat or tailored overcoat | `best-neutral` | vertical-line creating | `weather` | `3-5` | Full-length anchor for commuting. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `WP-S01` | Leather oxford or derby | `best-neutral` | anchoring | `polish` | `4-5` | Closed-lace default. |
| `WP-S02` | Leather loafer | `best-neutral` | none | `bridge` | `3-5` | Works across office formality levels. |
| `WP-S03` | Low block-heel dress shoe or sleek ankle boot | `best-neutral` | leg-line lengthening | `polish` | `4-5` | Sharper day option. |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `WP-A01` | Leather belt aligned with footwear | `best-neutral` | waist-defining | `finish` | `3-5` |  |
| `WP-A02` | Minimal watch with leather or metal strap | `any` | none | `finish` | `3-5` |  |
| `WP-A03` | Structured tote, briefcase, or slim work bag | `best-neutral` | none | `utility` | `3-5` | Should carry work essentials without slouch. |
| `WP-A04` | Silk scarf or pocket square | `signature` | focal-point creating | `hero` | `3-5` | The controlled statement piece. |
| `WP-A05` | Small hoop, stud, or simple chain jewelry | `any` | face-framing | `finish` | `3-5` |  |

### Outfit formulas
- Client-ready: WP-T01 + WP-B01 + WP-L01 + WP-S01.
- Softer office day: WP-T02 + WP-B02 + WP-L02 + WP-S02.
- Presentation polish: WP-T03 + WP-B03 + WP-L01 + WP-S03 + WP-A04.

### Substitution rules
- Creative office: WP-B02 may render with slightly relaxed proportions while keeping fabric polished.
- Conservative office: suppress visible accent roles except WP-A04 at small scale.
- Warm climate: WP-L03 becomes an unlined trench; WP-T02 becomes a fine cotton knit.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

## Minimal / Clean
**ID:** `minimal-clean`
**Style preset:** `minimal-clean`
**Lifestyle:** Quiet-luxury simplicity, low-contrast dressing, polished repeat wear, and high-quality basics.
**Default formality:** 2-4
**Philosophy:** Interest comes from cut, fabric, and proportion rather than decoration. The capsule should look intentional because every line is calm, useful, and precisely placed.
**Capsule logic:** Long vertical lines, clean closures, low hardware, and texture instead of contrast.
**Palette recipe:** Nearly all best-neutral; one signature slot adds depth without disrupting the quiet read.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `MC-T01` | Smooth long-sleeve knit tee | `best-neutral` | none | `base` | `2-3` | Polished base layer. |
| `MC-T02` | Fine-rib crew or mock-neck knit | `best-neutral` | torso-line smoothing | `base` | `2-4` | Trim without clinging. |
| `MC-T03` | Crisp cotton popover shirt | `best-neutral` | vertical-line creating | `bridge` | `3-4` | Half-placket keeps it minimal. |
| `MC-T04` | Silk or fine-cotton shell | `signature` | frame-softening | `bridge` | `3-4` | Quiet focal top. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `MC-B01` | Flat-front wide-leg trouser | `best-neutral` | vertical-line creating | `anchor` | `3-4` | Fluid but controlled. |
| `MC-B02` | Straight-leg jean with clean finish | `best-neutral` | anchoring | `bridge` | `2-3` | No heavy distressing. |
| `MC-B03` | Column skirt or refined knit pant | `best-neutral` | column-building | `anchor` | `2-4` | Simple uninterrupted line. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `MC-L01` | Collarless jacket | `best-neutral` | shoulder-structure adding | `polish` | `3-4` | Minimal seams and hardware. |
| `MC-L02` | Longline cardigan | `best-neutral` | vertical-line creating | `warmth` | `2-4` | Soft over structured bottoms. |
| `MC-L03` | Unstructured coat | `signature` | frame-extending | `weather` | `3-4` | Clean closure or wrap shape. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `MC-S01` | Minimal leather sneaker | `best-neutral` | none | `bridge` | `2-3` |  |
| `MC-S02` | Sleek loafer or refined slip-on | `best-neutral` | none | `bridge` | `3-4` |  |
| `MC-S03` | Refined ankle boot | `best-neutral` | anchoring | `anchor` | `3-4` |  |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `MC-A01` | Narrow leather belt | `best-neutral` | waist-defining | `finish` | `2-4` | Use only when the outfit needs a break. |
| `MC-A02` | Sculptural cuff or ring | `any` | focal-point creating | `finish` | `2-4` | Shape over color. |
| `MC-A03` | Soft structured shoulder bag | `best-neutral` | none | `utility` | `2-4` |  |
| `MC-A04` | Minimal watch | `any` | none | `finish` | `2-4` |  |
| `MC-A05` | Fine knit scarf | `best-neutral` | vertical-line creating | `texture` | `2-4` | Texture over contrast. |

### Outfit formulas
- Quiet uniform: MC-T02 + MC-B01 + MC-L01 + MC-S02.
- Relaxed clean: MC-T01 + MC-B02 + MC-L02 + MC-S01.
- Long-line polish: MC-T04 + MC-B03 + MC-L03 + MC-S03.

### Substitution rules
- High-contrast user palette: still render low-contrast by choosing adjacent roles from the locked palette.
- Warm climate: MC-L03 becomes an unlined long overshirt or duster.
- Extra formality: swap MC-S01 out first, not the clean denim slot.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

## Classic / Timeless
**ID:** `classic-timeless`
**Style preset:** `classic-timeless`
**Lifestyle:** Heritage shapes, investment-grade staples, smart casual defaults, and pieces designed to age well.
**Default formality:** 2-4
**Philosophy:** Prioritize familiar forms with proven longevity: collars, knits, tailoring, trench shapes, and reliable footwear. Personality comes from texture, proportion, and small accessories rather than trend volume.
**Capsule logic:** Crisp shirt lines, heritage knit texture, tailored outerwear, and grounded shoes.
**Palette recipe:** Best-neutral foundation with signature heritage pattern and texture slots.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CT-T01` | Oxford button-down shirt | `best-neutral` | vertical-line creating | `base` | `3-4` | Collar works alone or layered. |
| `CT-T02` | Breton stripe knit tee | `signature` | shoulder-balancing | `heritage` | `2-3` | Classic pattern without trend dependence. |
| `CT-T03` | Fine-gauge crewneck sweater | `best-neutral` | none | `base` | `2-4` | Layer over shirt or wear solo. |
| `CT-T04` | Cashmere or lambswool roll-neck | `best-neutral` | neck-lengthening | `polish` | `3-4` | Dresses up denim or tailoring. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CT-B01` | Straight-leg denim jean | `best-neutral` | anchoring | `anchor` | `2-3` | Classic rise and full-length option. |
| `CT-B02` | Tailored chino trouser | `best-neutral` | vertical-line creating | `bridge` | `2-4` |  |
| `CT-B03` | A-line skirt or pressed trouser alternative | `best-neutral` | waist-defining | `polish` | `3-4` | Choose by presentation setting and hem rules. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CT-L01` | Structured blazer | `best-neutral` | shoulder-structure adding | `polish` | `3-4` | Core heritage layer. |
| `CT-L02` | Trench coat | `best-neutral` | vertical-line creating | `weather` | `3-4` | Works over casual or tailored looks. |
| `CT-L03` | Cable-knit cardigan or sweater jacket | `signature` | frame-softening | `texture` | `2-4` | Texture adds tradition. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CT-S01` | Penny loafer | `best-neutral` | none | `anchor` | `2-4` |  |
| `CT-S02` | Leather dress boot | `best-neutral` | anchoring | `weather` | `3-4` |  |
| `CT-S03` | Clean court sneaker | `best-neutral` | none | `casualize` | `2-3` |  |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `CT-A01` | Leather belt with simple buckle | `best-neutral` | waist-defining | `finish` | `2-4` |  |
| `CT-A02` | Heritage watch | `any` | none | `finish` | `2-4` |  |
| `CT-A03` | Structured satchel or top-handle bag | `best-neutral` | none | `utility` | `2-4` |  |
| `CT-A04` | Silk scarf or neckerchief | `signature` | face-framing | `polish` | `2-4` | Adds polish without another layer. |
| `CT-A05` | Small stud, signet-style, or heritage jewelry | `any` | focal-point creating | `finish` | `2-4` |  |

### Outfit formulas
- Classic smart casual: CT-T01 + CT-B01 + CT-L01 + CT-S01.
- Heritage texture: CT-T04 + CT-B02 + CT-L03 + CT-S02.
- Relaxed weekend classic: CT-T02 + CT-B01 + CT-L02 + CT-S03.

### Substitution rules
- Very casual user: CT-L01 can render as an unstructured blazer instead of hard tailoring.
- Warm climate: CT-T04 becomes a fine-gauge short-sleeve knit with the same palette role.
- No skirt preference: CT-B03 becomes a pressed straight trouser or tailored culotte.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

## Bold / Statement
**ID:** `bold-statement`
**Style preset:** `bold-statement`
**Lifestyle:** Standout dressing, creative contexts, social plans, events, and personality-forward styling.
**Default formality:** 2-5
**Philosophy:** Every outfit gets one hero and a supporting cast. Accent roles create drama, but best-neutral anchors keep the capsule combinable.
**Capsule logic:** Hero slot plus anchor slot; avoid stacking loud pieces unless user explicitly requests high drama.
**Palette recipe:** Highest accent density; every accent item has a neutral counterpart nearby.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `BS-T01` | Sculptural tee or tank | `accent` | focal-point creating | `hero` | `2-4` | Use when the bottom is quiet. |
| `BS-T02` | Patterned button-front shirt | `signature` | vertical-line creating | `hero` | `2-5` | Pattern scale should be app-controlled. |
| `BS-T03` | Oversized poplin shirt | `best-neutral` | volume-balancing | `anchor` | `2-4` | Crisp counterpoint to statement pieces. |
| `BS-T04` | Fine-knit top with distinctive neckline | `signature` | face-framing | `bridge` | `3-5` | Lets accessories stay simpler. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `BS-B01` | Wide-leg statement trouser | `accent` | volume-balancing | `hero` | `3-5` | Primary hero bottom. |
| `BS-B02` | Clean straight jean or trouser | `best-neutral` | anchoring | `anchor` | `2-4` | Resets louder tops. |
| `BS-B03` | Tailored skirt or split-hem pant | `signature` | leg-line lengthening | `bridge` | `3-5` | Movement without clutter. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `BS-L01` | Sharp blazer with strong lapel | `signature` | shoulder-structure adding | `hero` | `3-5` | Main power layer. |
| `BS-L02` | Cropped jacket or bomber | `accent` | proportion-breaking | `hero` | `2-4` | Changes the outfit line fast. |
| `BS-L03` | Long coat with clean front | `best-neutral` | vertical-line creating | `anchor` | `3-5` | Grounds the capsule. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `BS-S01` | Sculptural dress shoe or boot | `accent` | focal-point creating | `hero` | `3-5` |  |
| `BS-S02` | Sleek low-top sneaker | `best-neutral` | none | `anchor` | `2-3` |  |
| `BS-S03` | Platform loafer or substantial-sole derby | `signature` | anchoring | `bridge` | `3-5` |  |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `BS-A01` | Statement belt | `accent` | waist-defining | `hero` | `2-5` |  |
| `BS-A02` | Oversized or geometric eyewear | `any` | face-framing | `hero` | `2-5` |  |
| `BS-A03` | Structured mini or shoulder bag | `signature` | focal-point creating | `hero` | `2-5` |  |
| `BS-A04` | Bold cuff, ring stack, or earrings | `any` | focal-point creating | `hero` | `2-5` |  |
| `BS-A05` | Graphic scarf | `accent` | vertical-line creating | `hero` | `2-5` | Tie at neck, bag, or waist. |

### Outfit formulas
- Top hero: BS-T02 + BS-B02 + BS-L03 + BS-S02.
- Bottom hero: BS-T03 + BS-B01 + BS-L03 + BS-S03.
- Event hero: BS-T04 + BS-B03 + BS-L01 + BS-S01.

### Substitution rules
- Low-drama mode: convert BS-L02 or BS-B01 from accent to signature at render time.
- Maximum-drama mode: allow two hero slots only if one is accessory-scale.
- Professional context: prefer BS-L01 over BS-L02 and suppress oversized eyewear.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

## Street / Urban
**ID:** `street-urban`
**Style preset:** `street-urban`
**Lifestyle:** Contemporary streetwear-influenced dressing for sneakers, utility details, layered outerwear, and relaxed proportions.
**Default formality:** 1-3
**Philosophy:** Shape comes from proportion play: boxy tops, useful pockets, substantial shoes, and open layers. Logos are optional; the capsule should still read urban through cut, fabric, and styling.
**Capsule logic:** Oversized top or layer plus grounded shoe; balance volume with one cleaner base slot.
**Palette recipe:** Best-neutral utility base, signature sportswear pieces, and accent graphics or socks.

### Tops (4)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `SU-T01` | Heavyweight boxy tee | `best-neutral` | shoulder-balancing | `base` | `1-2` | Clean base for layers. |
| `SU-T02` | Graphic tee | `accent` | focal-point creating | `hero` | `1-3` | Gate graphic intensity by user preference. |
| `SU-T03` | Oversized hoodie | `signature` | volume-balancing | `core` | `1-3` | Top or mid-layer. |
| `SU-T04` | Ribbed tank or fitted base top | `best-neutral` | torso-line defining | `base` | `1-2` | Balances loose bottoms. |

### Bottoms (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `SU-B01` | Relaxed cargo pant | `best-neutral` | volume-balancing | `utility` | `1-3` | Pocket detail adds shape. |
| `SU-B02` | Straight or loose denim jean | `best-neutral` | anchoring | `anchor` | `1-3` | Avoid heavy distressing unless opted in. |
| `SU-B03` | Track pant or nylon pull-on pant | `signature` | leg-line tapering | `sport` | `1-2` | Sporty swap. |

### Layers (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `SU-L01` | Overshirt or shacket | `best-neutral` | shoulder-structure adding | `utility` | `1-3` | Easy open layer. |
| `SU-L02` | Bomber or varsity-style jacket | `signature` | shoulder-balancing | `hero` | `1-3` | Graphic impact without relying on logos. |
| `SU-L03` | Puffer vest or utility vest | `accent` | upper-body volume adding | `hero` | `1-3` | High-impact layering piece. |

### Shoes (3)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `SU-S01` | Chunky sneaker | `best-neutral` | anchoring | `anchor` | `1-3` |  |
| `SU-S02` | Retro runner | `signature` | none | `sport` | `1-3` | Athletic contrast. |
| `SU-S03` | Weather-ready boot | `best-neutral` | grounding | `weather` | `1-3` |  |

### Accessories (5)
| Slot | Type | Palette | Silhouette | Intent | Formality | Runtime note |
|---|---|---|---|---|---|---|
| `SU-A01` | Beanie or cuffed knit cap | `signature` | face-framing | `finish` | `1-3` |  |
| `SU-A02` | Crossbody utility bag | `best-neutral` | none | `utility` | `1-3` |  |
| `SU-A03` | Webbing or tactical-style belt | `best-neutral` | waist-defining | `utility` | `1-3` |  |
| `SU-A04` | Sport watch or digital watch | `any` | none | `finish` | `1-3` |  |
| `SU-A05` | Tall socks or layered sock set | `accent` | leg-line breaking | `finish` | `1-2` | Visible detail should look intentional. |

### Outfit formulas
- Core street uniform: SU-T01 + SU-B01 + SU-L01 + SU-S01.
- Graphic layer: SU-T02 + SU-B02 + SU-L02 + SU-S02.
- Utility weather: SU-T03 + SU-B01 + SU-L03 + SU-S03.

### Substitution rules
- Logo-averse user: render graphics as texture, paneling, or pocket detail instead of branding.
- Higher polish: use SU-L01 and SU-S03 before adding tailoring.
- Hot climate: SU-L03 becomes a utility mesh or lightweight field vest.

### Outfit math
- 4 tops x 3 bottoms x 3 layers = 36 base outfit structures before shoes, accessories, climate swaps, and formality rendering.

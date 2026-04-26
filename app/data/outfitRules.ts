// Auto-generated from research/outfit-composition-rules.md by scripts/port-outfit-composition-rules.ts.
// Re-run that script to regenerate after the research file changes.

import type { OutfitRulesData } from "../lib/outfitRulesTypes";

export const OUTFIT_RULES: OutfitRulesData = {
  sourcing: "These rules synthesize tailoring, capsule-wardrobe, wardrobe-consultancy, and stylist guidance into palette-agnostic composition constraints. They assume the app applies canonical body-shape silhouette rules first, then uses these occasion rules for proportion, layer, fabric, palette-tier, and finishing decisions.",
  occasions: {
    "work": {
      id: "work",
      name: "Work / Polished",
      compositionTarget: "1 top + 1 bottom + 1 structured layer + 1 polished shoes + 2-3 accessories",
      goal: "Read structured, credible, and calm; best-neutrals lead while one controlled signature element adds personality.",
      paletteApproach: ["Best-neutrals do 70-80% of the work across top, bottom, layer, and primary shoe.","Use 0-1 loud piece; the rest stay quiet, smooth, and repeatable.","Metals and hardware stay consistent with the user's best metal direction."],
      silhouettePrinciples: ["At least one garment supplies structure: jacket, trouser, skirt, dress, or crisp shirt.","Vertical line dominates through open layers, matched separates, or uninterrupted top-to-bottom value.","Pair relaxed volume with discipline: soft top + tailored bottom, or soft bottom + structured layer."],
      layeringStrategy: ["One indoor layer is the default: blazer, structured cardigan, overshirt-jacket, or refined vest.","Layer breaks stack cleanly: outdoor layers land mid-thigh or longer; trousers meet the shoe without heavy pooling."],
      fabricGuidance: ["Prefer smooth wovens, tropical or worsted wool, cotton poplin or oxford, fine-gauge knit, crepe, lined twill, polished leather, and refined suede.","Use carefully: jersey, sweatshirt fleece, distressed denim, sheer fabrics, high-gloss satin, noisy technical synthetics, and limp knits."],
      exampleOutfitShapes: ["Oxford shirt + tailored trouser + single-breasted blazer + leather oxford + watch + belt","Fine-gauge knit + tailored trouser + structured cardigan + loafer + watch + minimal chain","Blouse + straight skirt + open trench + dress flat or low heel + simple earrings + structured tote","Knit polo + tailored chino + unstructured blazer + suede loafer + watch"],
      useCarefully: ["Cropped tops or short layers work best when the waist connection is intentional.","Athletic sneakers fit creative or tech workplaces when minimal, clean, and paired with tailoring.","Loud accents at both top and bottom can split authority; choose one personality anchor."],
    },
    "casual": {
      id: "casual",
      name: "Casual / Everyday",
      compositionTarget: "1 base top + 1 bottom + 0-1 light layer + 1 comfortable shoes + 1-2 accessories",
      goal: "Feel relaxed and mobile while still looking chosen; comfort leads, but one polish signal finishes the outfit.",
      paletteApproach: ["Best-neutrals do 60-70% of the work so frequent-wear pieces mix easily.","Use 0-1 loud piece: signature top, accent layer, patterned accessory, or expressive shoe.","Metals and hardware stay low-key; zippers, snaps, glasses, watch, and bag hardware should feel practical."],
      silhouettePrinciples: ["Ease is allowed, but at least one line is clean: shoulder, hem, waist, sleeve, or shoe profile.","Balance relaxed volume with one sharper element, such as a straight bottom, clean shoe, belt, or structured bag.","Tops land intentionally: tucked, half-tucked, cropped to meet the rise, or long enough to read deliberate."],
      layeringStrategy: ["Use a simple base-mid-outer stack: tee or knit + overshirt/cardigan/chore layer + weather layer when needed.","Casual layers may stay open; breaks can be soft, but hems should not pool, drag, or bunch heavily over shoes."],
      fabricGuidance: ["Prefer cotton jersey, denim, chino twill, brushed cotton, canvas, rib knit, medium-gauge knit, washable wool, soft leather, suede, and weather-friendly outerwear.","Use carefully: head-to-toe fleece, clingy jersey, delicate evening fabrics, bulky technical shells, distressed finishes, and very thin knits."],
      exampleOutfitShapes: ["Tee + straight jean + overshirt + low-top sneaker + watch + belt","Knit polo + chino + chore jacket + leather sneaker + compact crossbody","Fine-gauge crewneck + relaxed trouser + bomber jacket + casual loafer + simple glasses","Casual dress + denim jacket + clean sneaker + compact bag + small jewelry"],
      useCarefully: ["Oversized top plus oversized bottom works best with a compact shoe, visible wrist/ankle, or structured bag.","Athletic pieces read intentional when limited to one category: shoe, jacket, or pant.","Very soft fabrics benefit from one firmer element so the outfit does not collapse visually."],
    },
    "event": {
      id: "event",
      name: "Event / Elevated",
      compositionTarget: "1 full-body base OR 1 top + 1 bottom + 0-1 refined layer + 1 elevated shoes + 2-3 finishing accessories",
      goal: "Signal occasion and intention; richer fabric, sharper finish, and one clear statement element create elevation.",
      paletteApproach: ["Best-neutrals or signature pieces carry the main garment area; accent appears as a controlled focal point.","Use exactly 1 loud piece when possible: statement garment, texture, jewelry, shoe, or bag.","Metals and hardware may be more visible than daytime wear, but should repeat intentionally."],
      silhouettePrinciples: ["Choose one dominant shape: long column, tailored suit, fluid drape, full skirt, or sculptural layer.","Let the eye travel cleanly from neckline to hem; event outfits benefit from fewer horizontal interruptions.","Negative space is planned: neckline, sleeve, wrist, ankle, or open jacket can lighten dense fabrics."],
      layeringStrategy: ["The layer is part of the look: tuxedo jacket, evening coat, shawl, wrap, duster, or refined bolero.","Long outer layers match or exceed base formality; cropped layers end at a deliberate high-hip or waist point."],
      fabricGuidance: ["Prefer crepe, wool barathea, fine wool, silk or silk-blend, satin faille, velvet, lace or mesh with lining, fluid jersey, beading, and polished leather or suede.","Use carefully: plain cotton poplin, casual linen, sweatshirt fleece, distressed denim, outdoor technical fabrics, and cheap shiny synthetics."],
      exampleOutfitShapes: ["Dress shirt + evening trouser + dinner jacket + formal lace-up + pocket square + watch","Silk-blend shell + full skirt + cropped jacket + dress heel or polished flat + clutch + earrings","Draped blouse + fluid trouser + long coat + dress boot + sculptural jewelry","Structured jumpsuit + refined wrap + elevated shoe + clutch + statement earring"],
      useCarefully: ["Multiple statement textures work best when they share one visual direction, such as shine, pile, sheerness, or embellishment.","Daytime work pieces need richer fabric, sharper shoes, and more deliberate jewelry to read event-ready.","Large bags, bulky coats, and casual belts can downshift the occasion unless the venue is relaxed."],
    },
  },
};

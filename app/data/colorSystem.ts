// Auto-generated from research/color-theory.md by scripts/port-color-theory.ts.
// Re-run that script to regenerate after the research file changes.

import type { PaletteSwatchGroup } from "../lib/paletteTypes";

export type SeasonFamily = "spring" | "summer" | "autumn" | "winter";
export type SeasonUndertone =
  | "warm"
  | "neutral-warm"
  | "neutral"
  | "neutral-cool"
  | "cool"
  | "olive";
export type SeasonDepth = "light" | "medium" | "medium-deep" | "deep";
export type SeasonChroma = "soft" | "clear" | "bright";
export type SeasonContrast = "low" | "medium" | "high";

export type ColorSeasonRule = {
  id: string;
  name: string;
  family: SeasonFamily;
  aliases: string[];
  sisterSeasons: string[];
  traits: {
    undertone: SeasonUndertone;
    depth: SeasonDepth;
    chroma: SeasonChroma;
    contrast: SeasonContrast;
  };
  traitNotes?: {
    undertone?: string;
    depth?: string;
    chroma?: string;
    contrast?: string;
  };
  munsellPositioning?: string;
  skinTextureMetaphor?: string;
  descriptiveNotes: string[];
  palette: PaletteSwatchGroup;
  rules: string[];
  sources: string[];
  confidenceNote?: string;
  populated: boolean;
};

export const COLOR_SYSTEM: Record<string, ColorSeasonRule> = {
  "light-spring": {
    id: "light-spring",
    name: "Light Spring",
    family: "spring",
    aliases: [],
    sisterSeasons: ["light-summer","true-spring"],
    traits: {"undertone":"neutral-warm","depth":"light","chroma":"clear","contrast":"low"},
    traitNotes: {"undertone":"warm dominant with a Summer-cool whisper","depth":"highest value of any Spring; the primary characteristic","chroma":"medium-high; reads pastel because lightness plus brightness equals pastel","contrast":"Scaman: extremes of light and dark are absent"},
    munsellPositioning: "high value (8–9), moderate chroma (4–8), warm hue band 5YR–10Y leaning toward 2.5Y",
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Vanilla Cream","hex":"#F7EBD4"},{"name":"Eggshell Off-White","hex":"#F4ECDC"},{"name":"Warm Stone Gray","hex":"#8C8475","note":"Light Spring's \"black\""},{"name":"Light Warm Taupe","hex":"#C9B79A"},{"name":"Light Camel","hex":"#C8A67E"},{"name":"Soft Dove Gray","hex":"#B6B0A0"},{"name":"Light Warm Denim","hex":"#8FA7BC"}],
      signatureColors: [{"name":"Peach","hex":"#F4B999"},{"name":"Light Coral","hex":"#F69E8E"},{"name":"Warm Pastel Pink","hex":"#F7B6BC"},{"name":"Buttercup","hex":"#F8DC75"},{"name":"Light Mint Green","hex":"#B6E3B8"},{"name":"Light Aqua","hex":"#7CCFC8"},{"name":"Soft Sky Blue","hex":"#9CC8E0"},{"name":"Cantaloupe","hex":"#F6B97B"}],
      accentColors: [{"name":"Hot Coral","hex":"#F37C5E"},{"name":"Light Periwinkle","hex":"#A6A8DC"},{"name":"Clear Pastel Lime","hex":"#CDE17A"},{"name":"Tea Rose","hex":"#EDA0A8"},{"name":"Light Chinese Blue","hex":"#5E8AAE","note":"darkness limit"}],
      useCarefully: [{"name":"True Black","hex":"#000000","note":"cold and dark; replace with warm stone gray"},{"name":"Pure White","hex":"#FFFFFF","note":"too cool/harsh; use vanilla cream"},{"name":"Charcoal","hex":"#36454F","note":"exceeds darkness limit"},{"name":"Burnt Orange","hex":"#CC5500","note":"too saturated"},{"name":"Deep Navy","hex":"#1F2A66","note":"too dark for low-contrast face"},{"name":"Hot Magenta","hex":"#E0218A","note":"reads Bright Winter or Bright Spring"}],
    },
    rules: ["Keep value range light to light-medium; never exceed warm granite or stone gray near the face.","Replace true white with vanilla cream and black with warm stone gray.","Wear at least one colorful piece per outfit; all-neutral looks drain vitality.","Choose warm light gold or polished light metals; avoid antiqued or oxidized finishes.","Pair analogous hues at similar value to mirror the natural low contrast.","Avoid icy, glittery, or stark Winter effects; the Light Spring effect is creamy and dewy, not frosted."],
    sources: ["https://12blueprints.com/blogs/blog/comparing-light-and-bright-spring","https://12blueprints.com/light-spring-looking-serious/","https://12blueprints.com/products/eyeshadow-palette-light-spring","https://www.chrysaliscolour.com/more/learn-about-your-season/light-spring/","https://elementalcolour.com.au/blog/light-spring","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/light-spring-a-comprehensive-guide","https://gabriellearruda.com/the-light-spring-seasonal-color-guide/","https://palettepath.com/color-season/light-spring/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "true-spring": {
    id: "true-spring",
    name: "True Spring",
    family: "spring",
    aliases: ["warm-spring","golden-spring"],
    sisterSeasons: [],
    traits: {"undertone":"warm","depth":"medium","chroma":"bright","contrast":"medium"},
    traitNotes: {"undertone":"pure warm, no blue undertones; lighter and brighter than Autumn's gold","depth":"range from buttery ivory to warm dove gray; no extremely dark colors","chroma":"high chroma; saturated and vivid","contrast":"visible feature contrast without true white or black extremes"},
    munsellPositioning: "hue 5YR–7.5Y (most yellow-orange seasonal palette), value 6–8, chroma 8–14",
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Warm Ivory","hex":"#F6EBC9"},{"name":"French Vanilla","hex":"#F2E2BD"},{"name":"Light Yolk","hex":"#EBD18A"},{"name":"Warm Camel","hex":"#C99A5B"},{"name":"Golden Khaki","hex":"#B5A06A"},{"name":"Warm Chocolate Brown","hex":"#6F4A2D"},{"name":"Hippo Gray-Brown","hex":"#6E6657","note":"True Spring's \"black\""}],
      signatureColors: [{"name":"Clear Coral","hex":"#F37855"},{"name":"Peach","hex":"#F8A572"},{"name":"Warm Bright Yellow","hex":"#F5C84B"},{"name":"Mandarin Orange","hex":"#F08A3E"},{"name":"Tomato Red","hex":"#E04E2A"},{"name":"Warm Grass Green","hex":"#7BBB4F"},{"name":"Clear Turquoise","hex":"#3FB6B8"},{"name":"Warm Pastel Aqua","hex":"#9DD9C5"}],
      accentColors: [{"name":"Hot Watermelon Pink","hex":"#F25979"},{"name":"Periwinkle","hex":"#7B7CCB"},{"name":"Bright Lime","hex":"#B7D24A"},{"name":"Sugar Syrup","hex":"#F49F92"},{"name":"Marina","hex":"#3066B0"}],
      useCarefully: [{"name":"True Black","hex":"#000000","note":"too cold/dark; replace with hippo gray-brown or warm chocolate"},{"name":"True White","hex":"#FFFFFF","note":"too cool/harsh; use cream or buttermilk"},{"name":"Icy Pastel","hex":"#D6E9F5","note":"clashes with pure warmth"},{"name":"Dusty Rust","hex":"#B7410E","note":"Autumn shade dampens brightness"},{"name":"Burgundy","hex":"#722F37","note":"too cool and dark"},{"name":"Cool Fuchsia","hex":"#D81B60","note":"a pure-warm palette cannot host blue-pink"}],
    },
    rules: ["Eliminate black and pure white from the face; substitute warm ivory and warm chocolate.","Lead with warmth in every piece; if it leans cool, drop it.","Wear at least one bright or clear color per outfit; never head-to-toe neutrals.","Choose light, shiny yellow gold over silver; rose gold works only if peachy.","Pair value contrast with hue contrast (teal with peach, coral with turquoise).","Prefer dewy, glossy, juicy finishes; avoid heavy matte or dusty fabrics."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-true-spring","https://12blueprints.com/products/neutrals-set-true-spring","https://www.chrysaliscolour.com/more/learn-about-your-season/true-spring/","https://elementalcolour.com.au/blog/true-spring","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/true-spring-a-comprehensive-guide","https://gabriellearruda.com/true-spring-color-palette-wardrobe-guide/","https://palettepath.com/color-season/true-spring/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "bright-spring": {
    id: "bright-spring",
    name: "Bright Spring",
    family: "spring",
    aliases: ["clear-spring"],
    sisterSeasons: [],
    traits: {"undertone":"neutral-warm","depth":"medium","chroma":"bright","contrast":"high"},
    traitNotes: {"undertone":"warm dominant with Winter cool influence","depth":"range from light warm beige to warmed charcoal; mid-value cluster","chroma":"very high; only Bright Winter rivals it","contrast":"Scaman: wider light to dark than other Springs"},
    munsellPositioning: "hue 5YR–5Y leaning warm, value 5–7, chroma 10–16",
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Warm Off-White","hex":"#F5EFDF"},{"name":"Light Warm Beige","hex":"#E1CDA8"},{"name":"Warm Camel","hex":"#B7895A"},{"name":"Warm Greyish Brown","hex":"#6E5A47"},{"name":"Warmed Charcoal","hex":"#3A3530","note":"Bright Spring's \"black\""},{"name":"Bright Spring Navy","hex":"#1F3050","note":"warm blue-black"},{"name":"Light Greenish Gray","hex":"#B5B6A4"}],
      signatureColors: [{"name":"Bright Coral","hex":"#FF6F4D"},{"name":"Hot Pink","hex":"#F73E76"},{"name":"Lime","hex":"#9CCB3B"},{"name":"Bright Turquoise","hex":"#1FBFC5"},{"name":"Bright Royal/Cobalt Blue","hex":"#1F4FC8"},{"name":"Bright Lemon-Warm Yellow","hex":"#F5D324"},{"name":"Tropical Emerald","hex":"#1FB36A"},{"name":"Warm Fuchsia","hex":"#D8328C"}],
      accentColors: [{"name":"Persimmon","hex":"#F26B1F"},{"name":"Pansy Purple","hex":"#7C3FB4"},{"name":"Electric Aqua","hex":"#3FD8D5"},{"name":"Tomato Red","hex":"#E63B2A"},{"name":"Bright Buttercream","hex":"#F8E36A"}],
      useCarefully: [{"name":"Pure Black","hex":"#000000","note":"usable but never solo at the face; mix with bright color"},{"name":"Stark True White","hex":"#FFFFFF","note":"too icy; use warm off-white"},{"name":"Mustard","hex":"#C9A227","note":"Autumn earthiness dulls brightness"},{"name":"Dusty Heathered Pastel","hex":"#C8B6B0","note":"flattens and drains"},{"name":"Cool Icy Pastel","hex":"#D9E9F5","note":"clashes with warm undertone"},{"name":"Burnt Camel-Orange","hex":"#A0522D","note":"Autumn richness reads heavy"}],
    },
    rules: ["Wear at least one fully saturated palette color near the face; muted-only outfits flatten Bright Spring.","Use hue contrast (coral with turquoise, lime with magenta) over value contrast alone.","Pair black with a bright accent; never wear black solo at the face.","Choose shiny, polished finishes in metals and fabrics; avoid matte and antiqued.","Replace burnt orange and earthy browns with warm chocolate or warm camel.","Embrace clear, glassy effects (icier lights and high contrast as Winter influence arrives)."],
    sources: ["https://12blueprints.com/blogs/blog/the-consistent-bright-spring-landscape","https://12blueprints.com/blogs/blog/comparing-light-and-bright-spring","https://12blueprints.com/products/eyeshadow-palette-bright-spring","https://www.chrysaliscolour.com/more/learn-about-your-season/bright-spring/","https://elementalcolour.com.au/blog/bright-spring","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/bright-spring-a-comprehensive-guide","https://gabriellearruda.com/bright-spring-seasonal-color-ultimate-guide/","https://palettepath.com/color-season/bright-spring/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "light-summer": {
    id: "light-summer",
    name: "Light Summer",
    family: "summer",
    aliases: ["cool-light","sunlit-summer"],
    sisterSeasons: ["light-spring","true-summer"],
    traits: {"undertone":"neutral-cool","depth":"light","chroma":"soft","contrast":"low"},
    traitNotes: {"undertone":"cool with a small Spring-derived warmth dab","chroma":"medium; the brightest of the Summers, sometimes called \"soft-bright\""},
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Vanilla Ice Cream White","hex":"#F4ECDD"},{"name":"Light Pink Beige","hex":"#E6D5CC","note":"Peige"},{"name":"Dove Gray","hex":"#C9CDD0"},{"name":"Cool Light Taupe","hex":"#ACA6A2"},{"name":"Pewter","hex":"#9AA0A6"},{"name":"Cocoa Mauve","hex":"#8C7B7A"},{"name":"Soft Charcoal Navy","hex":"#475467"}],
      signatureColors: [{"name":"Powder Blue","hex":"#B0D4E3"},{"name":"Cornflower Blue","hex":"#7FB3D5"},{"name":"Periwinkle","hex":"#A6B6E0"},{"name":"Lavender","hex":"#C9B8E0"},{"name":"Light Wisteria","hex":"#B7A4D1"},{"name":"Cool Watermelon Pink","hex":"#F0A6BB"},{"name":"Sea Mist Mint","hex":"#B7DEC9"},{"name":"Light Rose","hex":"#E8B7C2"}],
      accentColors: [{"name":"Sky Blue","hex":"#A8C8E5"},{"name":"Light Orchid","hex":"#DBBAD9"},{"name":"Cool Coral Pink","hex":"#F2A6A0"},{"name":"Aster Purple","hex":"#8E7FB6"},{"name":"Cool Mint","hex":"#9DCFB6"}],
      useCarefully: [{"name":"Cool Raspberry","hex":"#B85D7A","note":"deepest red"},{"name":"Spruce Green","hex":"#3F6B5C","note":"darkness limit"},{"name":"Cadet Blue","hex":"#5F8C95"},{"name":"Ash Brown","hex":"#6E5E58","note":"darkness limit"},{"name":"Soft Black","hex":"#3E3F46"},{"name":"Cool Light Lemon","hex":"#F1EAB6","note":"use sparingly"}],
    },
    rules: ["Keep value light overall; never go deeper than soft charcoal or rose-brown near the face.","Stay neutral-cool; lead with blues but allow a vanilla or pink-gold whisper of Spring warmth.","Replace pure white with vanilla and pure black with soft koala gray or charcoal navy.","Use silver and white-gold metals in matte or satin finishes, not high-gloss.","Build low-contrast outfits with pastels and light-medium neutrals; avoid black-and-white pairings.","Use clear cool pastels as accents to repeat eye color and lift the skin."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-light-summer","https://12blueprints.com/products/eyeshadow-palette-light-summer","https://www.chrysaliscolour.com/more/learn-about-your-season/light-summer/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/light-summer-a-comprehensive-guide","https://elementalcolour.com.au/blog/light-summer","https://gabriellearruda.com/light-summer-complete-guide/","https://palettepath.com/color-season-guides/light-summer-color-palette-guide/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
  "true-summer": {
    id: "true-summer",
    name: "True Summer",
    family: "summer",
    aliases: ["cool-summer","pure-summer"],
    sisterSeasons: [],
    traits: {"undertone":"cool","depth":"medium","chroma":"soft","contrast":"medium"},
    traitNotes: {"undertone":"purely cool, blue-based, no yellow","depth":"light to medium-dark; chalk to pewter","chroma":"medium; muted but not drab; rose-based and dusty","contrast":"low-to-medium"},
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Cotton White","hex":"#F2EEEA"},{"name":"Light Cool Gray","hex":"#C5C9CE"},{"name":"Raincloud","hex":"#8E97A3"},{"name":"Pewter","hex":"#6E747C"},{"name":"Mushroom","hex":"#8F8579"},{"name":"Cool Rose Brown","hex":"#7A5C5E"},{"name":"Soft Navy","hex":"#3D4655"}],
      signatureColors: [{"name":"Lake Blue","hex":"#3F7BAA"},{"name":"Periwinkle","hex":"#7B8CC8"},{"name":"Lichen","hex":"#5C7B8C"},{"name":"Soft Teal","hex":"#5E9499"},{"name":"Lavender","hex":"#9F8FBF"},{"name":"Dusty Rose","hex":"#C18A99"},{"name":"Cool Raspberry","hex":"#B7546F"},{"name":"Spruce","hex":"#3F6B5C"}],
      accentColors: [{"name":"Aubergine","hex":"#5B3A57"},{"name":"Cool Berry","hex":"#8E3A5C"},{"name":"Soft Fuchsia","hex":"#B85B89"},{"name":"Cornflower","hex":"#6F7CB8"},{"name":"Soft Jade","hex":"#7AA89A"}],
      useCarefully: [{"name":"Cool Lemon","hex":"#E8E3B0","note":"use sparingly"},{"name":"Deep Rose","hex":"#9C3A5A","note":"saturation cap"},{"name":"Burgundy","hex":"#6E2840","note":"avoid Winter intensity"},{"name":"Charcoal","hex":"#3A3D44","note":"replaces black; stay below true black"},{"name":"Bright Magenta","hex":"#C03078","note":"too saturated"},{"name":"Pure White","hex":"#FFFFFF","note":"too icy"}],
    },
    rules: ["Lead with coolness; every choice contains blue, never yellow undertones.","Replace pure black with soft navy or pewter and pure white with cotton or eggshell.","Keep contrast medium and gradients gentle; combine within muted-to-medium chroma.","Use silver, platinum, white gold, pearls, rose quartz, sapphire, amethyst.","Build outfits as misty watercolor harmonies of pinks, blues, greys, lavenders.","Cap saturation; bright cool magenta and bright royal blue read too intense, soften toward rose and periwinkle."],
    sources: ["https://12blueprints.com/products/eyeshadow-palette-true-summer","https://12blueprints.com/blogs/blog/how-summers-intensify-eye-colour","https://www.chrysaliscolour.com/more/learn-about-your-season/true-summer/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/true-summer-a-comprehensive-guide","https://elementalcolour.com.au/blog/true-summer","https://gabriellearruda.com/true-summer-seasonal-color-ultimate-guide/","https://palettepath.com/color-season/true-summer/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
  "soft-summer": {
    id: "soft-summer",
    name: "Soft Summer",
    family: "summer",
    aliases: ["muted-summer"],
    sisterSeasons: ["soft-autumn","true-summer"],
    traits: {"undertone":"neutral-cool","depth":"medium","chroma":"soft","contrast":"low"},
    traitNotes: {"undertone":"cool primary with an Autumn-derived warmth trace","depth":"the darkest of the Summer trio","chroma":"very desaturated; tied with Soft Autumn for most muted season"},
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Antique White","hex":"#EDE6DC"},{"name":"Light Pearl Gray","hex":"#C4C2BE"},{"name":"Greige","hex":"#B7A99A"},{"name":"Cool Taupe","hex":"#9C8E80"},{"name":"Pewter","hex":"#7C7A78"},{"name":"Brown Burgundy","hex":"#5E4A4A"},{"name":"Soft Charcoal","hex":"#4A4B53"}],
      signatureColors: [{"name":"Smoked Mauve","hex":"#A899B5"},{"name":"Hazy Sky","hex":"#A8BDCF"},{"name":"Soft Mauve","hex":"#B997A5"},{"name":"Cool Sage","hex":"#9DAE9A"},{"name":"Marlin","hex":"#7A92A8"},{"name":"Misty Mint","hex":"#BDCFBF"},{"name":"Antique Rose","hex":"#9E6B7E"},{"name":"Storm Blue","hex":"#5F7480"}],
      accentColors: [{"name":"Cranberry","hex":"#9F4F60"},{"name":"Muted Periwinkle","hex":"#8B95B5"},{"name":"Soft Eggplant","hex":"#5C455A"},{"name":"Muted Teal","hex":"#578082"},{"name":"Dusty Wine","hex":"#6E3D49"}],
      useCarefully: [{"name":"Pure Black","hex":"#000000","note":"too harsh; use brown burgundy or soft charcoal"},{"name":"Pure White","hex":"#FFFFFF","note":"too stark"},{"name":"Bright Lavender","hex":"#B57EDC","note":"needs the dustier version"},{"name":"Saturated Forest Green","hex":"#1F6B3B"},{"name":"Hot Fuchsia","hex":"#D03A85"},{"name":"Warm Camel","hex":"#B8915A","note":"Soft Autumn territory"}],
    },
    rules: ["Lead with softness; every color should appear filtered through gray mist.","Stay cool-neutral with cool-leaning pinks, blues, plums, sage; never golden, peachy, or earthy.","Replace black with brown burgundy or soft charcoal; replace white with antique or clamshell white.","Combine analogous and monochromatic gradients (taupe with mauve, sage with dusty blue).","Keep contrast low; bright saturated colors overpower the gentle palette.","Use brushed silver, pewter, antiqued white gold; pearls and matte stones; satin or matte textures."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-soft-summer","https://12blueprints.com/products/eyeshadow-palette-soft-summer","https://www.chrysaliscolour.com/more/learn-about-your-season/soft-summer/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/soft-summer-a-comprehensive-guide","https://elementalcolour.com.au/blog/soft-summer","https://gabriellearruda.com/soft-summer-the-ultimate-guide/","https://palettepath.com/color-season-guides/soft-summer-color-palette-guide/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
  "soft-autumn": {
    id: "soft-autumn",
    name: "Soft Autumn",
    family: "autumn",
    aliases: ["muted-autumn","tinted-autumn","soft-warm"],
    sisterSeasons: ["soft-summer"],
    traits: {"undertone":"neutral-warm","depth":"medium","chroma":"soft","contrast":"low"},
    traitNotes: {"undertone":"warm-neutral; both gold and silver work, gold preferred","depth":"does not reach extremes of light or dark","chroma":"lowest chroma of the Autumns; primary aspect","contrast":"low to low-medium"},
    skinTextureMetaphor: "suede",
    descriptiveNotes: [],
    palette: {
      bestNeutrals: [{"name":"Eggshell","hex":"#F1E7D2"},{"name":"Oat Beige","hex":"#D7C4A3"},{"name":"Mushroom Taupe","hex":"#A89684"},{"name":"Warm Wood-Ash Gray","hex":"#8C8275"},{"name":"Walnut Brown","hex":"#7A5E48"},{"name":"Sepia","hex":"#5A4232"},{"name":"Dusty Warm Charcoal","hex":"#4B423A"}],
      signatureColors: [{"name":"Golden Apricot","hex":"#E0B080"},{"name":"Muskmelon","hex":"#D89978"},{"name":"Coral Rose","hex":"#C58775"},{"name":"Dusty Rose","hex":"#B98A85"},{"name":"Fern","hex":"#8A8A5C"},{"name":"Sage Green","hex":"#A6B08C"},{"name":"Weathered Turquoise","hex":"#5E8A88"},{"name":"Soft Mustard","hex":"#C8A364"}],
      accentColors: [{"name":"Spiced Apple","hex":"#B5604A"},{"name":"Dusty Periwinkle","hex":"#7A8AA8","note":"warm-leaning"},{"name":"Muted Plum","hex":"#7E5A6E"},{"name":"Light Aloe","hex":"#9DAE82"},{"name":"Toasted Camel","hex":"#B89368"}],
      useCarefully: [{"name":"True Black","hex":"#000000","note":"too dark; ages and boxes the appearance"},{"name":"Pure White","hex":"#FFFFFF","note":"too cool and harsh"},{"name":"Bright Cool Fuchsia","hex":"#D6206E","note":"cool clash; clownish"},{"name":"Saturated Orange","hex":"#FF6A00","note":"overpowers; reads artificial"},{"name":"Royal Blue","hex":"#1F3A93","note":"dominates the wearer"},{"name":"Cool Charcoal","hex":"#2A2A2A","note":"drains the face; use cocoa or sepia"}],
    },
    rules: ["Aim for medium-light to medium-dark overall value; avoid value extremes.","Combine monochromatically or with neighboring hues at similar value; avoid hue-opposites and high contrast.","Replace black with cocoa, sepia, or dusty warm charcoal; replace white with eggshell or oat.","Choose brushed, matte, antiqued, or hammered metals; soft yellow gold, rose gold, antiqued silver, pewter all work.","Keep prints small, loose, organic (leaves, ovals, tiny florals); avoid stark geometric or high-contrast prints.","In makeup, stay in muted browns and taupes; no true black mascara or liner."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-soft-autumn","https://12blueprints.com/blogs/blog/the-best-skin-finish-on-autumn-colouring","https://12blueprints.com/soft-autumn-darkness-adjustments/","https://www.chrysaliscolour.com/more/learn-about-your-season/soft-autumn/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/soft-autumn-a-comprehensive-guide","https://gabriellearruda.com/soft-autumn-the-ultimate-guide/","https://elementalcolour.com.au/blog/soft-autumn","https://palettepath.com/color-season-guides/soft-autumn-color-palette-guide/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "true-autumn": {
    id: "true-autumn",
    name: "True Autumn",
    family: "autumn",
    aliases: ["warm-autumn","pure-autumn","original-autumn"],
    sisterSeasons: [],
    traits: {"undertone":"warm","depth":"medium-deep","chroma":"soft","contrast":"medium"},
    traitNotes: {"undertone":"fully warm, golden yellow undertone, no cool influence; primary aspect","depth":"centers around coffee-level darkness","chroma":"medium-low; appears richer than it is due to warmth","contrast":"visible value separation without true white or black"},
    skinTextureMetaphor: "velvet",
    descriptiveNotes: ["Heart of the Autumn family; opposite True Spring. Unity of palette is created by gold."],
    palette: {
      bestNeutrals: [{"name":"Latte","hex":"#EFE0C5"},{"name":"Colonial Beige","hex":"#D9C2A0"},{"name":"Camel","hex":"#C19A6B"},{"name":"Elephant Gray","hex":"#8E8475","note":"warm medium gray"},{"name":"Warm Olive-Khaki","hex":"#8B7B4F"},{"name":"Rich Chocolate Brown","hex":"#5C3A21"},{"name":"Dark Olive-Brown","hex":"#3E3624","note":"True Autumn \"black\""}],
      signatureColors: [{"name":"Pumpkin","hex":"#C2602B"},{"name":"Terracotta","hex":"#B3553B"},{"name":"Curry","hex":"#C9A035"},{"name":"Warm Mossy Olive","hex":"#7A7A2E"},{"name":"Spruce","hex":"#506B2F"},{"name":"Warm Teal","hex":"#0F8088"},{"name":"Russet","hex":"#9C3E1F"},{"name":"Cognac","hex":"#8B5A2B"}],
      accentColors: [{"name":"Warm Tomato Red","hex":"#C0462B"},{"name":"Deep Periwinkle","hex":"#5F6FA0","note":"warm-leaning"},{"name":"Aubergine-Plum","hex":"#6E3E5C"},{"name":"Warm Daffodil","hex":"#E0B028"},{"name":"Cactus","hex":"#A8B27A"}],
      useCarefully: [{"name":"True Black","hex":"#000000","note":"too cool; manageable only in piping or far from face"},{"name":"Pure White","hex":"#FFFFFF","note":"adds age, drains health"},{"name":"Pastel Pink","hex":"#F8C8DC","note":"looks borrowed"},{"name":"Ice Blue","hex":"#C9E5F2","note":"cement-skin effect"},{"name":"Cool Fuchsia","hex":"#E6347D","note":"too red and cool"},{"name":"True Spring Bright Lemon","hex":"#FFF24A","note":"too clear and bright; reads bland"}],
    },
    rules: ["Center every color choice on warmth; yellow or gold base in everything, no blue undertones.","Build value via dark browns and olives instead of black; use latte or cream instead of pure white.","Pair neutrals with rich accents at similar value (camel with mustard, chocolate with russet).","Wear gold, copper, bronze, brass; skip silver, platinum, white gold; pair with amber, citrine, tortoiseshell.","Use bronzer freely where the sun lights the face; choose russet or sandalwood lips.","Choose textured, matte, suede, tweed, or hammered surfaces; avoid high-shine, plastic, or icy finishes."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-true-autumn","https://12blueprints.com/blogs/blog/true-autumn-neutrals","https://12blueprints.com/blogs/blog/autumn-progressions-basics","https://12blueprints.com/please-no-colours-for-autumns/","https://www.chrysaliscolour.com/more/learn-about-your-season/true-autumn/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/true-autumn-a-comprehensive-guide","https://gabriellearruda.com/true-autumn-ultimate-guide/","https://palettepath.com/color-season/true-autumn/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "dark-autumn": {
    id: "dark-autumn",
    name: "Dark Autumn",
    family: "autumn",
    aliases: ["deep-autumn","dark-warm"],
    sisterSeasons: ["dark-winter"],
    traits: {"undertone":"neutral-warm","depth":"deep","chroma":"soft","contrast":"high"},
    traitNotes: {"undertone":"warm-neutral leaning warm; Autumn primary, Winter influence","depth":"no upper darkness limit per Scaman; deepest of the Autumns","chroma":"medium chroma; richer than other Autumns due to Winter influence; reads rich, not bright","contrast":"Winter's range; high feature contrast"},
    skinTextureMetaphor: "leather",
    descriptiveNotes: ["Adjectives: rich, spicy, fiery, strong, hot."],
    palette: {
      bestNeutrals: [{"name":"Candlelight White","hex":"#EFDDB8","note":"warm dark off-white"},{"name":"Papyrus","hex":"#C8B89A"},{"name":"Burnt Caramel","hex":"#A87742"},{"name":"Warm Slate","hex":"#6E6960"},{"name":"Bronzed Gray","hex":"#4A4640"},{"name":"Espresso","hex":"#2E1F14"},{"name":"Bronzed Black","hex":"#1F1A12","note":"Dark Autumn \"black\"; warm green-black"}],
      signatureColors: [{"name":"Cinnabar","hex":"#A6411E"},{"name":"Paprika","hex":"#C25826"},{"name":"Marigold","hex":"#D89B1F"},{"name":"Curry","hex":"#B8892C"},{"name":"Pine Green","hex":"#2E4A2A"},{"name":"Bronzed Teal","hex":"#1C5A5C"},{"name":"Cabernet","hex":"#6E1F22"},{"name":"Aubergine","hex":"#3F2540"}],
      accentColors: [{"name":"Brick","hex":"#B43A2A"},{"name":"Hyacinth","hex":"#42548C"},{"name":"Warm Plum","hex":"#6C3A66"},{"name":"Warm Berry","hex":"#9C4F58"},{"name":"Dark Mossy Olive","hex":"#5A5A24"}],
      useCarefully: [{"name":"Pure White","hex":"#FFFFFF","note":"adds age, subtracts health"},{"name":"Icy Pastel Pink","hex":"#F4C2C2","note":"drains face"},{"name":"Bright Spring/Bright Winter Fuchsia","hex":"#E0207A","note":"too cool and bright"},{"name":"Pure Cool Sapphire","hex":"#0F52BA","note":"makes skin look cement"},{"name":"Light Dusty Blue","hex":"#9CB7C9","note":"washes out depth"},{"name":"Cool Silver-Gray","hex":"#6B7280","note":"sterile against warm skin"}],
    },
    rules: ["Anchor outfits in deep warm neutrals (espresso, bronzed black, warm slate); blacks must read warm (green-black, not blue-black).","Build value contrast: pair light camel or papyrus with espresso or aubergine; outfits with too little contrast look dull.","Saturation can be turned up; pumpkin, rust, marigold, deep teal carry the face. Use one strong color with neutrals.","Replace pure white with candlelight white and cool black with espresso or bronzed black.","Wear gold, copper, bronze, pewter, antiqued or oxidized metals; warm-leaning silver works; pair with garnet, carnelian, jasper, amber, emerald.","Use stronger makeup with muscle: bronzed berry or rust lips, defined brows, smoked warm liner; skip skin-toned nude lips."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-dark-autumn","https://12blueprints.com/blogs/blog/autumn-progressions-basics","https://12blueprints.com/blogs/blog/the-best-skin-finish-on-autumn-colouring","https://12blueprints.com/blogs/blog/your-best-silver","https://www.chrysaliscolour.com/more/learn-about-your-season/dark-autumn/","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/dark-autumn-a-comprehensive-guide","https://gabriellearruda.com/dark-autumn-the-ultimate-guide/","https://palettepath.com/color-season/dark-autumn/"],
    confidenceNote: "traits/rules High, hex Medium",
    populated: true,
  },
  "true-winter": {
    id: "true-winter",
    name: "True Winter",
    family: "winter",
    aliases: ["cool-winter","pure-winter"],
    sisterSeasons: [],
    traits: {"undertone":"cool","depth":"deep","chroma":"bright","contrast":"high"},
    traitNotes: {"undertone":"pure, maximum cool; blue-based, no yellow","depth":"medium-dark overall","chroma":"high saturation, clear; secondary aspect","contrast":"full white-to-black value range; can wear pure black with pure white"},
    descriptiveNotes: ["- Pure Black in large blocks at the face (Scaman: True Winter black is not always flattering, especially for women)"],
    palette: {
      bestNeutrals: [{"name":"Pure White","hex":"#FFFFFF"},{"name":"Icy Gray","hex":"#DCE3E8"},{"name":"Light True Gray","hex":"#B7BEC4"},{"name":"Medium Charcoal Gray","hex":"#4F555C"},{"name":"Black","hex":"#000000"},{"name":"True Navy","hex":"#1B2440"},{"name":"Cool Taupe Gray","hex":"#6E6A6F"}],
      signatureColors: [{"name":"True Red","hex":"#C8102E"},{"name":"Fuchsia","hex":"#D4145A"},{"name":"Royal Purple","hex":"#5B2A86"},{"name":"Sapphire","hex":"#1F3A93"},{"name":"Bright Royal Blue","hex":"#1858B8"},{"name":"True Emerald","hex":"#007355"},{"name":"Icy Pink","hex":"#F2C9D7"},{"name":"Icy Violet","hex":"#C9BEE0"}],
      accentColors: [{"name":"Magenta","hex":"#C71585"},{"name":"Cobalt","hex":"#0046AD"},{"name":"Lemon Ice","hex":"#F4F1A0","note":"cool yellow"},{"name":"Splish Splash","hex":"#B8DDE6"},{"name":"Acai","hex":"#5C1A3C"}],
      useCarefully: [{"name":"Warm Yellow","hex":"#F5C84B","note":"pulls the face toward sallow; only cool lemon ice works"},{"name":"Coral","hex":"#FF7F50","note":"any warmth pulls wrong"},{"name":"Olive","hex":"#8B7B4F","note":"warm muted disharmony"},{"name":"Beige","hex":"#C19A6B","note":"pure warm neutrals fight cool undertone"},{"name":"Dusty Lavender","hex":"#B57EDC","note":"too soft for high-chroma palette"}],
    },
    rules: ["Wear pure white with pure black for the classic high-contrast True Winter signature.","Pair a dark neutral with one icy or bright accent rather than mixing many colors.","Choose silver and platinum metals; avoid yellow gold.","Keep colors crisp and saturated; never substitute soft, dusty, or earthy variants.","Pick shiny, smooth fabric finishes (satin, polished cotton); avoid bronzer and warm-toned makeup.","Use white or icy as the lift in any all-dark outfit; one bright accent is louder than many."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-true-winter","https://12blueprints.com/3-types-of-true-winter","https://12blueprints.com/blogs/blog/look-bright-winter-not-true-winter","https://12blueprints.com/blogs/blog/your-best-silver","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/true-winter-a-comprehensive-guide","https://elementalcolour.com.au/blog/true-winter","https://gabriellearruda.com/true-winter-seasonal-color-ultimate-guide-cool-winter/","https://palettepath.com/color-season/true-winter/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
  "bright-winter": {
    id: "bright-winter",
    name: "Bright Winter",
    family: "winter",
    aliases: ["clear-winter"],
    sisterSeasons: ["bright-spring"],
    traits: {"undertone":"neutral-cool","depth":"medium-deep","chroma":"bright","contrast":"high"},
    traitNotes: {"undertone":"Winter dominant with Spring infusion; just to the cool side of halfway","depth":"lightest of the three Winters; majority medium-value, leaning slightly dark","chroma":"highest chroma of any season; the most intense, vibrant palette of the twelve","contrast":"highest contrast season per Concept Wardrobe"},
    descriptiveNotes: ["- All-Black or All-White outfits (too cool on a Bright Winter; always lift with a bright accent)"],
    palette: {
      bestNeutrals: [{"name":"Pure White","hex":"#FFFFFF"},{"name":"Icy Pink","hex":"#F4D3DA"},{"name":"Light Cool Gray","hex":"#C4C9CD"},{"name":"Charcoal Gray","hex":"#3F4248"},{"name":"Bright Winter Black","hex":"#0A0A12","note":"very slight blue"},{"name":"Dark Sapphire Navy","hex":"#1A2E63"},{"name":"Champagne","hex":"#E8DEC4"}],
      signatureColors: [{"name":"Hot Pink","hex":"#E62888"},{"name":"Magenta","hex":"#C5197A"},{"name":"Clear True Red","hex":"#E62739"},{"name":"Cobalt","hex":"#2049B0"},{"name":"Electric Royal Blue","hex":"#1858E8"},{"name":"Emerald","hex":"#00A36C"},{"name":"Limelight","hex":"#C2D929"},{"name":"Blue Iris","hex":"#5B3FA0"}],
      accentColors: [{"name":"Bright Turquoise","hex":"#1AB6D8"},{"name":"Cool Lemon Yellow","hex":"#F1E94B"},{"name":"Icy Lavender","hex":"#D7C9EC"},{"name":"Bright Plum","hex":"#7B2A6C"},{"name":"Bright Cyan","hex":"#00B7D6"}],
      useCarefully: [{"name":"Dusty Soft Mauve","hex":"#B997A5","note":"drains brightness"},{"name":"Camel","hex":"#C19A6B","note":"Spring's warmth here is yellow, not orange or earth"},{"name":"Forest","hex":"#506B2F","note":"too autumnal"},{"name":"Light Summer Pastel","hex":"#B7A4D1","note":"without icy quality, reads grayish"},{"name":"Antiqued","hex":"#A88A4A","note":"light shiny gold can work; avoid heavy or burnished"}],
    },
    rules: ["Always include at least one fully bright accent in any outfit; black plus white alone reads flat.","Aim for hue contrast (hot pink with teal, cobalt with limelight) not just value contrast.","Keep no more than roughly half an outfit black (per Elemental Colour rule of thumb).","Pair shiny, saturated finishes; avoid antique, matte, or earthy textures.","Wear silver and platinum first; light shiny gold and white gold are permissible.","Choose patterns medium-to-large in scale so brights do not optically mix into mud."],
    sources: ["https://12blueprints.com/blogs/blog/bright-winter-makeup-faqs","https://12blueprints.com/best-makeup-colours-bright-winter/","https://12blueprints.com/myles-is-a-bright-winter/","https://12blueprints.com/blogs/blog/what-it-takes-to-look-normal-living-up-to-bright-winter","https://12blueprints.com/blogs/blog/look-bright-winter-not-true-winter","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/bright-winter-a-comprehensive-guide","https://elementalcolour.com.au/blog/bright-winter","https://gabriellearruda.com/bright-winter-complete-guide/","https://palettepath.com/color-season/bright-winter/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
  "dark-winter": {
    id: "dark-winter",
    name: "Dark Winter",
    family: "winter",
    aliases: ["deep-winter","dark-warm-influenced-winter"],
    sisterSeasons: ["dark-autumn"],
    traits: {"undertone":"neutral-cool","depth":"deep","chroma":"bright","contrast":"high"},
    traitNotes: {"undertone":"Winter dominant with Autumn infusion; cool with a few drops of darkest chocolate","depth":"deepest season overall; very dark, low-value palette","chroma":"Scaman: moderately bright but not maximum; Concept Wardrobe: somewhat bright","contrast":"full light-to-dark range; icy lights against very dark darks"},
    descriptiveNotes: ["- All-light or all-icy outfits (diminishes natural depth)"],
    palette: {
      bestNeutrals: [{"name":"Cool Off-White","hex":"#F4F2EE"},{"name":"Icy Light Gray","hex":"#C8CCD1"},{"name":"Cool Mid Gray","hex":"#6B6F75"},{"name":"Charcoal","hex":"#2F3137"},{"name":"Pure Black","hex":"#000000"},{"name":"Black-Brown","hex":"#2A1F1C"},{"name":"Dark Navy","hex":"#1A2540"}],
      signatureColors: [{"name":"Dark Burgundy","hex":"#5C0A24"},{"name":"Ruby","hex":"#9B1B30"},{"name":"Blue Depths","hex":"#173366"},{"name":"Dark Emerald","hex":"#0A4A3A"},{"name":"Forest Teal","hex":"#0E4D5E"},{"name":"Plum Caspia","hex":"#4B1F45"},{"name":"Damson Purple","hex":"#36214E"},{"name":"Cool Mahogany Brown","hex":"#4A2027"}],
      accentColors: [{"name":"Bright Cool Pink","hex":"#C72A5A"},{"name":"Russian Red","hex":"#B5263C","note":"cool-leaning"},{"name":"Marine Green","hex":"#007F8B"},{"name":"Icy Pink","hex":"#ECCFD6"},{"name":"Splish Splash","hex":"#C0DDE2"}],
      useCarefully: [{"name":"Pure-Bright Neon","hex":"#39FF14","note":"belongs to Bright Winter; reads cartoonish here"},{"name":"Warm Rust","hex":"#A87742","note":"Dark Autumn's, not Dark Winter's"},{"name":"Yellow of any temperature","hex":"#E0B028","note":"very limited; only icy or very cool versions"},{"name":"Peach Pastel","hex":"#F8C8A8","note":"only icy pastels work"},{"name":"Bright Yellow Gold","hex":"#FFD700","note":"if used, choose deep slightly muted gold"}],
    },
    rules: ["Anchor outfits in a deep neutral and add one icy light or bright accent for the lift.","Wear teal somewhere; it bridges the Autumn-element warmth with the cool Winter base.","Choose smoky and jewel finishes; matte and antiqued metals work better here than on other Winters.","Avoid all-light combinations; you can carry all-dark, but always add a light or bright pop.","Use cool reds, dark fuchsia, smoked berry on lips and cheeks; skip nude and beige.","Choose bold high-contrast patterns; avoid faded watercolor or warm earth florals."],
    sources: ["https://12blueprints.com/blogs/blog/best-makeup-colours-dark-winter","https://12blueprints.com/blogs/blog/hot-weather-colour-for-dark-winter","https://12blueprints.com/blogs/blog/the-best-skin-finish-on-winter-colouring","https://12blueprints.com/blogs/blog/how-winters-intensify-eye-colour","https://12blueprints.com/products/eyeshadow-palette-dark-winter","https://theconceptwardrobe.com/colour-analysis-comprehensive-guides/dark-winter-a-comprehensive-guide","https://elementalcolour.com.au/blog/dark-winter","https://gabriellearruda.com/deep-winter-seasonal-color-ultimate-guide/","https://palettepath.com/color-season-guides/deep-winter-color-palette-guide/"],
    confidenceNote: "traits/rules High, hex Medium-High",
    populated: true,
  },
};

export const SEASON_IDS = Object.keys(COLOR_SYSTEM) as Array<keyof typeof COLOR_SYSTEM>;

function normalizeKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const ALIAS_TO_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const season of Object.values(COLOR_SYSTEM)) {
    map[season.id] = season.id;
    map[normalizeKey(season.name)] = season.id;
    for (const alias of season.aliases) {
      map[normalizeKey(alias)] = season.id;
    }
  }
  return map;
})();

export function resolveSeasonId(input: string): string | undefined {
  return ALIAS_TO_ID[normalizeKey(input)];
}

export function getSeason(idOrAlias: string): ColorSeasonRule | undefined {
  const id = resolveSeasonId(idOrAlias);
  return id ? COLOR_SYSTEM[id] : undefined;
}

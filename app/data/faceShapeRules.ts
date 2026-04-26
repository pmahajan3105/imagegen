// Auto-generated from research/face-shape-principles.md by scripts/port-face-shape-principles.ts.
// Re-run that script to regenerate after the research file changes.

import type { FaceShapeRulesData } from "../lib/faceShapeTypes";

export const FACE_SHAPE_RULES: FaceShapeRulesData = {
  "oval": {
    id: "oval",
    name: "Oval",
    lengthToWidthRatio: "~1.3-1.6",
    definingCues: {
      forehead: "balanced, slightly wider than chin",
      cheekbones: "average to prominent, often the widest point",
      jawline: "soft, gently tapered",
      chin: "rounded",
    },
    goal: "Maintain natural balance without exaggerating length, width, or softness.",
    necklines: {
      best: ["V-neck","scoop","square","crew","boat","off-shoulder"],
      useCarefully: ["very high turtleneck","extreme plunge","very oversized shoulder-width necklines"],
    },
    earrings: {
      best: ["studs","hoops","drops","teardrops","geometric shapes","sculptural earrings"],
      useCarefully: ["very long shoulder-dusters","oversized bottom-heavy styles"],
    },
    frames: {
      best: ["rectangular","square","geometric","wayfarer","browline","cat-eye"],
      useCarefully: ["very narrow frames","very oversized frames","frames much wider than the cheekbones"],
    },
    haircut: {
      best: ["most styles work; keep volume proportional to the face","hair texture","and body scale"],
      useCarefully: ["extremely flat styles","extreme crown height","or heavy side width that disrupts balance"],
    },
    notes: ["Commonly over-assigned; many faces called Oval are closer to Oblong, Rectangle, or softly Square."],
  },
  "round": {
    id: "round",
    name: "Round",
    lengthToWidthRatio: "~0.95-1.1",
    definingCues: {
      forehead: "balanced to wide, with a curved hairline",
      cheekbones: "average to prominent, softened by full cheeks",
      jawline: "soft, without strong corners",
      chin: "rounded",
    },
    goal: "Add vertical length, create definition, and reduce visual width at the cheeks.",
    necklines: {
      best: ["V-neck","square","surplice/wrap","open collar","one-shoulder","deep scoop"],
      useCarefully: ["high crew","turtleneck","jewel neck","tight cowl","wide shallow scoop"],
    },
    earrings: {
      best: ["long drops","linear earrings","slim chandeliers","elongated teardrops","angular drops"],
      useCarefully: ["large round hoops","button studs","wide clusters","short circular drops"],
    },
    frames: {
      best: ["rectangular","square","geometric","cat-eye","browline","full-rim frames"],
      useCarefully: ["round frames","small oval frames","rimless frames","very low-contrast rounded frames"],
    },
    haircut: {
      best: ["height at the crown","asymmetry","side parts","short sides with top volume","layers below the chin"],
      useCarefully: ["chin-length rounded bobs","blunt straight bangs","heavy cheek-level width","flat top with full sides"],
    },
    notes: ["Full cheeks can make an Oval or Square read Round in photos; check whether the jaw has hidden angles."],
  },
  "square": {
    id: "square",
    name: "Square",
    lengthToWidthRatio: "~0.95-1.1",
    definingCues: {
      forehead: "wide or balanced, similar in width to jaw",
      cheekbones: "average, not dramatically wider than forehead or jaw",
      jawline: "angular and wide",
      chin: "square",
    },
    goal: "Soften the jawline and add a little vertical lift without making the face boxier.",
    necklines: {
      best: ["scoop","sweetheart","soft V-neck","cowl","off-shoulder","asymmetric necklines"],
      useCarefully: ["sharp square necklines","high crew","stiff collars","boxy boat necks"],
    },
    earrings: {
      best: ["medium hoops","oval drops","teardrops","curved chandeliers","rounded huggies"],
      useCarefully: ["square studs","boxy geometric drops","hard angular ear climbers","very wide jaw-level earrings"],
    },
    frames: {
      best: ["round","oval","aviator","wire","semi-rimless","soft cat-eye"],
      useCarefully: ["thick square frames","boxy rectangles","sharp geometric frames","heavy flat-top frames"],
    },
    haircut: {
      best: ["soft layers","side parts","rounded fringe","waves","length below the jaw","light crown lift"],
      useCarefully: ["blunt jaw-length cuts","severe center parts","squared bangs","slicked-back styles that expose all angles"],
    },
    notes: ["Square and Round can share equal length and width; the deciding cue is jaw angle, not cheek fullness."],
  },
  "rectangle": {
    id: "rectangle",
    name: "Rectangle",
    lengthToWidthRatio: "~1.5-1.9",
    definingCues: {
      forehead: "wide or balanced, often similar to jaw width",
      cheekbones: "average, with straighter side lines",
      jawline: "angular and wide",
      chin: "square",
    },
    goal: "Break up facial length while softening the strong jaw and broad forehead.",
    necklines: {
      best: ["scoop","boat","sweetheart","cowl","off-shoulder","soft square"],
      useCarefully: ["deep narrow V-neck","plunging necklines","narrow halter","tall stiff collars"],
    },
    earrings: {
      best: ["clusters","medium hoops","button studs","rounded drops","huggies","ear stacks"],
      useCarefully: ["very long linear drops","narrow threaders","shoulder-dusters","boxy jaw-level shapes"],
    },
    frames: {
      best: ["tall square","deep rectangular","round","oval","aviator","browline with width"],
      useCarefully: ["shallow rectangles","narrow frames","tiny rimless frames","frames that sit too low on the face"],
    },
    haircut: {
      best: ["side volume","fringe","soft waves","layered medium cuts","texture at cheek or jaw level"],
      useCarefully: ["high pompadours","tight sides with tall top","long flat center parts","severe slick-backs"],
    },
    notes: ["Rectangle is often mislabeled as Oblong; keep Rectangle when the jaw and forehead read angular or broad."],
  },
  "oblong": {
    id: "oblong",
    name: "Oblong",
    lengthToWidthRatio: "~1.5-2.0",
    definingCues: {
      forehead: "balanced to tall, with a softer outline",
      cheekbones: "average to narrow, not dramatically wider than jaw",
      jawline: "soft, long, or gently tapered",
      chin: "rounded",
    },
    goal: "Add width and softness while visually shortening the face.",
    necklines: {
      best: ["boat","crew","scoop","cowl","off-shoulder","soft square","mock neck"],
      useCarefully: ["deep V-neck","plunging necklines","narrow halter","long open collars"],
    },
    earrings: {
      best: ["studs","clusters","huggies","ear cuffs","medium hoops","short wide drops"],
      useCarefully: ["long linear drops","threaders","narrow teardrops","shoulder-dusters"],
    },
    frames: {
      best: ["tall rims","deep square","round","oval","wide rectangle","decorative temples"],
      useCarefully: ["shallow rectangles","tiny frames","very narrow frames","low-bridge styles that drag the face downward"],
    },
    haircut: {
      best: ["fringe","curtain bangs","cheekbone layers","side volume","waves or curls","lobs and shoulder cuts"],
      useCarefully: ["extra crown height","long straight unlayered hair","tight high ponytails","very short sides with tall top"],
    },
    notes: ["The difference from Rectangle is softness: Oblong has length without a strongly squared jaw."],
  },
  "heart": {
    id: "heart",
    name: "Heart",
    lengthToWidthRatio: "~1.2-1.6",
    definingCues: {
      forehead: "wide, often the broadest upper point",
      cheekbones: "prominent, high, or wide",
      jawline: "narrow, tapering toward the chin",
      chin: "pointed",
    },
    goal: "Reduce top-heaviness and add softness or width near the lower face.",
    necklines: {
      best: ["soft V-neck","scoop","sweetheart","wrap","cowl","open collar"],
      useCarefully: ["high crew","halter","heavily embellished shoulders","very wide boat necks"],
    },
    earrings: {
      best: ["teardrops","chandeliers with fuller bottoms","pear shapes","curved drops","medium hoops near the jaw"],
      useCarefully: ["inverted-triangle earrings","top-heavy studs","very tiny studs","wide earrings at temple height"],
    },
    frames: {
      best: ["round","oval","aviator","semi-rimless","light-rim","curved-bottom frames"],
      useCarefully: ["heavy browline","oversized square","strong cat-eye","frames narrower than the forehead"],
    },
    haircut: {
      best: ["side-swept fringe","curtain bangs","chin-to-shoulder layers","lower curls or waves","bobs ending below the chin"],
      useCarefully: ["crown height","heavy temple volume","micro bangs","top-heavy pixies","slicked-back volume"],
    },
    notes: ["A widow's peak can suggest Heart, but width distribution matters more than the hairline alone."],
  },
  "diamond": {
    id: "diamond",
    name: "Diamond",
    lengthToWidthRatio: "~1.3-1.7",
    definingCues: {
      forehead: "narrow, often with a narrower hairline",
      cheekbones: "prominent and clearly the widest point",
      jawline: "narrow or softly angular",
      chin: "pointed",
    },
    goal: "Balance prominent cheekbones by adding softness near the forehead and jaw.",
    necklines: {
      best: ["V-neck","scoop","cowl","sweetheart","off-shoulder","soft boat"],
      useCarefully: ["very narrow halter","tight high crew","tiny jewel neck","severe plunges with no softness"],
    },
    earrings: {
      best: ["studs","small to medium hoops","soft drops","rounded huggies","curved climbers"],
      useCarefully: ["very wide cheek-level earrings","sharp geometric drops","oversized chandeliers","diamond-shaped earrings"],
    },
    frames: {
      best: ["browline","cat-eye","oval","round","semi-rimless","horn-rim with balanced width"],
      useCarefully: ["narrow frames","very wide cheek-emphasizing frames","low-slung frames","harsh angular rims"],
    },
    haircut: {
      best: ["side-swept fringe","textured layers","chin-level softness","lobs","tucked styles","gentle volume at top or jaw"],
      useCarefully: ["cheekbone-width blunt volume","ultra-short sides","flat center parts","severe slick-backs"],
    },
    notes: ["Often confused with Heart; Diamond has cheekbones wider than both forehead and jaw, not just a narrow chin."],
  },
  "triangle": {
    id: "triangle",
    name: "Triangle",
    lengthToWidthRatio: "~1.1-1.5",
    definingCues: {
      forehead: "narrow",
      cheekbones: "average to narrow compared with jaw",
      jawline: "wide and visually dominant",
      chin: "square to rounded",
    },
    goal: "Add presence near the forehead and temples while minimizing extra width at the jaw.",
    necklines: {
      best: ["boat","off-shoulder","wide scoop","square","sweetheart","one-shoulder","embellished collar"],
      useCarefully: ["deep narrow V-neck","narrow halter","tight high crew","necklines that visually point to the jaw"],
    },
    earrings: {
      best: ["studs","huggies","ear cuffs","climbers","short angular drops","top-detail jackets"],
      useCarefully: ["bottom-heavy teardrops","large hoops ending at the jaw","wide jaw-level drops","long chandeliers"],
    },
    frames: {
      best: ["browline","cat-eye","rectangle","top-heavy frames","decorative temples","aviator with strong brow"],
      useCarefully: ["bottom-heavy frames","tiny rimless frames","small round frames","frames with heavy lower rims"],
    },
    haircut: {
      best: ["temple width","textured fringe","layered top","side-swept volume","fuller crown","length that clears the jaw"],
      useCarefully: ["blunt chin-length cuts","heavy jaw-level curls","flat top with full lower sides","tight top with jaw emphasis"],
    },
    notes: ["Also called pear in some style systems; facial hair or a strong masseter area can make other shapes read Triangle."],
  },
};

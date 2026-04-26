export type FaceShapeId =
  | "oval"
  | "round"
  | "square"
  | "rectangle"
  | "oblong"
  | "heart"
  | "diamond"
  | "triangle";

export type FaceShapeAdvice = {
  best: string[];
  useCarefully: string[];
};

export type FaceShapePrinciples = {
  id: FaceShapeId;
  name: string;
  lengthToWidthRatio: string;
  definingCues: {
    forehead: string;
    cheekbones: string;
    jawline: string;
    chin: string;
  };
  goal: string;
  necklines: FaceShapeAdvice;
  earrings: FaceShapeAdvice;
  frames: FaceShapeAdvice;
  haircut: FaceShapeAdvice;
  notes: string[];
};

export type FaceShapeRulesData = Record<FaceShapeId, FaceShapePrinciples>;

export type StorefrontFinish = {
  code: string;
  label: string;
  description: string;
  swatchHex: string;
  imagePublicId?: string;
};

export const finishes: StorefrontFinish[] = [
  {
    code: "WHITE_OAK",
    label: "White Oak",
    description: "Warm grain and a calm natural character for architectural interiors.",
    swatchHex: "#c5aa82"
  },
  {
    code: "WALNUT",
    label: "Walnut",
    description: "Rich depth and darker contrast for a more tailored, furniture-grade look.",
    swatchHex: "#6b4a38"
  },
  {
    code: "NATURAL_MAPLE",
    label: "Natural Maple",
    description: "Light, clean, and restrained with a subtle contemporary feel.",
    swatchHex: "#dcc9a0"
  },
  {
    code: "PAINTED_MAPLE",
    label: "Painted Maple",
    description: "A paint-ready hardwood option for crisp custom color matching.",
    swatchHex: "#d9d3c9"
  }
];

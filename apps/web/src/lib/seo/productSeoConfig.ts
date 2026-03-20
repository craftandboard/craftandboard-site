import {
  getApprovedExpansionCombosForFamily,
  getApprovedExpansionVariantsForFamily
} from "./seoExpansionRules";

export type ProductSeoVariantKind = "dimension" | "material" | "use-case";

export const SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED = "2026-03-14";

export type ProductSeoVariantConfig = {
  slug: string;
  kind: ProductSeoVariantKind;
  label: string;
  title: string;
  description: string;
  intro: string;
  guidanceTitle: string;
  guidanceBody: string;
  ctaLabel: string;
};

export type ProductSeoVariantComboKind =
  | "dimension-material"
  | "material-use-case"
  | "dimension-use-case";

export type ProductSeoVariantComboConfig = {
  slug: string;
  kind: ProductSeoVariantComboKind;
  label: string;
  title: string;
  description: string;
  intro: string;
  guidanceTitle: string;
  guidanceBody: string;
  ctaLabel: string;
  componentSlugs: {
    dimension?: string;
    material?: string;
    useCase?: string;
  };
};

const baseProductSeoConfig = {
  "cabinet-shelves": {
    dimensions: [],
    materials: [],
    "use-cases": []
  },
  "floating-shelves": {
    dimensions: [
      {
        slug: "48-inch",
        kind: "dimension",
        label: "48 Inch Floating Shelf",
        title: "48 Inch Floating Shelf | Custom Solid Wood Shelves | Craft & Board",
        description: "Custom 48 inch floating shelves made from solid hardwood. Configure wood species, thickness, and concealed mounting to match your space.",
        intro: "A 48 inch floating shelf works well where the wall needs a custom built-in look without pushing too far past adjacent cabinets, millwork, or furniture.",
        guidanceTitle: "Where a 48 inch shelf works best",
        guidanceBody: "Use this size for kitchens, bar nooks, compact living-room walls, and smaller fireplace compositions where proportion matters more than maximum span.",
        ctaLabel: "Configure a 48 Inch Shelf"
      },
      {
        slug: "60-inch",
        kind: "dimension",
        label: "60 Inch Floating Shelf",
        title: "60 Inch Floating Shelf | Custom Solid Wood Shelves | Craft & Board",
        description: "Custom 60 inch floating shelves built to order in hardwood. Configure size, species, and concealed mounting for a clean architectural fit.",
        intro: "A 60 inch floating shelf bridges the gap between stock shelving and a more architectural custom install, especially over casework or furniture runs.",
        guidanceTitle: "Balanced span for everyday rooms",
        guidanceBody: "This size often fits dining-room walls, longer kitchen splash zones, and built-in compositions that need more presence than a short accent shelf.",
        ctaLabel: "Configure a 60 Inch Shelf"
      },
      {
        slug: "72-inch",
        kind: "dimension",
        label: "72 Inch Floating Shelf",
        title: "72 Inch Floating Shelf | Custom Solid Wood Shelves | Craft & Board",
        description: "Custom 72 inch floating shelves made from solid hardwood. Configure wood species, thickness, and mounting hardware to match your space.",
        intro: "A 72 inch floating shelf is one of the most versatile long-span options for living rooms, dining rooms, and architectural feature walls.",
        guidanceTitle: "A strong architectural long-shelf size",
        guidanceBody: "This span creates a cleaner horizontal line over furniture, built-ins, and fireplace walls while still fitting comfortably inside many standard rooms.",
        ctaLabel: "Configure a 72 Inch Shelf"
      },
      {
        slug: "84-inch",
        kind: "dimension",
        label: "84 Inch Floating Shelf",
        title: "84 Inch Floating Shelf | Custom Solid Wood Shelves | Craft & Board",
        description: "Custom 84 inch floating shelves made to order in hardwood for larger walls and long-span shelving layouts.",
        intro: "An 84 inch floating shelf is designed for longer walls and more intentional architectural compositions where stock shelf lengths feel undersized.",
        guidanceTitle: "For larger feature walls and wide compositions",
        guidanceBody: "Use this size when the shelf needs to read as a major design line across a room rather than a smaller decorative accent.",
        ctaLabel: "Configure an 84 Inch Shelf"
      }
    ],
    materials: [
      {
        slug: "white-oak",
        kind: "material",
        label: "White Oak Floating Shelves",
        title: "White Oak Floating Shelves | Custom Solid Wood Shelving | Craft & Board",
        description: "White oak floating shelves built to order with custom sizing, concealed mounting, and premium finish direction for warm architectural interiors.",
        intro: "White oak floating shelves bring a warm, modern hardwood character that works across contemporary, transitional, and natural-material spaces.",
        guidanceTitle: "Why white oak is a common shelf choice",
        guidanceBody: "White oak balances warmth, visible grain, and design flexibility, making it a strong fit for kitchens, living rooms, and fireplace walls.",
        ctaLabel: "Configure White Oak Shelves"
      },
      {
        slug: "walnut",
        kind: "material",
        label: "Walnut Floating Shelves",
        title: "Walnut Floating Shelves | Custom Solid Wood Shelving | Craft & Board",
        description: "Custom walnut floating shelves with tailored sizing and concealed support for darker, richer hardwood shelving installations.",
        intro: "Walnut floating shelves offer deeper tone, richer visual weight, and a more pronounced hardwood statement in custom shelving layouts.",
        guidanceTitle: "Best uses for walnut shelving",
        guidanceBody: "Walnut works especially well where the shelving needs to feel elevated against stone, plaster, painted millwork, or lighter wall finishes.",
        ctaLabel: "Configure Walnut Shelves"
      },
      {
        slug: "maple",
        kind: "material",
        label: "Maple Floating Shelves",
        title: "Maple Floating Shelves | Custom Hardwood Shelves | Craft & Board",
        description: "Custom maple floating shelves with made-to-order sizing, concealed mounting, and a lighter hardwood look for clean interiors.",
        intro: "Maple floating shelves are a strong option when the goal is a lighter wood direction with a clean profile and custom-built sizing.",
        guidanceTitle: "A lighter hardwood look",
        guidanceBody: "Maple is useful for rooms that need warmth without the darker contrast of walnut, especially in kitchens, breakfast spaces, and calm living rooms.",
        ctaLabel: "Configure Maple Shelves"
      }
    ],
    "use-cases": [
      {
        slug: "fireplace",
        kind: "use-case",
        label: "Floating Shelves for Fireplaces",
        title: "Floating Shelves for Fireplaces | Custom Mantel Shelving | Craft & Board",
        description: "Custom floating shelves for fireplace walls with made-to-order sizing, hardwood materials, and concealed mounting guidance.",
        intro: "Floating shelves around a fireplace need the right width, depth, and visual weight to feel integrated with the wall rather than added as an afterthought.",
        guidanceTitle: "Planning shelves near a fireplace",
        guidanceBody: "Use custom sizing to align with the surround, maintain the right visual spacing, and choose a hardwood finish that complements stone, plaster, or millwork.",
        ctaLabel: "Configure Fireplace Shelves"
      },
      {
        slug: "living-room",
        kind: "use-case",
        label: "Floating Shelves for Living Rooms",
        title: "Floating Shelves for Living Rooms | Custom Wood Shelves | Craft & Board",
        description: "Custom floating shelves for living rooms with tailored lengths, hardwood material options, and concealed support.",
        intro: "Living-room floating shelves often need to work across seating layouts, media walls, and artwork zones where off-the-shelf lengths rarely feel quite right.",
        guidanceTitle: "Living-room shelf layout ideas",
        guidanceBody: "Consider how the shelf relates to furniture width, art placement, and styling depth so the finished install feels intentional from across the room.",
        ctaLabel: "Configure Living-Room Shelves"
      },
      {
        slug: "kitchen",
        kind: "use-case",
        label: "Floating Shelves for Kitchens",
        title: "Floating Shelves for Kitchens | Custom Open Shelving | Craft & Board",
        description: "Custom floating kitchen shelves with hardwood material options, tailored spans, and concealed mounting for open shelving layouts.",
        intro: "Kitchen floating shelves need to balance display, utility, and clean architectural lines, which makes custom sizing especially valuable.",
        guidanceTitle: "Open shelving for kitchens",
        guidanceBody: "Use the exact shelf width and depth to fit tile runs, cabinet spacing, and daily-use styling so the open shelving feels integrated with the kitchen design.",
        ctaLabel: "Configure Kitchen Shelves"
      }
    ]
  },
  "floating-mantels": {
    dimensions: [
      {
        slug: "48-inch",
        kind: "dimension",
        label: "48 Inch Floating Mantel",
        title: "48 Inch Floating Mantel | Custom Wood Mantels | Craft & Board",
        description: "Custom 48 inch floating mantels built to order with configurable section depth and concealed support.",
        intro: "A 48 inch floating mantel is useful for smaller fireplace surrounds and compact rooms where a shorter custom span still needs architectural presence.",
        guidanceTitle: "A scaled mantel for smaller surrounds",
        guidanceBody: "This size works well where the fireplace wall is narrower and the mantel should feel intentional without extending too far beyond the surround.",
        ctaLabel: "Configure a 48 Inch Mantel"
      },
      {
        slug: "60-inch",
        kind: "dimension",
        label: "60 Inch Floating Mantel",
        title: "60 Inch Floating Mantel | Custom Wood Mantels | Craft & Board",
        description: "Custom 60 inch floating mantels made to order with hardwood options and concealed support guidance.",
        intro: "A 60 inch floating mantel is a common middle-ground span for fireplace walls that need a more tailored fit than stock mantel sizes provide.",
        guidanceTitle: "A versatile mantel span",
        guidanceBody: "This size suits many fireplace walls that need balanced projection, custom material direction, and a clean concealed-support look.",
        ctaLabel: "Configure a 60 Inch Mantel"
      },
      {
        slug: "72-inch",
        kind: "dimension",
        label: "72 Inch Floating Mantel",
        title: "72 Inch Floating Mantel | Custom Wood Mantels | Craft & Board",
        description: "Custom 72 inch floating mantels made to order with configurable span, profile depth, and concealed support.",
        intro: "A 72 inch floating mantel is one of the strongest standard custom spans for creating a clean architectural line across the fireplace wall.",
        guidanceTitle: "A strong focal-point mantel size",
        guidanceBody: "Use this span when the mantel should visually anchor the fireplace wall and hold its own against stone, plaster, or built-in surroundings.",
        ctaLabel: "Configure a 72 Inch Mantel"
      },
      {
        slug: "84-inch",
        kind: "dimension",
        label: "84 Inch Floating Mantel",
        title: "84 Inch Floating Mantel | Custom Long-Span Mantels | Craft & Board",
        description: "Custom 84 inch floating mantels for larger fireplace walls, built to order with hardwood materials and concealed support options.",
        intro: "An 84 inch floating mantel is meant for larger fireplace walls where a longer span helps the composition feel proportionate and substantial.",
        guidanceTitle: "Longer mantel spans for bigger rooms",
        guidanceBody: "Choose this size for larger fireplace walls and wider room compositions where a shorter mantel would feel visually compressed.",
        ctaLabel: "Configure an 84 Inch Mantel"
      }
    ],
    materials: [
      {
        slug: "white-oak",
        kind: "material",
        label: "White Oak Floating Mantels",
        title: "White Oak Floating Mantels | Custom Wood Mantels | Craft & Board",
        description: "White oak floating mantels made to order with custom sizing, concealed support, and a warm hardwood finish.",
        intro: "White oak floating mantels are a strong fit for fireplace walls that need warmth, visible grain, and a clean architectural profile.",
        guidanceTitle: "Why white oak works for mantels",
        guidanceBody: "White oak pairs well with stone, plaster, and neutral wall finishes, giving the fireplace wall a grounded but refined material presence.",
        ctaLabel: "Configure a White Oak Mantel"
      },
      {
        slug: "walnut",
        kind: "material",
        label: "Walnut Floating Mantels",
        title: "Walnut Floating Mantels | Custom Wood Mantels | Craft & Board",
        description: "Walnut floating mantels with custom span, profile depth, and concealed support for richer hardwood fireplace designs.",
        intro: "Walnut floating mantels create a darker, more dramatic hardwood statement for fireplace walls that need added visual weight.",
        guidanceTitle: "Where walnut mantels stand out",
        guidanceBody: "Walnut is especially effective when the mantel should contrast against lighter stone, plaster, tile, or painted built-ins.",
        ctaLabel: "Configure a Walnut Mantel"
      },
      {
        slug: "maple",
        kind: "material",
        label: "Maple Floating Mantels",
        title: "Maple Floating Mantels | Custom Wood Mantels | Craft & Board",
        description: "Maple floating mantels built to order with custom sizing and a lighter hardwood finish direction.",
        intro: "Maple floating mantels are useful when the fireplace wall needs a lighter hardwood look with a cleaner, quieter material presence.",
        guidanceTitle: "A lighter hardwood mantel direction",
        guidanceBody: "Maple works well in bright interiors and fireplace rooms that need a softer wood tone without losing the benefits of a custom mantel profile.",
        ctaLabel: "Configure a Maple Mantel"
      }
    ],
    "use-cases": [
      {
        slug: "fireplace",
        kind: "use-case",
        label: "Floating Mantels for Fireplaces",
        title: "Floating Mantels for Fireplaces | Custom Wood Mantels | Craft & Board",
        description: "Custom floating mantels for fireplaces with made-to-order span, depth, and concealed support paths.",
        intro: "A floating mantel for a fireplace needs the right span and section profile to belong to the full wall composition, not just the firebox opening.",
        guidanceTitle: "Planning a custom fireplace mantel",
        guidanceBody: "Consider surround width, material contrast, and overall room scale so the mantel feels integrated with the fireplace architecture.",
        ctaLabel: "Configure a Fireplace Mantel"
      },
      {
        slug: "living-room",
        kind: "use-case",
        label: "Floating Mantels for Living Rooms",
        title: "Floating Mantels for Living Rooms | Custom Fireplace Mantels | Craft & Board",
        description: "Custom floating mantels for living rooms with tailored spans, hardwood materials, and concealed support guidance.",
        intro: "Living-room mantels often serve as the main visual anchor of the room, which makes custom span, depth, and material choice especially important.",
        guidanceTitle: "Mantels as a living-room focal point",
        guidanceBody: "Use a made-to-order mantel when the fireplace wall needs a stronger focal element that ties the seating area and finish palette together.",
        ctaLabel: "Configure a Living-Room Mantel"
      },
      {
        slug: "kitchen",
        kind: "use-case",
        label: "Floating Mantels Near Kitchen and Dining Spaces",
        title: "Floating Mantels for Kitchen and Dining Spaces | Craft & Board",
        description: "Custom floating mantels for open kitchen and dining areas with made-to-order sizing and hardwood material options.",
        intro: "In open-plan homes, a fireplace mantel often needs to relate visually to nearby kitchen shelving, cabinetry, and dining millwork.",
        guidanceTitle: "Mantel design in open-plan spaces",
        guidanceBody: "Choose a mantel span and wood tone that feels consistent with adjacent cabinetry or shelving so the fireplace wall supports the larger room composition.",
        ctaLabel: "Configure an Open-Plan Mantel"
      }
    ]
  }
} as const satisfies Record<
  string,
  {
    dimensions: ProductSeoVariantConfig[];
    materials: ProductSeoVariantConfig[];
    "use-cases": ProductSeoVariantConfig[];
  }
>;

export type SeoProductFamily = keyof typeof baseProductSeoConfig;

function singularProductName(family: SeoProductFamily) {
  if (family === "floating-shelves") {
    return "Floating Shelf";
  }
  if (family === "floating-mantels") {
    return "Floating Mantel";
  }
  return "Cabinet Shelf";
}

function pluralProductName(family: SeoProductFamily) {
  if (family === "floating-shelves") {
    return "Floating Shelves";
  }
  if (family === "floating-mantels") {
    return "Floating Mantels";
  }
  return "Cabinet Shelves";
}

function materialName(variant: ProductSeoVariantConfig) {
  return variant.label
    .replace(" Floating Shelves", "")
    .replace(" Floating Mantels", "");
}

function useCaseDescriptor(variant: ProductSeoVariantConfig) {
  return variant.label
    .replace("Floating Shelves for ", "")
    .replace("Floating Mantels for ", "");
}

function combineSlug(parts: string[]) {
  return parts.join("-");
}

function createDimensionMaterialCombos(
  family: SeoProductFamily,
  dimensions: readonly ProductSeoVariantConfig[],
  materials: readonly ProductSeoVariantConfig[]
): ProductSeoVariantComboConfig[] {
  return dimensions.flatMap((dimension) =>
    materials.map((material) => {
      const materialText = materialName(material);
      const productName = singularProductName(family);
      const pluralName = pluralProductName(family);

      return {
        slug: combineSlug([dimension.slug, material.slug]),
        kind: "dimension-material",
        label: `${dimension.label.replace(productName, "").trim()} ${materialText} ${productName}`.trim(),
        title: `${dimension.label.replace(productName, "").trim()} ${materialText} ${productName} | Craft & Board`,
        description:
          family === "floating-shelves"
            ? `Custom ${dimension.slug.replace("-", " ")} ${pluralName.toLowerCase()} crafted from solid ${materialText.toLowerCase()}. Configure size, thickness, and concealed mounting for a premium shelf built to last.`
            : `Custom ${dimension.slug.replace("-", " ")} ${pluralName.toLowerCase()} crafted from solid ${materialText.toLowerCase()}. Configure span, section profile, and concealed support for a fireplace-ready mantel.`,
        intro:
          family === "floating-shelves"
            ? `A ${dimension.slug.replace("-", " ")} ${materialText.toLowerCase()} floating shelf combines one of the most common architectural shelf spans with a wood direction that can carry the room without feeling generic.`
            : `A ${dimension.slug.replace("-", " ")} ${materialText.toLowerCase()} floating mantel combines a proven mantel span with a wood tone that helps the fireplace wall feel warmer and more resolved.`,
        guidanceTitle:
          family === "floating-shelves"
            ? `Why ${dimension.slug.replace("-", " ")} and ${materialText.toLowerCase()} work together`
            : `Why ${dimension.slug.replace("-", " ")} and ${materialText.toLowerCase()} work for mantels`,
        guidanceBody:
          family === "floating-shelves"
            ? `${dimension.guidanceBody} ${material.guidanceBody}`
            : `${dimension.guidanceBody} ${material.guidanceBody}`,
        ctaLabel:
          family === "floating-shelves"
            ? `Configure a ${dimension.slug.replace("-", " ")} ${materialText} Shelf`
            : `Configure a ${dimension.slug.replace("-", " ")} ${materialText} Mantel`,
        componentSlugs: {
          dimension: dimension.slug,
          material: material.slug
        }
      };
    })
  );
}

function createMaterialUseCaseCombos(
  family: SeoProductFamily,
  materials: readonly ProductSeoVariantConfig[],
  useCases: readonly ProductSeoVariantConfig[]
): ProductSeoVariantComboConfig[] {
  return materials.flatMap((material) =>
    useCases.map((useCase) => {
      const materialText = materialName(material);
      const useCaseText = useCaseDescriptor(useCase);
      const pluralName = pluralProductName(family);

      return {
        slug: combineSlug([useCase.slug, material.slug]),
        kind: "material-use-case",
        label: `${materialText} ${pluralName} for ${useCaseText}`,
        title: `${materialText} ${pluralName} for ${useCaseText} | Craft & Board`,
        description:
          family === "floating-shelves"
            ? `Custom ${materialText.toLowerCase()} floating shelves for ${useCaseText.toLowerCase()} layouts. Configure shelf sizing, thickness, and concealed mounting for a more architectural result.`
            : `Custom ${materialText.toLowerCase()} floating mantels for ${useCaseText.toLowerCase()} fireplace walls. Configure span, profile, and support direction for a cleaner finished composition.`,
        intro:
          family === "floating-shelves"
            ? `${materialText} floating shelves for ${useCaseText.toLowerCase()} spaces help tie material warmth to a more specific room use case, which is why this combination tends to convert better than a broad product search.`
            : `${materialText} floating mantels for ${useCaseText.toLowerCase()} spaces combine a clear material direction with a room-specific fireplace context, making it easier to move from inspiration into a real mantel decision.`,
        guidanceTitle:
          family === "floating-shelves"
            ? `Using ${materialText.toLowerCase()} shelves in ${useCaseText.toLowerCase()} spaces`
            : `Using ${materialText.toLowerCase()} mantels in ${useCaseText.toLowerCase()} spaces`,
        guidanceBody: `${material.guidanceBody} ${useCase.guidanceBody}`,
        ctaLabel:
          family === "floating-shelves"
            ? `Configure ${materialText} Shelves`
            : `Configure a ${materialText} Mantel`,
        componentSlugs: {
          material: material.slug,
          useCase: useCase.slug
        }
      };
    })
  );
}

function createDimensionUseCaseCombos(
  family: SeoProductFamily,
  dimensions: readonly ProductSeoVariantConfig[],
  useCases: readonly ProductSeoVariantConfig[]
): ProductSeoVariantComboConfig[] {
  return dimensions.flatMap((dimension) =>
    useCases.map((useCase) => {
      const useCaseText = useCaseDescriptor(useCase);
      const productName = singularProductName(family);
      const pluralName = pluralProductName(family);

      return {
        slug: combineSlug([dimension.slug, useCase.slug]),
        kind: "dimension-use-case",
        label: `${dimension.label.replace(productName, "").trim()} ${pluralName} for ${useCaseText}`,
        title: `${dimension.label.replace(productName, "").trim()} ${pluralName} for ${useCaseText} | Craft & Board`,
        description:
          family === "floating-shelves"
            ? `Custom ${dimension.slug.replace("-", " ")} floating shelves for ${useCaseText.toLowerCase()} projects. Configure exact span, hardwood direction, and concealed mounting for a cleaner built-in look.`
            : `Custom ${dimension.slug.replace("-", " ")} floating mantels for ${useCaseText.toLowerCase()} fireplace walls. Configure mantel profile, hardwood direction, and concealed support for a tailored result.`,
        intro:
          family === "floating-shelves"
            ? `A ${dimension.slug.replace("-", " ")} floating shelf for ${useCaseText.toLowerCase()} spaces pairs a common high-intent shelf size with a room-specific design problem, which makes the page more useful than a generic width-only search.`
            : `A ${dimension.slug.replace("-", " ")} floating mantel for ${useCaseText.toLowerCase()} spaces connects one of the most useful mantel spans to the exact room context where proportion and fireplace composition matter most.`,
        guidanceTitle:
          family === "floating-shelves"
            ? `Why ${dimension.slug.replace("-", " ")} shelves work in ${useCaseText.toLowerCase()} spaces`
            : `Why ${dimension.slug.replace("-", " ")} mantels work in ${useCaseText.toLowerCase()} spaces`,
        guidanceBody: `${dimension.guidanceBody} ${useCase.guidanceBody}`,
        ctaLabel:
          family === "floating-shelves"
            ? `Configure a ${dimension.slug.replace("-", " ")} Shelf`
            : `Configure a ${dimension.slug.replace("-", " ")} Mantel`,
        componentSlugs: {
          dimension: dimension.slug,
          useCase: useCase.slug
        }
      };
    })
  );
}

function buildFamilyConfig(family: SeoProductFamily) {
  const config = baseProductSeoConfig[family];

  return {
    ...config,
    dimensionMaterialCombos: createDimensionMaterialCombos(
      family,
      config.dimensions,
      config.materials
    ),
    materialUseCaseCombos: createMaterialUseCaseCombos(
      family,
      config.materials,
      config["use-cases"]
    ),
    dimensionUseCaseCombos: createDimensionUseCaseCombos(
      family,
      config.dimensions,
      config["use-cases"]
    )
  };
}

export const productSeoConfig = {
  "cabinet-shelves": buildFamilyConfig("cabinet-shelves"),
  "floating-shelves": buildFamilyConfig("floating-shelves"),
  "floating-mantels": buildFamilyConfig("floating-mantels")
} as const;

export type SeoVariantEntry =
  | ProductSeoVariantConfig
  | ProductSeoVariantComboConfig;

export function getSeoVariantsForFamily(family: SeoProductFamily) {
  const config = productSeoConfig[family];
  return [
    ...config.dimensions,
    ...config.materials,
    ...config["use-cases"],
    ...getApprovedExpansionVariantsForFamily(family)
  ];
}

export function getSeoVariantCombosForFamily(family: SeoProductFamily) {
  const config = productSeoConfig[family];

  return [
    ...config.dimensionMaterialCombos,
    ...config.materialUseCaseCombos,
    ...config.dimensionUseCaseCombos,
    ...getApprovedExpansionCombosForFamily(family)
  ];
}

export function getAllSeoEntriesForFamily(family: SeoProductFamily) {
  return [...getSeoVariantsForFamily(family), ...getSeoVariantCombosForFamily(family)];
}

export function getSeoVariantBySlug(
  family: SeoProductFamily,
  slug: string
) {
  return getSeoVariantsForFamily(family).find((variant) => variant.slug === slug);
}

export function getSeoVariantComboBySlug(
  family: SeoProductFamily,
  slug: string
) {
  return getSeoVariantCombosForFamily(family).find((combo) => combo.slug === slug);
}

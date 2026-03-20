export const floatingShelfMaterialOptions = [
  { code: "WHITE_OAK", label: "White Oak", ratePerInchCents: 340, multiplier: 1.08 },
  { code: "WALNUT", label: "Walnut", ratePerInchCents: 385, multiplier: 1.16 },
  { code: "NATURAL_MAPLE", label: "Natural Maple", ratePerInchCents: 315, multiplier: 1 },
  { code: "PAINTED_MAPLE", label: "Painted Maple", ratePerInchCents: 290, multiplier: 0.96 }
] as const;

export const floatingShelfMountingOptions = [
  { code: "STANDARD_CONCEALED", label: "Standard concealed bracket", hardwareCents: 8500, multiplier: 1 },
  { code: "HEAVY_DUTY_CONCEALED", label: "Heavy-duty concealed bracket", hardwareCents: 14000, multiplier: 1.08 },
  { code: "CONSULT_REQUIRED", label: "Consult-needed mounting review", hardwareCents: 17500, multiplier: 1.12 }
] as const;

export const floatingShelfDepthOptions = [8, 10, 12] as const;
export const floatingShelfThicknessOptions = [1.5, 2, 2.5] as const;

export type FloatingShelfMaterialCode = (typeof floatingShelfMaterialOptions)[number]["code"];
export type FloatingShelfMountingCode = (typeof floatingShelfMountingOptions)[number]["code"];

export type FloatingShelfConfiguration = {
  productFamily: "floating-shelves";
  productSlug: "classic-floating-shelf";
  width: number;
  widthUnit: "IN";
  depth: (typeof floatingShelfDepthOptions)[number];
  depthUnit: "IN";
  thickness: (typeof floatingShelfThicknessOptions)[number];
  thicknessUnit: "IN";
  quantity: number;
  materialCode: FloatingShelfMaterialCode;
  materialLabel: string;
  mountingCode: FloatingShelfMountingCode;
  mountingLabel: string;
  finishCode?: string | null;
  finishLabel?: string | null;
  edgeProfileCode?: string | null;
  edgeProfileLabel?: string | null;
  colorCode?: string | null;
  customNotes?: string | null;
};

export type FloatingShelfPriceComponent = {
  code: "material" | "fabrication" | "mounting" | "packaging" | "margin";
  label: string;
  amountCents: number;
};

export type FloatingShelfPricingResult = {
  productFamily: "floating-shelves";
  productSlug: "classic-floating-shelf";
  currencyCode: "USD";
  priceState: "instant" | "estimate" | "consult";
  instantPriceEligible: boolean;
  reviewRequired: boolean;
  consultRequired: boolean;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  quantityTotalCents: number;
  estimatedSubtotalCents: number;
  depositEligible: boolean;
  shippingProfileHint: "parcel-ready" | "oversize-home-delivery" | "review-required";
  leadTimeText: string;
  pricingBasisVersion: string;
  warnings: string[];
  customerMessage: string;
  components: FloatingShelfPriceComponent[];
};

function roundCurrency(cents: number) {
  return Math.round(cents / 100) * 100;
}

function getMaterial(code: FloatingShelfMaterialCode) {
  return (
    floatingShelfMaterialOptions.find((option) => option.code === code) ??
    floatingShelfMaterialOptions[0]
  );
}

function getMounting(code: FloatingShelfMountingCode) {
  return (
    floatingShelfMountingOptions.find((option) => option.code === code) ??
    floatingShelfMountingOptions[0]
  );
}

function depthFactor(depth: FloatingShelfConfiguration["depth"]) {
  switch (depth) {
    case 8:
      return 1;
    case 10:
      return 1.12;
    case 12:
      return 1.24;
  }
}

function thicknessFactor(thickness: FloatingShelfConfiguration["thickness"]) {
  switch (thickness) {
    case 1.5:
      return 1;
    case 2:
      return 1.12;
    case 2.5:
      return 1.24;
  }
}

function leadTimeFor(input: {
  reviewRequired: boolean;
  consultRequired: boolean;
  mountingCode: FloatingShelfMountingCode;
}) {
  if (input.consultRequired) {
    return "Reviewed with your project after a consult";
  }
  if (input.reviewRequired) {
    return "Approximately 5 to 6 weeks after review";
  }
  if (input.mountingCode === "HEAVY_DUTY_CONCEALED") {
    return "Approximately 4 to 5 weeks";
  }
  return "Approximately 3 to 4 weeks";
}

export function calculateFloatingShelfPrice(
  configuration: FloatingShelfConfiguration
): FloatingShelfPricingResult {
  const material = getMaterial(configuration.materialCode);
  const mounting = getMounting(configuration.mountingCode);

  const width = configuration.width;
  const depthMultiplier = depthFactor(configuration.depth);
  const thicknessMultiplier = thicknessFactor(configuration.thickness);

  const materialCostCents = roundCurrency(
    width *
      material.ratePerInchCents *
      depthMultiplier *
      thicknessMultiplier *
      material.multiplier
  );
  const fabricationCostCents = roundCurrency(
    18000 + width * 95 + configuration.depth * 1400 + configuration.thickness * 5200
  );
  const mountingCostCents = roundCurrency(
    mounting.hardwareCents * mounting.multiplier + Math.max(0, width - 60) * 115
  );
  const packagingCostCents = roundCurrency(
    6500 + configuration.depth * 350 + configuration.thickness * 900 + Math.max(0, width - 72) * 140
  );

  const directCostCents =
    materialCostCents + fabricationCostCents + mountingCostCents + packagingCostCents;
  const marginComponentCents = roundCurrency(directCostCents * 0.34);
  const unitPriceCents = roundCurrency(directCostCents + marginComponentCents);
  const quantityTotalCents = unitPriceCents * configuration.quantity;

  const warnings: string[] = [];
  const consultRequired = configuration.mountingCode === "CONSULT_REQUIRED";
  let reviewRequired = consultRequired;

  if (width > 96) {
    reviewRequired = true;
    warnings.push("Widths above 96 inches move into project review before live ordering.");
  } else if (width > 84) {
    reviewRequired = true;
    warnings.push("Long spans above 84 inches are reviewed for support and wall conditions.");
  }

  if (configuration.depth === 12 && width > 72) {
    reviewRequired = true;
    warnings.push("Deep shelves above 72 inches are reviewed for bracket strategy and deflection.");
  }

  if (configuration.thickness === 2.5 && width > 84) {
    reviewRequired = true;
    warnings.push("Thick long shelves are reviewed to confirm the best build and mounting path.");
  }

  if (configuration.quantity > 4) {
    reviewRequired = true;
    warnings.push("Projects above four shelves are reviewed together before final scheduling.");
  }

  let shippingProfileHint: FloatingShelfPricingResult["shippingProfileHint"] = "parcel-ready";
  if (reviewRequired) {
    shippingProfileHint = "review-required";
  } else if (width > 60) {
    shippingProfileHint = "oversize-home-delivery";
  }

  const instantPriceEligible = !reviewRequired;
  const priceState: FloatingShelfPricingResult["priceState"] = consultRequired
    ? "consult"
    : instantPriceEligible
      ? "instant"
      : "estimate";

  const customerMessage = consultRequired
    ? "This mounting path needs review before Craft & Board can confirm an order."
    : instantPriceEligible
      ? "This configuration is within the standard instant-price range."
      : "This configuration is still priceable, but the final order is reviewed before confirmation.";

  return {
    productFamily: configuration.productFamily,
    productSlug: configuration.productSlug,
    currencyCode: "USD",
    priceState,
    instantPriceEligible,
    reviewRequired,
    consultRequired,
    quantity: configuration.quantity,
    unitPriceCents,
    totalPriceCents: quantityTotalCents,
    quantityTotalCents,
    estimatedSubtotalCents: quantityTotalCents,
    depositEligible: instantPriceEligible,
    shippingProfileHint,
    leadTimeText: leadTimeFor({
      reviewRequired,
      consultRequired,
      mountingCode: configuration.mountingCode
    }),
    pricingBasisVersion: "floating-shelf-v1",
    warnings,
    customerMessage,
    components: [
      { code: "material", label: "Material", amountCents: materialCostCents },
      { code: "fabrication", label: "Fabrication", amountCents: fabricationCostCents },
      { code: "mounting", label: "Mounting hardware", amountCents: mountingCostCents },
      { code: "packaging", label: "Packaging and handling", amountCents: packagingCostCents },
      { code: "margin", label: "Craft & Board build margin", amountCents: marginComponentCents }
    ]
  };
}

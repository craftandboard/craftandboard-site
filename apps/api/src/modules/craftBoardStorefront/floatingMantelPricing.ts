export const floatingMantelMaterialOptions = [
  { code: "WHITE_OAK", label: "White Oak", ratePerInchCents: 420, multiplier: 1.08 },
  { code: "WALNUT", label: "Walnut", ratePerInchCents: 470, multiplier: 1.16 },
  { code: "NATURAL_MAPLE", label: "Natural Maple", ratePerInchCents: 395, multiplier: 1 },
  { code: "PAINTED_MAPLE", label: "Painted Maple", ratePerInchCents: 365, multiplier: 0.97 }
] as const;

export const floatingMantelMountingOptions = [
  { code: "STANDARD_CONCEALED", label: "Standard concealed support", hardwareCents: 12000, multiplier: 1 },
  { code: "HEAVY_DUTY_CONCEALED", label: "Heavy-duty concealed support", hardwareCents: 18200, multiplier: 1.1 },
  { code: "CONSULT_REQUIRED", label: "Consult-needed installation review", hardwareCents: 22000, multiplier: 1.16 }
] as const;

export const floatingMantelDepthOptions = [8, 10, 12] as const;
export const floatingMantelHeightOptions = [4, 5, 6] as const;

export type FloatingMantelMaterialCode = (typeof floatingMantelMaterialOptions)[number]["code"];
export type FloatingMantelMountingCode = (typeof floatingMantelMountingOptions)[number]["code"];

export type FloatingMantelConfiguration = {
  productFamily: "floating-mantels";
  productSlug: "classic-floating-mantel";
  length: number;
  lengthUnit: "IN";
  depth: (typeof floatingMantelDepthOptions)[number];
  depthUnit: "IN";
  height: (typeof floatingMantelHeightOptions)[number];
  heightUnit: "IN";
  quantity: number;
  materialCode: FloatingMantelMaterialCode;
  materialLabel: string;
  mountingCode: FloatingMantelMountingCode;
  mountingLabel: string;
  finishCode?: string | null;
  finishLabel?: string | null;
  hollowVsSolidCode?: string | null;
  hollowVsSolidLabel?: string | null;
  edgeProfileCode?: string | null;
  edgeProfileLabel?: string | null;
  customNotes?: string | null;
};

export type FloatingMantelPriceComponent = {
  code: "material" | "fabrication" | "mounting" | "packaging" | "margin";
  label: string;
  amountCents: number;
};

export type FloatingMantelPricingResult = {
  productFamily: "floating-mantels";
  productSlug: "classic-floating-mantel";
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
  components: FloatingMantelPriceComponent[];
};

function roundCurrency(cents: number) {
  return Math.round(cents / 100) * 100;
}

function getMaterial(code: FloatingMantelMaterialCode) {
  return floatingMantelMaterialOptions.find((option) => option.code === code) ?? floatingMantelMaterialOptions[0];
}

function getMounting(code: FloatingMantelMountingCode) {
  return floatingMantelMountingOptions.find((option) => option.code === code) ?? floatingMantelMountingOptions[0];
}

function depthFactor(depth: FloatingMantelConfiguration["depth"]) {
  switch (depth) {
    case 8: return 1;
    case 10: return 1.1;
    case 12: return 1.22;
  }
}

function heightFactor(height: FloatingMantelConfiguration["height"]) {
  switch (height) {
    case 4: return 1;
    case 5: return 1.12;
    case 6: return 1.24;
  }
}

function leadTimeFor(input: {
  reviewRequired: boolean;
  consultRequired: boolean;
  mountingCode: FloatingMantelMountingCode;
}) {
  if (input.consultRequired) {
    return "Reviewed with your project after a site and support consult";
  }
  if (input.reviewRequired) {
    return "Approximately 5 to 7 weeks after project review";
  }
  if (input.mountingCode === "HEAVY_DUTY_CONCEALED") {
    return "Approximately 4 to 5 weeks";
  }
  return "Approximately 3 to 5 weeks";
}

export function calculateFloatingMantelPrice(
  configuration: FloatingMantelConfiguration
): FloatingMantelPricingResult {
  const material = getMaterial(configuration.materialCode);
  const mounting = getMounting(configuration.mountingCode);
  const length = configuration.length;
  const depthMultiplier = depthFactor(configuration.depth);
  const heightMultiplier = heightFactor(configuration.height);

  const materialCostCents = roundCurrency(
    length * material.ratePerInchCents * depthMultiplier * heightMultiplier * material.multiplier
  );
  const fabricationCostCents = roundCurrency(
    26000 + length * 135 + configuration.depth * 2100 + configuration.height * 3600
  );
  const mountingCostCents = roundCurrency(
    mounting.hardwareCents * mounting.multiplier + Math.max(0, length - 72) * 145
  );
  const packagingCostCents = roundCurrency(
    9000 + configuration.depth * 420 + configuration.height * 780 + Math.max(0, length - 72) * 160
  );

  const directCostCents =
    materialCostCents + fabricationCostCents + mountingCostCents + packagingCostCents;
  const marginComponentCents = roundCurrency(directCostCents * 0.36);
  const unitPriceCents = roundCurrency(directCostCents + marginComponentCents);
  const quantityTotalCents = unitPriceCents * configuration.quantity;

  const warnings: string[] = [];
  const consultRequired = configuration.mountingCode === "CONSULT_REQUIRED";
  let reviewRequired = consultRequired;

  if (length > 108) {
    reviewRequired = true;
    warnings.push("Lengths above 108 inches move into review before a standard order can be confirmed.");
  } else if (length > 96) {
    reviewRequired = true;
    warnings.push("Long mantels above 96 inches are reviewed for support, install conditions, and freight handling.");
  }

  if (configuration.depth === 12 && configuration.height === 6 && length > 84) {
    reviewRequired = true;
    warnings.push("Large section mantels above 84 inches are reviewed for build method and concealed support strategy.");
  }

  if (configuration.quantity > 2) {
    reviewRequired = true;
    warnings.push("Multi-mantel projects are reviewed together before scheduling and confirmation.");
  }

  let shippingProfileHint: FloatingMantelPricingResult["shippingProfileHint"] = "parcel-ready";
  if (reviewRequired) {
    shippingProfileHint = "review-required";
  } else if (length > 72) {
    shippingProfileHint = "oversize-home-delivery";
  }

  const instantPriceEligible = !reviewRequired;
  const priceState: FloatingMantelPricingResult["priceState"] = consultRequired
    ? "consult"
    : instantPriceEligible
      ? "instant"
      : "estimate";

  const customerMessage = consultRequired
    ? "This mantel installation path needs review before Craft & Board can confirm the order."
    : instantPriceEligible
      ? "This mantel configuration is within the standard instant-price range."
      : "This mantel is still priceable, but the final order is reviewed before confirmation.";

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
    pricingBasisVersion: "floating-mantel-v1",
    warnings,
    customerMessage,
    components: [
      { code: "material", label: "Material", amountCents: materialCostCents },
      { code: "fabrication", label: "Fabrication", amountCents: fabricationCostCents },
      { code: "mounting", label: "Mounting support", amountCents: mountingCostCents },
      { code: "packaging", label: "Packaging and handling", amountCents: packagingCostCents },
      { code: "margin", label: "Craft & Board build margin", amountCents: marginComponentCents }
    ]
  };
}

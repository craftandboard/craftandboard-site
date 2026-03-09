type MaterialProfileView = {
  thicknessIn: number;
  defaultEdgeBandPattern: "ALL_FOUR";
};

export function normalizeShelfOrderItem(input: {
  item: {
    id: string;
    title: string;
    quantity: number;
    lengthIn: number | null;
    depthIn: number | null;
    thicknessIn: number | null;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18" | null;
    edgeBandPattern: "ALL_FOUR" | null;
    requiresPackaging: boolean;
    shelfProductId?: string | null;
    packagingProfileId?: string | null;
  };
  shelfProduct?: {
    id: string;
    name: string;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    defaultThicknessIn: number;
    defaultEdgeBandPattern: "ALL_FOUR";
    packagingProfileId?: string | null;
  } | null;
  materialProfile?: MaterialProfileView | null;
  defaultCostProfileId?: string;
  defaultProductionAssumptionProfileId?: string;
  defaultPricingPolicyId?: string;
}) {
  const errors: string[] = [];

  if (input.item.quantity <= 0) {
    errors.push("Quantity must be greater than zero.");
  }
  if (!input.item.lengthIn || input.item.lengthIn <= 0) {
    errors.push("Valid lengthIn is required.");
  }
  if (!input.item.depthIn || input.item.depthIn <= 0) {
    errors.push("Valid depthIn is required.");
  }

  const materialType = input.item.materialType ?? input.shelfProduct?.materialType;
  const edgeBandPattern =
    input.item.edgeBandPattern ??
    input.shelfProduct?.defaultEdgeBandPattern ??
    input.materialProfile?.defaultEdgeBandPattern;
  const thicknessIn =
    input.item.thicknessIn ??
    input.shelfProduct?.defaultThicknessIn ??
    input.materialProfile?.thicknessIn;
  const packagingProfileId =
    input.item.packagingProfileId ??
    input.shelfProduct?.packagingProfileId ??
    undefined;

  if (!materialType) {
    errors.push("Material type could not be resolved.");
  }
  if (!edgeBandPattern) {
    errors.push("Edge band pattern could not be resolved.");
  }
  if (!thicknessIn || thicknessIn <= 0) {
    errors.push("Thickness could not be resolved.");
  }
  if (!input.defaultCostProfileId) {
    errors.push("Default cost profile is not configured.");
  }
  if (!input.defaultProductionAssumptionProfileId) {
    errors.push("Default production assumption profile is not configured.");
  }
  if (!input.defaultPricingPolicyId) {
    errors.push("Default pricing policy is not configured.");
  }
  if (input.item.requiresPackaging && !packagingProfileId) {
    errors.push("Packaging is required but no packaging profile was resolved.");
  }

  if (errors.length > 0) {
    return {
      ok: false as const,
      errors
    };
  }

  return {
    ok: true as const,
    normalizedSpec: {
      shelfProductId: input.shelfProduct?.id,
      costProfileId: input.defaultCostProfileId,
      productionAssumptionProfileId: input.defaultProductionAssumptionProfileId,
      packagingProfileId,
      pricingPolicyId: input.defaultPricingPolicyId,
      title: input.item.title,
      quantity: input.item.quantity,
      lengthIn: input.item.lengthIn,
      depthIn: input.item.depthIn,
      thicknessIn,
      materialType,
      edgeBandPattern,
      requiresPackaging: input.item.requiresPackaging
    }
  };
}

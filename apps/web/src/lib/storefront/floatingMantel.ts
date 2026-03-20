export const floatingMantelProductFamily = "floating-mantels" as const;
export const floatingMantelProductSlug = "classic-floating-mantel" as const;
export const floatingMantelProductName = "Classic Floating Mantel" as const;

export const floatingMantelLengthUnit = "IN" as const;
export const floatingMantelDepthUnit = "IN" as const;
export const floatingMantelHeightUnit = "IN" as const;

export const floatingMantelDepthOptions = [
  { value: 8, label: '8"' },
  { value: 10, label: '10"' },
  { value: 12, label: '12"' }
] as const;

export const floatingMantelHeightOptions = [
  { value: 4, label: '4"' },
  { value: 5, label: '5"' },
  { value: 6, label: '6"' }
] as const;

export const floatingMantelMaterialOptions = [
  { code: "WHITE_OAK", label: "White Oak" },
  { code: "WALNUT", label: "Walnut" },
  { code: "NATURAL_MAPLE", label: "Natural Maple" },
  { code: "PAINTED_MAPLE", label: "Painted Maple" }
] as const;

export const floatingMantelMountingOptions = [
  { code: "STANDARD_CONCEALED", label: "Standard concealed support" },
  { code: "HEAVY_DUTY_CONCEALED", label: "Heavy-duty concealed support" },
  { code: "CONSULT_REQUIRED", label: "Consult-needed installation review" }
] as const;

export type FloatingMantelMaterialCode = (typeof floatingMantelMaterialOptions)[number]["code"];
export type FloatingMantelMountingCode = (typeof floatingMantelMountingOptions)[number]["code"];

export type FloatingMantelConfig = {
  productFamily: typeof floatingMantelProductFamily;
  productSlug: typeof floatingMantelProductSlug;
  length: number;
  lengthUnit: typeof floatingMantelLengthUnit;
  depth: (typeof floatingMantelDepthOptions)[number]["value"];
  depthUnit: typeof floatingMantelDepthUnit;
  height: (typeof floatingMantelHeightOptions)[number]["value"];
  heightUnit: typeof floatingMantelHeightUnit;
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

export const floatingMantelDefaultConfig: FloatingMantelConfig = {
  productFamily: floatingMantelProductFamily,
  productSlug: floatingMantelProductSlug,
  length: 72,
  lengthUnit: floatingMantelLengthUnit,
  depth: 10,
  depthUnit: floatingMantelDepthUnit,
  height: 5,
  heightUnit: floatingMantelHeightUnit,
  quantity: 1,
  materialCode: floatingMantelMaterialOptions[0].code,
  materialLabel: floatingMantelMaterialOptions[0].label,
  mountingCode: floatingMantelMountingOptions[0].code,
  mountingLabel: floatingMantelMountingOptions[0].label,
  customNotes: null
};

export function getFloatingMantelMaterialLabel(code: FloatingMantelMaterialCode) {
  return (
    floatingMantelMaterialOptions.find((option) => option.code === code)?.label ??
    floatingMantelMaterialOptions[0].label
  );
}

export function getFloatingMantelMountingLabel(code: FloatingMantelMountingCode) {
  return (
    floatingMantelMountingOptions.find((option) => option.code === code)?.label ??
    floatingMantelMountingOptions[0].label
  );
}

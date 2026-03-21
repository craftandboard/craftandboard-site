export const floatingShelfProductFamily = "floating-shelves" as const;
export const floatingShelfProductSlug = "classic-floating-shelf" as const;
export const floatingShelfProductName = "Classic Floating Shelf" as const;

export const floatingShelfWidthUnit = "IN" as const;
export const floatingShelfDepthUnit = "IN" as const;
export const floatingShelfThicknessUnit = "IN" as const;

export const floatingShelfDepthOptions = [
  { value: 8, label: '8"' },
  { value: 10, label: '10"' },
  { value: 12, label: '12"' }
] as const;

export const floatingShelfThicknessOptions = [
  { value: 1.5, label: '1.5"' },
  { value: 2, label: '2"' },
  { value: 2.5, label: '2.5"' }
] as const;

export const floatingShelfMaterialOptions = [
  { code: "WHITE_OAK", label: "White Oak" },
  { code: "WALNUT", label: "Walnut" },
  { code: "NATURAL_MAPLE", label: "Natural Maple" },
  { code: "PAINTED_MAPLE", label: "Painted Maple" }
] as const;

export const floatingShelfMountingOptions = [
  { code: "STANDARD_CONCEALED", label: "Standard concealed bracket" },
  { code: "HEAVY_DUTY_CONCEALED", label: "Heavy-duty concealed bracket" },
  { code: "CONSULT_REQUIRED", label: "Consult-needed mounting review" }
] as const;

export type FloatingShelfMaterialCode = (typeof floatingShelfMaterialOptions)[number]["code"];
export type FloatingShelfMountingCode = (typeof floatingShelfMountingOptions)[number]["code"];

export type FloatingShelfConfig = {
  productFamily: typeof floatingShelfProductFamily;
  productSlug: typeof floatingShelfProductSlug;
  width: number;
  widthUnit: typeof floatingShelfWidthUnit;
  depth: (typeof floatingShelfDepthOptions)[number]["value"];
  depthUnit: typeof floatingShelfDepthUnit;
  thickness: (typeof floatingShelfThicknessOptions)[number]["value"];
  thicknessUnit: typeof floatingShelfThicknessUnit;
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

export const floatingShelfDefaultConfig: FloatingShelfConfig = {
  productFamily: floatingShelfProductFamily,
  productSlug: floatingShelfProductSlug,
  width: 72,
  widthUnit: floatingShelfWidthUnit,
  depth: 10,
  depthUnit: floatingShelfDepthUnit,
  thickness: 2,
  thicknessUnit: floatingShelfThicknessUnit,
  quantity: 1,
  materialCode: floatingShelfMaterialOptions[0].code,
  materialLabel: floatingShelfMaterialOptions[0].label,
  mountingCode: floatingShelfMountingOptions[0].code,
  mountingLabel: floatingShelfMountingOptions[0].label,
  customNotes: null
};

export function getFloatingShelfMaterialLabel(code: FloatingShelfMaterialCode) {
  return floatingShelfMaterialOptions.find((option) => option.code === code)?.label ?? floatingShelfMaterialOptions[0].label;
}

export function getFloatingShelfMountingLabel(code: FloatingShelfMountingCode) {
  return floatingShelfMountingOptions.find((option) => option.code === code)?.label ?? floatingShelfMountingOptions[0].label;
}

import {
  floatingShelfDefaultConfig,
  getFloatingShelfMaterialLabel,
  getFloatingShelfMountingLabel,
  type FloatingShelfConfig,
  type FloatingShelfMaterialCode,
  type FloatingShelfMountingCode
} from "./floatingShelf";
import {
  floatingMantelDefaultConfig,
  getFloatingMantelMaterialLabel,
  getFloatingMantelMountingLabel,
  type FloatingMantelConfig,
  type FloatingMantelMaterialCode,
  type FloatingMantelMountingCode
} from "./floatingMantel";

export type StorefrontPaymentMode =
  | "DEPOSIT_REQUEST"
  | "FULL_PAYMENT_LATER"
  | "PAY_NOW_PLACEHOLDER";

export type StorefrontOrderIntent =
  | "PURCHASE_STANDARD"
  | "REQUEST_REVIEW";

export type ProductFamilyCode =
  | "floating-shelves"
  | "floating-mantels"
  | "closet-shelving-systems"
  | "cabinet-modules"
  | "mudroom-bench-systems"
  | "window-seat-systems";

export type ProductLiveStatus = "LIVE" | "COMING_SOON" | "INTERNAL_ONLY";

export type StorefrontAddress = {
  fullName: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type ConfigurableProductEligibilityResult = {
  instantPriceEligible: boolean;
  reviewRequired: boolean;
  consultRequired: boolean;
  reasonCodes: string[];
  customerFacingMessage: string;
  allowedCheckoutMode: "STANDARD_CHECKOUT" | "REVIEW_ONLY";
  fallbackMode: "REQUEST_REVIEW" | "NONE";
};

export type ConfigurableProductCheckoutDraft<
  TConfiguration = Record<string, unknown>,
  TPricingResult = {
    productFamily: ProductFamilyCode;
    productSlug: string;
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
    components: Array<{
      code: "material" | "fabrication" | "mounting" | "packaging" | "margin";
      label: string;
      amountCents: number;
    }>;
  }
> = {
  sourceChannel: "CRAFT_BOARD";
  productFamily: ProductFamilyCode;
  productSlug: string;
  configuration: TConfiguration;
  pricingResult: TPricingResult;
  eligibilityResult: ConfigurableProductEligibilityResult;
  instantPriceEligible: boolean;
  consultRequired: boolean;
  customer: {
    fullName: string;
    email: string;
    phone?: string | null;
  };
  shippingAddress: StorefrontAddress;
  billingSameAsShipping: boolean;
  billingAddress?: StorefrontAddress | null;
  notes?: string | null;
  paymentMode: StorefrontPaymentMode;
  orderIntent: StorefrontOrderIntent;
  customerAcceptedPricingBasis: boolean;
  customerAcceptedLeadTimeBasis: boolean;
  customerAcknowledgedMadeToOrder: boolean;
};

export type FloatingShelfOrderDraft = ConfigurableProductCheckoutDraft<FloatingShelfConfig>;
export type FloatingMantelOrderDraft = ConfigurableProductCheckoutDraft<FloatingMantelConfig>;

export function buildFloatingShelfCheckoutHref(config: FloatingShelfConfig) {
  const params = new URLSearchParams({
    width: String(config.width),
    depth: String(config.depth),
    thickness: String(config.thickness),
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    mountingCode: config.mountingCode
  });

  if (config.customNotes) {
    params.set("customNotes", config.customNotes);
  }

  return `/order/floating-shelves/classic-floating-shelf?${params.toString()}`;
}

export function buildFloatingShelfPdpHref(config: FloatingShelfConfig) {
  const params = new URLSearchParams({
    width: String(config.width),
    depth: String(config.depth),
    thickness: String(config.thickness),
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    mountingCode: config.mountingCode
  });

  if (config.customNotes) {
    params.set("customNotes", config.customNotes);
  }

  return `/shop/floating-shelves/classic-floating-shelf?${params.toString()}`;
}

export function buildFloatingShelfInquiryHref(config: FloatingShelfConfig, sourcePath: string) {
  const params = new URLSearchParams({
    source: "storefront_checkout",
    sourcePath,
    productFamily: config.productFamily,
    productSlug: config.productSlug,
    productName: "Classic Floating Shelf",
    widthValue: String(config.width),
    widthUnit: config.widthUnit,
    depthValue: String(config.depth),
    depthUnit: config.depthUnit,
    thicknessValue: String(config.thickness),
    thicknessUnit: config.thicknessUnit,
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    materialLabel: config.materialLabel,
    mountingCode: config.mountingCode,
    mountingLabel: config.mountingLabel
  });

  if (config.customNotes) {
    params.set("notes", config.customNotes);
  }

  return `/contact?${params.toString()}`;
}

export function parseFloatingShelfConfigFromSearchParams(
  source:
    | URLSearchParams
    | { get(name: string): string | null }
    | Record<string, string | string[] | undefined>
    | undefined
) {
  const read = (key: string) => {
    if (!source) {
      return undefined;
    }
    const maybeReadable = source as { get?: ((name: string) => string | null) | undefined };
    if (typeof maybeReadable.get === "function") {
      return maybeReadable.get(key) ?? undefined;
    }
    const recordSource = source as Record<string, string | string[] | undefined>;
    const value = recordSource[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const width = Number(read("width") ?? floatingShelfDefaultConfig.width);
  const depth = Number(read("depth") ?? floatingShelfDefaultConfig.depth);
  const thickness = Number(read("thickness") ?? floatingShelfDefaultConfig.thickness);
  const quantity = Number(read("quantity") ?? floatingShelfDefaultConfig.quantity);
  const materialCode = (read("materialCode") ?? floatingShelfDefaultConfig.materialCode) as FloatingShelfMaterialCode;
  const mountingCode = (read("mountingCode") ?? floatingShelfDefaultConfig.mountingCode) as FloatingShelfMountingCode;
  const customNotes = read("customNotes") ?? null;

  return {
    ...floatingShelfDefaultConfig,
    width: Number.isFinite(width) && width > 0 ? width : floatingShelfDefaultConfig.width,
    depth: [8, 10, 12].includes(depth) ? (depth as FloatingShelfConfig["depth"]) : floatingShelfDefaultConfig.depth,
    thickness: [1.5, 2, 2.5].includes(thickness)
      ? (thickness as FloatingShelfConfig["thickness"])
      : floatingShelfDefaultConfig.thickness,
    quantity: Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : floatingShelfDefaultConfig.quantity,
    materialCode,
    materialLabel: getFloatingShelfMaterialLabel(materialCode),
    mountingCode,
    mountingLabel: getFloatingShelfMountingLabel(mountingCode),
    customNotes
  } satisfies FloatingShelfConfig;
}

export function buildFloatingMantelCheckoutHref(config: FloatingMantelConfig) {
  const params = new URLSearchParams({
    length: String(config.length),
    depth: String(config.depth),
    height: String(config.height),
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    mountingCode: config.mountingCode
  });

  if (config.customNotes) {
    params.set("customNotes", config.customNotes);
  }

  return `/order/floating-mantels/classic-floating-mantel?${params.toString()}`;
}

export function buildFloatingMantelPdpHref(config: FloatingMantelConfig) {
  const params = new URLSearchParams({
    length: String(config.length),
    depth: String(config.depth),
    height: String(config.height),
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    mountingCode: config.mountingCode
  });

  if (config.customNotes) {
    params.set("customNotes", config.customNotes);
  }

  return `/shop/floating-mantels/classic-floating-mantel?${params.toString()}`;
}

export function buildFloatingMantelInquiryHref(config: FloatingMantelConfig, sourcePath: string) {
  const params = new URLSearchParams({
    source: "storefront_checkout",
    sourcePath,
    productFamily: config.productFamily,
    productSlug: config.productSlug,
    productName: "Classic Floating Mantel",
    widthValue: String(config.length),
    widthUnit: config.lengthUnit,
    depthValue: String(config.depth),
    depthUnit: config.depthUnit,
    thicknessValue: String(config.height),
    thicknessUnit: config.heightUnit,
    quantity: String(config.quantity),
    materialCode: config.materialCode,
    materialLabel: config.materialLabel,
    mountingCode: config.mountingCode,
    mountingLabel: config.mountingLabel
  });

  if (config.customNotes) {
    params.set("notes", config.customNotes);
  }

  return `/contact?${params.toString()}`;
}

export function parseFloatingMantelConfigFromSearchParams(
  source:
    | URLSearchParams
    | { get(name: string): string | null }
    | Record<string, string | string[] | undefined>
    | undefined
) {
  const read = (key: string) => {
    if (!source) {
      return undefined;
    }
    const maybeReadable = source as { get?: ((name: string) => string | null) | undefined };
    if (typeof maybeReadable.get === "function") {
      return maybeReadable.get(key) ?? undefined;
    }
    const recordSource = source as Record<string, string | string[] | undefined>;
    const value = recordSource[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const length = Number(read("length") ?? floatingMantelDefaultConfig.length);
  const depth = Number(read("depth") ?? floatingMantelDefaultConfig.depth);
  const height = Number(read("height") ?? floatingMantelDefaultConfig.height);
  const quantity = Number(read("quantity") ?? floatingMantelDefaultConfig.quantity);
  const materialCode = (read("materialCode") ?? floatingMantelDefaultConfig.materialCode) as FloatingMantelMaterialCode;
  const mountingCode = (read("mountingCode") ?? floatingMantelDefaultConfig.mountingCode) as FloatingMantelMountingCode;
  const customNotes = read("customNotes") ?? null;

  return {
    ...floatingMantelDefaultConfig,
    length: Number.isFinite(length) && length > 0 ? length : floatingMantelDefaultConfig.length,
    depth: [8, 10, 12].includes(depth) ? (depth as FloatingMantelConfig["depth"]) : floatingMantelDefaultConfig.depth,
    height: [4, 5, 6].includes(height) ? (height as FloatingMantelConfig["height"]) : floatingMantelDefaultConfig.height,
    quantity: Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : floatingMantelDefaultConfig.quantity,
    materialCode,
    materialLabel: getFloatingMantelMaterialLabel(materialCode),
    mountingCode,
    mountingLabel: getFloatingMantelMountingLabel(mountingCode),
    customNotes
  } satisfies FloatingMantelConfig;
}

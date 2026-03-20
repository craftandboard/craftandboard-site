import type {
  StorefrontPackagingProfile,
  StorefrontShippingMode,
  StorefrontShippingQuoteSource
} from "./types";

export const shippingModeLabels: Record<StorefrontShippingMode, string> = {
  PARCEL: "Parcel",
  OVERSIZE_PARCEL: "Oversize Parcel",
  LTL_FREIGHT: "Freight Review",
  LOCAL_DELIVERY: "Local Delivery",
  PICKUP: "Pickup",
  REVIEW_REQUIRED: "Review Required"
};

export const packagingProfileLabels: Record<StorefrontPackagingProfile, string> = {
  long_shelf_box: "Long Shelf Box",
  mantel_box: "Mantel Box",
  long_oversize_box: "Long Oversize Box",
  mantel_crate: "Mantel Crate",
  freight_pallet: "Freight Pallet"
};

export const shippingQuoteSourceLabels: Record<StorefrontShippingQuoteSource, string> = {
  LIVE_PROVIDER: "Live Shipping Quote",
  ESTIMATE_RULES: "Estimated Shipping",
  MANUAL_REVIEW: "Shipping Review Required"
};

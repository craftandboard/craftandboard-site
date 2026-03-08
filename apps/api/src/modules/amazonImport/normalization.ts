import type { AmazonSellerCentralFixture, NormalizedOrderInput } from "@craft-and-board/shared";
import { formatDateKey, parseInputDate } from "../imports/date.js";
import { AmazonImportError } from "./errors.js";
import { combineIntoDimensionInches, validateShelfDimensionInches } from "./dimensions.js";
import { inferMaterial } from "./materialInference.js";
import { deriveCustomerLastName } from "./nameParser.js";
import { amazonFixtureSchema } from "./schemas.js";

export function normalizeAmazonFixture(rawInput: unknown): NormalizedOrderInput {
  const raw = amazonFixtureSchema.parse(rawInput) as AmazonSellerCentralFixture;
  const material = inferMaterial({
    material: raw.material,
    sku: raw.sku,
    productTitle: raw.productTitle
  });
  const widthIn = combineIntoDimensionInches({
    whole: raw.customizations.lengthInches,
    fractionOrAdjustment:
      raw.customizations.lengthAdjustment ?? raw.customizations.lengthFraction
  });
  const depthIn = combineIntoDimensionInches({
    whole: raw.customizations.depthInches,
    fractionOrAdjustment:
      raw.customizations.depthAdjustment ?? raw.customizations.depthFraction
  });

  validateShelfDimensionInches({ widthIn, depthIn });

  const customerFullName = raw.shipToName?.trim() || raw.buyerName.trim();
  const customerLastName = deriveCustomerLastName(customerFullName);
  const purchaseDate = raw.purchaseDate ? parseInputDate(raw.purchaseDate).toISOString() : undefined;
  const shipByDate = parseInputDate(raw.shipByDate).toISOString();

  if (!customerFullName) {
    throw new AmazonImportError("Customer full name is missing.");
  }

  return {
    externalOrderId: raw.amazonOrderId,
    amazonOrderId: raw.amazonOrderId,
    amazonOrderSource: "SELLER_CENTRAL_FIXTURE",
    orderDate: purchaseDate ?? shipByDate,
    purchaseDate,
    shipByDate,
    customerName: customerFullName,
    customerFullName,
    shipToName: raw.shipToName ?? raw.buyerName,
    customerLastName,
    status: "ready_for_batch",
    rawPayload: raw,
    lineItems: [
      {
        externalOrderItemId: raw.amazonOrderItemId,
        amazonOrderItemId: raw.amazonOrderItemId,
        asin: raw.asin ?? undefined,
        sku: raw.sku,
        title: raw.productTitle,
        productLabel: material.productLabel,
        normalizedLegacyXmlName: material.legacyXmlName,
        materialCode: material.materialCode,
        materialLabel: material.materialLabel,
        quantity: raw.quantity,
        widthIn,
        depthIn,
        thicknessIn: 0.75,
        edgeBandPattern: "ALL_FOUR",
        edgeBandLabel: "All four sides",
        sourceLengthIn: combineIntoDimensionInches({
          whole: raw.customizations.lengthInches,
          fractionOrAdjustment: 0
        }),
        sourceDepthIn: combineIntoDimensionInches({
          whole: raw.customizations.depthInches,
          fractionOrAdjustment: 0
        }),
        sourceEdgeBandText: raw.customizations.edgebanding ?? undefined,
        sourceCustomizationJson: raw.customizations,
        notes: raw.customizations.notes ?? undefined
      }
    ]
  };
}

export function buildAmazonPartCode(input: {
  shipByDate: string;
  materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE";
  orderItemKey: string;
  sequence: number;
}): string {
  const materialShort = input.materialCode === "WHITE_MELAMINE" ? "WHITE" : "MAPLE";
  const orderItemSuffix = input.orderItemKey.replace(/[^0-9A-Z]/gi, "").slice(-6).toUpperCase() || "ITEM";
  return `SHF-${formatDateKey(new Date(input.shipByDate)).replaceAll("-", "")}-${materialShort}-${orderItemSuffix}-${String(
    input.sequence
  ).padStart(4, "0")}`;
}

import type { NormalizationContext, NormalizedOrderInput } from "./types.js";
import { rawFixtureOrderSchema } from "./amazonRawFixtureSchema.js";
import { parseInputDate } from "./date.js";
import { normalizeDimensionInches } from "./dimension.js";
import { extractCustomerLastName } from "./lastName.js";
import { normalizeSkuMaterial } from "./skuMapping.js";

export function normalizeRawFixtureOrder(
  rawInput: unknown,
  _context?: NormalizationContext
): NormalizedOrderInput {
  const raw = rawFixtureOrderSchema.parse(rawInput);

  return {
    externalOrderId: raw.externalOrderId,
    amazonOrderId: raw.amazonOrderId,
    orderDate: parseInputDate(raw.orderDate).toISOString(),
    shipByDate: parseInputDate(raw.shipByDate).toISOString(),
    customerName: raw.customerName.trim(),
    customerLastName: extractCustomerLastName(raw.customerName),
    status: "imported",
    rawPayload: raw,
    lineItems: raw.lineItems.map((lineItem) => {
      const skuDetails = normalizeSkuMaterial({
        sku: lineItem.sku,
        title: lineItem.title,
        material: lineItem.material,
        edgeBandPattern: lineItem.edgeBandPattern
      });

      return {
        externalOrderItemId: lineItem.externalOrderItemId,
        sku: lineItem.sku,
        title: lineItem.title,
        productLabel: skuDetails.productLabel,
        materialCode: skuDetails.materialCode,
        materialLabel: skuDetails.materialLabel,
        quantity: lineItem.quantity,
        widthIn: normalizeDimensionInches({
          whole: lineItem.widthWhole,
          fraction: lineItem.widthFraction,
          decimal: lineItem.widthIn
        }),
        depthIn: normalizeDimensionInches({
          whole: lineItem.depthWhole,
          fraction: lineItem.depthFraction,
          decimal: lineItem.depthIn
        }),
        thicknessIn: 0.75,
        edgeBandPattern: skuDetails.edgeBandPattern,
        edgeBandLabel: skuDetails.edgeBandLabel,
        notes: lineItem.notes ?? undefined
      };
    })
  };
}

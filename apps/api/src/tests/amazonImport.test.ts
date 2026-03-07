import { describe, expect, it } from "vitest";
import { AmazonImportError } from "../modules/amazonImport/errors.js";
import {
  combineIntoDimensionInches,
  parseFractionAdjustment,
  validateShelfDimensionInches
} from "../modules/amazonImport/dimensions.js";
import { inferMaterial } from "../modules/amazonImport/materialInference.js";
import { deriveCustomerLastName } from "../modules/amazonImport/nameParser.js";
import { normalizeAmazonFixture } from "../modules/amazonImport/normalization.js";

describe("amazon material inference", () => {
  it("maps maple and white shelf products from seller central naming", () => {
    expect(
      inferMaterial({
        sku: 'CST-Maple Melamine Shelf - 3/4" Thick',
        productTitle: "Sublime Design - Made to Fit - Custom - Cabinet Replacement Shelves (Maple)"
      })
    ).toMatchObject({
      materialCode: "MAPLE_MELAMINE",
      productLabel: "Maple Shelf"
    });

    expect(
      inferMaterial({
        sku: 'CST-White Melamine Shelf - 3/4" Thick',
        productTitle: "Sublime Design - Made to Fit - Custom - Cabinet Replacement Shelves (White)"
      })
    ).toMatchObject({
      materialCode: "WHITE_MELAMINE",
      productLabel: "White Shelf"
    });
  });
});

describe("amazon dimension parsing", () => {
  it("supports no adjustment and common eighth-inch fractions", () => {
    expect(parseFractionAdjustment("No Adjustment")).toBe(0);
    expect(parseFractionAdjustment("1/8")).toBe(0.125);
    expect(parseFractionAdjustment("5/8")).toBe(0.625);
    expect(parseFractionAdjustment("0.375")).toBe(0.375);
  });

  it("maps length to width and rounds to the nearest eighth-inch", () => {
    expect(
      combineIntoDimensionInches({
        whole: "19",
        fractionOrAdjustment: "3/8"
      })
    ).toBe(19.375);

    expect(
      combineIntoDimensionInches({
        whole: 21,
        fractionOrAdjustment: "0.26"
      })
    ).toBe(21.25);
  });

  it("rejects out-of-range shelf sizes", () => {
    expect(() => validateShelfDimensionInches({ widthIn: 7.875, depthIn: 12 })).toThrow(
      AmazonImportError
    );
    expect(() => validateShelfDimensionInches({ widthIn: 24, depthIn: 24.125 })).toThrow(
      AmazonImportError
    );
  });
});

describe("amazon customer name parsing", () => {
  it("uses the last non-empty token and uppercases it", () => {
    expect(deriveCustomerLastName("  Teresa   Primorac  ")).toBe("PRIMORAC");
    expect(deriveCustomerLastName("Madison von Trapp")).toBe("TRAPP");
    expect(deriveCustomerLastName("")).toBe("UNKNOWN");
  });
});

describe("amazon fixture normalization", () => {
  it("maps seller central fields into the internal shelf workflow model", () => {
    const normalized = normalizeAmazonFixture({
      amazonOrderId: "111-5237066-4129809",
      amazonOrderItemId: "123098226833561",
      asin: "B0DW299RT2",
      quantity: 3,
      buyerName: "Teresa Primorac",
      shipToName: "Teresa Primorac",
      purchaseDate: "2025-03-10T14:43:00-08:00",
      shipByDate: "2025-03-12",
      productTitle:
        "Sublime Design - Made to Fit - Custom - Cabinet Replacement Shelves (Maple)",
      sku: 'CST-Maple Melamine Shelf - 3/4" Thick',
      customizations: {
        lengthInches: "19",
        lengthFraction: "No Adjustment",
        depthInches: "21",
        depthAdjustment: "1/8",
        edgebanding: "Edgeband On Short Side",
        contactInfo: "buyer@example.com",
        notes: ""
      }
    });

    expect(normalized.amazonOrderId).toBe("111-5237066-4129809");
    expect(normalized.customerLastName).toBe("PRIMORAC");
    expect(normalized.lineItems).toHaveLength(1);
    expect(normalized.lineItems[0]).toMatchObject({
      amazonOrderItemId: "123098226833561",
      productLabel: "Maple Shelf",
      materialCode: "MAPLE_MELAMINE",
      widthIn: 19,
      depthIn: 21.125,
      thicknessIn: 0.75,
      edgeBandPattern: "ALL_FOUR",
      sourceLengthIn: 19,
      sourceDepthIn: 21,
      sourceEdgeBandText: "Edgeband On Short Side"
    });
  });
});

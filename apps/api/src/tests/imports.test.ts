import { describe, expect, it } from "vitest";
import { normalizeDimensionInches, parseFraction } from "../modules/imports/dimension.js";
import { extractCustomerLastName } from "../modules/imports/lastName.js";
import { normalizeSkuMaterial } from "../modules/imports/skuMapping.js";

describe("parseFraction", () => {
  it("parses common fractional formats", () => {
    expect(parseFraction("1/4")).toBe(0.25);
    expect(parseFraction("1/2")).toBe(0.5);
    expect(parseFraction("3/4")).toBe(0.75);
    expect(parseFraction("0.25")).toBe(0.25);
    expect(parseFraction("")).toBe(0);
  });
});

describe("normalizeDimensionInches", () => {
  it("combines whole and fractional inputs", () => {
    expect(normalizeDimensionInches({ whole: 24, fraction: "1/2" })).toBe(24.5);
    expect(normalizeDimensionInches({ whole: "10", fraction: "1/4" })).toBe(10.25);
  });

  it("accepts already-normalized decimals", () => {
    expect(normalizeDimensionInches({ decimal: "11.5" })).toBe(11.5);
  });
});

describe("extractCustomerLastName", () => {
  it("handles single-token and multi-token names", () => {
    expect(extractCustomerLastName("Amelia Carter")).toBe("Carter");
    expect(extractCustomerLastName("Sophia Van Buren")).toBe("Van Buren");
  });
});

describe("normalizeSkuMaterial", () => {
  it("maps known shelf products into internal material codes", () => {
    expect(
      normalizeSkuMaterial({
        sku: "CB-WMS-24-12",
        title: "White Melamine Shelf 24 x 12"
      })
    ).toMatchObject({
      materialCode: "WHITE_MELAMINE",
      productLabel: "White Shelf"
    });

    expect(
      normalizeSkuMaterial({
        sku: "CB-MMS-36-14",
        title: "Maple Melamine Shelf 36 x 14"
      })
    ).toMatchObject({
      materialCode: "MAPLE_MELAMINE",
      productLabel: "Maple Shelf"
    });
  });
});

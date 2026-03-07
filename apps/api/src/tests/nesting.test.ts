import { describe, expect, it } from "vitest";
import { buildNestingResult } from "../modules/nesting/service.js";
import { USABLE_X_IN, USABLE_Y_IN } from "../modules/nesting/constants.js";
import { renderSyntecNcFile } from "../modules/cnc/syntecPost.js";

function samplePart(input: {
  id: string;
  partCode: string;
  widthIn: number;
  depthIn: number;
  materialCode?: "WHITE_MELAMINE" | "MAPLE_MELAMINE";
}) {
  return {
    id: input.id,
    partCode: input.partCode,
    materialCode: input.materialCode ?? "WHITE_MELAMINE",
    widthIn: input.widthIn,
    depthIn: input.depthIn,
    thicknessIn: 0.75
  };
}

describe("nesting engine v1", () => {
  it("builds deterministic sheets, preserves trim margin, and flags onion skin", () => {
    const first = buildNestingResult({
      bundleCode: "20250312-WHITE_MELAMINE",
      materialCode: "WHITE_MELAMINE",
      parts: [
        samplePart({ id: "p1", partCode: "SHF-0001", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p2", partCode: "SHF-0002", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p3", partCode: "SHF-0003", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p4", partCode: "SHF-0004", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p5", partCode: "SHF-0005", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p6", partCode: "SHF-0006", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p7", partCode: "SHF-0007", widthIn: 12, depthIn: 12 })
      ]
    });
    const second = buildNestingResult({
      bundleCode: "20250312-WHITE_MELAMINE",
      materialCode: "WHITE_MELAMINE",
      parts: [
        samplePart({ id: "p1", partCode: "SHF-0001", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p2", partCode: "SHF-0002", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p3", partCode: "SHF-0003", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p4", partCode: "SHF-0004", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p5", partCode: "SHF-0005", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p6", partCode: "SHF-0006", widthIn: 35, depthIn: 24 }),
        samplePart({ id: "p7", partCode: "SHF-0007", widthIn: 12, depthIn: 12 })
      ]
    });

    expect(first.sheetCount).toBeGreaterThan(1);
    expect(first.onionSkinPartCount).toBe(1);
    expect(first.sheets[0].placements[0].xIn).toBe(USABLE_X_IN);
    expect(first.sheets[0].placements[0].yIn).toBe(USABLE_Y_IN);
    expect(first).toEqual(second);

    for (const sheet of first.sheets) {
      for (let index = 0; index < sheet.placements.length; index += 1) {
        const current = sheet.placements[index];
        expect(current.xIn).toBeGreaterThanOrEqual(USABLE_X_IN);
        expect(current.yIn).toBeGreaterThanOrEqual(USABLE_Y_IN);

        for (let compareIndex = index + 1; compareIndex < sheet.placements.length; compareIndex += 1) {
          const other = sheet.placements[compareIndex];
          const overlap = !(
            current.xIn + current.widthIn <= other.xIn ||
            other.xIn + other.widthIn <= current.xIn ||
            current.yIn + current.depthIn <= other.yIn ||
            other.yIn + other.depthIn <= current.yIn
          );

          expect(overlap).toBe(false);
        }
      }
    }
  });

  it("renders a human-readable syntec nc file", () => {
    const nesting = buildNestingResult({
      bundleCode: "20250312-WHITE_MELAMINE",
      materialCode: "WHITE_MELAMINE",
      parts: [samplePart({ id: "p1", partCode: "SHF-0001", widthIn: 12, depthIn: 12 })]
    });

    const nc = renderSyntecNcFile({
      bundleCode: nesting.bundleCode,
      materialCode: nesting.materialCode,
      sheet: nesting.sheets[0]
    });

    expect(nc).toContain("Craft & Board V1 shop test output");
    expect(nc).toContain("M3 S18000");
    expect(nc).toContain("F450.000");
    expect(nc).toContain("SHF-0001");
    expect(nc).toContain("M30");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { estimatePartEdgeBand, mapEdgeBandMaterial, normalizeDerivedEdgeBandPattern } from "../modules/edgeBanding/estimation.js";

const selectorMocks = vi.hoisted(() => ({
  selectForecastEdgeBandParts: vi.fn(),
  selectBatchEdgeBandParts: vi.fn(),
  selectOrderEdgeBandParts: vi.fn()
}));

vi.mock("../modules/edgeBanding/selectors.js", () => selectorMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import { getBatchEdgeBandEstimate, getForecastEdgeBandEstimate } from "../modules/edgeBanding/service.js";

describe("edge banding estimation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports no edge band requirement", () => {
    const result = estimatePartEdgeBand({
      partId: "part_1",
      labelCode: "PART-1",
      materialCode: "WHITE_MELAMINE",
      widthIn: 20,
      depthIn: 12,
      source: "CONFIGURATOR",
      sourceEdgeBandText: "NONE"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.derivedPattern).toBe("NONE");
      expect(result.rawLinearFt).toBe(0);
      expect(result.adjustedLinearFt).toBe(0);
    }
  });

  it("supports one long edge, two short edges, and all four", () => {
    const longEdge = estimatePartEdgeBand({
      partId: "part_1",
      labelCode: "PART-1",
      materialCode: "WHITE_MELAMINE",
      widthIn: 30,
      depthIn: 12,
      source: "CONFIGURATOR",
      sourceEdgeBandText: "FRONT_ONLY"
    });
    const shortEdges = estimatePartEdgeBand({
      partId: "part_2",
      labelCode: "PART-2",
      materialCode: "WHITE_MELAMINE",
      widthIn: 30,
      depthIn: 12,
      source: "CONFIGURATOR",
      sourceEdgeBandText: "TWO_SHORT_EDGES"
    });
    const allFour = estimatePartEdgeBand({
      partId: "part_3",
      labelCode: "PART-3",
      materialCode: "WHITE_MELAMINE",
      widthIn: 30,
      depthIn: 12,
      source: "CONFIGURATOR",
      edgeBandPattern: "ALL_FOUR"
    });

    expect(longEdge.ok && longEdge.derivedPattern).toBe("ONE_LONG_EDGE");
    expect(longEdge.ok && longEdge.rawLinearIn).toBe(30);
    expect(shortEdges.ok && shortEdges.derivedPattern).toBe("TWO_SHORT_EDGES");
    expect(shortEdges.ok && shortEdges.rawLinearIn).toBe(24);
    expect(allFour.ok && allFour.derivedPattern).toBe("ALL_FOUR");
    expect(allFour.ok && allFour.rawLinearIn).toBe(84);
  });

  it("applies per-edge waste consistently", () => {
    const result = estimatePartEdgeBand({
      partId: "part_1",
      labelCode: "PART-1",
      materialCode: "WHITE_MELAMINE",
      widthIn: 19.25,
      depthIn: 12.5,
      source: "CONFIGURATOR",
      edgeBandPattern: "ALL_FOUR",
      perEdgeWasteIn: 1
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rawLinearIn).toBe(63.5);
      expect(result.wasteLinearIn).toBe(4);
      expect(result.adjustedLinearIn).toBe(67.5);
    }
  });

  it("maps panel material to deterministic edge band material", () => {
    expect(mapEdgeBandMaterial({ materialCode: "WHITE_MELAMINE" })).toEqual({
      key: "EDGE_WHITE_MELAMINE",
      label: "White Melamine Edge Band",
      colorLabel: "White"
    });
    expect(mapEdgeBandMaterial({ materialCode: "MAPLE_MELAMINE" })).toEqual({
      key: "EDGE_MAPLE_MELAMINE",
      label: "Maple Melamine Edge Band",
      colorLabel: "Maple"
    });
  });

  it("adds setup allowance once per grouped edge band bucket in forecast totals", async () => {
    selectorMocks.selectForecastEdgeBandParts.mockResolvedValue([
      {
        id: "part_1",
        orderId: "order_1",
        manufacturingJobId: "job_1",
        materialCode: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        widthIn: { toString: () => "20" },
        depthIn: { toString: () => "12" },
        instanceNumber: 1,
        orderItem: { sourceEdgeBandText: null },
        manufacturingJob: {
          labelCode: "SHELF-WM-20x12",
          source: "CONFIGURATOR",
          edgeBandPattern: "ALL_FOUR"
        }
      },
      {
        id: "part_2",
        orderId: "order_1",
        manufacturingJobId: "job_1",
        materialCode: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        widthIn: { toString: () => "20" },
        depthIn: { toString: () => "12" },
        instanceNumber: 2,
        orderItem: { sourceEdgeBandText: null },
        manufacturingJob: {
          labelCode: "SHELF-WM-20x12",
          source: "CONFIGURATOR",
          edgeBandPattern: "ALL_FOUR"
        }
      }
    ]);

    const result = await getForecastEdgeBandEstimate();

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].setupAllowanceFt).toBe(6);
    expect(result.totals.setupAllowanceFt).toBe(6);
  });

  it("returns batch rollup totals and contributing parts", async () => {
    selectorMocks.selectBatchEdgeBandParts.mockResolvedValue([
      {
        id: "part_1",
        orderId: "order_1",
        manufacturingJobId: "job_1",
        materialCode: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        widthIn: { toString: () => "30" },
        depthIn: { toString: () => "12" },
        instanceNumber: 1,
        orderItem: { sourceEdgeBandText: "TWO_LONG_EDGES" },
        manufacturingJob: {
          labelCode: "SHELF-WM-30x12",
          source: "CONFIGURATOR",
          edgeBandPattern: "ALL_FOUR"
        },
        batch: {
          id: "batch_1",
          code: "20260308-WHITE_MELAMINE-01",
          materialCode: "WHITE_MELAMINE"
        }
      }
    ]);

    const result = await getBatchEdgeBandEstimate("batch_1");

    expect(result.batch.code).toBe("20260308-WHITE_MELAMINE-01");
    expect(result.materials[0].parts[0].derivedPattern).toBe("TWO_LONG_EDGES");
    expect(result.materials[0].estimatedDemandFt).toBeGreaterThan(result.materials[0].rawLinearFt);
  });

  it("surfaces invalid or unmapped source data instead of guessing", async () => {
    selectorMocks.selectForecastEdgeBandParts.mockResolvedValue([
      {
        id: "part_1",
        orderId: "order_1",
        manufacturingJobId: "job_1",
        materialCode: null,
        edgeBandPattern: "ALL_FOUR",
        widthIn: { toString: () => "0" },
        depthIn: { toString: () => "12" },
        instanceNumber: 1,
        orderItem: { sourceEdgeBandText: null },
        manufacturingJob: {
          labelCode: "SHELF-UNK",
          source: "CONFIGURATOR",
          edgeBandPattern: "ALL_FOUR"
        }
      }
    ]);

    const result = await getForecastEdgeBandEstimate();

    expect(result.invalidParts).toHaveLength(1);
    expect(result.invalidParts[0].reason).toContain("Invalid source dimensions");
  });

  it("normalizes source edge band text deterministically", () => {
    expect(normalizeDerivedEdgeBandPattern({ sourceEdgeBandText: "All four sides" })).toBe("ALL_FOUR");
    expect(normalizeDerivedEdgeBandPattern({ sourceEdgeBandText: "Edgeband On Short Side" })).toBe("TWO_SHORT_EDGES");
    expect(normalizeDerivedEdgeBandPattern({ sourceEdgeBandText: "front only" })).toBe("ONE_LONG_EDGE");
  });
});

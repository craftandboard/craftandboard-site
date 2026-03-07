import type { SheetMapArtifact, SheetSummary } from "@craft-and-board/shared";
import { renderSheetMapHtml } from "./htmlRenderer.js";
import { renderSheetMapSvg } from "./svgRenderer.js";

export function buildSheetMapArtifact(input: {
  bundleCode: string;
  sheet: SheetSummary;
}): SheetMapArtifact {
  return {
    sheetId: input.sheet.id,
    bundleCode: input.bundleCode,
    sheetNumber: input.sheet.sheetNumber,
    svg: renderSheetMapSvg(input),
    html: renderSheetMapHtml(input),
    manifest: {
      bundleCode: input.bundleCode,
      materialCode: input.sheet.materialCode,
      sheetNumber: input.sheet.sheetNumber,
      utilizationPct: input.sheet.utilizationPct,
      placements: input.sheet.placements
    }
  };
}

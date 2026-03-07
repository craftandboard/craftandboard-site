import type { SheetMapArtifact, SheetSummary } from "@craft-and-board/shared";
import { ONION_SKIN_FILL, STANDARD_FILL, TRIM_STROKE } from "./legend.js";

const SCALE = 10;

function svgRect(value: number) {
  return Number((value * SCALE).toFixed(2));
}

export function renderSheetMapSvg(input: {
  bundleCode: string;
  sheet: SheetSummary;
}): SheetMapArtifact["svg"] {
  const sheetWidth = svgRect(input.sheet.widthIn);
  const sheetHeight = svgRect(input.sheet.heightIn);
  const usableX = svgRect(input.sheet.usableXIn);
  const usableY = svgRect(input.sheet.usableYIn);
  const usableWidth = svgRect(input.sheet.usableWidthIn);
  const usableHeight = svgRect(input.sheet.usableHeightIn);

  const placements = input.sheet.placements
    .map((placement) => {
      const fill = placement.onionSkin ? ONION_SKIN_FILL : STANDARD_FILL;
      const x = svgRect(placement.xIn);
      const y = svgRect(placement.yIn);
      const width = svgRect(placement.widthIn);
      const height = svgRect(placement.depthIn);
      const textX = x + 6;
      const textY = y + 16;

      return `
        <g>
          <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" fill-opacity="0.35" stroke="#0f172a" stroke-width="1.5" />
          <text x="${textX}" y="${textY}" font-size="12" font-family="Arial, sans-serif" fill="#0f172a">${placement.partCode}</text>
        </g>`;
    })
    .join("\n");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}">
    <rect x="0" y="0" width="${sheetWidth}" height="${sheetHeight}" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    <rect x="${usableX}" y="${usableY}" width="${usableWidth}" height="${usableHeight}" fill="none" stroke="${TRIM_STROKE}" stroke-dasharray="6 4" stroke-width="2" />
    <text x="12" y="18" font-size="14" font-family="Arial, sans-serif" fill="#0f172a">${input.bundleCode} Sheet ${input.sheet.sheetNumber}</text>
    ${placements}
  </svg>`.trim();
}

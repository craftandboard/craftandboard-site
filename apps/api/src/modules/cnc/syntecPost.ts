import type { SheetSummary } from "@craft-and-board/shared";
import { joinNcLines } from "./formatting.js";
import { formatComment } from "./helpers.js";
import { sortPlacementsForCutSequence } from "./sequence.js";
import { buildRectangleToolpathLines } from "./toolpath.js";

export function renderSyntecNcFile(input: {
  bundleCode: string;
  materialCode: SheetSummary["materialCode"];
  sheet: SheetSummary;
}) {
  const lines = [
    `(Craft & Board V1 shop test output)`,
    `(${formatComment(`Bundle ${input.bundleCode}`)})`,
    `(${formatComment(`Material ${input.materialCode}`)})`,
    `(${formatComment(`Sheet ${input.sheet.sheetNumber}`)})`,
    `(Tool 3/8 mortise compression bit)`,
    `(Spindle 18000 RPM | Feed 450 IPM | Plunge 80 IPM)`,
    `G90`,
    `G20`,
    `G17`,
    `G0 Z0.500`,
    `M3 S18000`
  ];

  for (const placement of sortPlacementsForCutSequence(input.sheet.placements)) {
    lines.push(...buildRectangleToolpathLines(placement));
  }

  lines.push(`M5`, `G0 Z0.500`, `M30`);
  return joinNcLines(lines);
}

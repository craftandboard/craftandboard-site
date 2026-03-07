import type { BuildNestingInput, NestingResult } from "./types.js";
import { packPartsIntoSheets } from "./packer.js";
import { assertNoPlacementOverlaps, assertPlacementsWithinUsableArea } from "./placements.js";

export function buildNestingResult(input: BuildNestingInput): NestingResult {
  const result = packPartsIntoSheets(input);

  for (const sheet of result.sheets) {
    assertPlacementsWithinUsableArea(sheet.placements);
    assertNoPlacementOverlaps(sheet.placements);
  }

  return result;
}

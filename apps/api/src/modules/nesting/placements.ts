import type { SheetPlacementView } from "@craft-and-board/shared";
import { overlaps } from "./geometry.js";
import { TRIM_MARGIN_IN, USABLE_HEIGHT_IN, USABLE_WIDTH_IN, USABLE_X_IN, USABLE_Y_IN } from "./constants.js";
import { NestingError } from "./errors.js";

export function assertPlacementsWithinUsableArea(placements: SheetPlacementView[]) {
  for (const placement of placements) {
    if (placement.xIn < USABLE_X_IN || placement.yIn < USABLE_Y_IN) {
      throw new NestingError(`Placement ${placement.partCode} violates the ${TRIM_MARGIN_IN}\" trim origin.`);
    }

    if (placement.xIn + placement.widthIn > USABLE_X_IN + USABLE_WIDTH_IN + 0.0001) {
      throw new NestingError(`Placement ${placement.partCode} exceeds usable sheet width.`);
    }

    if (placement.yIn + placement.depthIn > USABLE_Y_IN + USABLE_HEIGHT_IN + 0.0001) {
      throw new NestingError(`Placement ${placement.partCode} exceeds usable sheet height.`);
    }
  }
}

export function assertNoPlacementOverlaps(placements: SheetPlacementView[]) {
  for (let index = 0; index < placements.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < placements.length; compareIndex += 1) {
      if (overlaps(placements[index], placements[compareIndex])) {
        throw new NestingError(
          `Placements overlap: ${placements[index].partCode} and ${placements[compareIndex].partCode}`
        );
      }
    }
  }
}

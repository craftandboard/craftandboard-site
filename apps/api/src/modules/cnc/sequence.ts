import type { SheetPlacementView } from "@craft-and-board/shared";

export function sortPlacementsForCutSequence(placements: SheetPlacementView[]) {
  return [...placements].sort((left, right) => {
    if (left.sequenceNumber !== right.sequenceNumber) {
      return left.sequenceNumber - right.sequenceNumber;
    }

    if (left.yIn !== right.yIn) {
      return left.yIn - right.yIn;
    }

    return left.xIn - right.xIn;
  });
}

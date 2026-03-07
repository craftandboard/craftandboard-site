import type { NestingPartInput } from "@craft-and-board/shared";
import { USABLE_HEIGHT_IN, USABLE_WIDTH_IN } from "./constants.js";

export interface OrientedPart {
  widthIn: number;
  depthIn: number;
  rotationDeg: 0 | 90;
}

export function sortPartsForPacking(parts: NestingPartInput[]) {
  return [...parts].sort((left, right) => {
    const areaDiff = right.widthIn * right.depthIn - left.widthIn * left.depthIn;
    if (areaDiff !== 0) {
      return areaDiff;
    }

    const maxSideDiff = Math.max(right.widthIn, right.depthIn) - Math.max(left.widthIn, left.depthIn);
    if (maxSideDiff !== 0) {
      return maxSideDiff;
    }

    return left.partCode.localeCompare(right.partCode);
  });
}

export function orientationsForPart(part: NestingPartInput): OrientedPart[] {
  const orientations: OrientedPart[] = [{ widthIn: part.widthIn, depthIn: part.depthIn, rotationDeg: 0 }];

  if (part.widthIn !== part.depthIn) {
    orientations.push({ widthIn: part.depthIn, depthIn: part.widthIn, rotationDeg: 90 });
  }

  return orientations;
}

export function canFitWithinUsableSheet(orientation: OrientedPart) {
  return orientation.widthIn <= USABLE_WIDTH_IN && orientation.depthIn <= USABLE_HEIGHT_IN;
}

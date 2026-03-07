import type { SheetPlacementView } from "@craft-and-board/shared";
import { formatAxis, formatComment } from "./helpers.js";

const SAFE_Z = 0.5;
const CUT_DEPTH_FULL = -0.76;
const CUT_DEPTH_ONION = -0.72;

export function buildRectangleToolpathLines(placement: SheetPlacementView) {
  const x1 = placement.xIn;
  const y1 = placement.yIn;
  const x2 = placement.xIn + placement.widthIn;
  const y2 = placement.yIn + placement.depthIn;
  const depth = placement.onionSkin ? CUT_DEPTH_ONION : CUT_DEPTH_FULL;

  return [
    `(${formatComment(`${placement.partCode} ${placement.widthIn}" x ${placement.depthIn}" onion=${placement.onionSkin ? "yes" : "no"}`)})`,
    `G0 Z${formatAxis(SAFE_Z)}`,
    `G0 X${formatAxis(x1)} Y${formatAxis(y1)}`,
    `G1 Z${formatAxis(depth)} F80.000`,
    `G1 X${formatAxis(x2)} Y${formatAxis(y1)} F450.000`,
    `G1 X${formatAxis(x2)} Y${formatAxis(y2)} F450.000`,
    `G1 X${formatAxis(x1)} Y${formatAxis(y2)} F450.000`,
    `G1 X${formatAxis(x1)} Y${formatAxis(y1)} F450.000`,
    `G0 Z${formatAxis(SAFE_Z)}`
  ];
}

import type { EdgeBandPattern, MaterialCode } from "@craft-and-board/shared";

export function materialDisplayName(materialCode: MaterialCode, thicknessIn: number) {
  return `${materialCode.replaceAll("_", " ")} · ${thicknessIn.toFixed(2)} in`;
}

export function materialKeyFor(input: {
  materialCode: MaterialCode;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
}) {
  return `${input.materialCode}:${input.thicknessIn.toFixed(3)}:${input.edgeBandPattern}`;
}

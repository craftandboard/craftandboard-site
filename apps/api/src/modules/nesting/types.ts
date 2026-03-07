import type { MaterialCode, NestingPartInput, NestingResult, SheetPlacementView, SheetSummary } from "@craft-and-board/shared";

export type { NestingPartInput, NestingResult, SheetPlacementView, SheetSummary, MaterialCode };

export interface PackedPart extends SheetPlacementView {
  materialCode: MaterialCode;
  areaSqIn: number;
}

export interface WorkingSheet {
  sheetNumber: number;
  materialCode: MaterialCode;
  cursorXIn: number;
  cursorYIn: number;
  rowHeightIn: number;
  placements: PackedPart[];
}

export interface BuildNestingInput {
  bundleCode: string;
  materialCode: MaterialCode;
  parts: NestingPartInput[];
}

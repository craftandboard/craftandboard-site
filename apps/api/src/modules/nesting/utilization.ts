import { USABLE_AREA_SQ_IN } from "./constants.js";

export function calculateSheetUtilizationPct(partAreaSqIn: number) {
  return Number(((partAreaSqIn / USABLE_AREA_SQ_IN) * 100).toFixed(3));
}

export function calculateOverallUtilizationPct(totalPartAreaSqIn: number, sheetCount: number) {
  if (sheetCount === 0) {
    return 0;
  }

  return Number(((totalPartAreaSqIn / (USABLE_AREA_SQ_IN * sheetCount)) * 100).toFixed(3));
}

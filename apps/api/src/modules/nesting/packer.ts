import type { NestingPartInput, NestingResult, SheetSummary } from "@craft-and-board/shared";
import { USABLE_HEIGHT_IN, USABLE_WIDTH_IN, USABLE_X_IN, USABLE_Y_IN, SHEET_HEIGHT_IN, SHEET_WIDTH_IN } from "./constants.js";
import { NestingError } from "./errors.js";
import { orientationsForPart, sortPartsForPacking, type OrientedPart } from "./fit.js";
import { areaSqIn } from "./geometry.js";
import { requiresOnionSkin } from "./onionSkin.js";
import { calculateOverallUtilizationPct, calculateSheetUtilizationPct } from "./utilization.js";

interface WorkingRow {
  yIn: number;
  heightIn: number;
  cursorXIn: number;
}

interface WorkingSheet {
  sheetNumber: number;
  rows: WorkingRow[];
  placements: SheetSummary["placements"];
}

function chooseOrientationForNewRow(part: NestingPartInput, remainingHeightIn: number) {
  const fitting = orientationsForPart(part).filter(
    (orientation) => orientation.widthIn <= USABLE_WIDTH_IN && orientation.depthIn <= remainingHeightIn
  );

  if (fitting.length === 0) {
    return null;
  }

  return fitting.sort((left, right) => {
    if (left.depthIn !== right.depthIn) {
      return left.depthIn - right.depthIn;
    }

    if (left.widthIn !== right.widthIn) {
      return right.widthIn - left.widthIn;
    }

    return left.rotationDeg - right.rotationDeg;
  })[0];
}

function chooseOrientationForRow(
  part: NestingPartInput,
  row: WorkingRow
): OrientedPart | null {
  const fitting = orientationsForPart(part).filter(
    (orientation) => orientation.depthIn <= row.heightIn && row.cursorXIn + orientation.widthIn <= USABLE_X_IN + USABLE_WIDTH_IN
  );

  if (fitting.length === 0) {
    return null;
  }

  return fitting.sort((left, right) => {
    const leftWaste = row.heightIn - left.depthIn;
    const rightWaste = row.heightIn - right.depthIn;
    if (leftWaste !== rightWaste) {
      return leftWaste - rightWaste;
    }

    if (left.rotationDeg !== right.rotationDeg) {
      return left.rotationDeg - right.rotationDeg;
    }

    return left.widthIn - right.widthIn;
  })[0];
}

function placeOnSheet(
  sheet: WorkingSheet,
  part: NestingPartInput,
  sequenceNumber: number
) {
  for (const row of sheet.rows) {
    const orientation = chooseOrientationForRow(part, row);
    if (!orientation) {
      continue;
    }

    const placement = {
      partId: part.id,
      partCode: part.partCode,
      xIn: Number(row.cursorXIn.toFixed(3)),
      yIn: Number(row.yIn.toFixed(3)),
      widthIn: orientation.widthIn,
      depthIn: orientation.depthIn,
      rotationDeg: orientation.rotationDeg,
      sequenceNumber,
      onionSkin: requiresOnionSkin(orientation.widthIn, orientation.depthIn),
      customerLastName: part.customerLastName
    } as const;

    row.cursorXIn = Number((row.cursorXIn + orientation.widthIn).toFixed(3));
    sheet.placements.push(placement);
    return true;
  }

  const nextRowY = sheet.rows.length === 0
    ? USABLE_Y_IN
    : Number((sheet.rows.at(-1)!.yIn + sheet.rows.at(-1)!.heightIn).toFixed(3));
  const remainingHeightIn = Number((USABLE_Y_IN + USABLE_HEIGHT_IN - nextRowY).toFixed(3));
  const orientation = chooseOrientationForNewRow(part, remainingHeightIn);

  if (!orientation) {
    return false;
  }

  const row: WorkingRow = {
    yIn: nextRowY,
    heightIn: orientation.depthIn,
    cursorXIn: Number((USABLE_X_IN + orientation.widthIn).toFixed(3))
  };
  sheet.rows.push(row);
  sheet.placements.push({
    partId: part.id,
    partCode: part.partCode,
    xIn: USABLE_X_IN,
    yIn: nextRowY,
    widthIn: orientation.widthIn,
    depthIn: orientation.depthIn,
    rotationDeg: orientation.rotationDeg,
    sequenceNumber,
    onionSkin: requiresOnionSkin(orientation.widthIn, orientation.depthIn),
    customerLastName: part.customerLastName
  });

  return true;
}

export function packPartsIntoSheets(input: {
  bundleCode: string;
  materialCode: NestingPartInput["materialCode"];
  parts: NestingPartInput[];
}): NestingResult {
  const sortedParts = sortPartsForPacking(input.parts);
  const sheets: WorkingSheet[] = [];

  sortedParts.forEach((part, index) => {
    let placed = false;

    for (const sheet of sheets) {
      if (placeOnSheet(sheet, part, index + 1)) {
        placed = true;
        break;
      }
    }

    if (!placed) {
      const sheet: WorkingSheet = {
        sheetNumber: sheets.length + 1,
        rows: [],
        placements: []
      };

      if (!placeOnSheet(sheet, part, index + 1)) {
        throw new NestingError(
          `Part ${part.partCode} (${part.widthIn}\" x ${part.depthIn}\") does not fit inside the usable 47.5\" x 95.5\" sheet area.`
        );
      }

      sheets.push(sheet);
    }
  });

  const sheetSummaries: SheetSummary[] = sheets.map((sheet) => {
    const totalPartAreaSqIn = sheet.placements.reduce(
      (sum, placement) => sum + areaSqIn(placement.widthIn, placement.depthIn),
      0
    );

    return {
      productionBundleCode: input.bundleCode,
      materialCode: input.materialCode,
      sheetNumber: sheet.sheetNumber,
      widthIn: SHEET_WIDTH_IN,
      heightIn: SHEET_HEIGHT_IN,
      usableXIn: USABLE_X_IN,
      usableYIn: USABLE_Y_IN,
      usableWidthIn: USABLE_WIDTH_IN,
      usableHeightIn: USABLE_HEIGHT_IN,
      utilizationPct: calculateSheetUtilizationPct(totalPartAreaSqIn),
      totalParts: sheet.placements.length,
      placements: sheet.placements
    };
  });

  const totalPartAreaSqIn = sortedParts.reduce((sum, part) => sum + areaSqIn(part.widthIn, part.depthIn), 0);
  const onionSkinPartCount = sheetSummaries.reduce(
    (sum, sheet) => sum + sheet.placements.filter((placement) => placement.onionSkin).length,
    0
  );

  return {
    bundleCode: input.bundleCode,
    materialCode: input.materialCode,
    sheetCount: sheetSummaries.length,
    totalParts: sortedParts.length,
    totalPartAreaSqIn: Number(totalPartAreaSqIn.toFixed(3)),
    onionSkinPartCount,
    utilizationPct: calculateOverallUtilizationPct(totalPartAreaSqIn, sheetSummaries.length),
    sheets: sheetSummaries,
    warnings: []
  };
}

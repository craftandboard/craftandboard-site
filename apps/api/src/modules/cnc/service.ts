import type { CncJobSummary, SheetSummary } from "@craft-and-board/shared";
import { renderSyntecNcFile } from "./syntecPost.js";
import type { GeneratedCncFile } from "./types.js";

export function generateCncFilesForSheets(input: {
  bundleCode: string;
  materialCode: SheetSummary["materialCode"];
  sheets: SheetSummary[];
}): GeneratedCncFile[] {
  return input.sheets.map((sheet) => {
    const code = `${input.bundleCode}-S${String(sheet.sheetNumber).padStart(2, "0")}`;
    const fileName = `${input.bundleCode}-${input.materialCode}-sheet-${String(sheet.sheetNumber).padStart(2, "0")}.NC`;
    const ncText = renderSyntecNcFile({
      bundleCode: input.bundleCode,
      materialCode: input.materialCode,
      sheet
    });

    const job: CncJobSummary = {
      code,
      bundleCode: input.bundleCode,
      materialCode: input.materialCode,
      sheetId: sheet.id,
      sheetNumber: sheet.sheetNumber,
      controllerType: "SYNTEC_V1",
      fileExtension: ".NC",
      status: "generated",
      toolDiameterIn: 0.375,
      spindleRpm: 18000,
      feedRateIpm: 450,
      plungeRateIpm: 80,
      lineCount: ncText.trim().split("\n").length,
      fileName
    };

    return { job, ncText };
  });
}

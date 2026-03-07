import type { SheetSummary } from "@craft-and-board/shared";
import { generateCncFilesForSheets } from "../cnc/service.js";

export function buildCncJob(input: {
  bundleCode: string;
  materialCode: SheetSummary["materialCode"];
  sheets: SheetSummary[];
}) {
  return generateCncFilesForSheets(input);
}

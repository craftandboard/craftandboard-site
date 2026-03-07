import type { CncJobSummary, MaterialCode, SheetSummary } from "@craft-and-board/shared";

export type { CncJobSummary, MaterialCode, SheetSummary };

export interface GeneratedCncFile {
  job: CncJobSummary;
  ncText: string;
}

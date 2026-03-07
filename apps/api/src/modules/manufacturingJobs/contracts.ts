import type { CncJobSummary, ManufacturingBundleSummary, NestingResult, SheetMapArtifact, SheetSummary } from "@craft-and-board/shared";

export type { CncJobSummary, ManufacturingBundleSummary, NestingResult, SheetMapArtifact, SheetSummary };

export interface ManufacturingArtifactsResult {
  bundleCode: string;
  artifacts: Array<{
    id?: string;
    type: string;
    artifactType: string;
    version: number;
    isCurrent: boolean;
    uri: string;
    mimeType?: string;
    supersededAt?: string;
    sheetId?: string;
    cncJobId?: string;
  }>;
}

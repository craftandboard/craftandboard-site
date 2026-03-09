import type { EdgeBandPattern, MaterialCode } from "@craft-and-board/shared";
import { getForecastRemnantCandidates } from "../remnants/matching.js";

export async function getRemnantCandidatesForMaterial(input: {
  organizationId: string;
  materialCode: MaterialCode;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
  demandAreaSqIn: number;
}) {
  return getForecastRemnantCandidates(input);
}

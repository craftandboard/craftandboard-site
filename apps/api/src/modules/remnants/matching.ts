import type { EdgeBandPattern, MaterialCode, MaterialForecastRemnantCandidatePreview } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { estimatedSheetCountForArea } from "../materialForecast/summary.js";
import { materialKeyFor } from "../materialForecast/materialKey.js";

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

export async function getForecastRemnantCandidates(input: {
  organizationId?: string;
  materialCode: MaterialCode;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
  demandAreaSqIn: number;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const materialKey = materialKeyFor({
    materialCode: input.materialCode,
    thicknessIn: input.thicknessIn,
    edgeBandPattern: input.edgeBandPattern
  });

  const remnants = await prisma.remnant.findMany({
    where: {
      organizationId,
      materialKey,
      status: "AVAILABLE",
      allocations: {
        none: {
          status: "ACTIVE"
        }
      }
    },
    include: {
      currentLocation: true
    },
    orderBy: [{ usableAreaSqIn: "asc" }, { createdAt: "asc" }]
  });

  const totalCandidateAreaSqIn = Number(
    remnants.reduce((sum, remnant) => sum + toNumber(remnant.usableAreaSqIn ?? remnant.areaSqIn), 0).toFixed(3)
  );
  const recommendedCoverageAreaSqIn = Number(Math.min(input.demandAreaSqIn, totalCandidateAreaSqIn).toFixed(3));
  const baselineSheets = estimatedSheetCountForArea(input.demandAreaSqIn);
  const reducedSheets = estimatedSheetCountForArea(Math.max(0, input.demandAreaSqIn - recommendedCoverageAreaSqIn));

  return {
    candidateRemnantsCount: remnants.length,
    candidateRemnantsAreaSqIn: totalCandidateAreaSqIn,
    recommendedCoverageAreaSqIn,
    estimatedNewSheetReduction: Math.max(0, baselineSheets - reducedSheets),
    candidateRemnantsPreview: remnants.slice(0, 3).map(
      (remnant): MaterialForecastRemnantCandidatePreview => ({
        id: remnant.id,
        code: remnant.remnantCode ?? remnant.code,
        label: `${remnant.remnantCode ?? remnant.code} · ${toNumber(remnant.lengthIn).toFixed(2)}" × ${toNumber(remnant.widthIn).toFixed(2)}"`,
        locationLabel: remnant.locationLabel ?? remnant.currentLocation?.name ?? undefined,
        status: remnant.status,
        lengthIn: toNumber(remnant.lengthIn),
        widthIn: toNumber(remnant.widthIn),
        availableAreaSqIn: toNumber(remnant.usableAreaSqIn ?? remnant.areaSqIn)
      })
    )
  };
}

import { prisma } from "../../lib/prisma.js";
import { ensureDefaultProfiles, getMaterialProfile } from "../settings/service.js";
import { calculateShelfManufacturingCost } from "./calculator.js";
import {
  createCostProfile as createCostProfileRecord,
  createCostScenario,
  getCostProfileById,
  listActiveCostRates,
  listCostProfiles,
  updateCostProfile as updateCostProfileRecord,
  upsertCostRates as upsertCostRatesRecord
} from "./repository.js";
import type { CostRateKey, CostingEdgeBandPattern, CostScenarioSourceType } from "./contracts.js";

function mapProfile(profile: Awaited<ReturnType<typeof prisma.costProfile.findFirstOrThrow>>) {
  return {
    id: profile.id,
    name: profile.name,
    isDefault: profile.isDefault,
    currency: profile.currency,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function mapRate(rate: Awaited<ReturnType<typeof prisma.costRate.findFirstOrThrow>>) {
  return {
    id: rate.id,
    key: rate.key,
    valueDecimal: Number(rate.valueDecimal),
    unit: rate.unit,
    notes: rate.notes ?? undefined,
    effectiveFrom: rate.effectiveFrom.toISOString(),
    effectiveTo: rate.effectiveTo?.toISOString()
  };
}

export function latestRatesByKey(
  rates: Array<Awaited<ReturnType<typeof prisma.costRate.findFirstOrThrow>>>
) {
  const map = new Map<string, { value: number; unit: string; effectiveFrom: string }>();
  for (const rate of rates) {
    if (!map.has(rate.key)) {
      map.set(rate.key, {
        value: Number(rate.valueDecimal),
        unit: rate.unit,
        effectiveFrom: rate.effectiveFrom.toISOString()
      });
    }
  }
  return map;
}

export async function ensureCostProfileOwnership(costProfileId: string, organizationId: string) {
  const profile = await getCostProfileById(costProfileId, organizationId);
  if (!profile) {
    throw new Error("Cost profile not found.");
  }
  return profile;
}

export async function getCostProfiles(organizationId: string) {
  await ensureDefaultProfiles();
  const profiles = await listCostProfiles(organizationId);
  return {
    ok: true as const,
    profiles: profiles.map(mapProfile)
  };
}

export async function createCostProfile(
  input: {
    name: string;
    isDefault?: boolean;
    currency: "USD";
    notes?: string;
  },
  organizationId: string
) {
  const profile = await createCostProfileRecord({
    organizationId,
    ...input
  });
  return {
    ok: true as const,
    profile: mapProfile(profile)
  };
}

export async function updateCostProfile(
  costProfileId: string,
  input: {
    name?: string;
    isDefault?: boolean;
    currency?: "USD";
    notes?: string;
  },
  organizationId: string
) {
  const profile = await updateCostProfileRecord(costProfileId, {
    organizationId,
    ...input
  });
  return {
    ok: true as const,
    profile: mapProfile(profile)
  };
}

export async function getCostProfileRates(costProfileId: string, organizationId: string) {
  await ensureDefaultProfiles();
  await ensureCostProfileOwnership(costProfileId, organizationId);
  const rates = await listActiveCostRates(costProfileId, organizationId, new Date());
  return {
    ok: true as const,
    rates: rates.map(mapRate)
  };
}

export async function upsertCostRates(
  costProfileId: string,
  input: {
    rates: Array<{
      key: CostRateKey;
      valueDecimal: number;
      unit: string;
      notes?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }>;
  },
  organizationId: string
) {
  const rates = await upsertCostRatesRecord(costProfileId, {
    organizationId,
    rates: input.rates
  });
  return {
    ok: true as const,
    rates: rates.map(mapRate)
  };
}

export async function calculateCost(
  input: {
    costProfileId: string;
    lengthIn: number;
    depthIn: number;
    thicknessIn?: number;
    quantity: number;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern: CostingEdgeBandPattern;
    requiresPackaging: boolean;
    shippingClass?: string;
  },
  organizationId: string
) {
  const profile = await ensureCostProfileOwnership(input.costProfileId, organizationId);
  const rates = await listActiveCostRates(input.costProfileId, organizationId, new Date());
  const materialProfile = await getMaterialProfile(input.materialType, organizationId).catch(() => null);

  return {
    ok: true as const,
    result: calculateShelfManufacturingCost({
      profile: {
        id: profile.id,
        name: profile.name,
        currency: profile.currency,
        isDefault: profile.isDefault
      },
      materialProfile: materialProfile
        ? {
            sheetWidthIn: Number(materialProfile.sheetWidthIn),
            sheetDepthIn: Number(materialProfile.sheetDepthIn)
          }
        : undefined,
      rates: latestRatesByKey(rates),
      ...input
    })
  };
}

export async function resolveCostCalculationContext(
  input: {
    costProfileId: string;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  },
  organizationId: string
) {
  const profile = await ensureCostProfileOwnership(input.costProfileId, organizationId);
  const rates = await listActiveCostRates(input.costProfileId, organizationId, new Date());
  const materialProfile = await getMaterialProfile(input.materialType, organizationId).catch(() => null);

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      currency: profile.currency,
      isDefault: profile.isDefault
    },
    materialProfile: materialProfile
      ? {
          sheetWidthIn: Number(materialProfile.sheetWidthIn),
          sheetDepthIn: Number(materialProfile.sheetDepthIn)
        }
      : undefined,
    rates: latestRatesByKey(rates)
  };
}

export async function createCostScenarioSnapshot(
  input: {
    name?: string;
    sourceType: CostScenarioSourceType;
    sourceId?: string;
    input: {
      costProfileId: string;
      lengthIn: number;
      depthIn: number;
      thicknessIn?: number;
      quantity: number;
      materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
      edgeBandPattern: CostingEdgeBandPattern;
      requiresPackaging: boolean;
      shippingClass?: string;
    };
    createdByUserId?: string;
  },
  organizationId: string
) {
  const result = await calculateCost(input.input, organizationId);
  const scenario = await createCostScenario({
    organizationId,
    costProfileId: input.input.costProfileId,
    name: input.name,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    inputJson: input.input,
    resultJson: result.result,
    createdByUserId: input.createdByUserId
  });

  return {
    ok: true as const,
    scenario: {
      id: scenario.id,
      name: scenario.name ?? undefined,
      sourceType: scenario.sourceType,
      sourceId: scenario.sourceId ?? undefined,
      createdAt: scenario.createdAt.toISOString()
    },
    result: result.result
  };
}

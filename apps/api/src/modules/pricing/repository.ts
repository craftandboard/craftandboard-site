import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

export async function listShelfProducts(organizationId: string) {
  return prisma.shelfProduct.findMany({
    where: { organizationId },
    include: { packagingProfile: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
  });
}

export async function getShelfProductById(id: string, organizationId: string) {
  return prisma.shelfProduct.findFirst({
    where: { id, organizationId },
    include: { packagingProfile: true }
  });
}

export async function createShelfProduct(input: {
  organizationId: string;
  name: string;
  code: string;
  materialType: string;
  defaultThicknessIn: number;
  defaultEdgeBandPattern: "ALL_FOUR";
  packagingProfileId?: string;
  isActive?: boolean;
  notes?: string;
}) {
  return prisma.shelfProduct.create({
    data: {
      organizationId: input.organizationId,
      name: input.name.trim(),
      code: input.code.trim(),
      materialType: input.materialType as any,
      defaultThicknessIn: decimal(input.defaultThicknessIn),
      defaultEdgeBandPattern: input.defaultEdgeBandPattern as any,
      packagingProfileId: input.packagingProfileId ?? null,
      isActive: input.isActive ?? true,
      notes: input.notes?.trim() || null
    },
    include: { packagingProfile: true }
  });
}

export async function updateShelfProduct(id: string, input: {
  organizationId: string;
  name?: string;
  code?: string;
  materialType?: string;
  defaultThicknessIn?: number;
  defaultEdgeBandPattern?: "ALL_FOUR";
  packagingProfileId?: string | null;
  isActive?: boolean;
  notes?: string;
}) {
  return prisma.shelfProduct.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code.trim() } : {}),
      ...(input.materialType !== undefined ? { materialType: input.materialType as any } : {}),
      ...(input.defaultThicknessIn !== undefined ? { defaultThicknessIn: decimal(input.defaultThicknessIn) } : {}),
      ...(input.defaultEdgeBandPattern !== undefined ? { defaultEdgeBandPattern: input.defaultEdgeBandPattern as any } : {}),
      ...(input.packagingProfileId !== undefined ? { packagingProfileId: input.packagingProfileId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
    },
    include: { packagingProfile: true }
  });
}

async function updateDefaultFlag(
  tx: Prisma.TransactionClient,
  model: "productionAssumptionProfile" | "pricingPolicy",
  organizationId: string,
  idToKeep?: string
) {
  await (tx[model] as any).updateMany({
    where: {
      organizationId,
      isDefault: true,
      ...(idToKeep ? { id: { not: idToKeep } } : {})
    },
    data: { isDefault: false }
  });
}

export async function listProductionAssumptionProfiles(organizationId: string) {
  return prisma.productionAssumptionProfile.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getProductionAssumptionProfileById(id: string, organizationId: string) {
  return prisma.productionAssumptionProfile.findFirst({ where: { id, organizationId } });
}

export async function createProductionAssumptionProfile(input: {
  organizationId: string;
  name: string;
  isDefault?: boolean;
  cncLoadMinutesPerRun: number;
  cncUnloadMinutesPerRun: number;
  cncRunMinutesPerUnit: number;
  edgebanderSetupMinutesPerRun: number;
  edgebanderRunMinutesPerLinearFt: number;
  handlingMinutesPerUnit: number;
  packagingMinutesPerUnit: number;
  qcMinutesPerUnit?: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await updateDefaultFlag(tx, "productionAssumptionProfile", input.organizationId);
    }
    return tx.productionAssumptionProfile.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        isDefault: input.isDefault ?? false,
        cncLoadMinutesPerRun: decimal(input.cncLoadMinutesPerRun),
        cncUnloadMinutesPerRun: decimal(input.cncUnloadMinutesPerRun),
        cncRunMinutesPerUnit: decimal(input.cncRunMinutesPerUnit),
        edgebanderSetupMinutesPerRun: decimal(input.edgebanderSetupMinutesPerRun),
        edgebanderRunMinutesPerLinearFt: decimal(input.edgebanderRunMinutesPerLinearFt),
        handlingMinutesPerUnit: decimal(input.handlingMinutesPerUnit),
        packagingMinutesPerUnit: decimal(input.packagingMinutesPerUnit),
        qcMinutesPerUnit: input.qcMinutesPerUnit !== undefined ? decimal(input.qcMinutesPerUnit) : null,
        notes: input.notes?.trim() || null
      }
    });
  });
}

export async function updateProductionAssumptionProfile(id: string, input: {
  organizationId: string;
  name?: string;
  isDefault?: boolean;
  cncLoadMinutesPerRun?: number;
  cncUnloadMinutesPerRun?: number;
  cncRunMinutesPerUnit?: number;
  edgebanderSetupMinutesPerRun?: number;
  edgebanderRunMinutesPerLinearFt?: number;
  handlingMinutesPerUnit?: number;
  packagingMinutesPerUnit?: number;
  qcMinutesPerUnit?: number | null;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await updateDefaultFlag(tx, "productionAssumptionProfile", input.organizationId, id);
    }
    return tx.productionAssumptionProfile.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.cncLoadMinutesPerRun !== undefined ? { cncLoadMinutesPerRun: decimal(input.cncLoadMinutesPerRun) } : {}),
        ...(input.cncUnloadMinutesPerRun !== undefined ? { cncUnloadMinutesPerRun: decimal(input.cncUnloadMinutesPerRun) } : {}),
        ...(input.cncRunMinutesPerUnit !== undefined ? { cncRunMinutesPerUnit: decimal(input.cncRunMinutesPerUnit) } : {}),
        ...(input.edgebanderSetupMinutesPerRun !== undefined ? { edgebanderSetupMinutesPerRun: decimal(input.edgebanderSetupMinutesPerRun) } : {}),
        ...(input.edgebanderRunMinutesPerLinearFt !== undefined ? { edgebanderRunMinutesPerLinearFt: decimal(input.edgebanderRunMinutesPerLinearFt) } : {}),
        ...(input.handlingMinutesPerUnit !== undefined ? { handlingMinutesPerUnit: decimal(input.handlingMinutesPerUnit) } : {}),
        ...(input.packagingMinutesPerUnit !== undefined ? { packagingMinutesPerUnit: decimal(input.packagingMinutesPerUnit) } : {}),
        ...(input.qcMinutesPerUnit !== undefined ? { qcMinutesPerUnit: input.qcMinutesPerUnit === null ? null : decimal(input.qcMinutesPerUnit) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
      }
    });
  });
}

export async function listPackagingProfiles(organizationId: string) {
  return prisma.packagingProfile.findMany({
    where: { organizationId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
  });
}

export async function getPackagingProfileById(id: string, organizationId: string) {
  return prisma.packagingProfile.findFirst({ where: { id, organizationId } });
}

export async function createPackagingProfile(input: {
  organizationId: string;
  name: string;
  boxCostCentsPerUnit: number;
  bubbleWrapCostCentsPerUnit: number;
  shrinkWrapCostCentsPerUnit: number;
  tapeCostCentsPerUnit: number;
  labelCostCentsPerUnit: number;
  insertFlyerCostCentsPerUnit: number;
  otherPackagingCostCentsPerUnit: number;
  notes?: string;
  isActive?: boolean;
}) {
  return prisma.packagingProfile.create({
    data: {
      organizationId: input.organizationId,
      name: input.name.trim(),
      boxCostCentsPerUnit: input.boxCostCentsPerUnit,
      bubbleWrapCostCentsPerUnit: input.bubbleWrapCostCentsPerUnit,
      shrinkWrapCostCentsPerUnit: input.shrinkWrapCostCentsPerUnit,
      tapeCostCentsPerUnit: input.tapeCostCentsPerUnit,
      labelCostCentsPerUnit: input.labelCostCentsPerUnit,
      insertFlyerCostCentsPerUnit: input.insertFlyerCostCentsPerUnit,
      otherPackagingCostCentsPerUnit: input.otherPackagingCostCentsPerUnit,
      notes: input.notes?.trim() || null,
      isActive: input.isActive ?? true
    }
  });
}

export async function updatePackagingProfile(id: string, input: {
  name?: string;
  boxCostCentsPerUnit?: number;
  bubbleWrapCostCentsPerUnit?: number;
  shrinkWrapCostCentsPerUnit?: number;
  tapeCostCentsPerUnit?: number;
  labelCostCentsPerUnit?: number;
  insertFlyerCostCentsPerUnit?: number;
  otherPackagingCostCentsPerUnit?: number;
  notes?: string;
  isActive?: boolean;
}) {
  return prisma.packagingProfile.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.boxCostCentsPerUnit !== undefined ? { boxCostCentsPerUnit: input.boxCostCentsPerUnit } : {}),
      ...(input.bubbleWrapCostCentsPerUnit !== undefined ? { bubbleWrapCostCentsPerUnit: input.bubbleWrapCostCentsPerUnit } : {}),
      ...(input.shrinkWrapCostCentsPerUnit !== undefined ? { shrinkWrapCostCentsPerUnit: input.shrinkWrapCostCentsPerUnit } : {}),
      ...(input.tapeCostCentsPerUnit !== undefined ? { tapeCostCentsPerUnit: input.tapeCostCentsPerUnit } : {}),
      ...(input.labelCostCentsPerUnit !== undefined ? { labelCostCentsPerUnit: input.labelCostCentsPerUnit } : {}),
      ...(input.insertFlyerCostCentsPerUnit !== undefined ? { insertFlyerCostCentsPerUnit: input.insertFlyerCostCentsPerUnit } : {}),
      ...(input.otherPackagingCostCentsPerUnit !== undefined ? { otherPackagingCostCentsPerUnit: input.otherPackagingCostCentsPerUnit } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    }
  });
}

export async function listPricingPolicies(organizationId: string) {
  return prisma.pricingPolicy.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getPricingPolicyById(id: string, organizationId: string) {
  return prisma.pricingPolicy.findFirst({ where: { id, organizationId } });
}

export async function createPricingPolicy(input: {
  organizationId: string;
  name: string;
  isDefault?: boolean;
  manufacturingMarkupPercent: number;
  minimumChargeCentsPerUnit?: number;
  minimumRunChargeCents?: number;
  roundingMode?: "NONE" | "NEAREST" | "UP";
  roundToCents?: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await updateDefaultFlag(tx, "pricingPolicy", input.organizationId);
    }
    return tx.pricingPolicy.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        isDefault: input.isDefault ?? false,
        manufacturingMarkupPercent: decimal(input.manufacturingMarkupPercent),
        minimumChargeCentsPerUnit: input.minimumChargeCentsPerUnit ?? null,
        minimumRunChargeCents: input.minimumRunChargeCents ?? null,
        roundingMode: (input.roundingMode ?? "NONE") as any,
        roundToCents: input.roundToCents ?? null,
        notes: input.notes?.trim() || null
      }
    });
  });
}

export async function updatePricingPolicy(id: string, input: {
  organizationId: string;
  name?: string;
  isDefault?: boolean;
  manufacturingMarkupPercent?: number;
  minimumChargeCentsPerUnit?: number | null;
  minimumRunChargeCents?: number | null;
  roundingMode?: "NONE" | "NEAREST" | "UP";
  roundToCents?: number | null;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await updateDefaultFlag(tx, "pricingPolicy", input.organizationId, id);
    }
    return tx.pricingPolicy.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.manufacturingMarkupPercent !== undefined ? { manufacturingMarkupPercent: decimal(input.manufacturingMarkupPercent) } : {}),
        ...(input.minimumChargeCentsPerUnit !== undefined ? { minimumChargeCentsPerUnit: input.minimumChargeCentsPerUnit } : {}),
        ...(input.minimumRunChargeCents !== undefined ? { minimumRunChargeCents: input.minimumRunChargeCents } : {}),
        ...(input.roundingMode !== undefined ? { roundingMode: input.roundingMode as any } : {}),
        ...(input.roundToCents !== undefined ? { roundToCents: input.roundToCents } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
      }
    });
  });
}

export async function createPricingScenario(input: {
  organizationId: string;
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  inputJson: unknown;
  resultJson: unknown;
  createdByUserId?: string;
}) {
  return prisma.pricingScenario.create({
    data: {
      organizationId: input.organizationId,
      shelfProductId: input.shelfProductId ?? null,
      costProfileId: input.costProfileId,
      productionAssumptionProfileId: input.productionAssumptionProfileId,
      packagingProfileId: input.packagingProfileId ?? null,
      pricingPolicyId: input.pricingPolicyId,
      inputJson: input.inputJson as Prisma.InputJsonValue,
      resultJson: input.resultJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

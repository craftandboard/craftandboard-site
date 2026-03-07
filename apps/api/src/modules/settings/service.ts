import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { MaterialCode } from '@craft-and-board/shared';

const LOCAL_ORG_ID = 'org_local_craft_board';
const db = prisma as any;

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

export async function ensureDefaultProfiles() {
  await db.organization.upsert({
    where: { id: LOCAL_ORG_ID },
    update: { name: 'Craft & Board Local' },
    create: { id: LOCAL_ORG_ID, name: 'Craft & Board Local' }
  });

  await db.machineProfile.upsert({
    where: { code: 'LAGUNA_SYNTEC_V1' },
    update: {
      name: 'Laguna Syntec V1',
      controllerType: 'SYNTEC_V1',
      fileExtension: '.NC',
      units: 'INCH',
      toolDiameterIn: decimal(0.375),
      spindleRpm: 18000,
      feedRateIpm: 450,
      plungeRateIpm: 80,
      cutDepthIn: decimal(0.76),
      onionSkinDepthIn: decimal(0.72),
      safeZIn: decimal(0.5),
      defaultCutStrategy: 'RECTANGLE_PROFILE',
      active: true,
      organizationId: LOCAL_ORG_ID
    },
    create: {
      code: 'LAGUNA_SYNTEC_V1',
      name: 'Laguna Syntec V1',
      controllerType: 'SYNTEC_V1',
      fileExtension: '.NC',
      units: 'INCH',
      toolDiameterIn: decimal(0.375),
      spindleRpm: 18000,
      feedRateIpm: 450,
      plungeRateIpm: 80,
      cutDepthIn: decimal(0.76),
      onionSkinDepthIn: decimal(0.72),
      safeZIn: decimal(0.5),
      defaultCutStrategy: 'RECTANGLE_PROFILE',
      active: true,
      organizationId: LOCAL_ORG_ID
    }
  });

  const materials: Array<{ code: MaterialCode; name: string }> = [
    { code: 'WHITE_MELAMINE', name: 'White Melamine' },
    { code: 'MAPLE_MELAMINE', name: 'Maple Melamine' }
  ];

  for (const material of materials) {
    await db.materialProfile.upsert({
      where: {
        organizationId_code: {
          organizationId: LOCAL_ORG_ID,
          code: material.code
        }
      },
      update: {
        name: material.name,
        thicknessIn: decimal(0.75),
        sheetWidthIn: decimal(48),
        sheetDepthIn: decimal(96),
        trimMarginIn: decimal(0.25),
        defaultEdgeBandPattern: 'ALL_FOUR',
        active: true
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        code: material.code,
        name: material.name,
        thicknessIn: decimal(0.75),
        sheetWidthIn: decimal(48),
        sheetDepthIn: decimal(96),
        trimMarginIn: decimal(0.25),
        defaultEdgeBandPattern: 'ALL_FOUR',
        active: true
      }
    });
  }
}

export async function getDefaultMachineProfile() {
  await ensureDefaultProfiles();
  return db.machineProfile.findUniqueOrThrow({ where: { code: 'LAGUNA_SYNTEC_V1' } });
}

export async function getMaterialProfile(materialCode: MaterialCode) {
  await ensureDefaultProfiles();
  return db.materialProfile.findFirstOrThrow({
    where: { organizationId: LOCAL_ORG_ID, code: materialCode, active: true }
  });
}

export { LOCAL_ORG_ID };

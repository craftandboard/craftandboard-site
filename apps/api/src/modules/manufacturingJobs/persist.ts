import { Prisma } from '@prisma/client';
import type { CncJobSummary, NestingResult, SheetMapArtifact, SheetSummary } from '@craft-and-board/shared';
import { prisma } from '../../lib/prisma.js';
const db = prisma as any;

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

async function getBundleOrThrow(bundleCode: string) {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }
  return bundle;
}

export async function replaceBundleNesting(input: {
  bundleCode: string;
  result: NestingResult;
  reason?: string | null;
  force?: boolean;
}) {
  const bundle = await getBundleOrThrow(input.bundleCode);

  if (!input.force && ['IN_PRODUCTION', 'CUT_COMPLETE', 'PACKED', 'SHIPPED'].includes(bundle.status)) {
    throw new Error('Cannot regenerate nesting after production start without explicit override reason.');
  }

  const nextVersion = (bundle.currentNestVersion ?? 0) + 1;

  const currentSheets = await db.sheet.findMany({
    where: { productionBundleId: bundle.id, isCurrent: true },
    select: { id: true }
  });
  const currentSheetIds = currentSheets.map((sheet: { id: string }) => sheet.id);

  await db.sheet.updateMany({
    where: { productionBundleId: bundle.id, isCurrent: true },
    data: { isCurrent: false }
  });
  await db.artifact.updateMany({
    where: {
      productionBundleId: bundle.id,
      isCurrent: true,
      artifactType: { in: ['SHEET_MAP_SVG', 'SHEET_MAP_HTML'] }
    },
    data: { isCurrent: false, supersededAt: new Date() }
  });
  await db.cncJob.updateMany({
    where: { productionBundleId: bundle.id, isCurrent: true },
    data: { isCurrent: false, status: 'SUPERSEDED', supersededAt: new Date() }
  });
  await db.artifact.updateMany({
    where: {
      productionBundleId: bundle.id,
      isCurrent: true,
      artifactType: 'CNC_FILE'
    },
    data: { isCurrent: false, supersededAt: new Date() }
  });

  const createdSheets: SheetSummary[] = [];

  for (const sheet of input.result.sheets) {
    const createdSheet = await db.sheet.create({
      data: {
        organizationId: bundle.organizationId,
        productionBundleId: bundle.id,
        productionBundleCode: bundle.code,
        materialCode: sheet.materialCode,
        sheetNumber: sheet.sheetNumber,
        version: nextVersion,
        widthMm: Math.round(sheet.widthIn * 25.4),
        heightMm: Math.round(sheet.heightIn * 25.4),
        widthIn: decimal(sheet.widthIn),
        heightIn: decimal(sheet.heightIn),
        usableXIn: decimal(sheet.usableXIn),
        usableYIn: decimal(sheet.usableYIn),
        usableWidthIn: decimal(sheet.usableWidthIn),
        usableHeightIn: decimal(sheet.usableHeightIn),
        utilizationPct: decimal(sheet.utilizationPct),
        status: 'PLANNED',
        isCurrent: true
      }
    });

    const createdPlacements = [] as SheetSummary['placements'];

    for (const placement of sheet.placements) {
      const createdPlacement = await db.sheetPlacement.create({
        data: {
          organizationId: bundle.organizationId,
          sheetId: createdSheet.id,
          partId: placement.partId,
          xMm: Math.round(placement.xIn * 25.4),
          yMm: Math.round(placement.yIn * 25.4),
          xIn: decimal(placement.xIn),
          yIn: decimal(placement.yIn),
          widthIn: decimal(placement.widthIn),
          depthIn: decimal(placement.depthIn),
          rotation: placement.rotationDeg,
          rotationDeg: placement.rotationDeg,
          sequenceNumber: placement.sequenceNumber,
          onionSkin: placement.onionSkin
        }
      });

      createdPlacements.push({ ...placement, id: createdPlacement.id, sheetId: createdSheet.id });
    }

    createdSheets.push({
      ...(sheet as any),
      id: createdSheet.id,
      version: nextVersion,
      isCurrent: true,
      status: 'planned',
      placements: createdPlacements
    } as any);
  }

  await db.productionBundle.update({
    where: { id: bundle.id },
    data: {
      currentNestVersion: nextVersion,
      status: 'NESTED',
      notes: input.reason ?? bundle.notes
    }
  });

  return { ...input.result, sheets: createdSheets };
}

export async function replaceBundleCncJobs(input: {
  bundleCode: string;
  jobs: Array<{ job: CncJobSummary; ncText: string }>;
  reason?: string | null;
  force?: boolean;
}) {
  const bundle = await getBundleOrThrow(input.bundleCode);

  if (!bundle.currentNestVersion) {
    throw new Error('Cannot generate CNC without a current nest version.');
  }

  if (!input.force && ['IN_PRODUCTION', 'CUT_COMPLETE', 'PACKED', 'SHIPPED'].includes(bundle.status)) {
    throw new Error('Cannot regenerate CNC after production start without explicit override reason.');
  }

  const nextVersion = (bundle.currentCncVersion ?? 0) + 1;

  await db.cncJob.updateMany({
    where: { productionBundleId: bundle.id, isCurrent: true },
    data: { isCurrent: false, status: 'SUPERSEDED', supersededAt: new Date() }
  });
  await db.artifact.updateMany({
    where: { productionBundleId: bundle.id, artifactType: 'CNC_FILE', isCurrent: true },
    data: { isCurrent: false, supersededAt: new Date() }
  });

  const createdJobs: CncJobSummary[] = [];

  for (const generated of input.jobs) {
    const createdJob = await db.cncJob.create({
      data: {
        organizationId: bundle.organizationId,
        productionBundleId: bundle.id,
        productionBundleCode: input.bundleCode,
        sheetId: generated.job.sheetId,
        code: generated.job.code,
        materialCode: generated.job.materialCode,
        controllerType: generated.job.controllerType,
        fileExtension: generated.job.fileExtension,
        version: nextVersion,
        status: 'GENERATED',
        isCurrent: true,
        toolDiameterIn: decimal(generated.job.toolDiameterIn),
        spindleRpm: generated.job.spindleRpm,
        feedRateIpm: generated.job.feedRateIpm,
        plungeRateIpm: generated.job.plungeRateIpm
      }
    });

    await db.artifact.create({
      data: {
        organizationId: bundle.organizationId,
        type: 'cnc-file',
        artifactType: 'CNC_FILE',
        uri: `/manufacturing/cnc/${createdJob.id}/file`,
        mimeType: 'text/plain',
        version: nextVersion,
        isCurrent: true,
        generatedFrom: 'cnc',
        productionBundleId: bundle.id,
        productionBundleCode: input.bundleCode,
        sheetId: generated.job.sheetId,
        cncJobId: createdJob.id
      }
    });

    createdJobs.push({ ...generated.job, id: createdJob.id, version: nextVersion, isCurrent: true });
  }

  await db.productionBundle.update({
    where: { id: bundle.id },
    data: {
      currentCncVersion: nextVersion,
      status: 'CNC_GENERATED',
      notes: input.reason ?? bundle.notes
    }
  });

  return createdJobs;
}

export async function replaceBundleSheetArtifacts(input: {
  bundleCode: string;
  version: number;
  maps: SheetMapArtifact[];
}) {
  const bundle = await getBundleOrThrow(input.bundleCode);

  await db.artifact.updateMany({
    where: {
      productionBundleId: bundle.id,
      artifactType: { in: ['SHEET_MAP_SVG', 'SHEET_MAP_HTML'] },
      isCurrent: true
    },
    data: { isCurrent: false, supersededAt: new Date() }
  });

  for (const map of input.maps) {
    if (!map.sheetId) {
      continue;
    }

    await db.artifact.createMany({
      data: [
        {
          organizationId: bundle.organizationId,
          type: 'sheet-map-svg',
          artifactType: 'SHEET_MAP_SVG',
          uri: `/manufacturing/sheets/${map.sheetId}/map?format=svg`,
          mimeType: 'image/svg+xml',
          version: input.version,
          isCurrent: true,
          generatedFrom: 'nest',
          productionBundleId: bundle.id,
          productionBundleCode: input.bundleCode,
          sheetId: map.sheetId
        },
        {
          organizationId: bundle.organizationId,
          type: 'sheet-map-html',
          artifactType: 'SHEET_MAP_HTML',
          uri: `/manufacturing/sheets/${map.sheetId}/map?format=html`,
          mimeType: 'text/html',
          version: input.version,
          isCurrent: true,
          generatedFrom: 'nest',
          productionBundleId: bundle.id,
          productionBundleCode: input.bundleCode,
          sheetId: map.sheetId
        }
      ]
    });
  }
}

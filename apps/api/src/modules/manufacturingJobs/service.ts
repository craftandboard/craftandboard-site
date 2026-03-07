import type { CncJobSummary, ManufacturingBundleSummary, MaterialCode, NestingPartInput, SheetSummary } from '@craft-and-board/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { buildCncJob } from './buildCncJob.js';
import { buildNestingJob } from './buildNestingJob.js';
import type { ManufacturingArtifactsResult } from './contracts.js';
import { replaceBundleCncJobs, replaceBundleNesting, replaceBundleSheetArtifacts } from './persist.js';
import { buildSheetMapArtifact } from '../sheetMaps/service.js';
import { isSupportedBundleMaterial } from '../productionBundles/naming.js';
import { filterRecordsForBundle, buildBundleSummaries, loadBundleSourceRecords } from '../productionBundles/grouping.js';
import { renderSyntecNcFile } from '../cnc/syntecPost.js';
import { ensureProductionBundle } from '../manufacturingLifecycle/service.js';
import { getDefaultMachineProfile } from '../settings/service.js';
const db = prisma as any;

function decimalToNumber(value: { toNumber(): number }) {
  return value.toNumber();
}

function mapPartsToNestingInputs(records: Awaited<ReturnType<typeof loadBundleSourceRecords>>) {
  return records.flatMap((record) =>
    record.parts.map(
      (part, index): NestingPartInput => ({
        id: part.id,
        partCode: part.partCode,
        orderId: part.orderId ?? undefined,
        orderItemId: part.orderItemId ?? undefined,
        customerLastName: part.customerLastName ?? undefined,
        materialCode: (part.materialCode ?? record.materialCode) as MaterialCode,
        shipByDate: part.shipByDate?.toISOString(),
        widthIn: decimalToNumber(part.widthIn),
        depthIn: decimalToNumber(part.depthIn),
        thicknessIn: decimalToNumber(part.thicknessIn),
        sequenceHint: index + 1
      })
    )
  );
}

async function requireBundle(bundleCode: string) {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((candidate) => candidate.bundleCode === bundleCode);

  if (!summary || !isSupportedBundleMaterial(summary.materialCode)) {
    throw new Error(`Manufacturing bundle not found: ${bundleCode}`);
  }

  const bundleRecords = filterRecordsForBundle(records, bundleCode);
  const parts = mapPartsToNestingInputs(bundleRecords);

  if (parts.length === 0) {
    throw new Error(`Manufacturing bundle ${bundleCode} has no physical parts.`);
  }

  const [month, day, year] = summary.shipByDate.split('/');
  const bundleRecord = await ensureProductionBundle({
    code: summary.bundleCode,
    shipByDate: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
    materialCode: summary.materialCode,
    totalLineItems: summary.totalLineItems,
    totalPhysicalParts: summary.totalPhysicalParts
  });

  return { summary, bundleRecord, records: bundleRecords, parts };
}

type PersistedSheetRecord = Prisma.SheetGetPayload<{
  include: {
    placements: {
      include: { part: true };
    };
    artifacts: true;
    cncJobs: true;
  };
}>;

function mapPersistedSheet(sheet: PersistedSheetRecord): SheetSummary {
  const placements = sheet.placements.map((placement) => ({
    id: placement.id,
    sheetId: sheet.id,
    partId: placement.partId,
    partCode: placement.part.partCode,
    xIn: decimalToNumber(placement.xIn),
    yIn: decimalToNumber(placement.yIn),
    widthIn: decimalToNumber(placement.widthIn),
    depthIn: decimalToNumber(placement.depthIn),
    rotationDeg: placement.rotationDeg as 0 | 90,
    sequenceNumber: placement.sequenceNumber,
    onionSkin: placement.onionSkin,
    customerLastName: placement.part.customerLastName ?? undefined
  }));

  return {
    id: sheet.id,
    productionBundleCode: sheet.productionBundleCode ?? '',
    materialCode: sheet.materialCode as MaterialCode,
    sheetNumber: sheet.sheetNumber,
    version: sheet.version,
    widthIn: decimalToNumber(sheet.widthIn),
    heightIn: decimalToNumber(sheet.heightIn),
    usableXIn: decimalToNumber(sheet.usableXIn),
    usableYIn: decimalToNumber(sheet.usableYIn),
    usableWidthIn: decimalToNumber(sheet.usableWidthIn),
    usableHeightIn: decimalToNumber(sheet.usableHeightIn),
    utilizationPct: decimalToNumber(sheet.utilizationPct),
    totalParts: placements.length,
    placements
  };
}

export async function buildBundleNesting(bundleCode: string, options?: { reason?: string; force?: boolean }) {
  const { summary, parts, bundleRecord } = await requireBundle(bundleCode);
  const result = buildNestingJob({ bundleCode, materialCode: summary.materialCode, parts });
  const persisted = await replaceBundleNesting({ bundleCode, result, reason: options?.reason, force: options?.force });
  const version = bundleRecord.currentNestVersion ? bundleRecord.currentNestVersion + 1 : 1;
  const maps = persisted.sheets.map((sheet) => buildSheetMapArtifact({ bundleCode, sheet }));
  await replaceBundleSheetArtifacts({ bundleCode, version, maps });

  return {
    bundleCode,
    summary: { ...summary, currentNestVersion: version, status: 'nested' },
    nesting: { ...persisted, sheets: persisted.sheets },
    maps
  };
}

export async function getBundleNesting(bundleCode: string) {
  const { summary, bundleRecord } = await requireBundle(bundleCode);
  const sheets = await db.sheet.findMany({
    where: { productionBundleId: bundleRecord.id, isCurrent: true },
    include: {
      placements: { include: { part: true }, orderBy: { sequenceNumber: 'asc' } },
      artifacts: true,
      cncJobs: true
    },
    orderBy: { sheetNumber: 'asc' }
  });

  const mappedSheets = (sheets as PersistedSheetRecord[]).map(mapPersistedSheet);
  const totalPartAreaSqIn = mappedSheets.reduce(
    (sum: number, sheet: SheetSummary) =>
      sum +
      sheet.placements.reduce(
        (sheetSum: number, placement) => sheetSum + placement.widthIn * placement.depthIn,
        0
      ),
    0
  );
  const onionSkinPartCount = mappedSheets.reduce(
    (sum: number, sheet: SheetSummary) =>
      sum + sheet.placements.filter((placement) => placement.onionSkin).length,
    0
  );
  const utilizationPct =
    mappedSheets.length === 0
      ? 0
      : Number((mappedSheets.reduce((sum, sheet) => sum + sheet.utilizationPct, 0) / mappedSheets.length).toFixed(3));

  return {
    summary: {
      ...summary,
      id: bundleRecord.id,
      status: String(bundleRecord.status).toLowerCase() as ManufacturingBundleSummary['status'],
      currentNestVersion: bundleRecord.currentNestVersion ?? undefined,
      currentCncVersion: bundleRecord.currentCncVersion ?? undefined,
      releasedAt: bundleRecord.releasedAt?.toISOString(),
      nestingApprovedAt: bundleRecord.nestingApprovedAt?.toISOString(),
      cncApprovedAt: bundleRecord.cncApprovedAt?.toISOString(),
      notes: bundleRecord.notes ?? undefined
    },
    nesting: {
      bundleCode,
      materialCode: summary.materialCode,
      sheetCount: mappedSheets.length,
      totalParts: mappedSheets.reduce((sum: number, sheet: SheetSummary) => sum + sheet.totalParts, 0),
      totalPartAreaSqIn: Number(totalPartAreaSqIn.toFixed(3)),
      onionSkinPartCount,
      utilizationPct,
      sheets: mappedSheets,
      warnings: []
    }
  };
}

export async function listBundleSheets(bundleCode: string, options?: { includeSuperseded?: boolean }) {
  if (!options?.includeSuperseded) {
    const result = await getBundleNesting(bundleCode);
    return result.nesting.sheets;
  }

  const { bundleRecord } = await requireBundle(bundleCode);
  const sheets = await db.sheet.findMany({
    where: { productionBundleId: bundleRecord.id },
    include: {
      placements: { include: { part: true }, orderBy: { sequenceNumber: 'asc' } },
      artifacts: true,
      cncJobs: true
    },
    orderBy: [{ version: 'desc' }, { sheetNumber: 'asc' }]
  });

  return (sheets as PersistedSheetRecord[]).map(mapPersistedSheet).map((sheet, index) => ({
    ...sheet,
    status: String((sheets[index] as any).status).toLowerCase(),
    isCurrent: Boolean((sheets[index] as any).isCurrent),
    approvedAt: (sheets[index] as any).approvedAt?.toISOString(),
    postedAt: (sheets[index] as any).postedAt?.toISOString(),
    completedAt: (sheets[index] as any).completedAt?.toISOString(),
    scrapReason: (sheets[index] as any).scrapReason ?? undefined
  }));
}

export async function getSheetById(sheetId: string) {
  const sheet = await db.sheet.findUnique({
    where: { id: sheetId },
    include: {
      placements: { include: { part: true }, orderBy: { sequenceNumber: 'asc' } },
      artifacts: true,
      cncJobs: true
    }
  });

  if (!sheet) {
    return null;
  }

  return {
    ...(mapPersistedSheet(sheet as PersistedSheetRecord) as any),
    productionBundleCode: sheet.productionBundleCode ?? '',
    status: String(sheet.status).toLowerCase(),
    isCurrent: sheet.isCurrent,
    postedAt: sheet.postedAt?.toISOString(),
    completedAt: sheet.completedAt?.toISOString(),
    cncJobs: sheet.cncJobs.map((job: any): CncJobSummary => ({
      id: job.id,
      version: job.version,
      isCurrent: job.isCurrent,
      code: job.code,
      bundleCode: job.productionBundleCode ?? '',
      materialCode: job.materialCode as MaterialCode,
      sheetId: job.sheetId ?? undefined,
      sheetNumber: sheet.sheetNumber,
      controllerType: job.controllerType,
      fileExtension: job.fileExtension,
      status: String(job.status).toLowerCase() as CncJobSummary['status'],
      toolDiameterIn: decimalToNumber(job.toolDiameterIn),
      spindleRpm: job.spindleRpm,
      feedRateIpm: job.feedRateIpm,
      plungeRateIpm: job.plungeRateIpm,
      lineCount: 0,
      fileName: `${job.code}${job.fileExtension}`,
      approvedAt: job.approvedAt?.toISOString(),
      approvedBy: job.approvedBy ?? undefined,
      postedAt: job.postedAt?.toISOString(),
      ranAt: job.ranAt?.toISOString(),
      supersededAt: job.supersededAt?.toISOString(),
      failureReason: job.failureReason ?? undefined
    })),
    artifacts: sheet.artifacts.map((artifact: any) => ({
      id: artifact.id,
      type: artifact.type,
      artifactType: artifact.artifactType ?? undefined,
      version: artifact.version,
      isCurrent: artifact.isCurrent,
      uri: artifact.uri,
      mimeType: artifact.mimeType ?? undefined,
      sheetId: artifact.sheetId ?? undefined,
      cncJobId: artifact.cncJobId ?? undefined
    }))
  };
}

export async function getSheetMap(sheetId: string) {
  const sheet = await getSheetById(sheetId);
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetId}`);
  }

  return buildSheetMapArtifact({ bundleCode: sheet.productionBundleCode, sheet });
}

export async function generateBundleCnc(bundleCode: string, options?: { reason?: string; force?: boolean }) {
  const nesting = await getBundleNesting(bundleCode);
  if (nesting.nesting.sheets.length === 0) {
    throw new Error(`Cannot generate CNC without nesting for ${bundleCode}.`);
  }

  const machine = await getDefaultMachineProfile();
  const generated = buildCncJob({
    bundleCode,
    materialCode: nesting.summary.materialCode,
    sheets: nesting.nesting.sheets.map((sheet) => ({ ...sheet }))
  }).map((generatedFile: any) => ({
    ...generatedFile,
    job: {
      ...generatedFile.job,
      controllerType: machine.controllerType,
      fileExtension: machine.fileExtension,
      toolDiameterIn: decimalToNumber(machine.toolDiameterIn),
      spindleRpm: machine.spindleRpm,
      feedRateIpm: machine.feedRateIpm,
      plungeRateIpm: machine.plungeRateIpm ?? generatedFile.job.plungeRateIpm
    }
  }));

  const jobs = await replaceBundleCncJobs({ bundleCode, jobs: generated, reason: options?.reason, force: options?.force });

  return { bundleCode, jobs, totalJobs: jobs.length };
}

export async function listBundleCncJobs(bundleCode: string, options?: { includeSuperseded?: boolean }) {
  const { bundleRecord } = await requireBundle(bundleCode);
  const jobs = await db.cncJob.findMany({
    where: {
      productionBundleId: bundleRecord.id,
      ...(options?.includeSuperseded ? {} : { isCurrent: true })
    },
    orderBy: [{ version: 'desc' }, { code: 'asc' }]
  });

  return jobs.map(
    (job: any): CncJobSummary => ({
      id: job.id,
      version: job.version,
      isCurrent: job.isCurrent,
      code: job.code,
      bundleCode: job.productionBundleCode ?? bundleCode,
      materialCode: job.materialCode as MaterialCode,
      sheetId: job.sheetId ?? undefined,
      sheetNumber: Number(job.code.split('-S').at(-1) ?? 0),
      controllerType: job.controllerType,
      fileExtension: job.fileExtension,
      status: String(job.status).toLowerCase() as CncJobSummary['status'],
      toolDiameterIn: decimalToNumber(job.toolDiameterIn),
      spindleRpm: job.spindleRpm,
      feedRateIpm: job.feedRateIpm,
      plungeRateIpm: job.plungeRateIpm,
      lineCount: 0,
      fileName: `${job.code}${job.fileExtension}`,
      approvedAt: job.approvedAt?.toISOString(),
      approvedBy: job.approvedBy ?? undefined,
      postedAt: job.postedAt?.toISOString(),
      ranAt: job.ranAt?.toISOString(),
      supersededAt: job.supersededAt?.toISOString(),
      failureReason: job.failureReason ?? undefined
    })
  );
}

export async function getCncFile(jobId: string) {
  const job = await db.cncJob.findUnique({ where: { id: jobId } });
  if (!job || !job.productionBundleCode || !job.sheetId) {
    return null;
  }

  const sheet = await getSheetById(job.sheetId);
  if (!sheet) {
    return null;
  }

  const ncText = renderSyntecNcFile({
    bundleCode: job.productionBundleCode,
    materialCode: job.materialCode as MaterialCode,
    sheet
  });

  return {
    jobId: job.id,
    code: job.code,
    fileName: `${job.code}${job.fileExtension}`,
    ncText
  };
}

export async function listBundleArtifacts(bundleCode: string): Promise<ManufacturingArtifactsResult> {
  const { bundleRecord } = await requireBundle(bundleCode);
  const artifacts = await db.artifact.findMany({
    where: { productionBundleId: bundleRecord.id },
    orderBy: [{ version: 'desc' }, { createdAt: 'asc' }]
  });

  return {
    bundleCode,
    artifacts: artifacts.map((artifact: any) => ({
      id: artifact.id,
      type: artifact.type,
      artifactType: artifact.artifactType,
      version: artifact.version,
      isCurrent: artifact.isCurrent,
      uri: artifact.uri,
      mimeType: artifact.mimeType ?? undefined,
      supersededAt: artifact.supersededAt?.toISOString(),
      sheetId: artifact.sheetId ?? undefined,
      cncJobId: artifact.cncJobId ?? undefined
    }))
  };
}

export async function listManufacturingBundles(): Promise<ManufacturingBundleSummary[]> {
  const productionRecords = await loadBundleSourceRecords();
  const bundleSummaries = buildBundleSummaries(productionRecords);

  for (const bundle of bundleSummaries) {
    const [month, day, year] = bundle.shipByDate.split('/');
    await ensureProductionBundle({
      code: bundle.bundleCode,
      shipByDate: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
      materialCode: bundle.materialCode as 'WHITE_MELAMINE' | 'MAPLE_MELAMINE',
      totalLineItems: bundle.totalLineItems,
      totalPhysicalParts: bundle.totalPhysicalParts
    });
  }

  const persisted = await db.productionBundle.findMany({ orderBy: [{ shipByDate: 'asc' }, { code: 'asc' }] });
  const sheetGroups = await db.sheet.groupBy({
    by: ['productionBundleId'],
    _count: { _all: true },
    _avg: { utilizationPct: true },
    where: { productionBundleId: { not: null }, isCurrent: true }
  });
  const onionCountsByBundle = new Map<string, number>();
  const onionPlacements = await db.sheetPlacement.findMany({
    where: { onionSkin: true, sheet: { isCurrent: true } },
    select: { sheet: { select: { productionBundleCode: true } } }
  });
  for (const placement of onionPlacements) {
    const code = placement.sheet?.productionBundleCode;
    if (!code) continue;
    onionCountsByBundle.set(code, (onionCountsByBundle.get(code) ?? 0) + 1);
  }

  return persisted.map((bundle: any) => {
    const summary = bundleSummaries.find((item) => item.bundleCode === bundle.code);
    const sheetGroup = sheetGroups.find((item: any) => item.productionBundleId === bundle.id);

    return {
      id: bundle.id,
      bundleCode: bundle.code,
      shipByDate: bundle.shipByDate.toISOString().slice(0, 10).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1'),
      materialCode: bundle.materialCode as MaterialCode,
      productLabel: summary?.productLabel ?? (bundle.materialCode === 'WHITE_MELAMINE' ? 'White Shelf' : 'Maple Shelf'),
      totalPhysicalParts: summary?.totalPhysicalParts ?? bundle.totalPhysicalParts,
      nestingBuilt: Boolean(bundle.currentNestVersion),
      cncGenerated: Boolean(bundle.currentCncVersion),
      totalSheets: sheetGroup?._count._all ?? 0,
      utilizationPct: sheetGroup?._avg.utilizationPct ? Number(sheetGroup._avg.utilizationPct.toFixed(3)) : undefined,
      onionSkinPartCount: onionCountsByBundle.get(bundle.code) ?? 0,
      status: String(bundle.status).toLowerCase() as ManufacturingBundleSummary['status'],
      currentNestVersion: bundle.currentNestVersion ?? undefined,
      currentCncVersion: bundle.currentCncVersion ?? undefined
    };
  });
}

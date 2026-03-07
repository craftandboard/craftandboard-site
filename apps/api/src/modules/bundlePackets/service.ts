import type { ArtifactVersionSummary, BundleLifecycleView, CncJobSummary, CustomerOrderStatusView, ManufacturingBundleSummary, ProductionBundleStatus, SheetSummary } from '@craft-and-board/shared';
import { prisma } from '../../lib/prisma.js';
import { projectCustomerOrderStatus } from '../customerStatus/service.js';
import { getBundleLifecycleView } from '../manufacturingLifecycle/service.js';
import { getBundleNesting } from '../manufacturingJobs/service.js';
import { getDefaultMachineProfile, getMaterialProfile } from '../settings/service.js';
import { renderBundlePacketHtml } from './htmlRenderer.js';

const db = prisma as any;

function parseSourceVersions(generatedFrom?: string | null) {
  const match = generatedFrom?.match(/^packet:nest:(\d+):cnc:(\d+)$/);
  if (!match) {
    return { nestVersion: null, cncVersion: null };
  }

  return {
    nestVersion: Number(match[1]),
    cncVersion: Number(match[2])
  };
}

function buildCustomerProjection(bundle: ManufacturingBundleSummary): CustomerOrderStatusView {
  return projectCustomerOrderStatus({
    orderId: bundle.bundleCode,
    bundleStatuses: [(bundle.status ?? 'draft') as ProductionBundleStatus],
    shipmentTrackingNo: null
  });
}

async function requireBundle(bundleCode: string) {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }
  return bundle;
}

async function loadBundleSummary(bundleCode: string): Promise<ManufacturingBundleSummary> {
  const nesting = await getBundleNesting(bundleCode);

  return {
    ...nesting.summary,
    nestingBuilt: Boolean(nesting.summary.currentNestVersion),
    cncGenerated: Boolean(nesting.summary.currentCncVersion),
    totalSheets: nesting.nesting.sheetCount,
    utilizationPct: nesting.nesting.utilizationPct,
    onionSkinPartCount: nesting.nesting.onionSkinPartCount
  };
}

function decimalToNumber(value: { toNumber(): number }) {
  return value.toNumber();
}

function mapSheetRecord(sheet: any): SheetSummary {
  const placements = (sheet.placements ?? []).map((placement: any) => ({
    id: placement.id,
    sheetId: sheet.id,
    partId: placement.partId,
    partCode: placement.part?.partCode ?? '',
    xIn: decimalToNumber(placement.xIn),
    yIn: decimalToNumber(placement.yIn),
    widthIn: decimalToNumber(placement.widthIn),
    depthIn: decimalToNumber(placement.depthIn),
    rotationDeg: placement.rotationDeg as 0 | 90,
    sequenceNumber: placement.sequenceNumber,
    onionSkin: placement.onionSkin,
    customerLastName: placement.part?.customerLastName ?? undefined
  }));

  return {
    id: sheet.id,
    productionBundleCode: sheet.productionBundleCode ?? '',
    materialCode: sheet.materialCode,
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
    status: String(sheet.status).toLowerCase() as SheetSummary['status'],
    isCurrent: sheet.isCurrent,
    approvedAt: sheet.approvedAt?.toISOString(),
    postedAt: sheet.postedAt?.toISOString(),
    completedAt: sheet.completedAt?.toISOString(),
    scrapReason: sheet.scrapReason ?? undefined,
    placements
  };
}

async function loadVersionedPacketData(input: { bundleCode: string; nestVersion?: number | null; cncVersion?: number | null }) {
  const bundle = await requireBundle(input.bundleCode);
  const lifecycle = await getBundleLifecycleView(input.bundleCode);
  if (!lifecycle) {
    throw new Error(`Production bundle not found: ${input.bundleCode}`);
  }

  const summary = await loadBundleSummary(input.bundleCode);
  const sheetsRaw = await db.sheet.findMany({
    where: {
      productionBundleId: bundle.id,
      ...(input.nestVersion ? { version: input.nestVersion } : { isCurrent: true })
    },
    include: {
      placements: {
        include: { part: true },
        orderBy: { sequenceNumber: 'asc' }
      }
    },
    orderBy: { sheetNumber: 'asc' }
  });
  const jobsRaw = await db.cncJob.findMany({
    where: {
      productionBundleId: bundle.id,
      ...(input.cncVersion ? { version: input.cncVersion } : { isCurrent: true })
    },
    orderBy: [{ version: 'desc' }, { code: 'asc' }]
  });
  const artifactsRaw = await db.artifact.findMany({
    where: {
      productionBundleId: bundle.id,
      ...(input.nestVersion || input.cncVersion
        ? {
            OR: [
              ...(input.nestVersion
                ? [
                    {
                      artifactType: { in: ['SHEET_MAP_SVG', 'SHEET_MAP_HTML'] },
                      version: input.nestVersion
                    }
                  ]
                : []),
              ...(input.cncVersion
                ? [
                    {
                      artifactType: 'CNC_FILE',
                      version: input.cncVersion
                    }
                  ]
                : [])
            ]
          }
        : { isCurrent: true })
    },
    orderBy: [{ version: 'desc' }, { createdAt: 'asc' }]
  });

  const sheets = sheetsRaw.map(mapSheetRecord) as SheetSummary[];
  const jobs = jobsRaw.map(
    (job: any): CncJobSummary => ({
      id: job.id,
      version: job.version,
      isCurrent: job.isCurrent,
      code: job.code,
      bundleCode: job.productionBundleCode ?? input.bundleCode,
      materialCode: job.materialCode,
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
  const artifacts = artifactsRaw.map(
    (artifact: any): ArtifactVersionSummary => ({
      id: artifact.id,
      artifactType: artifact.artifactType,
      version: artifact.version,
      isCurrent: artifact.isCurrent,
      uri: artifact.uri,
      mimeType: artifact.mimeType ?? undefined,
      supersededAt: artifact.supersededAt?.toISOString()
    })
  );

  const customerStatus = buildCustomerProjection(summary);
  const [machineProfile, materialProfile] = await Promise.all([
    getDefaultMachineProfile(),
    getMaterialProfile(summary.materialCode)
  ]);

  return { bundle, lifecycle, summary, sheets, jobs, artifacts, customerStatus, machineProfile, materialProfile };
}

export async function generateBundlePacket(bundleCode: string) {
  const bundle = await requireBundle(bundleCode);
  if (!bundle.currentNestVersion) {
    throw new Error('Cannot generate packet without a current nest version.');
  }

  const packetArtifacts = await db.artifact.findMany({
    where: {
      productionBundleId: bundle.id,
      artifactType: 'BUNDLE_PACKET_HTML'
    },
    orderBy: { version: 'desc' }
  });
  const nextVersion = (packetArtifacts[0]?.version ?? 0) + 1;
  const sourceTag = `packet:nest:${bundle.currentNestVersion ?? 0}:cnc:${bundle.currentCncVersion ?? 0}`;

  await db.artifact.updateMany({
    where: {
      productionBundleId: bundle.id,
      artifactType: 'BUNDLE_PACKET_HTML',
      isCurrent: true
    },
    data: {
      isCurrent: false,
      supersededAt: new Date()
    }
  });

  const artifact = await db.artifact.create({
    data: {
      type: 'bundle-packet-html',
      artifactType: 'BUNDLE_PACKET_HTML',
      uri: `/manufacturing/bundles/${bundleCode}/packet?version=${nextVersion}`,
      mimeType: 'text/html',
      version: nextVersion,
      isCurrent: true,
      generatedFrom: sourceTag,
      productionBundleId: bundle.id,
      productionBundleCode: bundleCode
    }
  });

  return {
    bundleCode,
    status: String(bundle.status).toLowerCase() as ProductionBundleStatus,
    version: artifact.version,
    uri: artifact.uri,
    message: 'Bundle packet generated.'
  };
}

export async function getBundlePacket(bundleCode: string, version?: number) {
  const bundle = await requireBundle(bundleCode);
  const packetArtifact = await db.artifact.findFirst({
    where: {
      productionBundleId: bundle.id,
      artifactType: 'BUNDLE_PACKET_HTML',
      ...(version ? { version } : { isCurrent: true })
    },
    orderBy: [{ version: 'desc' }]
  });

  if (!packetArtifact) {
    throw new Error(`Bundle packet not found for ${bundleCode}.`);
  }

  const { nestVersion, cncVersion } = parseSourceVersions(packetArtifact.generatedFrom);
  const packet = await loadVersionedPacketData({ bundleCode, nestVersion, cncVersion });
  const html = renderBundlePacketHtml({
    generatedAt: packetArtifact.createdAt.toISOString(),
    bundle: packet.summary,
    lifecycle: packet.lifecycle as BundleLifecycleView,
    customerStatus: packet.customerStatus,
    sheets: packet.sheets,
    cncJobs: packet.jobs,
    artifacts: packet.artifacts,
    machineProfile: {
      name: packet.machineProfile.name,
      controllerType: packet.machineProfile.controllerType,
      fileExtension: packet.machineProfile.fileExtension,
      toolDiameterIn: packet.machineProfile.toolDiameterIn.toNumber(),
      spindleRpm: packet.machineProfile.spindleRpm,
      feedRateIpm: packet.machineProfile.feedRateIpm,
      plungeRateIpm: packet.machineProfile.plungeRateIpm,
      cutDepthIn: packet.machineProfile.cutDepthIn.toNumber(),
      onionSkinDepthIn: packet.machineProfile.onionSkinDepthIn.toNumber(),
      safeZIn: packet.machineProfile.safeZIn.toNumber()
    },
    materialProfile: {
      name: packet.materialProfile.name,
      thicknessIn: packet.materialProfile.thicknessIn.toNumber(),
      sheetWidthIn: packet.materialProfile.sheetWidthIn.toNumber(),
      sheetDepthIn: packet.materialProfile.sheetDepthIn.toNumber(),
      trimMarginIn: packet.materialProfile.trimMarginIn.toNumber(),
      defaultEdgeBandPattern: packet.materialProfile.defaultEdgeBandPattern
    }
  });

  return {
    bundleCode,
    version: packetArtifact.version,
    artifactId: packetArtifact.id,
    uri: packetArtifact.uri,
    html,
    summary: packet.summary,
    lifecycle: packet.lifecycle,
    customerStatus: packet.customerStatus,
    sheets: packet.sheets,
    jobs: packet.jobs,
    artifacts: packet.artifacts
  };
}

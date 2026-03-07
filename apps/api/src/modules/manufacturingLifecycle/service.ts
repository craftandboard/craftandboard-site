import type { BundleActionResult, BundleLifecycleView, CncJobStatus, ProductionBundleStatus } from '@craft-and-board/shared';
import { prisma } from '../../lib/prisma.js';
import { LOCAL_ORG_ID } from '../settings/service.js';
const db = prisma as any;

export class LifecycleActionError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, options?: { code?: string; details?: Record<string, unknown> }) {
    super(message);
    this.name = 'LifecycleActionError';
    this.code = options?.code ?? 'invalid_transition';
    this.details = options?.details;
  }
}

const bundleTransitions: Record<ProductionBundleStatus, ProductionBundleStatus[]> = {
  draft: ['ready_for_nesting', 'qc_hold', 'error'],
  ready_for_nesting: ['nested', 'qc_hold', 'error'],
  nested: ['ready_for_cnc', 'qc_hold', 'error'],
  ready_for_cnc: ['cnc_generated', 'qc_hold', 'error'],
  cnc_generated: ['approved_for_production', 'qc_hold', 'error'],
  approved_for_production: ['in_production', 'qc_hold', 'error'],
  in_production: ['cut_complete', 'qc_hold', 'error'],
  cut_complete: ['packed', 'qc_hold', 'error'],
  qc_hold: ['error'],
  packed: ['shipped', 'qc_hold', 'error'],
  shipped: [],
  error: []
};

function toPrismaBundleStatus(status: ProductionBundleStatus) {
  return status.toUpperCase() as Uppercase<ProductionBundleStatus>;
}

function fromPrismaBundleStatus(status: string): ProductionBundleStatus {
  return status.toLowerCase() as ProductionBundleStatus;
}

function fromPrismaCncStatus(status: string): CncJobStatus {
  return status.toLowerCase() as CncJobStatus;
}

function conflictForBundle(bundle: { code: string; status: string; currentNestVersion?: number | null; currentCncVersion?: number | null }, message: string) {
  const currentStatus = fromPrismaBundleStatus(bundle.status);
  return new LifecycleActionError(message, {
    code: 'invalid_transition',
    details: {
      bundleCode: bundle.code,
      currentStatus,
      currentNestVersion: bundle.currentNestVersion ?? undefined,
      currentCncVersion: bundle.currentCncVersion ?? undefined,
      allowedNextActions: nextAllowedBundleActions(currentStatus)
    }
  });
}

function conflictForJob(job: { id: string; status: string; version?: number | null; productionBundle?: { code: string } | null }, message: string) {
  return new LifecycleActionError(message, {
    code: 'invalid_transition',
    details: {
      jobId: job.id,
      currentStatus: fromPrismaCncStatus(job.status),
      bundleCode: job.productionBundle?.code,
      version: job.version ?? undefined
    }
  });
}

export function isAllowedBundleTransition(currentStatus: ProductionBundleStatus, nextStatus: ProductionBundleStatus) {
  return bundleTransitions[currentStatus].includes(nextStatus);
}

export function canApproveNesting(input: { bundleStatus: ProductionBundleStatus; currentNestVersion?: number | null }) {
  return Boolean(input.currentNestVersion && ['ready_for_nesting', 'nested'].includes(input.bundleStatus));
}

export function canApproveCnc(input: { bundleStatus: ProductionBundleStatus; currentCncVersion?: number | null }) {
  return Boolean(input.currentCncVersion && ['ready_for_cnc', 'cnc_generated'].includes(input.bundleStatus));
}

export function canPostCncStatus(status: CncJobStatus) {
  return status === 'approved';
}

export function canCompleteOrFailCncStatus(status: CncJobStatus) {
  return status === 'posted';
}

export async function ensureProductionBundle(input: {
  code: string;
  shipByDate: Date;
  materialCode: 'WHITE_MELAMINE' | 'MAPLE_MELAMINE';
  totalLineItems: number;
  totalPhysicalParts: number;
}) {
  return db.productionBundle.upsert({
    where: { code: input.code },
    update: {
      shipByDate: input.shipByDate,
      materialCode: input.materialCode,
      totalLineItems: input.totalLineItems,
      totalPhysicalParts: input.totalPhysicalParts
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      code: input.code,
      shipByDate: input.shipByDate,
      materialCode: input.materialCode,
      totalLineItems: input.totalLineItems,
      totalPhysicalParts: input.totalPhysicalParts,
      status: 'DRAFT'
    }
  });
}

export function nextAllowedBundleActions(status: ProductionBundleStatus) {
  switch (status) {
    case 'draft':
      return ['release'];
    case 'ready_for_nesting':
      return ['build_nesting'];
    case 'nested':
      return ['approve_nesting'];
    case 'ready_for_cnc':
      return ['generate_cnc'];
    case 'cnc_generated':
      return ['approve_cnc'];
    case 'approved_for_production':
      return ['post_cnc'];
    case 'in_production':
      return ['complete_cut'];
    case 'cut_complete':
      return ['pack'];
    case 'packed':
      return ['ship'];
    default:
      return [];
  }
}

export async function getBundleLifecycleView(bundleCode: string): Promise<BundleLifecycleView | null> {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    return null;
  }

  const status = fromPrismaBundleStatus(bundle.status);
  return {
    bundleCode: bundle.code,
    status,
    currentNestVersion: bundle.currentNestVersion ?? undefined,
    currentCncVersion: bundle.currentCncVersion ?? undefined,
    releasedAt: bundle.releasedAt?.toISOString(),
    nestingApprovedAt: bundle.nestingApprovedAt?.toISOString(),
    cncApprovedAt: bundle.cncApprovedAt?.toISOString(),
    nextAllowedActions: nextAllowedBundleActions(status)
  };
}

async function transitionBundle(bundleCode: string, nextStatus: ProductionBundleStatus, note?: string) {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const currentStatus = fromPrismaBundleStatus(bundle.status);
  if (!isAllowedBundleTransition(currentStatus, nextStatus)) {
    throw conflictForBundle(bundle, `Illegal bundle transition from ${currentStatus} to ${nextStatus}.`);
  }

  return db.productionBundle.update({
    where: { code: bundleCode },
    data: {
      status: toPrismaBundleStatus(nextStatus),
      notes: note ?? bundle.notes
    }
  });
}

export async function releaseBundle(bundleCode: string, releasedBy?: string | null): Promise<BundleActionResult> {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const currentStatus = fromPrismaBundleStatus(bundle.status);
  if (currentStatus === 'ready_for_nesting' && bundle.releasedAt) {
    return {
      bundleCode,
      status: 'ready_for_nesting',
      message: 'Bundle already released for nesting.'
    };
  }

  const updated = await transitionBundle(bundleCode, 'ready_for_nesting');
  await db.productionBundle.update({
    where: { id: updated.id },
    data: { releasedAt: bundle.releasedAt ?? new Date(), releasedBy: releasedBy ?? updated.releasedBy ?? null }
  });

  return {
    bundleCode,
    status: 'ready_for_nesting',
    message: 'Bundle released for nesting.'
  };
}

export async function approveNesting(bundleCode: string, approvedBy?: string | null): Promise<BundleActionResult> {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const currentStatus = fromPrismaBundleStatus(bundle.status);
  if (currentStatus === 'ready_for_cnc' && bundle.nestingApprovedAt) {
    return {
      bundleCode,
      status: 'ready_for_cnc',
      version: bundle.currentNestVersion ?? undefined,
      message: 'Current nesting version already approved.'
    };
  }

  if (!canApproveNesting({ bundleStatus: currentStatus, currentNestVersion: bundle.currentNestVersion })) {
    throw conflictForBundle(bundle, `Cannot approve nesting from bundle status ${currentStatus}.`);
  }

  await db.productionBundle.update({
    where: { code: bundleCode },
    data: {
      status: 'READY_FOR_CNC',
      nestingApprovedAt: bundle.nestingApprovedAt ?? new Date(),
      nestingApprovedBy: approvedBy ?? bundle.nestingApprovedBy ?? null
    }
  });

  return {
    bundleCode,
    status: 'ready_for_cnc',
    version: bundle.currentNestVersion,
    message: 'Current nesting version approved.'
  };
}

export async function approveCnc(bundleCode: string, approvedBy?: string | null): Promise<BundleActionResult> {
  const bundle = await db.productionBundle.findUnique({ where: { code: bundleCode } });
  if (!bundle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const currentStatus = fromPrismaBundleStatus(bundle.status);
  if (currentStatus === 'approved_for_production' && bundle.cncApprovedAt) {
    return {
      bundleCode,
      status: 'approved_for_production',
      version: bundle.currentCncVersion ?? undefined,
      message: 'Current CNC version already approved.'
    };
  }

  if (!canApproveCnc({ bundleStatus: currentStatus, currentCncVersion: bundle.currentCncVersion })) {
    throw conflictForBundle(bundle, `Cannot approve CNC from bundle status ${currentStatus}.`);
  }

  await db.cncJob.updateMany({
    where: {
      productionBundleId: bundle.id,
      version: bundle.currentCncVersion,
      isCurrent: true
    },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: approvedBy ?? null
    }
  });

  await db.productionBundle.update({
    where: { code: bundleCode },
    data: {
      status: 'APPROVED_FOR_PRODUCTION',
      cncApprovedAt: bundle.cncApprovedAt ?? new Date(),
      cncApprovedBy: approvedBy ?? bundle.cncApprovedBy ?? null
    }
  });

  return {
    bundleCode,
    status: 'approved_for_production',
    version: bundle.currentCncVersion,
    message: 'Current CNC version approved.'
  };
}

export async function postCncJob(jobId: string): Promise<BundleActionResult> {
  const job = await db.cncJob.findUnique({ include: { productionBundle: true }, where: { id: jobId } });
  if (!job || !job.productionBundle) {
    throw new Error(`CNC job not found: ${jobId}`);
  }

  const currentStatus = fromPrismaCncStatus(job.status);
  if (currentStatus === 'posted' && job.postedAt) {
    return {
      bundleCode: job.productionBundle.code,
      status: 'in_production',
      version: job.version,
      message: 'CNC job already posted to production.'
    };
  }

  if (currentStatus === 'ran') {
    return {
      bundleCode: job.productionBundle.code,
      status: 'cut_complete',
      version: job.version,
      message: 'CNC job already completed.'
    };
  }

  if (!canPostCncStatus(currentStatus)) {
    throw conflictForJob(job, 'Only APPROVED CNC jobs can be posted.');
  }

  await db.cncJob.update({ where: { id: jobId }, data: { status: 'POSTED', postedAt: job.postedAt ?? new Date() } });
  await db.productionBundle.update({ where: { id: job.productionBundleId! }, data: { status: 'IN_PRODUCTION' } });

  return {
    bundleCode: job.productionBundle.code,
    status: 'in_production',
    version: job.version,
    message: 'CNC job posted to production.'
  };
}

export async function completeCncJob(jobId: string): Promise<BundleActionResult> {
  const job = await db.cncJob.findUnique({ include: { productionBundle: true }, where: { id: jobId } });
  if (!job || !job.productionBundle) {
    throw new Error(`CNC job not found: ${jobId}`);
  }

  const currentStatus = fromPrismaCncStatus(job.status);
  if (currentStatus === 'ran' && job.ranAt) {
    return {
      bundleCode: job.productionBundle.code,
      status: 'cut_complete',
      version: job.version,
      message: 'CNC job already completed.'
    };
  }

  if (!canCompleteOrFailCncStatus(currentStatus)) {
    throw conflictForJob(job, 'Only POSTED CNC jobs can be completed.');
  }

  await db.cncJob.update({ where: { id: jobId }, data: { status: 'RAN', ranAt: job.ranAt ?? new Date() } });

  const openJobs = await db.cncJob.count({
    where: {
      productionBundleId: job.productionBundleId,
      isCurrent: true,
      status: { in: ['APPROVED', 'POSTED', 'GENERATED'] }
    }
  });

  const nextStatus: ProductionBundleStatus = openJobs === 0 ? 'cut_complete' : 'in_production';
  await db.productionBundle.update({
    where: { id: job.productionBundleId! },
    data: { status: nextStatus === 'cut_complete' ? 'CUT_COMPLETE' : 'IN_PRODUCTION' }
  });

  return {
    bundleCode: job.productionBundle.code,
    status: nextStatus,
    version: job.version,
    message: nextStatus === 'cut_complete' ? 'All CNC jobs completed.' : 'CNC job completed.'
  };
}

export async function failCncJob(jobId: string, reason: string): Promise<BundleActionResult> {
  const job = await db.cncJob.findUnique({ include: { productionBundle: true }, where: { id: jobId } });
  if (!job || !job.productionBundle) {
    throw new Error(`CNC job not found: ${jobId}`);
  }

  const currentStatus = fromPrismaCncStatus(job.status);
  if (currentStatus === 'failed' && job.failureReason) {
    return {
      bundleCode: job.productionBundle.code,
      status: 'error',
      version: job.version,
      message: 'CNC job already marked failed.'
    };
  }

  if (!canCompleteOrFailCncStatus(currentStatus)) {
    throw conflictForJob(job, 'Only POSTED CNC jobs can be failed.');
  }

  await db.cncJob.update({
    where: { id: jobId },
    data: { status: 'FAILED', failureReason: reason }
  });
  await db.productionBundle.update({ where: { id: job.productionBundleId! }, data: { status: 'ERROR' } });

  return {
    bundleCode: job.productionBundle.code,
    status: 'error',
    version: job.version,
    message: 'CNC job marked failed.'
  };
}

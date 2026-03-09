import { LOCAL_ORG_ID } from "../settings/service.js";
import { estimatePartEdgeBand, EDGE_BANDING_DEFAULTS } from "./estimation.js";
import { selectBatchEdgeBandParts, selectForecastEdgeBandParts, selectOrderEdgeBandParts } from "./selectors.js";

function toNumber(value: { toString(): string } | null | undefined) {
  if (!value) {
    return 0;
  }
  return Number(value.toString());
}

function labelCodeFor(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

function summarizeEstimates(
  estimates: Array<
    | ReturnType<typeof estimatePartEdgeBand> & { ok: true }
    | ReturnType<typeof estimatePartEdgeBand> & { ok: false }
  >,
  setupAllowanceFtPerGroup = EDGE_BANDING_DEFAULTS.setupAllowanceFtPerMaterialGroup
) {
  const valid = estimates.filter((estimate) => estimate.ok);
  const invalid = estimates.filter((estimate) => !estimate.ok);
  const grouped = new Map<
    string,
    {
      edgeBandMaterialKey: string;
      edgeBandMaterialLabel: string;
      edgeBandColorLabel: string;
      rawLinearIn: number;
      adjustedLinearIn: number;
      partCount: number;
      orderIds: Set<string>;
      jobIds: Set<string>;
      parts: Array<(typeof valid)[number]>;
    }
  >();

  for (const estimate of valid) {
    if (!estimate.edgeBandMaterialKey || estimate.bandedEdgeCount === 0) {
      continue;
    }

    const bucket =
      grouped.get(estimate.edgeBandMaterialKey) ??
      {
        edgeBandMaterialKey: estimate.edgeBandMaterialKey,
        edgeBandMaterialLabel: estimate.edgeBandMaterialLabel ?? estimate.edgeBandMaterialKey,
        edgeBandColorLabel: estimate.edgeBandColorLabel ?? "Unspecified",
        rawLinearIn: 0,
        adjustedLinearIn: 0,
        partCount: 0,
        orderIds: new Set<string>(),
        jobIds: new Set<string>(),
        parts: []
      };

    bucket.rawLinearIn = Number((bucket.rawLinearIn + estimate.rawLinearIn).toFixed(3));
    bucket.adjustedLinearIn = Number((bucket.adjustedLinearIn + estimate.adjustedLinearIn).toFixed(3));
    bucket.partCount += 1;
    if (estimate.orderId) bucket.orderIds.add(estimate.orderId);
    if (estimate.jobId) bucket.jobIds.add(estimate.jobId);
    bucket.parts.push(estimate);
    grouped.set(estimate.edgeBandMaterialKey, bucket);
  }

  const materials = [...grouped.values()]
    .map((bucket) => {
      const setupAllowanceFt = bucket.partCount > 0 ? setupAllowanceFtPerGroup : 0;
      const setupAllowanceIn = setupAllowanceFt * 12;
      const estimatedDemandIn = Number((bucket.adjustedLinearIn + setupAllowanceIn).toFixed(3));
      return {
        edgeBandMaterialKey: bucket.edgeBandMaterialKey,
        edgeBandMaterialLabel: bucket.edgeBandMaterialLabel,
        edgeBandColorLabel: bucket.edgeBandColorLabel,
        rawLinearIn: bucket.rawLinearIn,
        adjustedLinearIn: bucket.adjustedLinearIn,
        rawLinearFt: Number((bucket.rawLinearIn / 12).toFixed(3)),
        adjustedLinearFt: Number((bucket.adjustedLinearIn / 12).toFixed(3)),
        setupAllowanceFt,
        estimatedDemandFt: Number((estimatedDemandIn / 12).toFixed(3)),
        partCount: bucket.partCount,
        jobCount: bucket.jobIds.size,
        orderCount: bucket.orderIds.size,
        parts: bucket.parts.map((part) => ({
          partId: part.partId,
          orderId: part.orderId,
          jobId: part.jobId,
          labelCode: part.labelCode,
          materialCode: part.materialCode,
          derivedPattern: part.derivedPattern,
          rawLinearFt: part.rawLinearFt,
          adjustedLinearFt: part.adjustedLinearFt,
          source: part.source,
          sourceEdgeBandText: part.sourceEdgeBandText
        }))
      };
    })
    .sort((left, right) => right.estimatedDemandFt - left.estimatedDemandFt);

  return {
    assumptions: {
      perEdgeWasteIn: EDGE_BANDING_DEFAULTS.perEdgeWasteIn,
      setupAllowanceFtPerEdgeBandMaterialGroup: setupAllowanceFtPerGroup
    },
    totals: {
      rawLinearFt: Number(materials.reduce((sum, bucket) => sum + bucket.rawLinearFt, 0).toFixed(3)),
      adjustedLinearFt: Number(materials.reduce((sum, bucket) => sum + bucket.adjustedLinearFt, 0).toFixed(3)),
      setupAllowanceFt: Number(materials.reduce((sum, bucket) => sum + bucket.setupAllowanceFt, 0).toFixed(3)),
      estimatedDemandFt: Number(materials.reduce((sum, bucket) => sum + bucket.estimatedDemandFt, 0).toFixed(3))
    },
    materials,
    unmappedParts: valid
      .filter((estimate) => estimate.bandedEdgeCount > 0 && !estimate.edgeBandMaterialKey)
      .map((estimate) => ({
        partId: estimate.partId,
        labelCode: estimate.labelCode,
        reason: "Panel material does not have an edge band material mapping."
      })),
    invalidParts: invalid.map((estimate) => ({
      partId: estimate.partId,
      labelCode: estimate.labelCode,
      reason: estimate.reason
    }))
  };
}

function estimateRecords(
  parts: Array<{
    id: string;
    orderId: string | null;
    manufacturingJobId: string | null;
    materialCode: string | null;
    edgeBandPattern: string;
    widthIn: { toString(): string };
    depthIn: { toString(): string };
    instanceNumber: number;
    orderItem: { sourceEdgeBandText: string | null } | null;
    manufacturingJob: {
      labelCode: string;
      source: "CONFIGURATOR" | "AMAZON";
      edgeBandPattern: string;
    } | null;
  }>
) {
  return parts.map((part) =>
    estimatePartEdgeBand({
      partId: part.id,
      orderId: part.orderId ?? undefined,
      jobId: part.manufacturingJobId ?? undefined,
      materialCode: part.materialCode as never,
      labelCode: part.manufacturingJob
        ? labelCodeFor(part.manufacturingJob.labelCode, part.instanceNumber)
        : part.id,
      widthIn: toNumber(part.widthIn),
      depthIn: toNumber(part.depthIn),
      source: part.manufacturingJob?.source ?? "CONFIGURATOR",
      sourceEdgeBandText: part.orderItem?.sourceEdgeBandText,
      edgeBandPattern: part.orderItem?.sourceEdgeBandText ? undefined : part.edgeBandPattern || part.manufacturingJob?.edgeBandPattern
    })
  );
}

export async function getForecastEdgeBandEstimate(organizationId = LOCAL_ORG_ID) {
  const parts = await selectForecastEdgeBandParts(organizationId);
  const summary = summarizeEstimates(estimateRecords(parts));

  return {
    ok: true,
    scope: "forecast" as const,
    ...summary
  };
}

export async function getBatchEdgeBandEstimate(batchId: string, organizationId = LOCAL_ORG_ID) {
  const parts = await selectBatchEdgeBandParts(batchId, organizationId);

  if (parts.length === 0) {
    throw new Error("Batch not found or has no parts.");
  }

  const batch = parts[0].batch;
  const summary = summarizeEstimates(estimateRecords(parts));

  return {
    ok: true,
    scope: "batch" as const,
    batch: {
      id: batch?.id ?? batchId,
      code: batch?.code ?? "UNKNOWN",
      materialCode: batch?.materialCode ?? null
    },
    ...summary
  };
}

export async function getOrderEdgeBandEstimate(orderId: string, organizationId = LOCAL_ORG_ID) {
  const parts = await selectOrderEdgeBandParts(orderId, organizationId);

  if (parts.length === 0) {
    throw new Error("Order not found or has no parts.");
  }

  const summary = summarizeEstimates(estimateRecords(parts));

  return {
    ok: true,
    scope: "order" as const,
    order: {
      id: orderId,
      customerName: parts[0].order?.customerName ?? "Unknown"
    },
    ...summary
  };
}

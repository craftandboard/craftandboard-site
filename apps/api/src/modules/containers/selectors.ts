import type { BatchSortingSummary, ContainerPartRow, ContainerSummary, ContainerStatus, ContainerType, MaterialCode } from "@craft-and-board/shared";

export const SORTING_ELIGIBLE_PART_STATUSES = ["READY_FOR_BATCH", "BATCHED", "CUT", "EDGEBANDED"] as const;
export type SortingEligiblePartStatus = (typeof SORTING_ELIGIBLE_PART_STATUSES)[number];

export function labelCodeFor(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

export function mapContainerSummary(input: {
  id: string;
  batchId: string | null;
  code: string;
  label: string;
  type: ContainerType;
  status: ContainerStatus;
  notes: string | null;
  orderId: string | null;
  manufacturingJobId: string | null;
  partCount: number;
  completionPct: number;
  mixed: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ContainerSummary {
  return {
    id: input.id,
    batchId: input.batchId ?? undefined,
    code: input.code,
    label: input.label,
    type: input.type,
    status: input.status,
    notes: input.notes ?? undefined,
    orderId: input.orderId ?? undefined,
    manufacturingJobId: input.manufacturingJobId ?? undefined,
    partCount: input.partCount,
    completionPct: input.completionPct,
    mixed: input.mixed,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString()
  };
}

export function mapContainerPartRow(input: {
  id: string;
  orderId: string | null;
  manufacturingJobId: string | null;
  partCode: string;
  instanceNumber: number;
  scanCode: string;
  materialCode: MaterialCode | null;
  widthIn: { toString(): string };
  depthIn: { toString(): string };
  thicknessIn: { toString(): string };
  status: string;
  manufacturingJob: {
    labelCode: string;
    source: "CONFIGURATOR" | "AMAZON";
  } | null;
}): ContainerPartRow {
  return {
    partId: input.id,
    jobId: input.manufacturingJobId ?? undefined,
    orderId: input.orderId ?? undefined,
    labelCode: labelCodeFor(input.manufacturingJob?.labelCode ?? input.partCode, input.instanceNumber),
    scanCode: input.scanCode,
    material: (input.materialCode ?? "WHITE_MELAMINE") as MaterialCode,
    width: Number(input.widthIn.toString()),
    depth: Number(input.depthIn.toString()),
    thickness: Number(input.thicknessIn.toString()),
    status: input.status.toLowerCase() as ContainerPartRow["status"],
    source: (input.manufacturingJob?.source ?? "CONFIGURATOR") as "CONFIGURATOR" | "AMAZON"
  };
}

export function buildSortingSummary(input: {
  batchId: string;
  batchCode: string;
  totalParts: number;
  assignedParts: number;
  openContainers: number;
}): BatchSortingSummary {
  const unassignedParts = Math.max(input.totalParts - input.assignedParts, 0);
  const completionPct = input.totalParts === 0 ? 0 : Math.round((input.assignedParts / input.totalParts) * 100);

  return {
    batchId: input.batchId,
    batchCode: input.batchCode,
    totalParts: input.totalParts,
    assignedParts: input.assignedParts,
    unassignedParts,
    openContainers: input.openContainers,
    completionPct
  };
}

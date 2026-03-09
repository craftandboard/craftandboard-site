import { prisma } from "../../lib/prisma.js";

export type MachineEventLinkResult = {
  linkedBatchId?: string;
  linkedManufacturingJobId?: string;
  linkedPartId?: string;
  processingStatus: "LINKED" | "UNMATCHED";
};

function normalizeRef(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function linkMachineEventToContext(input: {
  organizationId: string;
  normalizedBatchRef?: string;
  normalizedJobRef?: string;
  normalizedPartRef?: string;
}): Promise<MachineEventLinkResult> {
  const normalizedPartRef = normalizeRef(input.normalizedPartRef);
  const normalizedBatchRef = normalizeRef(input.normalizedBatchRef);
  const normalizedJobRef = normalizeRef(input.normalizedJobRef);

  const linkedPart = normalizedPartRef
    ? await prisma.part.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [{ scanCode: normalizedPartRef }, { id: normalizedPartRef }, { partCode: normalizedPartRef }]
        },
        select: { id: true }
      })
    : null;

  const linkedBatch = normalizedBatchRef
    ? await prisma.batch.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [{ id: normalizedBatchRef }, { code: normalizedBatchRef }]
        },
        select: { id: true }
      })
    : null;

  const linkedManufacturingJob = normalizedJobRef
    ? await prisma.manufacturingJob.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [{ id: normalizedJobRef }, { labelCode: normalizedJobRef }]
        },
        select: { id: true }
      })
    : null;

  const linked = Boolean(linkedPart || linkedBatch || linkedManufacturingJob);

  return {
    linkedBatchId: linkedBatch?.id,
    linkedManufacturingJobId: linkedManufacturingJob?.id,
    linkedPartId: linkedPart?.id,
    processingStatus: linked ? "LINKED" : "UNMATCHED"
  };
}

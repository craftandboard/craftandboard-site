import { prisma } from "../../lib/prisma.js";
import type { MachineEventLinkConfidence, MachineEventLinkMethod, MachineTelemetryEntityType } from "./contracts.js";

type LinkRow = {
  entityType: MachineTelemetryEntityType;
  entityId: string;
  confidence: MachineEventLinkConfidence;
  linkMethod: MachineEventLinkMethod;
  notes?: string;
};

export async function linkMachineTelemetryEvent(input: {
  organizationId: string;
  normalizedBatchRef?: string;
  normalizedPartRef?: string;
  normalizedRemnantRef?: string;
  programName?: string;
}) {
  const links: LinkRow[] = [];

  if (input.normalizedBatchRef) {
    const batch = await prisma.manufacturingBatch.findFirst({
      where: {
        organizationId: input.organizationId,
        OR: [{ id: input.normalizedBatchRef }, { batchNumber: input.normalizedBatchRef }]
      },
      select: { id: true }
    });
    if (batch) {
      links.push({
        entityType: "MANUFACTURING_BATCH",
        entityId: batch.id,
        confidence: "HIGH",
        linkMethod: "BATCH_NUMBER_MATCH"
      });
    }
  }

  if (input.normalizedPartRef) {
    const part = await prisma.manufacturingPart.findFirst({
      where: {
        organizationId: input.organizationId,
        OR: [{ id: input.normalizedPartRef }, { partNumber: input.normalizedPartRef }]
      },
      select: { id: true }
    });
    if (part) {
      links.push({
        entityType: "MANUFACTURING_PART",
        entityId: part.id,
        confidence: "HIGH",
        linkMethod: "PART_NUMBER_MATCH"
      });
    }
  }

  if (input.normalizedRemnantRef) {
    const remnant = await prisma.remnant.findFirst({
      where: {
        organizationId: input.organizationId,
        OR: [{ id: input.normalizedRemnantRef }, { remnantCode: input.normalizedRemnantRef }, { code: input.normalizedRemnantRef }]
      },
      select: { id: true }
    });
    if (remnant) {
      links.push({
        entityType: "REMNANT",
        entityId: remnant.id,
        confidence: "HIGH",
        linkMethod: "REMNANT_CODE_MATCH"
      });
    }
  }

  if (links.length === 0 && input.programName) {
    const batch = await prisma.manufacturingBatch.findFirst({
      where: {
        organizationId: input.organizationId,
        batchNumber: input.programName
      },
      select: { id: true }
    });
    if (batch) {
      links.push({
        entityType: "MANUFACTURING_BATCH",
        entityId: batch.id,
        confidence: "LOW",
        linkMethod: "PROGRAM_NAME_MATCH",
        notes: "Linked via programName heuristic."
      });
    }
  }

  const primaryLink =
    links.find((link) => link.confidence === "HIGH") ??
    links.find((link) => link.confidence === "MEDIUM") ??
    links[0];

  return {
    links,
    primaryLink,
    processingStatus: links.length > 0 ? "LINKED" : "NORMALIZED"
  } as const;
}

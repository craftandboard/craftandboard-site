import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function resolveMachineByIdOrCode(input: {
  organizationId: string;
  machineId?: string;
  machineCode?: string;
}) {
  if (input.machineId) {
    return prisma.machine.findFirst({
      where: {
        id: input.machineId,
        organizationId: input.organizationId
      }
    });
  }

  if (input.machineCode) {
    return prisma.machine.findFirst({
      where: {
        code: input.machineCode,
        organizationId: input.organizationId
      }
    });
  }

  return null;
}

export function buildMachineEventWhere(input: {
  organizationId: string;
  machineId?: string;
  eventType?: string;
  processingStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Prisma.MachineEventWhereInput {
  return {
    organizationId: input.organizationId,
    ...(input.machineId ? { machineId: input.machineId } : {}),
    ...(input.eventType ? { eventType: input.eventType } : {}),
    ...(input.processingStatus ? { processingStatus: input.processingStatus as never } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          eventTs: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {})
          }
        }
      : {})
  };
}

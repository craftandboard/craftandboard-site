import type { Prisma } from "@prisma/client";

export function buildStageCandidateWhere(input: {
  organizationId: string;
  status?: string;
  targetType?: string;
  machineId?: string;
  batchId?: string;
  recommendedAction?: string;
}) {
  return {
    organizationId: input.organizationId,
    ...(input.status ? { status: input.status as never } : {}),
    ...(input.targetType ? { targetType: input.targetType as never } : {}),
    ...(input.machineId ? { sourceMachineId: input.machineId } : {}),
    ...(input.batchId ? { targetBatchId: input.batchId } : {}),
    ...(input.recommendedAction ? { recommendedAction: input.recommendedAction as never } : {})
  } satisfies Prisma.StageCandidateSignalWhereInput;
}

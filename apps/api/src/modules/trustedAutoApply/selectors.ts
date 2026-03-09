import { prisma } from "../../lib/prisma.js";
import type { MachineType } from "../machines/contracts.js";
import type { TrustedAutoApplyAction } from "./contracts.js";

export async function findMatchingTrustedAutoApplyRule(input: {
  organizationId: string;
  machineId: string;
  machineType: MachineType;
  candidateAction: TrustedAutoApplyAction;
}) {
  const machineSpecificRule = await prisma.trustedAutoApplyRule.findFirst({
    where: {
      organizationId: input.organizationId,
      machineId: input.machineId,
      candidateAction: input.candidateAction,
      enabled: true
    },
    orderBy: { createdAt: "asc" }
  });

  if (machineSpecificRule) {
    return machineSpecificRule;
  }

  return prisma.trustedAutoApplyRule.findFirst({
    where: {
      organizationId: input.organizationId,
      machineId: null,
      machineType: input.machineType,
      candidateAction: input.candidateAction,
      enabled: true
    },
    orderBy: { createdAt: "asc" }
  });
}

import { prisma } from "../../lib/prisma.js";
import type { MachineType } from "../machines/contracts.js";
import { TRUSTED_AUTO_APPLY_ACTIONS, type TrustedAutoApplyAction } from "./contracts.js";

const ruleInclude = {
  machine: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      status: true
    }
  }
} as const;

function mapRule(
  rule: Awaited<ReturnType<typeof prisma.trustedAutoApplyRule.findFirstOrThrow>> & {
    machine?: { id: string; code: string; name: string; type: string; status: string } | null;
  }
) {
  return {
    id: rule.id,
    organizationId: rule.organizationId,
    machineId: rule.machineId ?? undefined,
    machineType: rule.machineType ?? undefined,
    candidateAction: rule.candidateAction,
    enabled: rule.enabled,
    notes: rule.notes ?? undefined,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    machine: rule.machine
      ? {
          id: rule.machine.id,
          code: rule.machine.code,
          name: rule.machine.name,
          type: rule.machine.type,
          status: rule.machine.status
        }
      : undefined
  };
}

export async function listTrustedAutoApplyRules(organizationId: string) {
  const rules = await prisma.trustedAutoApplyRule.findMany({
    where: { organizationId },
    include: ruleInclude,
    orderBy: [{ candidateAction: "asc" }, { createdAt: "asc" }]
  });

  return {
    ok: true as const,
    rules: rules.map(mapRule)
  };
}

export async function createTrustedAutoApplyRule(
  input: {
    machineId?: string;
    machineType?: MachineType;
    candidateAction: TrustedAutoApplyAction;
    enabled?: boolean;
    notes?: string;
  },
  organizationId: string
) {
  if (!TRUSTED_AUTO_APPLY_ACTIONS.includes(input.candidateAction)) {
    throw new Error("Trusted auto-apply action is not supported.");
  }

  if (!input.machineId && !input.machineType) {
    throw new Error("Trusted auto-apply rules must target a machine or machine type.");
  }

  if (input.machineId && input.machineType) {
    throw new Error("Trusted auto-apply rules must target either a machine or machine type, not both.");
  }

  if (input.machineId) {
    const machine = await prisma.machine.findFirst({
      where: {
        id: input.machineId,
        organizationId
      }
    });

    if (!machine) {
      throw new Error("Machine not found.");
    }
  }

  const existing = await prisma.trustedAutoApplyRule.findFirst({
    where: {
      organizationId,
      machineId: input.machineId ?? null,
      machineType: input.machineType ?? null,
      candidateAction: input.candidateAction
    }
  });

  if (existing) {
    throw new Error("A trusted auto-apply rule already exists for that scope and action.");
  }

  const rule = await prisma.trustedAutoApplyRule.create({
    data: {
      organizationId,
      machineId: input.machineId ?? null,
      machineType: input.machineType ?? null,
      candidateAction: input.candidateAction,
      enabled: input.enabled ?? true,
      notes: input.notes?.trim() || null
    },
    include: ruleInclude
  });

  return {
    ok: true as const,
    rule: mapRule(rule)
  };
}

export async function updateTrustedAutoApplyRule(
  ruleId: string,
  input: {
    enabled?: boolean;
    notes?: string;
  },
  organizationId: string
) {
  const existing = await prisma.trustedAutoApplyRule.findFirst({
    where: {
      id: ruleId,
      organizationId
    }
  });

  if (!existing) {
    throw new Error("Trusted auto-apply rule not found.");
  }

  const rule = await prisma.trustedAutoApplyRule.update({
    where: { id: ruleId },
    data: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
    },
    include: ruleInclude
  });

  return {
    ok: true as const,
    rule: mapRule(rule)
  };
}

export async function disableTrustedAutoApplyRule(ruleId: string, organizationId: string) {
  return updateTrustedAutoApplyRule(ruleId, { enabled: false }, organizationId);
}

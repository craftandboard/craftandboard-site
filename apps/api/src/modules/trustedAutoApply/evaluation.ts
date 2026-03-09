import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { TRUSTED_AUTO_APPLY_ACTIONS } from "./contracts.js";
import { findMatchingTrustedAutoApplyRule } from "./selectors.js";
import { autoApplyStageCandidateSignal } from "../stageSignals/service.js";

function isTrustedAutoApplyAction(
  value: string
): value is "MARK_PART_CUT" | "MARK_PART_EDGEBANDED" | "MARK_BATCH_CUT_IN_PROGRESS" | "MARK_BATCH_CUT_COMPLETE" {
  return TRUSTED_AUTO_APPLY_ACTIONS.includes(
    value as "MARK_PART_CUT" | "MARK_PART_EDGEBANDED" | "MARK_BATCH_CUT_IN_PROGRESS" | "MARK_BATCH_CUT_COMPLETE"
  );
}

export async function evaluateTrustedAutoApplyForCandidate(candidateId: string, organizationId: string) {
  const candidate = await prisma.stageCandidateSignal.findFirst({
    where: {
      id: candidateId,
      organizationId
    },
    include: {
      sourceMachine: {
        select: {
          id: true,
          type: true,
          status: true
        }
      }
    }
  });

  if (!candidate || candidate.status !== "OPEN" || candidate.confidence !== "HIGH") {
    return { matched: false as const, autoApplied: false as const };
  }

  if (!isTrustedAutoApplyAction(candidate.recommendedAction)) {
    return { matched: false as const, autoApplied: false as const };
  }

  if (!candidate.sourceMachine || candidate.sourceMachine.status !== "ACTIVE") {
    return { matched: false as const, autoApplied: false as const };
  }

  const matchingRule = await findMatchingTrustedAutoApplyRule({
    organizationId,
    machineId: candidate.sourceMachine.id,
    machineType: candidate.sourceMachine.type,
    candidateAction: candidate.recommendedAction
  });

  if (!matchingRule) {
    return { matched: false as const, autoApplied: false as const };
  }

  const rationale = matchingRule.machineId
    ? `Trusted auto-apply matched machine-specific rule ${matchingRule.id}.`
    : `Trusted auto-apply matched ${matchingRule.machineType} machine-type rule ${matchingRule.id}.`;

  try {
    await autoApplyStageCandidateSignal(
      candidate.id,
      {
        ruleId: matchingRule.id,
        rationale
      },
      organizationId
    );

    return {
      matched: true as const,
      autoApplied: true as const,
      ruleId: matchingRule.id
    };
  } catch (error) {
    logger.error("Trusted auto-apply evaluation failed", {
      candidateId,
      organizationId,
      ruleId: matchingRule.id,
      error
    });

    return {
      matched: true as const,
      autoApplied: false as const,
      ruleId: matchingRule.id
    };
  }
}

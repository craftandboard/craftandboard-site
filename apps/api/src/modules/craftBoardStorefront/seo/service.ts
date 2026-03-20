import { prisma } from "../../../lib/prisma.js";
import { logger } from "../../../lib/logger.js";

function sourcePathFromConfiguration(value: unknown) {
  if (!value || typeof value !== "object" || !("sourcePath" in value)) {
    return null;
  }

  const sourcePath = (value as Record<string, unknown>).sourcePath;
  return typeof sourcePath === "string" && sourcePath.trim().length > 0
    ? sourcePath.trim()
    : null;
}

export async function listStorefrontSeoAttributionAttempts(input: {
  organizationId: string;
  lookbackDays: number;
}) {
  const lookbackDays = Number.isFinite(input.lookbackDays) ? Math.max(1, Math.min(365, Math.floor(input.lookbackDays))) : 28;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (lookbackDays - 1));

  logger.info("Listing storefront SEO attribution attempts", {
    organizationId: input.organizationId,
    lookbackDays
  });

  const attempts = await prisma.craftBoardStorefrontOrderAttempt.findMany({
    where: {
      organizationId: input.organizationId,
      createdAt: { gte: startDate }
    },
    select: {
      id: true,
      createdAt: true,
      configurationJson: true,
      productFamily: true,
      paymentStatus: true,
      paidAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    ok: true as const,
    lookbackDays,
    attempts: attempts
      .map((attempt) => ({
        attemptId: attempt.id,
        createdAt: attempt.createdAt.toISOString(),
        sourcePath: sourcePathFromConfiguration(attempt.configurationJson),
        productFamily: attempt.productFamily,
        paymentStatus: attempt.paymentStatus,
        paidAt: attempt.paidAt?.toISOString() ?? null
      }))
      .filter((attempt): attempt is typeof attempt & { sourcePath: string } => Boolean(attempt.sourcePath))
      .map((attempt) => ({
        attemptId: attempt.attemptId,
        createdAt: attempt.createdAt,
        sourcePath: attempt.sourcePath,
        productFamily: attempt.productFamily,
        paymentStatus: attempt.paymentStatus,
        paidAt: attempt.paidAt
      }))
  };
}

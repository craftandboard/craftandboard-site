import { prisma } from "../../lib/prisma.js";

export async function markStageCandidateRejected(input: {
  candidateId: string;
  organizationId: string;
  memberId: string;
  rejectionReason: string;
}) {
  const candidate = await prisma.stageCandidateSignal.findFirst({
    where: {
      id: input.candidateId,
      organizationId: input.organizationId
    }
  });

  if (!candidate) {
    throw new Error("Stage candidate signal not found.");
  }

  if (candidate.status !== "OPEN") {
    throw new Error(`Stage candidate signal ${candidate.id} is already ${candidate.status}.`);
  }

  return prisma.stageCandidateSignal.update({
    where: { id: candidate.id },
    data: {
      status: "REJECTED",
      reviewedByMemberId: input.memberId,
      reviewedAt: new Date(),
      rejectedAt: new Date(),
      rejectionReason: input.rejectionReason.trim()
    }
  });
}

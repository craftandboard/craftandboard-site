import { decimalToNumber } from "../../utils/decimal.js";
import type { PublicProposalSnapshot } from "./contracts.js";

type ProposalBundle = {
  organization: { name: string } | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  sections: Array<{
    title: string;
    lines: Array<{
      name: string;
      description: string | null;
      qty: { toNumber(): number };
      unit: string | null;
      priceCents: number;
    }>;
  }>;
  lines: Array<{
    name: string;
    description: string | null;
    qty: { toNumber(): number };
    unit: string | null;
    priceCents: number;
  }>;
};

export function buildSnapshotFromCanonicalProposal(input: {
  proposal: ProposalBundle;
  paymentSummary: {
    requestedAmountCents: number;
    paidAmountCents: number;
    outstandingAmountCents: number;
    depositRequestedAmountCents: number;
    depositPaidAmountCents: number;
    hasOpenDepositRequest: boolean;
  };
}): PublicProposalSnapshot {
  const sections = input.proposal.sections.map((section) => ({
    title: section.title,
    lines: section.lines.map((line) => ({
      name: line.name,
      description: line.description,
      qty: decimalToNumber(line.qty),
      unit: line.unit,
      priceCents: line.priceCents
    }))
  }));

  const unsectionedLines = input.proposal.lines.map((line) => ({
    name: line.name,
    description: line.description,
    qty: decimalToNumber(line.qty),
    unit: line.unit,
    priceCents: line.priceCents
  }));

  const totalAmountCents =
    sections.reduce(
      (sum, section) => sum + section.lines.reduce((sectionSum, line) => sectionSum + line.priceCents, 0),
      0
    ) + unsectionedLines.reduce((sum, line) => sum + line.priceCents, 0);

  return {
    organizationName: input.proposal.organization?.name ?? null,
    title: input.proposal.title,
    summary: input.proposal.title ? `Proposal review for ${input.proposal.title}` : "Proposal review",
    createdAt: input.proposal.createdAt.toISOString(),
    updatedAt: input.proposal.updatedAt.toISOString(),
    sections,
    unsectionedLines,
    totals: {
      totalAmountCents,
      currency: "USD"
    },
    depositSummary: {
      policy: input.proposal.depositPolicy,
      requestedAmountCents: input.paymentSummary.requestedAmountCents,
      paidAmountCents: input.paymentSummary.paidAmountCents,
      outstandingAmountCents: input.paymentSummary.outstandingAmountCents,
      depositRequestedAmountCents: input.paymentSummary.depositRequestedAmountCents,
      depositPaidAmountCents: input.paymentSummary.depositPaidAmountCents,
      hasOpenDepositRequest: input.paymentSummary.hasOpenDepositRequest
    }
  };
}

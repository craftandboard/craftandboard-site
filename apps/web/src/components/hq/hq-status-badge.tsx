import type { HqDocumentStatus, HqSectionStatus } from "../../lib/hq/types";

const SECTION_LABELS: Record<HqSectionStatus, string> = {
  NOT_STARTED: "Not started",
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  READY_FOR_REVIEW: "Ready for review",
  AGREED: "Agreed"
};

const DOCUMENT_LABELS: Record<HqDocumentStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  NEEDS_SIGNATURE: "Needs signature",
  SIGNED: "Signed"
};

const TONES: Record<string, string> = {
  NOT_STARTED: "border-[#ded2c5] bg-[#f6efe6] text-[#7a6858]",
  DRAFT: "border-[#ded2c5] bg-[#f6efe6] text-[#7a6858]",
  IN_REVIEW: "border-[#d9c6ac] bg-[#fbf1e2] text-[#87664b]",
  IN_PROGRESS: "border-[#d9c6ac] bg-[#fbf1e2] text-[#87664b]",
  NEEDS_SIGNATURE: "border-[#d9c6ac] bg-[#fbf1e2] text-[#87664b]",
  READY_FOR_REVIEW: "border-[#c9d0b2] bg-[#f2f5e8] text-[#5d6a42]",
  AGREED: "border-[#c9d0b2] bg-[#f2f5e8] text-[#5d6a42]",
  SIGNED: "border-[#c9d0b2] bg-[#f2f5e8] text-[#5d6a42]"
};

export function HqStatusBadge({ status }: { status: HqSectionStatus | HqDocumentStatus }) {
  const label =
    status in SECTION_LABELS
      ? SECTION_LABELS[status as HqSectionStatus]
      : DOCUMENT_LABELS[status as HqDocumentStatus];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${
        TONES[status] ?? TONES.DRAFT
      }`}
    >
      {label}
    </span>
  );
}

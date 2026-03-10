export type PilotFeedbackView = {
  id: string;
  orgId: string;
  membershipId: string | null;
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status: "NEW" | "REVIEWED" | "RESOLVED";
  pagePath: string | null;
  title: string;
  message: string;
  reproductionNotes: string | null;
  screenshotUrl: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PilotFeedbackSummaryView = {
  openBlockerCount: number;
  openHighSeverityCount: number;
  openCount: number;
  latestSubmittedAt: string | null;
};

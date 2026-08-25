import type { HqSectionKey } from "./types";

export const HQ_HOME_PATH = "/hq";

/** Absolute origin for HQ, used for canonical/off-host links. */
export const HQ_URL = (process.env.NEXT_PUBLIC_HQ_URL ?? "https://hq.craftandboard.com").replace(
  /\/+$/,
  ""
);

export interface HqSectionDefinition {
  key: HqSectionKey;
  label: string;
  href: string;
  summary: string;
}

export const HQ_SECTIONS: HqSectionDefinition[] = [
  {
    key: "vision",
    label: "Vision",
    href: "/hq/vision",
    summary: "What Craft & Board is and why we are building it."
  },
  {
    key: "opportunity",
    label: "Opportunity",
    href: "/hq/opportunity",
    summary: "Market, customer, competition, and the edge."
  },
  {
    key: "roles",
    label: "Roles",
    href: "/hq/roles",
    summary: "The four questions, the roles table, and ownership options."
  },
  {
    key: "numbers",
    label: "Numbers",
    href: "/hq/numbers",
    summary: "Startup costs, equipment, revenue, and breakeven."
  },
  {
    key: "partnership-agreement",
    label: "Partnership Agreement",
    href: "/hq/partnership-agreement",
    summary: "Twelve questions to line up on before the attorney drafts the real document."
  },
  {
    key: "documents",
    label: "Documents",
    href: "/hq/documents",
    summary: "Google Docs links and where each one stands."
  },
  {
    key: "decisions",
    label: "Decisions",
    href: "/hq/decisions",
    summary: "What we agreed, when, and who agreed."
  }
];

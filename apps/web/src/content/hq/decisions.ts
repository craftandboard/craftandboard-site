import type { HqDecisionRecord, HqStaticSection } from "../../lib/hq/types";

/**
 * Static intro plus the transcription fixture standing in for the
 * `HqDecision` table. Pages must not import this directly — it is read
 * through `lib/hq/data.ts`.
 */
export const hqDecisionsIntro: HqStaticSection = {
  title: "Decisions",
  intent: "What we actually agreed, when, and who agreed to it.",
  status: "NOT_STARTED",
  blocks: [
    {
      heading: "What belongs here",
      body:
        "A decision lands here only after all three partners have agreed to it. Everything else — proposals, options, open questions — stays on its own page.",
      points: [
        "One entry per decision, written so it still makes sense in six months",
        "`agreedBy` lists the people who actually agreed, not everyone present",
        "If a decision is reversed later, add a new entry rather than editing the old one"
      ]
    }
  ]
};

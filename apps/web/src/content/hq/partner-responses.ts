import type { HqPartnerResponseRecord } from "../../lib/hq/types";

/**
 * Transcription fixture standing in for the `HqPartnerResponse` table.
 *
 * Pages must not import this directly — it is read through `lib/hq/data.ts`.
 *
 * There are no writers by design: Tim answers by text, Tyler answers in
 * person, and Brandon transcribes. To record an answer, add an entry below.
 * `personName` must match a name in `content/hq/roles.ts` and `question` must
 * match a question number from the same file.
 *
 *   {
 *     id: "brandon-1",
 *     personName: "Brandon",
 *     question: 1,
 *     body: "…what he actually said…",
 *     submittedAt: "2026-08-23T00:00:00.000Z",
 *     updatedAt: "2026-08-23T00:00:00.000Z"
 *   }
 *
 * Answers are intentionally empty until they come back.
 */
export const hqPartnerResponseRecords: HqPartnerResponseRecord[] = [];

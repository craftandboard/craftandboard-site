import type { HqDocumentRecord } from "../../lib/hq/types";

/**
 * Transcription fixture standing in for the `HqDocument` table.
 *
 * Pages must not import this directly — it is read through `lib/hq/data.ts`.
 *
 * Add an entry once a Google Doc actually exists. `title` should match the
 * checklist entry in `content/hq/documents.ts` so the two line up.
 *
 *   {
 *     id: "partnership-agreement",
 *     title: "Partnership agreement",
 *     url: "https://docs.google.com/document/d/…",
 *     status: "IN_REVIEW",
 *     sortOrder: 10,
 *     createdAt: "2026-08-23T00:00:00.000Z",
 *     updatedAt: "2026-08-23T00:00:00.000Z"
 *   }
 *
 * Empty until the first document is created — no placeholder URLs.
 */
export const hqDocumentRecords: HqDocumentRecord[] = [];

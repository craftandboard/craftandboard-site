# FieldMetriq MVP Pilot Hardening Plan

## What changed for pilot hardening
- Proposal editor usability was tightened with clearer estimate-builder grouping, better empty states, stronger action labels, and a pilot readiness summary card.
- Acceptance-link lifecycle is now visible on the proposal screen with clearer intake state labels, copy/share behavior for fresh links, and a safe reissue path for expired, revoked, submitted, or completed links.
- The thin public acceptance page now distinguishes invalid, expired, revoked, blocked, submitted, and completed states more clearly and tells signers when they need a new link from the sender.
- A narrow internal pilot feedback workflow now exists so blocker and high-severity issues can be captured and triaged inside the app at `/pilot-feedback`.

## Failure states now covered
- No proposal sections or no line items
- No active acceptance link
- Active intake exists but token is no longer re-readable
- Expired or revoked acceptance link
- Already submitted or already completed public acceptance flow
- Empty deposit request and payment states
- Conversion blocked with plain-language reasons
- Missing pilot feedback visibility during live sessions

## How to reissue acceptance links
1. Open the proposal screen.
2. Check the `Share & Acceptance` card.
3. If the latest intake is expired, revoked, submitted, completed, or otherwise not shareable, click `Reissue Acceptance Link`.
4. Copy the fresh link immediately from the card.

The existing intake history remains preserved. Reissue creates a new public-token intake rather than mutating or deleting the old one.

## How pilot feedback is captured
- Internal users can open `/pilot-feedback` from the `MVP Pilot` nav group.
- Proposal editors also include an embedded feedback form so friction can be logged in context.
- Feedback captures area, severity, page path, title, message, reproduction notes, and optional screenshot URL.
- The feedback list shows open blockers, open high-severity items, and the latest submitted issue so you can see where testers are getting stuck.

## Still intentionally out of scope before pilot
- Scheduling
- Notifications
- Invoice UI
- Advanced dashboards and reporting
- Full public proposal portal or branded public UX
- Signature provider runtime or branded e-sign flows
- Accounting UI
- Manufacturing or operational UI beyond the basic project handoff

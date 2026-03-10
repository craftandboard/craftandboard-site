# FieldMetriq Public Intake Retry Plan

## Recovery and completion states now handled
- `READY` / `REVIEW_READY`: the signer can review the proposal and continue.
- `READY_TO_CONFIRM`: the signer can submit confirmation.
- `SUBMITTED`: the confirmation was already received and no duplicate submission is needed.
- `COMPLETED` / `CONFIRMED`: acceptance already completed and no further signer action is required.
- `EXPIRED`: the link can no longer be used and a new one must be issued internally.
- `REVOKED`: the link was intentionally disabled and a new one must be issued internally if needed.
- `INVALID`: the token is not usable and the signer is told to contact the sender.
- `BLOCKED`: the review cannot proceed safely and the signer gets a neutral fallback instruction.

## Internal reissue workflow
1. Open the proposal.
2. Review the `Share & Acceptance` card.
3. If the link is expired, revoked, submitted, completed, or otherwise no longer shareable, click `Reissue Acceptance Link`.
4. Copy the fresh link immediately from the same card.

The old intake remains in history. Reissue creates a new public token instead of editing historical records.

## Public stale-link messaging
- Expired link: "This link expired. Please contact the sender for a new link."
- Revoked link: "This link was revoked. Please contact the sender for a new link."
- Invalid link: "This link is not available. Please contact the sender for help."
- Submitted/completed link: "Your confirmation was already received" or "Acceptance already completed" with no duplicate submit action.

## Still intentionally out of scope
- Email or SMS resend workflows
- Full public proposal portal
- Public accounts or login
- Branded portal work
- Signature-provider execution
- Invoice or accounting flows

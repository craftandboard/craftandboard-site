# FieldMetriq UI MVP Plan

## Exact pages built
- `/leads`
- `/leads/new`
- `/leads/:leadId`
- `/proposals/:proposalId`
- `/projects`
- `/projects/:projectId`
- `/accept/proposal?token=...`
- `/pilot-feedback`

## Exact API routes consumed
- `GET /leads`
- `GET /leads/:leadLookup`
- `POST /leads`
- `PATCH /leads/:leadId`
- `GET /proposals`
- `GET /proposals/:proposalLookup`
- `POST /proposals`
- `PATCH /proposals/:proposalId`
- `POST /proposals/:proposalId/sections`
- `PATCH /proposals/:proposalId/sections/:sectionId`
- `POST /proposals/:proposalId/lines`
- `PATCH /proposals/:proposalId/lines/:lineId`
- `POST /proposals/:proposalId/acceptance-intakes`
- `GET /proposals/:proposalId/acceptance-intakes`
- `GET /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/acceptance`
- `PATCH /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/deposit-requests`
- `GET /proposals/:proposalId/deposit-requests`
- `POST /proposals/:proposalId/payments`
- `GET /proposals/:proposalId/payments`
- `GET /proposals/:proposalId/payment-summary`
- `POST /proposals/:proposalId/conversion-evaluation`
- `GET /proposals/:proposalId/conversion`
- `POST /proposals/:proposalId/convert`
- `GET /projects`
- `GET /projects/:projectLookup`
- `GET /pilot-feedback`
- `POST /pilot-feedback`
- `PATCH /pilot-feedback/:feedbackId`
- `POST /public/proposal-acceptance/review`
- `POST /public/proposal-acceptance/presentation-state`
- `POST /public/proposal-acceptance/instructions`
- `POST /public/proposal-acceptance/ready-state`
- `POST /public/proposal-acceptance/confirmation`
- `POST /public/proposal-acceptance/presentation-viewed`
- `POST /public/proposal-acceptance/submit`

## MVP flow covered
1. Create a lead
2. Update lead summary and stage
3. Create a proposal from the lead detail screen
4. Add sections and line items in the proposal editor
5. Review totals and deposit policy
6. Generate a public acceptance link
7. Reissue a fresh public acceptance link when an old one is expired, revoked, submitted, or no longer shareable
8. Review acceptance, deposit, and payment state in the proposal screen
9. Evaluate conversion and convert to project
10. Open the created project detail screen
11. Capture pilot friction in `/pilot-feedback`

## Known intentional gaps
- No full proposal list screen yet; proposals are entered from lead detail and project linkage.
- No rich search/filter UI yet.
- No advanced mutation UI for deposit status updates or payment status updates after creation.
- No provider execution UI yet.
- No notification or email delivery system for acceptance links yet.
- No invoice, accounting, notifications, scheduling, manufacturing, or advanced CRM surface.
- Public acceptance UI is intentionally thin and token-gated only.

## Pilot guidance
- Use the new `MVP Pilot` navigation section in the app shell.
- Start each tester on `/leads`.
- Keep pilot scenarios centered on one lead, one proposal, one acceptance link, one deposit, and one conversion at a time.

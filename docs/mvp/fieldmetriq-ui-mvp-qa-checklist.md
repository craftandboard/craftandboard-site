# FieldMetriq UI MVP QA Checklist

## Manual pilot checklist
1. Log in and confirm the `MVP Pilot` navigation section is visible.
2. Open `/leads` and confirm the empty or populated list renders without errors.
3. Create a lead from `/leads/new`.
4. Update the lead status, stage, summary, and contact fields from `/leads/:leadId`.
5. Create a proposal from the lead detail screen.
6. Open `/proposals/:proposalId` and update title, status, and deposit policy.
7. Add at least one proposal section.
8. Add at least one line item inside a section.
9. Add at least one unsectioned line item and confirm totals update after refresh.
10. Create a public acceptance link and copy it.
11. Open the public link in a separate browser session and confirm the review snapshot loads.
12. Confirm the public page shows a safe state for valid review, not just raw form fields.
13. Revoke or let an existing link expire, then confirm the public page shows a safe blocked/expired message.
14. Reissue a fresh acceptance link from the proposal screen and confirm it can be copied immediately.
15. Submit public acceptance with signer name and confirm the confirmation state appears.
16. Return to the internal proposal screen and confirm acceptance or intake state changed.
17. Create a deposit request and confirm it appears in the deposit list.
18. Record a manual payment and confirm the payment summary updates.
19. Run conversion evaluation and confirm eligible or blocked reasons render in plain language.
20. Convert the proposal to a project once eligible.
21. Confirm the UI routes to `/projects/:projectId` and shows the created project.
22. Open `/projects` and confirm the converted project appears in the list.
23. Open `/pilot-feedback`, submit one blocker or high-severity issue, and confirm it appears in the list.
24. Update that issue to `REVIEWED` or `RESOLVED` and confirm the pilot summary counts update.

## Known manual watchpoints
- Public acceptance routes should never leak internal IDs.
- Repeated acceptance link clicks should remain safe.
- Reissued acceptance links should create fresh shareable links without deleting intake history.
- If an active link exists but the token is not re-readable, the UI should explain that a fresh link must be issued.
- Proposal save, section save, and line save actions should show success or error feedback.
- Conversion should only be attempted after acceptance and deposit conditions are met.
- Pilot feedback should remain internal-only and never appear on public routes.

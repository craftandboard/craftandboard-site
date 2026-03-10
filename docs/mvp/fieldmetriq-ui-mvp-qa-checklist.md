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
13. Submit public acceptance with signer name and confirm the confirmation state appears.
14. Reload the same public link and confirm it now shows a safe already-submitted or completed state with no duplicate submit CTA.
15. Revoke or let an existing link expire, then confirm the public page shows a safe expired or revoked retry-needed state.
16. Open an invalid token and confirm the page shows a safe generic blocked state without leaking internals.
17. Reissue a fresh acceptance link from the proposal screen and confirm it becomes the clearly shareable link and can be copied immediately.
18. Return to the internal proposal screen and confirm it clearly shows acceptance completed vs needs new link.
19. Create a deposit request and confirm it appears in the deposit list.
20. Record a manual payment and confirm the payment summary updates.
21. Run conversion evaluation and confirm eligible or blocked reasons render in plain language.
22. Convert the proposal to a project once eligible.
23. Confirm the UI routes to `/projects/:projectId` and shows the created project.
24. Open `/projects` and confirm the converted project appears in the list.
25. Open `/pilot-feedback`, submit one blocker or high-severity issue, and confirm it appears in the list.
26. Update that issue to `REVIEWED` or `RESOLVED` and confirm the pilot summary counts update.
27. Open `/pilot-ops` and confirm summary cards load without errors.
28. Confirm the workflow table shows each lead/proposal/project pilot item with an obvious current status and next action.
29. Confirm blocker/high-severity items are visually obvious and link into the affected page when pagePath is present.
30. Confirm the pilot dashboard makes it obvious whether a proposal is stuck on acceptance, deposit, or conversion.

## Known manual watchpoints
- Public acceptance routes should never leak internal IDs.
- Repeated acceptance link clicks should remain safe.
- Reissued acceptance links should create fresh shareable links without deleting intake history.
- If an active historical link exists but the token is not re-readable, the UI should explain that a fresh link must be issued.
- Public stale-link states should never dead-end without a clear "contact the sender for a new link" instruction.
- Proposal save, section save, and line save actions should show success or error feedback.
- Conversion should only be attempted after acceptance and deposit conditions are met.
- Pilot feedback should remain internal-only and never appear on public routes.
- `/pilot-ops` should be understandable in under 30 seconds and should not require reading raw API state to know what is stuck.

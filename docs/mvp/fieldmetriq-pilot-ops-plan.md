# FieldMetriq Pilot Ops Plan

## Pilot-ops surfaces added
- `/pilot-ops` for a single internal pilot operations view
- `/pilot-feedback` with filterable blocker/high-severity triage
- quick links from blocker items and workflow rows into the affected lead, proposal, or project when available

## Summary metrics shown
- total pilot items
- proposals created
- active acceptance links
- accepted proposals
- converted projects
- open blocker count
- open high-severity count

## Workflow visibility shown
Each pilot row is derived from the current canonical lead, proposal, intake, payment summary, conversion, project, and pilot feedback data. The dashboard surfaces labels such as:
- `Waiting on proposal`
- `Waiting on customer acceptance`
- `Needs new acceptance link`
- `Waiting on deposit`
- `Ready to convert`
- `Project created`
- `Blocked by pilot issue`

## How blocker triage works
- Open `/pilot-feedback`
- filter by area, severity, or status
- use the inline status selector to move issues between `NEW`, `REVIEWED`, and `RESOLVED`
- open the affected page directly from the issue when a page path was captured

## How to use the dashboard during the 3-contractor pilot
1. Start in `/pilot-ops`.
2. Check summary cards and the decision-support note first.
3. Review `Waiting on action` to see where testers are stuck.
4. Review blockers/high-severity issues and jump directly into the affected proposal or project.
5. Move to `/pilot-feedback` when you need full triage control.

## Still intentionally out of scope
- notifications or email delivery
- full issue management
- advanced analytics or BI reporting
- scheduling
- branded public portal work
- signature-provider runtime
- accounting or invoicing UI
- manufacturing or Amazon workflow UI

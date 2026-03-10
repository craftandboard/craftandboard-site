# Phase 5 Overlap Compare

| Source concept | Canonical target concept(s) | Overlap type | Explanation | Import risk |
| --- | --- | --- | --- | --- |
| Lead | none first-class today | adjacent | Target has no lead runtime yet, but project creation and org ownership will eventually connect to it. | medium |
| Proposal | none first-class today | adjacent | No canonical proposal module exists yet, but proposals later need to feed project activation. | medium |
| Deposit gate | target project + audit context | adjacent | Deposits attach to projects already imported into target, but no canonical deposit model exists yet. | high |
| Project payments | target project + costing/pricing + sales orders | conflicting | Source payment records are not the same thing as target costing/pricing or manufacturing sales orders. | high |
| Stripe events | none first-class today | adjacent | Target has no Stripe runtime, but event handling will touch payments, orgs, and provider config. | high |
| Payment | `OrderCostEstimate`, `ShelfCostEstimate`, pricing snapshots | duplicate-risk | Target already stores estimates and pricing artifacts, but not actual project payment receipts. | high |
| Proposal acceptance | target project status/stage | adjacent | Acceptance should later influence project lifecycle, but current project module is intentionally narrow. | high |
| Lead conversion | target project creation + work-modules | adjacent | Conversion likely opens or enriches projects, but current canonical project creation is manual and isolated. | medium |
| Customer / contact | sales-order customer fields, org + user ownership | conflicting | Target has order customer fields, source has richer `Contact` and lead-linked customer records. | high |
| Sales stage / status | project `status`/`stage`, manufacturing stage signals | duplicate-risk | Source sales stages and target project/manufacturing stages are different state machines. | high |
| Audit events | target has operational events and artifacts, source has `AuditEvent` | duplicate-risk | Both repos need audit/event concepts, but entity types and lifecycle actions differ. | high |

## Summary
- The biggest overlaps are finance vocabulary and lifecycle semantics, not route shape.
- `craft-and-board` already owns pricing and manufacturing-adjacent cost records.
- `fieldmetriq-core` owns customer-conversion, proposal, deposit, and project-payment intent.
- The seam is therefore adapter-heavy and should not start with payment writes.

# Phase 5 Domain Ownership

| Domain | Owner recommendation | Confidence | Risk | Rationale | Direct import safe later |
| --- | --- | --- | --- | --- | --- |
| Leads | `fieldmetriq-core` | high | medium | Target has no first-class lead module today; source clearly owns sales-pipeline state transitions. | yes, read-first only |
| Proposals | `fieldmetriq-core` | high | medium | Proposal models and acceptance logic are source-owned and currently absent from target. | yes, read-first only |
| Deposits | `new canonical abstraction in craft-and-board` | medium | high | Deposits affect projects and payments and should not remain an ad hoc source-only behavior. | no, needs adapter first |
| Project payments | `hybrid with adapter` | medium | high | Source owns payment receipts, but target already owns pricing/costing records with nearby finance meaning. | no |
| Stripe integration | `new canonical abstraction in craft-and-board` | high | high | Stripe must be introduced behind canonical runtime/config boundaries, not by copying source route assumptions. | no |
| Customer/account linkage for project sales | `hybrid with adapter` | low | high | Source `Contact`/lead linkage and target sales-order customer fields are related but not equivalent. | no |
| Acceptance / conversion lifecycle | `fieldmetriq-core` | medium | high | Source already defines proposal acceptance and lead advancement rules, but they must be adapted to canonical project ownership. | read-first rule mining first |
| Sales-stage tracking | `fieldmetriq-core` | medium | high | Source owns the current sales stage machine; target should not invent a second one before import. | read-first only |

## Ownership conclusion
- Leads and proposals are the safest first source-owned sales slices to import later.
- Deposits, payments, and Stripe need new canonical abstractions in `craft-and-board` before runtime import.
- Customer/contact linkage is the least settled area and should remain adapter-led.

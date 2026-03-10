# Phase 5 Adapter Strategy

| Adapter | Why required | Required before which import phase | Complexity | Blocks Phase 6 |
| --- | --- | --- | --- | --- |
| Project↔sales linkage adapter | Leads and proposals must attach to canonical projects without taking over project ownership | before proposals import | high | yes |
| Payment ownership adapter | Source payments cannot collide with target pricing/costing artifacts | before deposits or project payments import | high | no, if Phase 6 stays read-first on leads/proposals |
| Stripe customer/org adapter | Stripe customer and event flow must bind to canonical org/project identity | before any Stripe import | high | no |
| Proposal acceptance -> project activation adapter | Proposal acceptance side effects must route through canonical project services | before proposal write imports | high | yes for proposal writes |
| Lead conversion adapter | Lead advancement and project creation/enrichment must use canonical project boundaries | before lead write imports | medium | no for read-first |
| Audit/event adapter | Source sales audit and Stripe/webhook events should not overwrite target operational event semantics | before leads, proposals, deposits, or payments | medium | yes |
| Stage/status translation adapter | Sales stages must stay separate from project execution and manufacturing statuses | before leads/proposals import | medium | yes |

## Adapter conclusion
- Phase 6 should avoid payment and Stripe because those adapters are the heaviest and least settled.
- The smallest adapter set that unlocks value is:
  - project↔sales linkage adapter
  - audit/event adapter
  - stage/status translation adapter

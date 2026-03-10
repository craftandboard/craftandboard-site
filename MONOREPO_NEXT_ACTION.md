# MONOREPO NEXT ACTION

Safest canonical repo right now: `/Users/brandon/Projects/craft-and-board`

Do not do yet:
- do not import Stripe or payment runtime yet
- do not couple proposals directly to deposit/payment workflows
- do not merge sales models into pricing/costing structures

Exact next Phase 9 action:
- add a provider-agnostic payment execution and reconciliation boundary before wiring any live Stripe checkout, webhook ingestion, or automatic proposal acceptance flow

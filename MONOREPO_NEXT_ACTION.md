# MONOREPO NEXT ACTION

Safest canonical repo right now: `/Users/brandon/Projects/craft-and-board`

Do not do yet:
- do not import Stripe or payment runtime first
- do not merge deposit or project-payment schema into pricing/costing models
- do not collapse sales stages into project or manufacturing statuses

Exact next Phase 6 action:
- import `leads` and `proposals` as read-first bounded modules, with project-sales linkage, stage/status translation, and audit adapters in place before any deposit, payment, or Stripe work

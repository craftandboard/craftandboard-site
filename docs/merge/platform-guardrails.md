# Platform Guardrails

## Hard Rules
- One platform direction only: `FieldMetriq`
- Do not create new Craft & Board-only architecture for reusable platform concerns
- Do not create duplicate schema ownership for the same operational concept
- Do not hardcode tenant-specific behavior when configuration can solve it
- Do not perform destructive rename/refactor work that breaks current software unless it belongs to an explicit migration branch
- Preserve working routes, tests, and runtime behavior while migrating
- Document platform-vs-tenant decisions in `docs/merge`
- Prefer additive moves over risky rewrites during the merge sequence

## Practical Rules
- shared manufacturing logic belongs to platform domains
- tenant defaults belong to tenant bootstrap/config
- public brand/marketing concerns remain tenant/business-specific
- extraction into future `packages/*` should happen intentionally, not opportunistically
- migration branches should each have one clear purpose and one clear exit condition

## Decision Check
Before changing architecture, ask:
1. Is this reusable across tenants?
2. Can this be represented as tenant configuration instead of code?
3. Does this create a second canonical model for an existing concept?
4. Does this break a currently working route/test without being part of an explicit migration phase?
5. Has the platform-vs-tenant decision been written down?

If any answer indicates ambiguity, document the boundary first and defer the code move to the correct migration branch.

# Branch Plan

## Sequence
1. `chore/pending-work-stabilization`
2. `chore/platform-merge-foundation`
3. `feat/tenant-org-bootstrap`
4. `feat/schema-unification-orders-manufacturing`
5. `feat/craft-board-import-migration`
6. `feat/cost-engine-platform-module`
7. `feat/ops-ui-unification`
8. `chore/deploy-vercel-railway-wireup`
9. `chore/craft-board-repo-freeze-notes`

## Branch 1 — `chore/pending-work-stabilization`
- Objective: preserve valid pending changes and establish a clean baseline commit
- In scope:
  - inspect and classify pending files
  - exclude generated noise if found
  - preserve valid platform work
  - document the starting state
- Out of scope:
  - broad merge refactors
  - schema redesign
- Completion criteria:
  - baseline committed
  - pending work documented
  - clean branch state

## Branch 2 — `chore/platform-merge-foundation`
- Objective: convert the current repo into the formal FieldMetriq merge-foundation baseline at the docs/planning boundary
- In scope:
  - target architecture documentation
  - tenant bootstrap target documentation
  - platform guardrails
  - current-to-target module mapping
  - update merge README, branch plan, and migration plan for foundation reality
  - optional documentation-only package destination stubs
- Out of scope:
  - schema unification
  - repo-wide renaming
  - destructive refactors
  - broad module moves
- Specific outputs:
  - `docs/merge/target-architecture.md`
  - `docs/merge/tenant-bootstrap-target.md`
  - `docs/merge/platform-guardrails.md`
  - `docs/merge/current-to-target-mapping.md`
  - updated merge planning docs
- Handoff:
  - next branch is `feat/tenant-org-bootstrap`
  - tenant bootstrap must use the documented platform/tenant boundary from this phase
- Definition of done:
  - platform identity is explicit
  - target module structure is documented
  - tenant bootstrap target is unambiguous
  - repo remains build/test stable

## Branch 3 — `feat/tenant-org-bootstrap`
- Objective: bootstrap Craft & Board as the first tenant on the platform path
- In scope:
  - tenant/org bootstrap configuration
  - tenant defaults and seed direction
  - platform-safe tenant setup path
- Out of scope:
  - broad manufacturing schema migration
- Dependencies:
  - `chore/platform-merge-foundation`

## Branches 4-9
- Follow the sequence above.
- Each later branch must preserve current working software, document platform-vs-tenant decisions, and avoid duplicate schema ownership.

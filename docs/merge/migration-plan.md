# Migration Plan

## Phase 0 — Pending work stabilization
- Goal: preserve the current valid implementation
- Inputs: dirty branch state and verified tests/builds
- Tasks: inspect, classify, commit, exclude noise if found
- Outputs: stable baseline
- Risks: losing platform work, starting merge from ambiguity
- Exit criteria: baseline commit exists or exclusions are explicit

## Phase 1 — Merge foundation docs
- Goal: define canonical direction
- Inputs: stabilized baseline
- Tasks:
  - document target architecture
  - document tenant bootstrap target
  - document platform guardrails
  - document current-to-target mapping
  - refine branch and migration plans for the canonical FieldMetriq direction
- Outputs:
  - merge docs
  - explicit FieldMetriq platform identity
  - explicit Craft & Board tenant direction
- Risks: plan drift
- Exit criteria:
  - platform identity is explicit in-repo
  - target repo shape is documented
  - tenant bootstrap target is documented
  - next branch is unambiguous

### What Foundation Means
- documentation, structure targets, guardrails, and migration sequencing are explicit
- no destructive refactors are required to understand the direction
- platform-vs-tenant boundaries are documented before moving code

### What Must Be True Before Tenant Bootstrap Begins
- stabilization is complete
- current platform state is documented
- target platform domains are documented
- tenant bootstrap responsibilities are clearly separated from platform responsibilities
- deployment direction is explicit: Vercel frontend, Railway backend/workers/database

### What Must Not Be Attempted In This Phase
- schema unification
- repo-wide rename
- import path or package renaming
- broad module extraction
- breaking runtime route surfaces for naming purity

## Phase 2 — Tenant/org bootstrap
- Goal: treat Craft & Board as first tenant on FieldMetriq
- Inputs: merge docs
- Tasks: tenant bootstrap design and seed split
- Outputs: tenant bootstrap path
- Risks: platform/tenant leakage
- Exit criteria: bootstrap direction is explicit

## Phase 3 — Schema unification
- Goal: reconcile orders/manufacturing models
- Inputs: current schema + platform target
- Tasks: canonical model selection and migration plan
- Outputs: unified schema direction
- Risks: model overlap and migration complexity
- Exit criteria: migration-safe schema plan

## Phase 4 — Import + manufacturing migration
- Goal: move intake/manufacturing logic into canonical platform modules
- Inputs: unified schema
- Tasks: intake, packet, part, batch, remnant, telemetry migration
- Outputs: canonical manufacturing flow
- Risks: operational regressions
- Exit criteria: tenant flow works through shared modules

## Phase 5 — Costing + packaging/shipping migration
- Goal: migrate cost and pricing logic into platform modules
- Inputs: stabilized pricing engine
- Tasks: module extraction and tenant-config bindings
- Outputs: platform cost/pricing framework
- Risks: business-rule drift
- Exit criteria: calculations remain reproducible

## Phase 6 — Frontend ops unification
- Goal: move ops UI into FieldMetriq frontend
- Inputs: canonical backend
- Tasks: unify pages and route structure
- Outputs: shared ops UI
- Risks: UX regressions
- Exit criteria: operator-critical flows preserved

## Phase 7 — Deploy wiring + cutover prep
- Goal: align Vercel + Railway deploy topology
- Inputs: unified application
- Tasks: environment matrix, service split, cutover checklist
- Outputs: deployable target topology
- Risks: runtime/env mismatch
- Exit criteria: deploy strategy proven

## Phase 8 — Legacy repo freeze/archive
- Goal: freeze Craft & Board standalone repo
- Inputs: successful migration
- Tasks: archive notes and cutover references
- Outputs: explicit legacy repo state
- Risks: development continues in wrong repo
- Exit criteria: archive/freeze is safe

## Rule
- Do NOT skip Phase 0.
- Do NOT start broad merge changes while current implemented work is still uncommitted or ambiguously classified.

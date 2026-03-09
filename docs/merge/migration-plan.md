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
- Tasks: docs, inventory, branch plan, env and deploy docs
- Outputs: merge docs
- Risks: plan drift
- Exit criteria: docs committed

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


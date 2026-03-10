# FieldMetriq Monorepo Staged Migration Plan

## Phase 0 — Freeze and checkpoint
- Objective: stop accidental structural edits while both repos are dirty
- Exact scope:
  - audit both repos
  - capture dirty-file summaries
  - identify deploy ownership and preserve docs
- Dependencies:
  - none
- Risks:
  - losing track of which dirty repo owns which live behavior
- Rollback approach:
  - none needed; no structural changes occur here
- Completion criteria:
  - repo audit docs exist
  - preservation checklist exists
  - canonical-repo recommendation exists

## Phase 1 — Choose canonical repo
- Objective: formally pick the monorepo base before moving code
- Exact scope:
  - adopt `craft-and-board` as the canonical base for migration planning
  - mark `fieldmetriq-core` as backend source to be folded later
- Dependencies:
  - completed audit and preservation checklist
- Risks:
  - choosing the wrong base can multiply later file moves
- Rollback approach:
  - revisit recommendation before any code movement starts
- Completion criteria:
  - Brandon explicitly agrees which repo becomes canonical

## Phase 2 — Bring frontend and backend into one structure
- Objective: consolidate repo layout without changing production behavior yet
- Exact scope:
  - import backend code from `fieldmetriq-core` into the canonical monorepo in controlled slices
  - do not delete old repos during the first import pass
- Dependencies:
  - Phase 1 decision
  - clean checkpoint of dirty local work
- Risks:
  - accidental loss of uncommitted migrations, views, or tests
- Rollback approach:
  - stop after each slice and compare against preserved source repo
- Completion criteria:
  - backend source exists inside the canonical monorepo in parallel with preserved originals

## Phase 3 — Normalize package boundaries
- Objective: reduce cross-app duplication and clarify ownership
- Exact scope:
  - move shared contracts/config/helpers into `packages/*`
  - keep app-specific logic in `apps/web` and `apps/api`
- Dependencies:
  - backend code imported into the canonical monorepo
- Risks:
  - over-extracting too early can break both runtime and imports
- Rollback approach:
  - keep moves small and reversible at package boundary checkpoints
- Completion criteria:
  - shared runtime code has a defined home and import graph is stable

## Phase 4 — Standardize env/config
- Objective: unify environment naming and runtime config
- Exact scope:
  - standardize frontend, API, worker, and Prisma config
  - normalize domain/env samples
- Dependencies:
  - agreed app/package boundaries
- Risks:
  - silent env drift between local, Vercel, and Railway
- Rollback approach:
  - preserve previous env docs and migrate values one environment at a time
- Completion criteria:
  - one env matrix governs the canonical monorepo

## Phase 5 — Fix branding/domain assumptions
- Objective: finish FieldMetriq-first naming after code is consolidated
- Exact scope:
  - remove remaining stale repo/domain assumptions
  - validate marketing/app/API role separation in one repo
- Dependencies:
  - frontend and backend coexist in the canonical repo
- Risks:
  - mixing domain cutover work into structure work too early
- Rollback approach:
  - keep domain changes doc-driven and reversible at the provider layer
- Completion criteria:
  - brand/domain assumptions are consistent across code and docs

## Phase 6 — Rewire deploy pipelines
- Objective: point Vercel and Railway at the canonical monorepo safely
- Exact scope:
  - update root directories, build commands, and provider assumptions
  - verify against staging or preview paths before production
- Dependencies:
  - canonical repo structure and env model complete
- Risks:
  - breaking live deploys during source-of-truth handoff
- Rollback approach:
  - keep old repo/provider settings intact until new deploys pass
- Completion criteria:
  - Vercel and Railway both deploy from the canonical monorepo successfully

## Phase 7 — Deprecate old repo/domain usage
- Objective: retire old repo/domain assumptions after production is stable
- Exact scope:
  - archive or freeze old repo usage
  - remove obsolete docs and fallback references
- Dependencies:
  - stable production deploys from the canonical monorepo
- Risks:
  - deleting historical context too early
- Rollback approach:
  - archive before removal; keep read-only references available
- Completion criteria:
  - one canonical repo and one canonical deploy story remain

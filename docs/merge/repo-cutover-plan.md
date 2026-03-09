# Repo Cutover Plan

## Target Repo Name
- `fieldmetriq-core`

## Cutover Prerequisites
- freeze notes documented
- deployment topology and env matrix documented
- current repo working state stabilized
- clear branch plan for post-cutover work
- Vercel and Railway wiring understood

## Recommended Cutover Sequence

### Phase 1 — Freeze Current Repo Role
- mark this repo as transitional only
- stop making identity-deepening Craft & Board platform changes

### Phase 2 — Rename / Move Repo
- rename or move the repo to `fieldmetriq-core`
- preserve commit history
- avoid simultaneous deep code refactors

### Phase 3 — Reconnect Deploy Targets
- reconnect Vercel projects:
  - `fieldmetriq-web-dev`
  - `fieldmetriq-web-prod`
- reconnect Railway projects:
  - `fieldmetriq-api-dev`
  - `fieldmetriq-api-prod`

### Phase 4 — Validate App / API After Move
- verify web build
- verify API build
- verify deploy env mapping
- verify dashboard, orders, costing, and machines load correctly

### Phase 5 — Update Docs / References
- update repo name references
- update local clone instructions
- update deploy/project docs

## Remote / Repo Rename Considerations
- preserve branches and PR history
- avoid force-push or history rewrite
- update remotes for active contributors after rename

## Branch Protection Considerations
- reapply or verify branch protections after repo rename
- confirm deployment-connected branches still match intended flow

## Vercel / Railway Connection Update Considerations
- Vercel root directory should still point to `apps/web`
- Railway service should still build/run `apps/api`
- domain bindings should be rechecked after repo move

## Environment Variable Continuity Considerations
- keep variable names stable through cutover
- avoid env renames during the repo move itself
- verify shared secrets still match across frontend/backend

## Smoke Test After Cutover
- web app loads
- dashboard loads
- orders page loads
- costing page loads
- machines page loads
- API `/health` responds
- no API base URL mismatch in browser

## Rollback Notes
- if repo rename/move creates deploy or remote issues, restore prior remote wiring and retry cutover later
- do not combine cutover with destructive schema changes

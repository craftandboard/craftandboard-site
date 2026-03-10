# Local Checkpoint: craft-and-board

## Repo
- Path: `/Users/brandon/Projects/craft-and-board`
- Branch: `chore/live-deploy-reconcile-and-api-domain-cutover`
- Checkpoint time: `2026-03-09 17:55:17 PDT`

## Dirty file summary at checkpoint start
- Modified files: frontend app routes, branding/domain helpers, env/readme, deployment docs
- Untracked files: new FieldMetriq marketing/domain helpers and migration-planning docs
- Dirty path count observed: `34`

## Grouped commit plan
1. `chore(checkpoint): preserve fieldmetriq domain cutover work`
   - `apps/web/src/app/*`
   - `apps/web/src/components/*`
   - `apps/web/src/lib/*`
   - host-aware app/marketing logic
   - FieldMetriq branding replacements
   - removal of production-facing localhost artifact links
2. `docs(checkpoint): preserve fieldmetriq planning and deployment docs`
   - `.env.example`
   - `README.md`
   - `docs/merge/*`
   - `MONOREPO_NEXT_ACTION.md`

## Intentionally left uncommitted
- none

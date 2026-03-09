# Repo Cutover Execution

## Starting Branch
- `chore/repo-cutover-to-fieldmetriq-core`

## Current Repo Name At Start
- local folder: `craft-and-board`
- Git remote identity at start: `craftandboard/craftandboard-site`

## Current Local Folder Path
- `/Users/brandon/Projects/craft-and-board`

## Latest Baseline Commit Hash
- `077eaff`

## Current Clean Status Confirmation
- worktree was clean before cutover execution

## Deploy Readiness Baseline
- deploy wiring branch was completed
- API tests were green
- API build was green
- web build was green

## Known Linked Systems To Recheck After Cutover
- GitHub remote URL
- default branch tracking
- Vercel repo connection
- Railway repo connection
- environment variable continuity

## Git Remote URLs

### Before
- `origin`: `https://github.com/craftandboard/craftandboard-site.git`

### After
- `origin`: `https://github.com/brandonbozarth/fieldmetriq-core.git`
- `legacy-craft-board`: `https://github.com/craftandboard/craftandboard-site.git`

## Current Branch Name
- `chore/repo-cutover-to-fieldmetriq-core`

## Current Default Branch Assumption
- `main`

## Vercel Project Names From Docs
- `fieldmetriq-web-dev`
- `fieldmetriq-web-prod`

## Railway Project Names From Docs
- `fieldmetriq-api-dev`
- `fieldmetriq-api-prod`

## Cutover Actions Executed
- created the canonical GitHub repo:
  - `brandonbozarth/fieldmetriq-core`
- preserved the old remote locally as `legacy-craft-board`
- changed local `origin` to the canonical FieldMetriq repo
- pushed:
  - `main`
  - `chore/repo-cutover-to-fieldmetriq-core`

## Cutover Actions Not Executed Here
- local folder rename from `craft-and-board` to `fieldmetriq-core`
- live Vercel reconnect
- live Railway reconnect
- branch protection updates on the new repo

## Deployment Reconnect Checklist

### Completed In This Branch
- canonical GitHub repo created
- local `origin` updated
- baseline branches pushed to canonical remote

### Still Manual After This Branch
1. verify GitHub repo settings on `brandonbozarth/fieldmetriq-core`
2. verify local remotes for all other contributors
3. reconnect Vercel repo references
4. reconnect Railway repo references
5. verify branch tracking/default branch policies
6. verify env var mappings still match across Vercel and Railway
7. verify any webhook/integration expectations tied to old repo identity

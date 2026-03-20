# Craft & Board Post-Launch Repo State

## Current Repo State
- Canonical Git remote: `origin`
- Canonical repo URL: `https://github.com/craftandboard/craftandboard-site.git`
- Live MVP deployment commit: `d94efcd01843bf80dad0a1089a34e6edf40f8a6e`
- Live commit marker: `production/craft-board-mvp-2026-03-19`

## What Was Cleaned
- Renamed Git remotes so `origin` now points to the Craft & Board repo.
- Renamed the old incorrect `origin` to `fieldmetriq-origin`.
- Removed the tracked `.deploy-trigger` file used during deployment troubleshooting.
- Added `.deploy-trigger` to `.gitignore`.
- Removed local Vercel metadata and build output generated during deploy debugging.

## Remaining Local State
- The repository still contains substantial in-progress source work outside this cleanup step.
- Those changes were left alone intentionally to avoid disturbing active MVP and platform work.
- Cleanup work was limited to Git/remotes, local deploy artifacts, and this handoff note.

## Git Branch Strategy
- `main` should represent the live/default Craft & Board app state.
- The launch/deploy branch used during production cutover was `chore/live-deploy-reconcile-and-api-domain-cutover`.
- The live MVP commit is preserved by tag before any future branch cleanup or merges.

## Safe Push Workflow
1. Confirm `git remote -v` shows `origin` as the Craft & Board repo.
2. Confirm the branch you intend to push is correct.
3. Push normal application work to `origin` only after reviewing `git status`.
4. Do not use `fieldmetriq-origin` for normal Craft & Board work.

## Safe Deploy Workflow
1. Build locally first.
2. Ensure the commit author on `HEAD` is a Vercel-authorized identity for the active team/project.
3. Push the deployable commit to the production branch.
4. Trigger or observe the Vercel production deployment.

## Vercel Deploy Author Requirement
- Vercel checks the Git author on `HEAD` for production deploy eligibility.
- The current Vercel team setup does not allow adding new team members on the Hobby plan.
- Future production deploys must use an already-authorized Git identity, or the Vercel team setup must change.

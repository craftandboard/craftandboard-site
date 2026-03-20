# Craft & Board Post-Launch Repo State

## Current Repo State
- Canonical Git remote: `origin`
- Canonical repo URL: `https://github.com/craftandboard/craftandboard-site.git`
- Canonical Craft & Board Git identity: `LiamBozarth <brandonbozarth30@gmail.com>`
- Live MVP deployment commit: `d94efcd01843bf80dad0a1089a34e6edf40f8a6e`
- Live commit marker: `production/craft-board-mvp-2026-03-19`

## Canonical Source-Control Identity
- Normal Craft & Board commits in this repo should use `LiamBozarth <brandonbozarth30@gmail.com>`.
- This should be configured at the repo level for this repository so normal development does not depend on manual switching or memory.
- `admin@sublimedesignnv.com` is not the canonical Craft & Board commit identity.
- The Sublime-branded identity existed only as a temporary production deploy workaround while Vercel ownership and deploy authorization were still tied to an older account setup.

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
- Preserved safety, snapshot, and release references should remain intact until intentionally cleaned up later.

## Current Vercel Caveat
- Production deployment is still partially constrained by the current Vercel owner/account setup.
- This is a deployment-platform constraint, not the desired long-term Craft & Board source-control identity.
- The earlier `admin@sublimedesignnv.com` author was used because it aligned with the account that Vercel would accept for production deployment at the time.
- That workaround should not be treated as normal development practice.
- If production deployment still requires the older Vercel-authorized identity, treat that as a temporary exception only until Vercel ownership or deploy permissions are corrected.

## Safe Git Workflow
### Normal Development Identity
- Commit normal Craft & Board work as `LiamBozarth <brandonbozarth30@gmail.com>`.
- Use `origin` as the canonical Craft & Board remote.
- Do not use `fieldmetriq-origin` for normal Craft & Board work.
- Do not use the Sublime-branded identity as the repo default.

### Feature Branch Workflow
1. Start from the correct up-to-date base branch.
2. Create a focused feature branch for the work.
3. Confirm `git config user.name` and `git config user.email` before the first commit if anything looks suspicious.
4. Review `git status --short` before committing so unrelated local changes do not get swept in.
5. Push the branch to `origin`.

### Release Branch Workflow
1. Cut a release branch from the intended production-ready base.
2. Stage only the files intended for the release.
3. Build and verify before pushing or promoting.
4. Do not push snapshot branches or dirty worktrees directly as release candidates.
5. Keep release commits reviewable and isolated from unrelated work.

## Safe Push Workflow
1. Confirm `git remote -v` shows `origin` as the Craft & Board repo.
2. Confirm the branch you intend to push is correct.
3. Push normal application work to `origin` only after reviewing `git status`.
4. Do not use `fieldmetriq-origin` for normal Craft & Board work.

## Safe Deploy Workflow
1. Build locally first.
2. Prepare releases on a clean feature or release branch using the canonical LiamBozarth identity.
3. Use manual Vercel branch deployment and/or current owner-account involvement if production promotion still depends on the older Vercel authorization setup.
4. Do not assume a direct push from a dirty worktree is a safe production move.
5. If a production deploy absolutely requires the older Vercel-authorized identity, use it only as an explicit temporary workaround and document that choice in the release notes or deploy handoff.

## Vercel Deploy Author Requirement
- Vercel checks the Git author on `HEAD` for production deploy eligibility.
- The current Vercel team setup does not allow adding new team members on the Hobby plan.
- Future production deploys must use an already-authorized Git identity, or the Vercel team setup must change.

## Recommended Ongoing Workflow
### Normal Everyday Craft & Board Work
- Commit as `LiamBozarth <brandonbozarth30@gmail.com>`.
- Use the correct Craft & Board remote at `origin`.
- Work from feature and release branches instead of improvising from dirty local state.
- Do not treat the Sublime-branded identity as normal.

### Current Production Reality
- Production deployment is still partially constrained by current Vercel ownership and deploy authorization.
- Use manual release discipline until Vercel ownership is properly realigned.
- Prefer manual branch deployment or owner-account involvement over ad hoc author switching hidden in local config.

### Long-Term Fix Target
- Craft & Board production deployment should be owned by, or deployable directly through, the same LiamBozarth / Craft & Board identity used for normal source control.
- No Sublime-branded commit-author workaround should be required once Vercel ownership or deploy permissions are corrected.

## Pre-Release Verification Checklist
Run these checks before pushing a release branch or preparing a production deployment:
1. `git status`
2. `git branch --show-current`
3. `git config user.email`
4. `git remote -v`
5. Confirm the worktree is clean or intentionally scoped
6. Confirm the branch is the one you actually intend to deploy

# Repo Freeze Notes

## Current Repo Status
This repository is now a transitional execution repo for the FieldMetriq platform baseline.

It is no longer to be treated as a separate Craft & Board software platform.

## Why Freeze Notes Are Needed
The repo now contains platform-grade manufacturing, telemetry, costing, scan, container, and inventory logic. Without an explicit freeze note, future work could drift back into treating this codebase as a permanent Craft & Board-only application instead of the temporary execution ground for FieldMetriq.

## What Is Frozen
- the idea that this repo is a separate long-term Craft & Board software platform
- new repo-identity decisions that deepen Craft & Board-specific platform naming
- broad aesthetic or naming cleanups done only to make the old repo identity feel permanent

## What Is Still Allowed Temporarily
- urgent bug fixes
- deploy/manual wire-up adjustments
- low-risk platform continuation work already on the roadmap
- cutover-preparation docs
- smoke-test fixes

## What Is No Longer Allowed
- treating this repo as a permanent Craft & Board-only product platform
- building duplicate reusable platform abstractions here and again later in FieldMetriq
- new naming that deepens repo-identity confusion
- major repo/file/package reorganization just for aesthetics before cutover

## How To Describe This Repo Internally
- transitional execution repo
- current working FieldMetriq platform baseline
- Craft & Board tenant-1 implementation ground

## Relation To FieldMetriq Canonical Target
The canonical platform target remains `fieldmetriq-core`.

New reusable ops, manufacturing, telemetry, inventory, and costing work is FieldMetriq work even if it lands here temporarily before the repo cutover is executed.

## Relation To Craft & Board Tenant / Business
Craft & Board is tenant 1 and a business context on the platform.

Craft & Board-specific defaults, assumptions, and workflows should become tenant configuration wherever possible, not permanent platform hardcoding.

## Next Cutover Milestones
1. freeze current repo role
2. complete cutover planning
3. rename/move repo to canonical target
4. reconnect Vercel/Railway projects
5. update docs and references after cutover

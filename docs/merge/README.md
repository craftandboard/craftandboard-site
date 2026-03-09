# FieldMetriq Merge Foundation

## Problem Statement
Craft & Board now contains substantial manufacturing-platform logic, but the canonical software platform direction is `FieldMetriq`. Merge work must start from the real implemented state, not from an imagined clean-room rewrite.

## Current State
This repository already contains platform-grade operational domains:
- org-aware auth and roles
- manufacturing packets, parts, labels, scans, and batches
- container/bin workflows
- remnant inventory and matching
- costing and pricing foundations
- machine telemetry evidence intake and machine-stage candidates

## Canonical Decisions
- Canonical platform: `FieldMetriq`
- Canonical target repo: `fieldmetriq-core`
- Craft & Board is the first tenant/business on the platform
- Frontend host target: `Vercel`
- Backend/API/workers/database target: `Railway`

## Why Current Manufacturing Work Belongs To Platform
The current Craft & Board code is not only tenant-specific business logic. It already implements reusable manufacturing-system primitives:
- jobs, parts, packets, and batches
- labels and scan events
- trusted auto-apply rules
- machine telemetry evidence
- remnant inventory
- cost and pricing engines

These belong in the shared platform, with tenant configuration layered on top.

## Merge Phases Overview
1. Pending work stabilization
2. Merge foundation docs
3. Tenant/org bootstrap
4. Schema unification
5. Import + manufacturing migration
6. Costing + packaging/shipping migration
7. Frontend ops unification
8. Deploy wiring + cutover prep
9. Legacy repo freeze/archive

## Merge Docs
- [Current Working Tree Snapshot](/Users/brandon/Projects/craft-and-board/docs/merge/current-working-tree-snapshot.md)
- [Current Platform State](/Users/brandon/Projects/craft-and-board/docs/merge/current-platform-state.md)
- [Repo Inventory](/Users/brandon/Projects/craft-and-board/docs/merge/repo-inventory.md)
- [Domain Boundary](/Users/brandon/Projects/craft-and-board/docs/merge/domain-boundary.md)
- [Branch Plan](/Users/brandon/Projects/craft-and-board/docs/merge/branch-plan.md)
- [Migration Plan](/Users/brandon/Projects/craft-and-board/docs/merge/migration-plan.md)
- [Deployment Topology](/Users/brandon/Projects/craft-and-board/docs/merge/deployment-topology.md)
- [Env Matrix](/Users/brandon/Projects/craft-and-board/docs/merge/env-matrix.md)


# Phase 2 Prisma Boundary Plan

## Boundary rule
- `craft-and-board` remains the canonical Prisma home.
- No source migration history is imported directly.
- Imported source slices must be re-expressed inside the target Prisma ownership plan.

## Bucket: canonical in `craft-and-board`
- `Organization`
- `User`
- `OrganizationMember`
- `Session`
- `Order`
- `ManufacturingJob`
- manufacturing bundle/sheet/output families
- label and artifact families
- container, remnant, station, machine, telemetry, stage-signal families
- order intake, pricing, costing, and production-floor support models

## Bucket: candidate for future import from `fieldmetriq-core`
- `Project`
- source `Job` only if renamed or reframed relative to manufacturing jobs
- `ProjectTask`
- `TaskTemplate`
- proposal snapshot families
- lead/contact/pipeline families
- project cost tracking families
- project payment families
- Stripe event and webhook-event families
- deposit gate and change-order families

## Bucket: overlap requiring manual reconciliation
- `User`
- `Organization` / `Org`
- `OrganizationMember` / `OrgMember`
- permission role and capability tables
- audit event concepts
- job/project execution lineage
- financial summary and estimate/cost concepts
- status/stage/phase tracking concepts

## Bucket: must never duplicate
- user identity records
- organization records
- organization membership join records
- session records
- canonical auth tokens / session cookies
- primary payment event identity keys

## Bucket: needs adapter or translation layer
- `Org` -> `Organization`
- `OrgMember` -> `OrganizationMember`
- source permission-role capability graph -> target capability checks
- source `Job` lifecycle -> namespaced project domain lifecycle
- source `Payment` -> target project-billing namespace
- source `AuditEvent` -> target audit/event ownership

## High-risk merge lines

### Identity and access
- Source and target both define user/org/member ownership.
- These models must converge logically before any imported route writes through them.

### Execution model
- Target’s `ManufacturingJob` is not the same concept as source `Job`.
- Source `Project` plus `Job` plus `ProjectTask` should enter as a project-delivery slice, not as a manufacturing override.

### Financial model
- Target already owns costing and pricing.
- Source owns project payments, deposit gates, and Stripe lifecycle.
- Payment-related Prisma families must arrive under a bounded project-billing model instead of colliding with target costing tables.

## Safe schema planning rule for Phase 3
- Phase 3 may introduce project-domain model drafts in the target repo only after:
  - auth/org ownership remains canonical in target
  - naming collisions are resolved on paper
  - every imported source model family has a declared target namespace

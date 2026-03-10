# Phase 1 Prisma Compare

## Schema sources
- Target schema:
  - `/Users/brandon/Projects/craft-and-board/prisma/schema.prisma`
- Source schema:
  - `/Users/brandon/Projects/fieldmetriq-core/prisma/schema.prisma`

## Migration history summary
- Target migration history:
  - 12 migrations
  - concentrated in March 8-9, 2026
  - focused on manufacturing, pricing, order intake, labels, containers, remnants, telemetry, org settings, and schema bridges
- Source migration history:
  - 29 migrations
  - spans February 16, 2026 through March 2, 2026
  - focused on leads, invites, permissions, financial baseline, change orders, deposit gating, Stripe idempotency, job spine, cost tracking, project payments, and work modules

## Current richness assessment
- Richer migration history:
  - `fieldmetriq-core`
- Richer manufacturing/platform schema:
  - `craft-and-board`
- Richer project, sales, and payment schema:
  - `fieldmetriq-core`
- Overall merge risk:
  - high

## Likely overlapping model families

| Business concept | Target likely ownership | Source likely ownership | Risk |
| --- | --- | --- | --- |
| Users / auth identities | present | present | high |
| Organizations / membership / permissions | present | present | high |
| Jobs / project execution units | present as production/job concepts | present as project/job spine concepts | high |
| Costing / estimates / financial outputs | present | present | high |
| Status / stage tracking | present via stage signals and manufacturing lifecycle | present via work modules and project phases | high |

## Likely target-unique model families
- manufacturing expansion backbone
- label and scan workflow tables
- container sorting
- remnant inventory
- machine telemetry
- shelf jobs and production bundle outputs
- trusted auto-apply and org settings bootstrap

## Likely source-unique model families
- leads and lead runtime
- invite acceptance and security
- project deposit gates
- Stripe event idempotency
- proposal snapshots
- change orders
- project payments
- work module phases, task ordering, assignment rules

## Conflict areas that make a direct merge risky
- Both repos likely define user, org, and permission concepts with different relationships.
- Both repos likely define “job” and “cost” concepts, but they attach those concepts to different operational flows.
- Migration order is incompatible for a blind import because each repo already assumes its own history is canonical.
- Naming collisions are likely around:
  - project vs job
  - estimate vs costing
  - task/stage/status representations
  - org/member/access tables

## Safe Prisma conclusion
- Do not import source Prisma migrations directly into the target history.
- Phase 2 should begin with a model-family reconciliation document and explicit canonical ownership decisions for:
  - auth/org tables
  - project/job tables
  - financial/payment tables
- Only after that should any schema slice be ported into the target repo.

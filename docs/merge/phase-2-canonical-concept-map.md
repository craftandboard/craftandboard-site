# Phase 2 Canonical Concept Map

## Concept mapping rules
- Canonical terms should favor the existing `craft-and-board` monorepo when the concept already anchors current production app behavior.
- Source-only business domains may keep their source term initially, but only behind a target module boundary.
- If a concept collides across repos, it must be:
  - unified
  - namespaced
  - or translated by an adapter

| Concept | Canonical monorepo term | `fieldmetriq-core` equivalent(s) | `craft-and-board` equivalent(s) | Import risk | Direction |
| --- | --- | --- | --- | --- | --- |
| User | `User` | `User` | `User` | high | unify |
| Member | `OrganizationMember` | `OrgMember` | `OrganizationMember` | high | translate by adapter first, unify later |
| Org | `Organization` | `Org` | `Organization` | high | translate by adapter first, unify later |
| Workspace | `Organization context` | org-scoped app context | current organization in request context | medium | namespaced as org context, avoid new top-level workspace model |
| Project | `Project` | `Project` | none as first-class canonical model yet | high | future import candidate, namespaced under new project modules |
| Job | `ManufacturingJob` for manufacturing, `Project` for service delivery | `Job` | `ManufacturingJob`, shelf-job and production job concepts | high | split meaning, do not unify under one term yet |
| Order | `Order` | no direct equivalent | `Order` | low | keep canonical in target |
| Stage | `Stage signal` or manufacturing stage | work stage / lifecycle / pipeline stage | stage signals, manufacturing lifecycle | high | adapter/translation required |
| Phase | `Project phase` only inside imported project modules | project phase / work module phase | no direct equivalent | medium | namespaced inside projects/work-modules |
| Task | `ProjectTask` inside imported project modules | `ProjectTask` | no direct equivalent as canonical API model | medium | import later with namespacing |
| Payment | `ProjectPayment` for imported project billing flows | `Payment` | costing/pricing outputs but not equivalent payment routes | high | namespaced and adapter-backed |
| Deposit | `Deposit gate` inside project payments domain | deposit gate state | no direct equivalent | medium | namespaced inside project payments |
| Event | `AuditEvent` or domain event, depending context | `AuditEvent`, `StripeEvent`, `WebhookEvent` | operational events and machine/stage signals | high | separate audit/system/manufacturing event types |
| Audit item | `AuditEvent` | `AuditEvent` | likely operational audit records, artifact logs | high | unify carefully, not in Phase 3 |
| Label / artifact | `Artifact` and label domain terms | no strong equivalent | `Artifact`, label workflows | low | keep canonical in target |

## Key naming decisions
- `Organization` is the canonical name, not `Org`.
- `OrganizationMember` is the canonical name, not `OrgMember`.
- `Project` should be introduced later as a project-service-delivery domain, not as a replacement for manufacturing `Order`.
- `ManufacturingJob` and imported `Project`/`Job` concepts must stay distinct until lifecycle overlap is proven minimal.
- `Payment` from the source repo should land under a project-billing namespace instead of taking over target costing names.

## Concepts that must never be treated as direct synonyms
- `Order` and `Project`
- `ManufacturingJob` and source `Job`
- manufacturing `stage` and project `phase`
- target costing/pricing outputs and source project payment records

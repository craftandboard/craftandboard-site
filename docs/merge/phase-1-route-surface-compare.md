# Phase 1 Route Surface Compare

## Comparison method
- Target repo:
  - `/Users/brandon/Projects/craft-and-board/apps/api/src/routes`
- Source repo:
  - `/Users/brandon/Projects/fieldmetriq-core/src/routes`
- Status labels:
  - `target-only`
  - `source-only`
  - `overlap-same-intent`
  - `overlap-unclear`

## Route group comparison

| Feature area | `craft-and-board` target | `fieldmetriq-core` source | Status | Notes |
| --- | --- | --- | --- | --- |
| Auth / login / session | `auth.ts`, `me.ts` | auth endpoints in `src/server.js` | `overlap-same-intent` | Same user intent, different implementation style and route layout. |
| Org / members / roles | `org.ts` | org context appears in middleware/security, but no direct equivalent member-management route set | `target-only` | Target has clearer org member APIs and capability checks. |
| Orders / order intake | `orders.ts`, `orderIntake.ts` | no clear order-intake equivalent | `target-only` | Target owns order capture and fulfillment workflows. |
| Production / manufacturing | `manufacturing.ts`, `manufacturingExpansion.ts`, `production.ts`, `shelfJobs.ts` | `activate-project.routes.js`, `project-materials-list.routes.js`, work-pack routes | `overlap-unclear` | Both touch execution workflows, but one is manufacturing-floor oriented and the other is project execution oriented. |
| Labels / artifacts / scans | `labels.ts`, `manufacturingLabels.ts`, `scanning.ts` | no direct equivalent | `target-only` | Source does not appear to own label/scan flows. |
| Machines / telemetry / stations | `machines.ts`, `machineEvents.ts`, `machineStageCandidates.ts`, `stations.ts`, `stageSignals.ts` | no direct equivalent | `target-only` | Manufacturing-floor surface is unique to target. |
| Costing / pricing | `costing.ts`, `pricing.ts`, `reports.ts` | `project-cost-tracking.routes.js`, `project-financial-snapshot.routes.js` | `overlap-same-intent` | Similar financial intent, but different business objects and outputs. |
| Jobs / projects / tasks | `jobs.ts` | `project-tasks.routes.js`, `project-work-pack.routes.js`, `project-work-notes.routes.js` | `overlap-unclear` | The word “job” exists in both repos but means different lifecycle scopes. |
| Billing / Stripe / payments | no direct Stripe route set | `project-payments.routes.js`, `project-deposit-gate.routes.js`, `stripeCheckout.js`, `stripeWebhook.js` | `source-only` | Source clearly owns live project payment workflows. |
| Sales / proposals / lead flow | no clear equivalent | `lead-advance.routes.js`, `proposal-acceptance.routes.js` | `source-only` | Source owns pre-project sales transitions. |
| Admin / infra / health | `health.ts` | `/health`, `/ready`, `/version` in `src/server.js` | `overlap-same-intent` | Infra health exists in both, but not in the same shape. |

## Target route surface highlights
- Strongest target areas:
  - orders
  - order intake
  - production/manufacturing
  - labels and scans
  - machines, telemetry, remnants, stations
- Target test coverage exists across those areas in `apps/api/src/tests/*.test.ts`.

## Source route surface highlights
- Strongest source areas:
  - project tasks and work packs
  - project payments and deposit gates
  - proposal acceptance and lead advancement
  - Stripe checkout and webhook handling
- Source route design is more monolithic because much of the app behavior is still centered around `src/server.js`.

## Route import implications
- Safest “adopt target” zones:
  - manufacturing
  - orders
  - labels
  - machine telemetry
- Safest “import source later” zones:
  - project tasks
  - work packs
  - project payments
  - Stripe webhook/checkouts
- Manual reconciliation required before import:
  - auth/session
  - health/readiness/version conventions
  - any route using “jobs” language

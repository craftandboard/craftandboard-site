# Product Roadmap

This roadmap outlines the intended evolution of Craft & Board from foundation workflow into a multi-shop manufacturing platform.

It is written from the current repo state, where the core manufacturing data path is already operational for shelf work.

## Phase 1 — Foundation (completed)

Objective:
- establish a complete end-to-end manufacturing foundation for deterministic shelf production

Implemented:

- shared monorepo structure for web, API, worker, shared contracts, and Prisma
- PostgreSQL-backed persistence through Prisma
- configurator flow:
  - validate
  - normalize
  - quote
  - translate
  - create manufacturing job
- Amazon fixture import into the same manufacturing path
- persistence of:
  - `Order`
  - `OrderItem`
  - `Part`
  - `ManufacturingJob`
- deterministic batch generation by material
- deterministic nesting foundation with persisted sheets and placements
- deterministic CNC packet generation
- deterministic label packet generation
- printable label PDF generation
- printable traveler PDF generation
- batch detail inspection
- part-level shop-floor transitions
- batch lifecycle transitions
- globally unique `scanCode` for every part
- order/job completion cascade
- shipping station and shipped-order closeout

Outcome:
- the repo now has a functioning manufacturing backbone from demand intake through shipment-state completion

## Phase 2 — Shop-floor workflow

Objective:
- make day-to-day production execution practical for operators

Focus areas:

- add a Material Forecast / Production Board between order intake and batch creation
- show pending cut demand grouped by material with order/job/part traceability
- estimate sheet demand before a batch is built
- surface advisory remnant candidates before pulling new full sheets
- allow explicit forecast demand selection into the next production batch
- improve station UX for high-volume scanning
- reduce clicks and refresh dependence between scans
- add clearer operator feedback and exception handling
- add packing slip generation as a dedicated printable artifact
- add shipment detail capture:
  - carrier
  - tracking number
  - pickup vs shipment mode
- add rework / hold / exception paths for parts and orders
- add operational dashboards for:
  - active queues
  - stuck work
  - ready-to-ship work

Desired outcome:
- operators can run daily production and fulfillment without using admin/debug views
- planners can decide what should be cut next before invoking downstream batch, nesting, CNC, and station workflows

## Phase 3 — CNC integration

Objective:
- move from foundation CNC packets to machine-ready integration

Focus areas:

- translate current CNC packet format into real controller outputs
- support machine profiles and post-processors cleanly
- generate controller-specific files for target machines
- add CNC job posting/approval workflow on the batch path
- persist machine-ready outputs through the artifact/versioning model
- connect CNC job execution state back into batch and station visibility

Potential deliverables:

- Mosaic-compatible output
- CSV export variants
- G-code/post output for specific controllers
- machine-specific setup sheets

Desired outcome:
- the system produces files that can be sent directly to production equipment

## Phase 4 — Optimization / nesting

Objective:
- improve sheet efficiency and throughput beyond the deterministic baseline

Focus areas:

- smarter packing and placement algorithms
- grain-direction-aware optimization
- sheet-usage and trim-loss optimization
- mixed-size part packing improvements
- kerf/tooling-aware placement refinement
- remnant handling
- multi-sheet strategy improvements
- comparison metrics between baseline and optimized nests

Desired outcome:
- reduced material waste and better throughput while preserving deterministic operational behavior

## Phase 5 — Multi-shop / SaaS

Objective:
- evolve the product from single-workflow manufacturing tooling into a multi-tenant operating platform

Focus areas:

- organization-aware access control
- user roles and station permissions
- multi-shop configuration:
  - machine profiles
  - material profiles
  - station layouts
  - workflow rules
- tenant-safe artifact isolation
- customer-facing order visibility
- hosted deployment and environment management
- billing, subscriptions, and commercial controls
- auditability and operational reporting across shops

Desired outcome:
- multiple shops can run independent workflows on the same platform safely and commercially

## Cross-Phase Principles

These principles should stay stable across phases:

- prefer extending the existing shared manufacturing pipeline over creating parallel paths
- keep persisted records as the source of truth
- keep generated outputs inside the `Artifact` pattern where practical
- preserve deterministic behavior before introducing aggressive optimization
- keep operator workflows simple even when underlying planning becomes more sophisticated

## Material Forecast Notes

What the Material Forecast board does now:

- computes pending cut demand from persisted orders, jobs, and parts
- groups demand deterministically by material and thickness
- shows traceability from order to job to part
- estimates sheet demand using simple planning math with a waste factor
- uses live remnant inventory to show candidate coverage and estimated new-sheet reduction
- allows explicit forecast selection to create the next batch

What it does not do yet:

- exact remnant allocation or reservation locking
- optimizer-grade sheet estimation
- automatic bin/container assignment
- purchasing or replenishment automation

## Edge Band Estimation Notes

What the edge band estimator does now:

- calculates banding demand from persisted part dimensions and edge requirements
- derives richer patterns from source edge-band text when available
- maps panel material to a deterministic edge band material/color bucket
- includes fixed per-edge waste allowance
- includes fixed setup/test-run allowance once per edge band material bucket
- rolls totals up for forecast and batch planning views

What it does not do yet:

- purchase orders
- stock depletion
- vendor logic
- machine runtime estimation
- substitution logic

## Machine Telemetry Prep Notes

What the telemetry prep layer does now:

- registers org-owned machines such as CNC routers and edgebanders
- stores machine events in an append-only ledger
- preserves raw payloads for debugging
- normalizes common event types into a stable internal contract
- safely links events to batch, job, or part context when trusted refs are present
- supports simulated events without hardware

What it does not do yet:

- live PLC or vendor protocol integrations
- broad automatic status mutation
- streaming/event-bus infrastructure
- OEE or downtime analytics

## Auto Stage Candidate Signal Notes

What the candidate-signal layer does now:

- derives reviewable stage suggestions from trusted linked machine events
- stores each suggestion with source machine-event traceability
- supports open, applied, rejected, and superseded audit states
- uses existing batch and part transition services when a candidate is applied
- keeps manual review as the default control point
- can auto-apply a small HIGH-confidence subset only when an org-scoped trusted rule explicitly enables it

What it does not do yet:

- broad automatic status mutation
- advanced confidence scoring
- rule-builder UI
- notification workflows
- default-on automation

## Trusted Auto-Apply Notes

What the trusted auto-apply layer does now:

- stores org-scoped trusted auto-apply rules
- supports machine-specific and machine-type rule matching
- only considers HIGH-confidence candidate signals
- only auto-applies a narrow approved action subset
- reuses the same stage-signal apply path as manual review
- preserves audit fields for rule id, applied mode, timestamp, and rationale

What it does not do yet:

- broad default-on automation
- job-level auto-apply
- user-defined rule builders
- retry queues or exception inbox workflows

## Immediate Next Operational Layer

Container / bin workflow sits immediately after CNC cut and before downstream station work.

It is intended to answer:

- where each freshly cut part physically goes
- which job or order a bin is scoped to
- which parts are still loose or unassigned
- which bin downstream edgebanding or packing should pull from

It is not intended to become a general warehouse location system in this phase.

## Remnant Catalog Notes

What the remnant catalog does now:

- stores real persisted remnants with normalized material identity
- tracks remnant code, dimensions, usable area, status, location, and source batch
- supports manual create, update, and partial consume flows
- generates a printable remnant label PDF
- feeds live remnant candidate data back into Material Forecast

What it does not do yet:

- exact nesting-grade remnant allocation
- automated remnant capture from machine telemetry
- conflict-safe reservation across multiple planners
- full warehouse location management

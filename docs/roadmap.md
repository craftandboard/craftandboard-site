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

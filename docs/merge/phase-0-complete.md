# Phase 0 Complete

## What branding was normalized
- Shared SaaS shell branding is now FieldMetriq
- Marketing-host copy is FieldMetriq-first
- Auth pages and shared app chrome present the SaaS as FieldMetriq
- Remaining user-facing Craft & Board SaaS references in `apps/web` were removed

## What docs were normalized
- `.env.example` now clearly explains marketing, app, and API URL responsibilities
- deployment docs explicitly separate:
  - `fieldmetriq.com`
  - `app.fieldmetriq.com`
  - `api.fieldmetriq.com`
- backend import placeholder docs now define the future source and landing areas

## What still remains before backend import
- route-by-route API overlap review
- Prisma schema and migration reconciliation plan
- script/test harness comparison
- backend slice import sequencing

## Exact next recommended phase
- Phase 1: confirm the canonical repo decision operationally and begin backend import inventory work before any code movement

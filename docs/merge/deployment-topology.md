# Deployment Topology

## Source Control
- GitHub
- Canonical repo target: `fieldmetriq-core`
- Current execution repo: this repo until repo move/rename is handled in a later migration branch

## Frontend
- Host: `Vercel`
- Projects:
  - `fieldmetriq-web-dev`
  - `fieldmetriq-web-prod`
- Primary responsibility:
  - Next.js operations UI from `apps/web`

## Backend / Workers / Database
- Host: `Railway`
- Projects:
  - `fieldmetriq-api-dev`
  - `fieldmetriq-api-prod`
- Primary responsibility:
  - Express API from `apps/api`
  - workers/background processing as Railway services
  - Postgres per environment

## Domains
- marketing prod target: `fieldmetriq.com`
- frontend prod target: `app.fieldmetriq.com`
- backend prod target: `api.fieldmetriq.com`
- optional dev targets:
  - `dev.fieldmetriq.com`
  - `api-dev.fieldmetriq.com`

## Positioning
Craft & Board public brand/storefront may remain separate later, but operations and manufacturing software live in the shared FieldMetriq platform deployment.

## Current Domain Cutover Direction
- `fieldmetriq.com` becomes the public marketing/landing site
- `app.fieldmetriq.com` becomes the canonical SaaS app host
- `api.fieldmetriq.com` remains the canonical backend API host
- `craftandboard.com` stops being the primary SaaS domain after validation and is reserved for future ecommerce use

## Current Practical Split
- Vercel deploys `apps/web`
- Railway deploys `apps/api`
- Railway also owns environment-specific Postgres and worker services
- the web app talks to Railway API through `NEXT_PUBLIC_API_BASE_URL`

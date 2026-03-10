# FieldMetriq Domain Cutover

## Current state
- The live SaaS frontend is currently reachable on a Craft & Board-branded domain.
- The backend API target is `https://api.fieldmetriq.com`.
- The frontend code now supports a split between the marketing host and the app host.

## Target state
- `https://fieldmetriq.com` -> public marketing / landing page
- `https://app.fieldmetriq.com` -> logged-in SaaS app
- `https://api.fieldmetriq.com` -> production backend API
- `https://craftandboard.com` -> temporary coexistence only, then removed as primary SaaS domain and reserved for ecommerce later

## Required Vercel domains
- `fieldmetriq.com`
- `app.fieldmetriq.com`

## Required backend domain
- `api.fieldmetriq.com`

## Vercel domain add steps
1. Open the live Vercel project that serves `apps/web`.
2. Add `fieldmetriq.com` as a production domain.
3. Add `app.fieldmetriq.com` as a production domain.
4. Keep the current Craft & Board domain attached during validation so production can fall back if needed.
5. Set production env vars:
   - `NEXT_PUBLIC_MARKETING_URL=https://fieldmetriq.com`
   - `NEXT_PUBLIC_APP_URL=https://app.fieldmetriq.com`
   - `NEXT_PUBLIC_API_BASE_URL=https://api.fieldmetriq.com`
6. Redeploy production after the new domains verify.

## DNS expectations
- `fieldmetriq.com` must point to the live Vercel frontend project
- `app.fieldmetriq.com` must point to the same Vercel frontend project
- `api.fieldmetriq.com` must continue pointing to Railway
- keep `craftandboard.com` intact until the FieldMetriq domains pass smoke tests

## Temporary coexistence note
- The old Craft & Board SaaS domain may still exist briefly during cutover.
- The canonical target after validation is FieldMetriq:
  - marketing -> `fieldmetriq.com`
  - app -> `app.fieldmetriq.com`
  - API -> `api.fieldmetriq.com`

## Why Craft & Board is no longer the SaaS domain
- The software now presents itself as FieldMetriq, not as a single tenant brand.
- Craft & Board remains a business context, but not the platform-facing SaaS identity.

## Why app.fieldmetriq.com is the correct app domain
- It separates public discovery from authenticated product usage.
- It keeps login, app links, and canonical app references consistent.

## How craftandboard.com will be reserved for ecommerce later
- After validation it should be removed as the primary SaaS domain.
- It can later be reused for a separate commerce storefront without changing the FieldMetriq SaaS addresses again.

## Rollback notes
1. If the new domains fail, keep `craftandboard.com` as the live production domain.
2. Revert Vercel production env vars to the previously working values if needed.
3. Promote the last known-good Vercel deployment if a rollback is required.

## Smoke tests
- `https://fieldmetriq.com` loads the public marketing page
- `https://fieldmetriq.com` CTA links point to `https://app.fieldmetriq.com`
- `https://app.fieldmetriq.com` loads the app shell
- `https://app.fieldmetriq.com/login` loads the FieldMetriq sign-in page
- app requests go to `https://api.fieldmetriq.com`
- no app artifact links point to localhost
- `craftandboard.com` can remain as fallback during validation, but no longer presents the SaaS as Craft & Board

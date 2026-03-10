# Production Smoke Check: FieldMetriq

## Marketing checks
- `https://fieldmetriq.com` loads
- homepage shows `FieldMetriq`, not `Craft & Board`
- primary CTA links:
  - `Sign In` -> `https://app.fieldmetriq.com/login`
  - `Open App` -> `https://app.fieldmetriq.com`
- canonical and OG metadata resolve to the FieldMetriq domain

## App checks
- `https://app.fieldmetriq.com` loads the app shell
- header branding shows `FieldMetriq`
- login page shows `FieldMetriq`
- forgot-password, reset-password, and activate pages remain functional
- artifact and print links do not point to localhost

## API checks
- frontend calls `https://api.fieldmetriq.com`
- `https://api.fieldmetriq.com/health` returns success
- no mixed-content warnings appear in the browser

## Temporary coexistence checks
- `craftandboard.com` may still resolve during validation
- if it remains attached temporarily, it should no longer present the SaaS as Craft & Board
- remove it as the primary SaaS domain only after the FieldMetriq domains pass

## Pass/fail recording
- marketing domain: pass / fail
- app domain: pass / fail
- API connectivity: pass / fail
- auth flow: pass / fail
- artifact links: pass / fail
- fallback domain status: pass / fail

# Live API Domain Cutover

## Current generated Railway URL
- `https://fieldmetriq-core-production.up.railway.app`

## Target custom domain
- `https://api.fieldmetriq.com`

## Actions taken
- Confirmed the live Railway production project is `FieldMetriq Production`.
- Confirmed the live service is `fieldmetriq-core`.
- Added `api.fieldmetriq.com` as a custom domain on that live production service.

## DNS record actually required by Railway
- Zone: `fieldmetriq.com`
- Type: `CNAME`
- Name: `api`
- Target: `u4uv13cn.up.railway.app`
- Proxy mode during verification: `DNS only`

## Verification status
- Railway custom domain object created successfully.
- Railway status currently reports:
  - `api.fieldmetriq.com`
  - DNS record requires update
  - certificate status is still validating ownership
- Public DNS check still fails for `api.fieldmetriq.com` as of March 9, 2026 because the Cloudflare DNS record has not been added from this session.

## Rollback path
1. Do not update the Vercel production API base URL until Railway verifies the custom domain.
2. If the custom domain needs to be abandoned, leave the frontend pointed at the old Railway-generated hostname.
3. Remove `api.fieldmetriq.com` from Railway only after confirming production still uses `fieldmetriq-core-production.up.railway.app`.

## Current blocker
- Cloudflare DNS credentials were not available from this terminal session, so the required `api` CNAME could not be created here.

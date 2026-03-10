# Live Deploy Reconcile Results

## What repo actually serves production
- Live production frontend source: `brandonbozarth/fieldmetriq-core`
- Live Vercel project root: `apps/web`
- Local matching checkout: `/Users/brandon/Projects/craft-and-board`

## What Railway service actually serves production
- Railway project: `FieldMetriq Production`
- Railway service: `fieldmetriq-core`
- Current Railway public hostname: `fieldmetriq-core-production.up.railway.app`

## Whether repo mismatch was resolved
- Yes for the frontend source-of-truth audit.
- The mismatch is now explicit:
  - `/Users/brandon/Projects/fieldmetriq-core` is not the live frontend repo/path.
  - `/Users/brandon/Projects/craft-and-board` is the checkout that matches the live Vercel frontend project.

## api.fieldmetriq.com status
- Attached in Railway to the live production service.
- Not publicly resolving yet because the Cloudflare DNS record is still missing.
- Railway-required record:
  - `CNAME api -> u4uv13cn.up.railway.app`

## Vercel env update status
- Not changed yet.
- Held intentionally until Railway verifies `api.fieldmetriq.com`.

## Production redeploy status
- Not triggered yet.
- Held intentionally until the production API custom domain is verified.

## Smoke-test results
- `craftandboard.com` is still healthy
- Existing Railway API hostname is still healthy
- New custom API hostname is pending DNS

## Remaining manual follow-ups
1. Add the Cloudflare DNS record:
   - `CNAME api -> u4uv13cn.up.railway.app`
   - proxy `DNS only`
2. Wait for Railway verification.
3. Update Vercel production env:
   - `NEXT_PUBLIC_API_BASE_URL=https://api.fieldmetriq.com`
4. Redeploy the `craftandboard-web` production project.
5. Re-run smoke tests against `craftandboard.com` and `api.fieldmetriq.com`.

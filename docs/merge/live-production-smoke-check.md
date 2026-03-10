# Live Production Smoke Check

## Frontend checks
- `https://craftandboard.com` loads successfully
- `http://craftandboard.com` redirects to `https://craftandboard.com/`
- Homepage renders from Vercel
- Public site response still looks healthy after the Railway custom-domain attach
- Mixed-content status after cutover:
  - not fully verifiable yet because the frontend has not been switched to `https://api.fieldmetriq.com`

## Backend checks
- `https://fieldmetriq-core-production.up.railway.app/health` -> `200 ok`
- `https://fieldmetriq-core-production.up.railway.app/ready` -> `200 ok`
- `https://api.fieldmetriq.com/health`:
  - currently fails DNS resolution
  - expected until Cloudflare adds `api.fieldmetriq.com -> u4uv13cn.up.railway.app`

## Integration checks
- Old Railway-generated API hostname remains available as fallback
- Live Vercel project has `NEXT_PUBLIC_API_BASE_URL` configured, but the value was not changed in this session because Railway verification is not complete yet
- Production redeploy has not been triggered in this session

## Pass/fail results
- Frontend availability: pass
- Existing Railway backend availability: pass
- New custom API domain public resolution: fail pending DNS
- Production env cutover to `api.fieldmetriq.com`: pending
- Full integration cutover: pending

## Screenshots and links referenced
- Vercel project: `craftandboard-web`
- Vercel production deployment: `https://craftandboard-332vq33x9-sublimedesignnvs-projects.vercel.app`
- Railway fallback API: `https://fieldmetriq-core-production.up.railway.app`
- Target API domain: `https://api.fieldmetriq.com`

## Fallback notes
- Keep frontend traffic on the existing Railway-generated hostname until DNS is live and Railway reports the custom domain verified.
- Do not redeploy the frontend with `NEXT_PUBLIC_API_BASE_URL=https://api.fieldmetriq.com` before that verification step.

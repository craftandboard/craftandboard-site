# Phase 2 Auth / Org Ownership

## Decision
- `craft-and-board auth/org stays canonical`

## Why this is the safer boundary
- `craft-and-board` already has explicit API auth routes in `apps/api/src/routes/auth.ts`.
- Session resolution is already centralized in `apps/api/src/lib/requestContext.ts`.
- Organization membership and role-based access are already explicit in:
  - `apps/api/src/routes/org.ts`
  - `apps/api/src/lib/authorization.ts`
  - `apps/api/src/modules/org/*`
- The canonical monorepo already expects these primitives to back the current `apps/web` experience.

## What this means for `fieldmetriq-core`
- Source auth/session code should not become the canonical runtime owner.
- Source auth logic should be treated as:
  - `adapted`
  - `partially imported later`
  - `mined for business rules`
- In practice:
  - login/session primitives remain owned by `craft-and-board`
  - source route slices imported later must resolve current user and org through target request-context primitives
  - source permission concepts may inform capability expansion, but not replace target membership ownership

## Org and access-control decision
- Canonical org/member/access-control owner:
  - `craft-and-board`
- Reason:
  - the target already exposes explicit organization-member management APIs and a simple capability model tied to monorepo routes
  - the source repo has deeper permission-role concepts, but they are entangled with its monolithic server and project app model

## Risk note
- This keeps the production auth seam stable, but it creates adapter work later.
- The main risk is that imported `fieldmetriq-core` project and payment slices assume:
  - `Org`
  - `OrgMember`
  - permission-role capabilities
  - auth cookie conventions
- Those assumptions must be translated instead of copied directly.

## Explicit import rule for later phases
- Do not import source login/logout/session endpoints.
- Do not import source auth cookie strategy as-is.
- Do not replace target request context with `fieldmetriq-core/src/server.js` middleware.
- Import source business routes only after they can read:
  - canonical user identity
  - canonical organization context
  - canonical role/capability checks

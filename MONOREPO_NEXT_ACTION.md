# MONOREPO NEXT ACTION

Safest canonical repo right now: `/Users/brandon/Projects/craft-and-board`

Do not do yet:
- do not import source auth/session endpoints
- do not merge Prisma models or migrations blindly
- do not start payments or Stripe import first

Exact next Phase 3 action:
- import a read-first `projects` and `workModules` slice from `fieldmetriq-core` into `craft-and-board/apps/api/src/modules`, using target-owned auth/org context and adapter boundaries

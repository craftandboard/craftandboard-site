# Phase 2 Adapter Strategy

## Adapter rule
- Imported source slices must adapt to canonical target auth/org/prisma boundaries.
- Adapters should be introduced before write-heavy imports, not after breakage.

| Adapter | Why needed | Required before which phase | Complexity |
| --- | --- | --- | --- |
| Auth/session adapter | Source routes assume their own cookie and request-auth conventions; target already owns session context | before first imported project/work-module route | high |
| Org/member resolver | Source uses `Org` and `OrgMember`; target uses `Organization` and `OrganizationMember` with different route ownership | before first imported project or lead route | high |
| Capability bridge | Source permission-role model is richer; target capability checks are simpler and current-runtime canonical | before imported write flows | medium |
| Project↔job terminology adapter | Source `Job`/`Project` concepts overlap with target manufacturing job language | before first project/work-module import | high |
| Payment ownership adapter | Source payments and Stripe lifecycle cannot collide with target costing/pricing | before project payments or Stripe import | high |
| Route contract adapter | Source monolithic route assumptions need to fit target modular route registration and response contracts | before any source route import | medium |
| Prisma model translation adapter | Source model names and relations differ from target canonical names | before any imported slice writes to database | high |
| Audit/event adapter | Source audit and webhook events overlap conceptually with target operational events | before payments, leads, or admin imports | medium |

## Adapter priorities

### Must exist before the first Phase 3 slice
- auth/session adapter
- org/member resolver
- project↔job terminology adapter
- prisma model translation adapter

### Must exist before payment-related imports
- payment ownership adapter
- audit/event adapter

### Can follow after first read-only imports
- capability bridge refinement
- route contract normalization helpers

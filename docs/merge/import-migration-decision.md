# Import Migration Decision

| Intake Source | Current Write Target | Canonical Target | Compatibility Needed | Branch Action | Notes / Risks |
| --- | --- | --- | --- | --- | --- |
| Amazon fixture import | `Order`, `OrderItem`, `ManufacturingJob`, `Part` | `SalesOrder`, `SalesOrderItem`, `ShelfJob` | Yes | SWITCH TO CANONICAL | Keep linked legacy rows because current downstream still reads them |
| Normalized fixture/manual import | `Order`, `OrderItem`, `Part` | `SalesOrder`, `SalesOrderItem`, `ShelfJob` | Yes | SWITCH TO CANONICAL | Canonical shelf jobs added; legacy rows remain for compatibility |
| Manual/admin shelf order intake | `SalesOrder`, `SalesOrderItem`, `ShelfJob`, `ManufacturingPacket` | same | No | KEEP LEGACY TEMPORARILY | Already canonical-first; no migration required |
| Configurator-created manufacturing path | `ManufacturingJob`, `Order`, `OrderItem`, `Part` | later `SalesOrder` bridge or direct canonical intake | Yes | KEEP LEGACY TEMPORARILY | Not an import path; defer to later cleanup |
| Manufacturing expansion triggered after intake | `ManufacturingPacket`, `ManufacturingPart`, `ManufacturingBatch` | same | No | KEEP LEGACY TEMPORARILY | Already canonical |

## Decision Summary
- Canonical-first write behavior now applies to import pipelines that previously deepened legacy dependency.
- Temporary dual-write is limited to the persistence boundary for Amazon and normalized fixture imports.
- Legacy compatibility remains intentional and explicit, not scattered across unrelated services.

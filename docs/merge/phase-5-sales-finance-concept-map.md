# Phase 5 Sales / Finance Concept Map

| Concept | Canonical term in monorepo | Source repo equivalent | Target repo equivalent | Stay distinct or unify | Adapter / translation note |
| --- | --- | --- | --- | --- | --- |
| Lead | `Lead` | `Lead` | none | stay distinct for now | import as sales-pipeline concept, not as project |
| Proposal | `Proposal` | `Proposal` | none | stay distinct for now | later proposal acceptance should feed project lifecycle through adapter |
| Estimate | `Cost estimate` vs `sales estimate` | `Estimate` | `ShelfCostEstimate`, `OrderCostEstimate`, pricing scenario outputs | stay distinct | do not collapse source sales estimate into target manufacturing cost estimate |
| Quote | `Proposal` if customer-facing | proposal/estimate blend in source | no first-class canonical quote object | stay distinct | avoid introducing new quote synonym until proposal slice lands |
| Deposit | `Project deposit` | deposit gate / deposit payment | none first-class | stay distinct | represent as project-sales concept, not pricing artifact |
| Payment | `Project payment` | `Payment`, `ProjectPayment` | estimate snapshots and pricing outputs only | stay distinct | adapter must separate actual money movement from pricing/costing records |
| Invoice | `Deferred` | no clear first-class invoice model inspected | none | stay distinct | keep out until payments model is stable |
| Customer | `Project customer/contact` | `Contact`, lead-associated customer | sales-order customer fields | unify later via adapter | contact model should not overwrite order customer fields |
| Project acceptance | `Proposal acceptance` | proposal accepted -> lead won | none | stay distinct | adapter should translate acceptance into project-domain events |
| Conversion | `Lead conversion` | lead advancement / activation | manual project creation | stay distinct | later conversion should create or enrich target projects through service boundary |
| Stage | `Sales stage` or `project stage` depending namespace | lead/project stages | project stage, manufacturing stage signals | stay distinct | namespace sales stages from manufacturing/project execution stages |
| Status | domain-specific status | lead/proposal/payment statuses | order/project/task statuses | stay distinct | never share generic `status` semantics without namespacing |

## Vocabulary rule
- Use domain prefixes in docs and code planning:
  - sales lead status
  - proposal status
  - project payment
  - manufacturing order status
  - pricing estimate

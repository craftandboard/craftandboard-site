# Order Normalization

Craft & Board now bridges the old spreadsheet-driven shelf workflow into a fixture-driven backend pipeline.

## Old workflow

The legacy process lived in Google Sheets and relied on row filtering, calculated columns, manual exports, and menu actions. It was effective for a small operation, but it mixed data entry, transformation logic, and export generation in one place.

## New fixture-driven pipeline

1. Raw Amazon-style fixture JSON files are loaded from `apps/api/src/fixtures/orders`.
2. Zod validates the transitional fixture shape.
3. The importer parses dates, derives customer last names, normalizes material/product labels, and resolves dimensions into decimal inches.
4. Orders and order items are persisted in PostgreSQL via Prisma.
5. Quantity is expanded into physical `Part` records, each representing a cuttable shelf instance.
6. Production outputs are generated from persisted records, not from raw fixture files.

## Dimension parsing

The normalization layer supports:

- decimal numbers like `11.5`
- numeric strings like `"30.25"`
- common fractions like `"1/4"`, `"1/2"`, `"3/4"`
- empty values as zero
- combined whole + fraction inputs

Examples:

- `24` + `"1/2"` -> `24.5`
- `12` + `"1/4"` -> `12.25`
- `"30.25"` -> `30.25`

## Quantity to physical parts

If one order item has `quantity = 3`, the persistence layer creates three distinct physical parts. Each receives:

- deterministic `partCode`
- instance number
- QR placeholder payload
- copied material, dimensions, ship-by date, and customer last name

This mirrors how the shop actually operates: one purchasable line item may become multiple physical pieces.

## Generated outputs

- `GET /production/daily` returns a daily production report with counts by material and production rows suitable for HTML/PDF rendering.
- `GET /production/labels` returns one label row per physical part.
- `GET /production/optimizer` returns one optimizer row per physical part plus CSV output.
- `GET /production/legacy-xml` returns a placeholder migration-bridge XML string inspired by the old workflow.
- `GET /reports/ship-by-summary` returns grouped totals by customer last name.
- `GET /production/bundles` returns production package summaries grouped by ship-by date and material.
- `GET /production/bundles/:bundleCode` returns the new bundle detail payload with pick list, labels, optimizer output, legacy XML, and file renderers.

## Still intentionally deferred

- Real Amazon SP-API ingestion
- Real ShipStation sync
- Production-ready Mozaik or CAM integration
- Authenticated workflow controls
- Batching, nesting, CNC, and QR execution logic

This stage is focused on proving the normalization and downstream contract layer locally.

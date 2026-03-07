# Amazon Import V1

## Purpose

This phase adds a local-first Amazon Seller Central style importer so Craft & Board can ingest realistic marketplace order data without depending on a live Amazon API connection. The importer is fixture-driven on purpose: it lets the app prove the normalization, persistence, production-bundle, and label flows before external integration work begins.

## Why Seller Central style fixtures first

- Seller Central evidence already shows the real field patterns the team has to support.
- The importer can be tested repeatedly without API credentials, rate limits, or account coupling.
- Fixture-backed ingestion gives the production, label, and export layers a stable contract while live integration remains out of scope.

## Source-to-internal field mapping

The importer accepts Amazon-style fields that reflect the legacy customization UI and maps them into Craft & Board terminology.

| Amazon source field | Internal field | Notes |
| --- | --- | --- |
| `amazonOrderId` | `Order.amazonOrderId` | Primary external order reference |
| `amazonOrderItemId` | `OrderItem.amazonOrderItemId` | Primary external line-item reference |
| `buyerName` / `shipToName` | `customerFullName`, `shipToName` | Full source names are preserved |
| last token of buyer/ship-to name | `customerLastName` | Uppercased for operations use |
| `Length (Inches)` | `widthIn` | Legacy Amazon length maps to Craft & Board width |
| `Depth (Inches)` | `depthIn` | Preserved as depth |
| `Length Fraction` / `Length Adjustment` | width adjustment | Supports `No Adjustment`, decimals, and fractions |
| `Depth Fraction` / `Depth Adjustment` | depth adjustment | Supports `No Adjustment`, decimals, and fractions |
| Amazon title / SKU / material hint | `materialCode` | Inferred using explicit material, then SKU, then title |
| legacy edge-band text | `sourceEdgeBandText` | Preserved raw for traceability |

## Dimension parsing rules

Craft & Board customer-facing dimensions are width and depth. Amazon legacy data still uses length and depth, so the importer enforces this mapping:

- `lengthInches` -> internal `widthIn`
- `depthInches` -> internal `depthIn`

Supported adjustment inputs:

- whole numbers like `19`
- decimals like `19.375`
- fractions like `1/8`, `3/8`, `7/8`
- `No Adjustment`
- blank or null

Normalization behavior:

- width = parsed whole length + parsed length adjustment
- depth = parsed whole depth + parsed depth adjustment
- values round to the nearest 1/8 inch
- width must remain between 8 and 35 inches
- depth must remain between 8 and 24 inches
- thickness is always `0.75`

Invalid dimensions currently fail validation cleanly and return import diagnostics instead of silently producing bad production data.

## Material inference

The importer determines `materialCode` in this order:

1. explicit fixture material field
2. SKU text
3. product title text

Current supported material outputs:

- `WHITE_MELAMINE` -> `White Shelf`
- `MAPLE_MELAMINE` -> `Maple Shelf`

Legacy XML compatibility names are also assigned during normalization:

- `CST-White Melamine Shelf - .75 Thick`
- `CST-Maple Melamine Shelf - .75 Thick`

## Edge-band normalization

Seller Central source data may contain historical values such as `Edgeband On Short Side`. Craft & Board no longer produces shelves with mixed edge-band rules. MVP production normalizes every imported shelf part to:

- `edgeBandPattern = ALL_FOUR`

The original source text is still stored for debugging and migration traceability.

## Quantity expansion

Amazon quantity stays aggregated on the `OrderItem`, but persistence expands it into one physical `PartInstance` per shelf piece. That is what allows downstream systems to work correctly:

- production bundles group real physical parts
- labels render one label per physical part
- optimizer exports render one row per physical part
- pick lists and legacy XML remain aggregated at the line-item level

## API flow

Current routes:

- `GET /orders/import/amazon-fixtures/preview`
- `POST /orders/import/amazon-fixtures`
- `GET /orders`
- `GET /orders/:id`
- `GET /orders/:id/normalized`

The importer writes data that the existing `/production` and `/labels` routes already understand, so no separate remapping layer is needed after import.

## Remaining future work

- live Amazon SP-API ingestion
- retry and hold workflows for partial import failures
- richer diagnostics and operator review queues
- shipping / ShipStation handoff
- attachment of source documents or downloadable reports from Amazon

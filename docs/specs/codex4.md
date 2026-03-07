# CODEX4 Amazon Import V1

## Implemented

- Added a Seller Central style fixture importer under `apps/api/src/modules/amazonImport`
- Added realistic Amazon fixture files under `apps/api/src/fixtures/amazon-seller-central`
- Normalized legacy Amazon `Length` into internal `widthIn`
- Normalized `Depth` into internal `depthIn`
- Added material inference from explicit field, SKU, and title
- Preserved raw source customization payloads for traceability
- Normalized all imported edge-band values to `ALL_FOUR`
- Persisted `Order`, `OrderItem`, and expanded physical `Part` instances from Amazon fixture imports
- Added preview and import API routes for Amazon fixtures
- Extended `GET /orders`, `GET /orders/:id`, and `GET /orders/:id/normalized`
- Extended the Orders UI with Amazon import actions and an order detail page
- Kept existing production bundles and labels compatible with the new importer
- Added Amazon-focused unit coverage for inference, dimensions, name parsing, and normalization mapping

## What this phase intentionally did not do

- live Amazon SP-API integration
- ShipStation integration
- downloadable Amazon history ingestion
- production hold queues or operator correction screens
- any change to the production bundle grouping rules

## What the next spec should build

- live ingestion adapter boundary for Amazon SP-API
- import diagnostics persistence and review UI
- shipping/export handoff contracts
- batch creation from imported physical parts
- deeper production state transitions after import

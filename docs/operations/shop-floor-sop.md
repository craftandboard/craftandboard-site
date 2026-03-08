# Shop Floor SOP

This SOP describes the current Craft & Board operational flow for turning persisted configurator and Amazon work into shipped orders.

Use this document as the standard operator sequence for the current system.

## Scope

This SOP covers:

1. Build batch
2. Nest
3. Generate CNC and labels
4. Cutting station
5. Edgebanding station
6. Packing station
7. Shipping station

## Preconditions

Before starting:

- the API and web app must be running
- shelf jobs must already exist in the system
- jobs may come from:
  - configurator-created work
  - Amazon fixture import
- eligible parts must be in draft/unbatched state before batching

Primary operator pages:

- `/batches`
- `/batches/[batchId]`
- `/stations/cutting`
- `/stations/edgebanding`
- `/stations/packing`
- `/stations/shipping`

## 1. Build Batch

Purpose:
- group eligible draft parts into a material-specific production batch

Where:
- `/batches`

Steps:

1. Open the batches page.
2. Choose the material you want to batch.
3. Trigger batch creation.
4. Confirm the response returns:
   - `ok: true`
   - `action: "create-batch"`
   - a new `batchCode`
5. Open the new batch detail page.

Expected result:
- a persisted draft batch exists
- eligible jobs and parts are linked to that batch

If it fails:
- if the response says no eligible draft parts were found, verify that:
  - jobs are still `DRAFT`
  - parts are not already assigned to another batch
  - you selected the correct material

## 2. Nest

Purpose:
- generate sheet layouts for the batch

Where:
- `/batches/[batchId]`

Steps:

1. Open the target batch detail page.
2. Click `Nest Batch`.
3. Wait for the JSON response.
4. Confirm the response returns:
   - `ok: true`
   - `action: "nest-batch"`
   - one or more `sheets`
5. Verify the `Nested Sheets` section now lists sheet placements.

Expected result:
- persisted `Sheet` and `SheetPlacement` rows exist
- the batch moves into a planned state if not already planned

If it fails:
- confirm the batch has parts
- confirm parts are linked to the batch

## 3. Generate CNC + Labels

Purpose:
- produce manufacturing artifacts for cutting and identification

Where:
- `/batches/[batchId]`

Steps:

1. On the batch detail page, click `Generate CNC`.
2. Confirm the response returns:
   - `ok: true`
   - `action: "generate-cnc"`
   - a `packetCode`
3. Click `Generate Labels`.
4. Confirm the response returns:
   - `ok: true`
   - `action: "generate-labels"`
   - label rows with both `labelCode` and `scanCode`
5. If needed, also generate:
   - `Generate Label PDF`
   - `Generate Traveler PDF`
6. Confirm artifact metadata and links appear in the batch detail page.

Expected result:
- current batch CNC packet exists
- current batch label packet exists
- optional printable PDFs exist

Operational note:
- `labelCode` is human-readable
- `scanCode` is the unambiguous floor-scanning identifier

## 4. Cutting Station

Purpose:
- mark queued batched pending parts as cut

Where:
- `/stations/cutting`

Queue contents:
- parts eligible for cutting
- these appear with:
  - `scanCode`
  - `labelCode`
  - batch reference
  - dimensions
  - material

Steps:

1. Open `/stations/cutting`.
2. Confirm the queue contains the parts you expect to cut.
3. Scan or paste the part `scanCode`.
4. Submit the scan.
5. Confirm the response shows the part moved to `CUT`.

Expected result:
- the part leaves the cutting queue
- the part becomes eligible for `/stations/edgebanding`

If it fails:
- verify the operator scanned `scanCode`, not a stale label
- verify the part has not already been cut

## 5. Edgebanding Station

Purpose:
- mark cut parts as edgebanded

Where:
- `/stations/edgebanding`

Queue contents:
- parts with status `CUT`

Steps:

1. Open `/stations/edgebanding`.
2. Scan or paste the part `scanCode`.
3. Submit the scan.
4. Confirm the response shows the part moved to `EDGEBANDED`.

Expected result:
- the part leaves the edgebanding queue
- the part becomes eligible for `/stations/packing`

## 6. Packing Station

Purpose:
- mark edgebanded parts as packed and complete production execution

Where:
- `/stations/packing`

Queue contents:
- parts with status `EDGEBANDED`

Steps:

1. Open `/stations/packing`.
2. Scan or paste the part `scanCode`.
3. Submit the scan.
4. Confirm the response shows the part moved to `PACKED`.

Expected result:
- the part leaves the packing queue
- if all parts for a manufacturing job are now packed:
  - `ManufacturingJob.status` becomes `COMPLETE`
- if all manufacturing jobs for the order are now complete:
  - `Order.status` becomes `READY_FOR_SHIPMENT`

Operational note:
- this completion cascade is automatic
- operators do not need a separate “complete job” or “complete order” action

## 7. Shipping Station

Purpose:
- close out completed orders that are ready for shipment or pickup

Where:
- `/stations/shipping`

Queue contents:
- orders from `GET /orders/completed`
- each row shows:
  - order id
  - source
  - job count
  - part count
  - completed time

Steps:

1. Open `/stations/shipping`.
2. Locate the completed order.
3. Use the packing slip link to open the order detail page if review is needed.
4. Click `Mark Shipped`.
5. Confirm the response shows:
   - `ok: true`
   - `order.status: "SHIPPED"`

Expected result:
- the order leaves the completed work queue
- shipment state is recorded in the system

## Standard Checks

Operators should verify these signals during normal use:

- batch detail shows current sheets and artifacts before floor execution starts
- labels always include both `labelCode` and `scanCode`
- station pages only show work relevant to that station
- packed work no longer appears in earlier stations
- completed orders appear in shipping automatically

## Error Handling

Common responses are structured JSON.

Examples:

```json
{
  "ok": false,
  "error": "Part scan code PART-unknown was not found."
}
```

```json
{
  "ok": false,
  "error": "Order order_123 is not ready to ship."
}
```

If an action fails:

1. read the error exactly
2. confirm the item is in the expected current state
3. confirm you are working in the correct station
4. retry only if the failure was due to bad input, stale page state, or wrong scan target

## Current System Boundaries

This SOP reflects the current implementation.

Not yet included:

- printer integrations
- barcode hardware integrations
- carrier API integration
- packing-slip PDF generation as a dedicated artifact
- shipment tracking capture
- auth and operator permissions

Until those exist, operators should use the existing station pages and batch detail artifacts as the system of record.

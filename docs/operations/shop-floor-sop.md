# Shop Floor SOP

This SOP describes the current Craft & Board operational flow for turning persisted configurator and Amazon work into shipped orders.

Use this document as the standard operator sequence for the current system.

## Scope

This SOP covers:

1. Build batch
2. Nest
3. Generate CNC and labels
4. Container / bin sorting
5. Remnant capture
6. Cutting station
7. Edgebanding station
8. Packing station
9. Shipping station
10. Machine telemetry diagnostics
11. Stage candidate review
12. Trusted auto-apply oversight

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
- `/batches/[batchId]/sorting`
- `/stations/cutting`
- `/stations/edgebanding`
- `/stations/packing`
- `/stations/shipping`
- `/remnants`
- `/machines`
- `/stage-signals`

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

## 4. Container / Bin Sorting

Purpose:
- assign freshly cut parts into physical bins or containers by job or order before downstream handling

Where:
- `/batches/[batchId]/sorting`

Steps:

1. Open the batch sorting workspace from the batch detail page.
2. Create one or more bins or containers for the batch.
3. Prefer a single job or single order per container when practical.
4. Select the active container.
5. Scan each part `scanCode` into the active container as parts come off the CNC.
6. If scanning is unavailable, assign parts manually from the unassigned list.
7. Confirm the sorting summary is moving:
   - assigned parts up
   - unassigned parts down
8. Confirm downstream parts now show a container location.

Expected result:
- every sorted part has a current container location
- the batch sorting summary reflects assigned vs unassigned work
- downstream stations can see the current container code

Operational note:
- mixed containers are possible but should be intentional and visible
- this is an operational sorting layer, not a warehouse inventory location system

## 5. Remnant Capture

Purpose:
- record usable leftover material before it is lost or forgotten

Where:
- `/remnants`

Steps:

1. After CNC cut and sorting, measure any usable leftover piece.
2. Open the remnant catalog.
3. Create a remnant with:
   - material
   - thickness
   - length
   - width
   - location
4. Generate a remnant label.
5. Attach or store the labeled remnant in the recorded location.
6. If the remnant is later trimmed or consumed, update or consume it in the catalog.

Expected result:
- the remnant is now real inventory in the system
- it can appear in Material Forecast as advisory candidate coverage
- future planners can decide whether to consume it before pulling a full sheet

Operational note:
- forecast remnant recommendations are advisory planning math, not exact nesting guarantees
- only remnants with matching normalized material identity are recommended

Planning note:
- Material Forecast and batch detail now show edge band demand using:
  - real part dimensions
  - normalized or source-derived edge requirements
  - fixed per-edge waste allowance
  - fixed setup/test-run allowance per edge band material bucket
- treat these totals as planning/purchasing guidance, not exact machine runtime prediction

## 6. Cutting Station

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

## 7. Edgebanding Station

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

## 8. Packing Station

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

## 9. Shipping Station

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

## 10. Machine Telemetry Diagnostics

Purpose:
- capture machine activity in an append-only event ledger without requiring live PLC or machine integration yet

Where:
- `/machines`
- `/machines/[machineId]`

Steps:

1. Open the machine registry.
2. Register each shop machine with a stable code and type.
3. Open the target machine detail page.
4. Use the simulation form to post a diagnostic event such as:
   - `RUN_STARTED`
   - `SHEET_COMPLETED`
   - `PART_SCANNED`
   - `EDGEBAND_RUN_COMPLETED`
   - `FAULT`
5. Confirm the event log shows:
   - machine
   - event type
   - timestamp
   - source
   - processing status
   - linked batch/job/part context when a trusted ref is present

Expected result:
- the event is stored even if it does not link to production context
- raw payload is preserved for debugging
- matched refs like batch code or `scanCode` can safely link the event to current work

Operational note:
- this phase is telemetry prep only
- machine events do not broadly update production statuses automatically
- later automation should build on this ledger rather than bypassing it

## 11. Stage Candidate Review

Purpose:
- review machine-derived stage suggestions before they affect live batch or part state

Where:
- `/stage-signals`

Steps:

1. Open the stage-signals page.
2. Filter to `OPEN` candidates if needed.
3. Inspect:
   - source machine
   - source machine event type
   - linked batch, job, or part context
   - recommended action
   - rationale
4. If the signal is trustworthy, click `Apply`.
5. If the signal is wrong or stale, click `Reject`.

Expected result:
- applied candidates update supported targets through the normal service-layer rules
- rejected candidates remain visible for audit
- raw machine events remain unchanged as source evidence

Operational note:
- review is the default
- machine events do not silently advance production state in this phase
- unsupported job-level edge-complete candidates may remain visible but non-applying

## 12. Trusted Auto-Apply Oversight

Purpose:
- allow a very small subset of obvious HIGH-confidence machine-confirmed stage signals to apply automatically without removing audit visibility

Where:
- `/trusted-auto-apply`
- `/stage-signals`

Steps:

1. Open the trusted auto-apply rules page.
2. Create a rule for either:
   - one specific machine
   - one machine type
3. Limit rules to the approved phase-1 actions only.
4. Confirm the machine is active and the rule is enabled.
5. Monitor `/stage-signals` for:
   - `appliedMode = AUTO`
   - auto-apply rationale
   - rule id used for the decision

Expected result:
- only eligible HIGH-confidence signals auto-apply
- ineligible or unmatched signals remain OPEN for manual review
- audit history still shows the source machine event and the rule that fired

Operational note:
- manual review remains the default workflow
- trusted auto-apply is opt-in, conservative, and reversible by disabling the rule

## Standard Checks

Operators should verify these signals during normal use:

- batch detail shows current sheets and artifacts before floor execution starts
- labels always include both `labelCode` and `scanCode`
- remnants should carry a remnant label before going into storage
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
- shipment tracking capture
- live PLC or vendor-specific machine drivers
- automatic stage mutation from machine events
- exception inbox or retry workflow for problematic machine-driven signals

Until those exist, operators should use the existing station pages and batch detail artifacts as the system of record.

# Label Engine

Craft & Board now owns the shelf-part label workflow directly inside the app so the paid external label program is no longer required for this MVP path.

## Why it replaced the external tool

- The production bundle workflow already has the exact per-part label data needed internally.
- The old external tool added cost and a manual handoff step.
- Browser-based preview and print are sufficient for the current shelf label workflow.

## Current label spec

- Physical target size: `4in x 2in`
- Orientation: horizontal
- Label type: shelf-part production label
- Product names at MVP:
  - `White Shelf`
  - `Maple Shelf`

## Label data fields

Each label is built from `ShelfLabelData`:

- bundle code
- ship-by date
- product label
- quantity display
- customer last name
- order ID
- box code
- shelf length
- shelf depth
- job number
- part code
- barcode value
- material code

## Barcode choice

- Barcode type: Code 128
- Encoded value: `orderId`
- Rendering strategy: SVG
- If barcode generation fails, the renderer falls back to readable order ID text

## Print strategy

- Browser print first
- Batch preview page supports `window.print()`
- Printable HTML is also available from the API
- CSS targets a `4in x 2in` layout with strong borders and no paid third-party label tooling

## Future steps

- direct thermal printer output
- QR code support
- shipping label workflow
- box code assignment logic
- saved print presets per printer

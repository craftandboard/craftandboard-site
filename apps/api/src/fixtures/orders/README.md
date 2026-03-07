# Order Fixtures

These JSON files are a transitional import format used to model Amazon-style custom shelf orders before a real marketplace integration exists.

Each file contains one raw order using these top-level fields:

- `externalOrderId`
- `amazonOrderId`
- `orderDate`
- `shipByDate`
- `customerName`
- `lineItems[]`

Line items support either split dimensions:

- `widthWhole` + `widthFraction`
- `depthWhole` + `depthFraction`

or already-normalized decimal values:

- `widthIn`
- `depthIn`

This format exists so normalization logic can be tested locally and later adapted to real Amazon payloads without rewriting the downstream workflow.

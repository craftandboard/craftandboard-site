# Legacy Shelf Tracker Analysis

This analysis is based on the legacy Google Apps Script behavior described during migration planning. The old spreadsheet workflow acted as the operating surface for custom shelf orders, daily filtering, label generation, and machine-prep exports.

## What the old script did

- Added custom Google Sheets menu actions for shelf processing
- Reformatted date fields for human-readable ship scheduling
- Derived customer last names from full names for sorting and labels
- Combined whole-number and fractional dimensions into usable shelf sizes
- Normalized SKU and product labels
- Filtered rows by ship-by date and product selection
- Created a daily work subset for production planning
- Generated summary exports for print/PDF use
- Generated label rows with one row per physical shelf piece
- Generated optimizer CSV output in millimeters
- Generated legacy XML output for a downstream Mozaik-style workflow
- Produced date-based reporting grouped by ship-by date and customer last name

## Fields it transformed

- Full customer name -> customer last name
- Whole width + fractional width -> normalized `widthIn`
- Whole depth + fractional depth -> normalized `depthIn`
- Human-entered SKU/title -> normalized material and product labels
- Quantity on one row -> multiple physical shelf pieces
- Ship-by date cell -> daily work grouping key
- Spreadsheet row collection -> export-ready CSV/PDF/XML data

## Transformations that matter now

- Last-name derivation remains useful for labels and production sorting.
- Dimension normalization remains essential because custom shelf sizing often arrives as mixed whole/fraction values.
- Quantity expansion remains essential because the shop cuts physical pieces, not abstract line items.
- Ship-by date grouping still drives daily production planning.
- Export generation still matters, but now it should come from typed backend contracts instead of spreadsheet formulas.

## What should be intentionally replaced

- Spreadsheet menus should be replaced by API endpoints and app pages.
- Sheet filtering should become structured database queries.
- Ad hoc date formatting should become explicit date parsing/formatting utilities.
- CSV/XML string building inside the UI layer should become isolated pure output adapters.
- Hidden spreadsheet state should be replaced with persisted normalized orders, items, and physical part instances.

## Exports that still matter

- Daily production summary for HTML/PDF rendering
- One-label-per-physical-part output
- Optimizer-ready part rows with millimeter dimensions
- Legacy XML bridge output for migration/testing only

## Proposed new domain language

- `RawFixtureOrder`: transitional import payload
- `NormalizedOrderInput`: validated and normalized import domain object
- `Order`: customer order record
- `OrderItem`: normalized purchasable shelf line
- `PartInstance`: one physical cuttable shelf piece
- `ProductionReport`: daily work summary
- `LabelJob`: one label row per physical part
- `OptimizerExport`: future nesting/CAM handoff contract
- `LegacyXmlAdapter`: migration bridge for old downstream expectations

## Old-to-new mapping

| Legacy concept | New concept |
| --- | --- |
| SHELF Tracker row | `OrderItem` + expanded `PartInstance` records |
| Last name columns | derived `customerLastName` |
| Total shelf length/depth | normalized `widthIn` / `depthIn` |
| Filtered daily work sheet | daily production query |
| Label CSV | label job output contract |
| Optimizer CSV | optimizer export contract |
| MZKORD XML | legacy XML adapter contract |
| Report/export menu | API endpoints + web production page |
| Spreadsheet date formatting | explicit date utilities |

The new system preserves the useful business intent while removing spreadsheet-specific architecture.

## Confirmed Output Package from Real Legacy Examples

The real legacy examples confirm that the operational output was not just a generic report. It was a production package generated per ship-by date and per material.

### Pick list overview behavior

- One row per order line item
- Quantity stays aggregated at the line-item level
- Columns centered on ship-by date, product, quantity, customer last name, order ID, and final shelf dimensions
- Acts as the human-readable cut-prep overview for one bundle

### Labels CSV behavior

- One row per physical shelf piece
- Quantity expands into `1 of N`, `2 of N`, etc.
- Job numbers increment sequentially across the entire filtered package
- This is a piece-level operational export, not an order-level report

### Optimizer CSV behavior

- One row per physical shelf piece
- Dimensions are converted to millimeters
- The legacy layout used a fixed 9-column pattern with leading/trailing placeholders
- This export is machine-oriented and must preserve material separation

### MZKORD/XML behavior

- One `Product` node per order line item
- Quantity remains aggregated
- Product naming is material-specific
- Customer last name appears as the product description field

### Material-separated bundle rule

- Ship-by date alone is not enough
- The legacy workflow effectively generated separate file packages for each ship-by date and material bucket
- White melamine and maple melamine must never share a production bundle because they represent separate CNC cutting runs

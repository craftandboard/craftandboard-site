# Nesting Engine V1

## Purpose

This phase adds the first real manufacturing engine layer to Craft & Board. Production bundles are already separated by ship-by date and material; nesting keeps that separation intact and turns one bundle's physical shelf parts into 4x8 sheet layouts.

## Why bundles are nested independently

- White melamine and maple melamine cannot share a sheet.
- Ship-by date remains the operational grouping for production output.
- The bundle is now the clean handoff point between order processing and manufacturing.

A single nesting run always operates on one `bundleCode`, which already encodes ship-by date plus material.

## Sheet assumptions

- Sheet size: `48" x 96"`
- Trim margin: `0.25"` on all four edges
- Usable origin: `0.25, 0.25`
- Usable area: `47.5" x 95.5"`
- Grain direction: ignored in V1
- Shapes: rectangles only

## Packing algorithm

V1 uses a deterministic shelf-packing strategy instead of a more advanced optimizer.

Process:

1. sort physical parts by descending area
2. break ties by longest side
3. break remaining ties by `partCode`
4. place into existing sheets before opening a new sheet
5. place left-to-right within rows
6. open a new row only when the part no longer fits the current rows
7. allow 90-degree rotation when it improves fit and still respects limits

This is intentionally simple and reproducible. The same input bundle should yield the same sheet layout every run.

## Onion skin rule

Parts with area `<= 144 sq in` are flagged with `onionSkin = true`.

In V1:

- the flag is persisted on `SheetPlacement`
- the flag is visualized in sheet maps
- the flag changes the CNC contour depth behavior

There are no tabs and no other hold-down strategies yet.

## Persisted outputs

The nesting pipeline persists:

- `Sheet`
- `SheetPlacement`
- sheet map artifact records
- bundle-scoped artifact metadata

It also exposes SVG, HTML, and JSON sheet map outputs for inspection.

## Current limitations

- no true free-rectangle or genetic optimization
- no kerf-aware optimization model yet
- no common-line cutting
- no sheet remnant management
- no drill/pocket/notch operations
- no machine simulation

The goal of V1 is deterministic, explainable layouts that are operationally useful for shelf cutting right now.

# CODEX3 Label Engine

This phase integrated the shelf-part label engine directly into Craft & Board.

## Implemented

- Shared shelf label contracts
- API label mapping and batch services
- SVG barcode generation for order IDs
- 2x4 horizontal shelf label HTML/CSS renderer
- `/labels` bundle list page
- `/labels/[bundleCode]` batch preview page
- `/labels/[bundleCode]/single/[partCode]` single-label preview page
- Label API routes for JSON and printable HTML
- Production bundle detail links into the label workflow

## Still deferred

- Native printer protocols such as ZPL/EPL
- Final PDF generation pipeline beyond browser print
- Shipping labels
- QR-based shelf labels
- Automated box code logic

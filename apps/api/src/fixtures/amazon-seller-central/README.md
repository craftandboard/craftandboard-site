# Amazon Seller Central Fixtures

These fixtures model the order and customization field patterns seen in Amazon Seller Central custom-product workflows.

They are local-only source fixtures for importer development. They are not live Amazon payloads and do not require any marketplace API connection.

Canonical fields include:

- `amazonOrderId`
- `amazonOrderItemId`
- `asin`
- `quantity`
- `buyerName`
- `shipToName`
- `purchaseDate`
- `shipByDate`
- `productTitle`
- `sku`
- `customizations.lengthInches`
- `customizations.lengthFraction` or `customizations.lengthAdjustment`
- `customizations.depthInches`
- `customizations.depthFraction` or `customizations.depthAdjustment`
- `customizations.edgebanding`
- `customizations.contactInfo`
- `customizations.notes`

Normalization rules map legacy Amazon `Length` to internal `widthIn`, `Depth` to internal `depthIn`, and all imported edge-band values to `ALL_FOUR`.

# Tenant Bootstrap Target

## Tenant Identity
- Recommended tenant/org slug: `craft-board`
- Recommended display name: `Craft & Board`
- Bootstrap objective: represent Craft & Board as the first production tenant on FieldMetriq

## Required Org Settings
- tenant/org slug
- display name
- default currency
- timezone
- default costing profile
- default pricing policy
- default production assumption profile
- default packaging profile
- default label template version

## Default Workstation Concepts
- `CNC_OUTFEED`
- `EDGEBAND_QUEUE`
- `PACKAGING_STAGING`
- `SHIPPING_STAGING`
- future scan stations mapped by function rather than hardcoded tenant-specific route logic

## Machine / Source Mapping Concepts
- CNC router sources
- edgebander sources
- optional saw/drill/PLC bridge sources
- tenant-level mapping from physical machine/source codes into platform machine registry

## Default Material Assumptions
- panel material defaults
- default thickness assumptions
- edge band defaults by material family
- remnant eligibility defaults
- sheet size defaults for planning math

## Packaging Defaults
- box cost assumptions
- wrap/tape/label defaults
- packaging-required defaults by shelf product family
- packaging staging conventions

## Shipping Defaults
- per-unit and per-order shipping allowances
- shipping class mapping
- future carrier integration placeholders

## Pricing / Cost Profile Placeholders
- one default costing profile
- one default pricing policy
- one default production assumption profile
- starter shelf-product assumptions
- clear note that these are tenant-configured values, not platform constants

## Role / User Assumptions
- at least one owner/admin bootstrap user
- operations role coverage for floor workflows
- tenant-scoped permissions using platform auth/role primitives

## Future Tenant-Specific Overrides
- material catalogs and defaults
- packaging assumptions
- shipping assumptions
- machine naming/mapping
- workstation naming
- tenant-specific parsing rules where configuration can express them

## Principle
Craft & Board-specific business rules should become tenant configuration where possible, not hardcoded platform behavior.

# Domain Boundary

## 1. Platform Responsibilities
- manufacturing pipeline
- jobs, packets, parts, batches
- labels and scans
- stage tracking
- trusted evidence rules
- machine telemetry/events
- cost engine framework
- remnant and inventory framework
- integrations framework
- shared ops UI

## 2. Tenant Configuration Responsibilities
- material defaults
- edge band defaults
- packaging defaults
- shipping assumptions
- workstation naming
- machine mapping
- tenant-specific pricing assumptions
- product-specific parsing rules where configurable

## 3. Brand / Business Responsibilities
- logos
- packaging visuals
- product imagery
- Amazon listing copy
- marketing site copy

## 4. Decision Tests
- If a second tenant would need it, it is platform.
- If it is a shop behavior configured by data, it is platform plus tenant config.
- If it is only Craft & Board’s brand expression, it is tenant/business.


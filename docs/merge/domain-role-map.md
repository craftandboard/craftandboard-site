# Domain Role Map

## Canonical roles
- `fieldmetriq.com` = public marketing and landing site
- `app.fieldmetriq.com` = logged-in SaaS application
- `api.fieldmetriq.com` = production backend API
- `craftandboard.com` = temporary coexistence domain during cutover, then future ecommerce brand domain

## Why Craft & Board is no longer the SaaS domain
- Craft & Board is no longer the platform identity of the software.
- The SaaS now needs a platform-facing brand that can support multiple businesses and workflows under one operating system.
- Keeping the app on a tenant-specific consumer brand would make the software look like a single-company internal tool instead of the FieldMetriq platform.

## Why app.fieldmetriq.com is the correct app domain
- It cleanly separates public marketing from the authenticated application.
- It makes auth, canonical links, and support references unambiguous.
- It leaves `fieldmetriq.com` available for public positioning without forcing the marketing homepage to behave like the app shell.

## How craftandboard.com will be reserved for ecommerce later
- It should stop acting as the primary SaaS host after validation.
- It can later point to a separate commerce or brand site without changing the FieldMetriq app or API domains again.
- Temporary coexistence is acceptable during cutover, but the canonical SaaS target becomes `app.fieldmetriq.com`.

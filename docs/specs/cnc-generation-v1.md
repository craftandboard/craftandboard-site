# CNC Generation V1

## Purpose

This phase converts persisted nested sheet placements into first-pass Syntec-style `.NC` files for Laguna/Syntec shop testing.

## Tool assumptions

V1 uses one fixed tool and one fixed feed package:

- tool: `3/8" mortise compression bit`
- spindle: `18000 RPM`
- feed: `450 IPM`
- plunge: `80 IPM`

There is no tool-library abstraction yet.

## Output structure

One `.NC` file is generated per sheet.

Each file includes:

- Craft & Board comment header
- bundle code
- material
- sheet number
- tool/feed/spindle comments
- absolute mode and inch units
- spindle start
- rectangle profile operations for each part
- spindle stop
- end program

Each part operation is commented with:

- `partCode`
- dimensions
- onion-skin yes/no

## Toolpath assumptions

V1 is contour-only.

Included:

- rapid to safe Z
- rapid to part start point
- plunge
- rectangle perimeter cut
- retract to safe Z

Not included:

- drilling
- pocketing
- notching
- tabs
- lead-in/lead-out refinement
- machine upload
- controller verification feedback

## Onion skin behavior

Small parts flagged by the nesting engine use a shallower contour depth in V1 so they retain an onion skin.

This is not yet a production-certified hold-down strategy. It is a first-pass shop-test behavior encoded in the generated file.

## Scope boundary

This phase generates testable job files and metadata only.

It does not attempt to:

- upload to the Laguna controller
- run the machine
- verify machine kinematics
- certify the post as final production output

That is a later phase after shop validation.

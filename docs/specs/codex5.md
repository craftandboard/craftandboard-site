# CODEX5 Nesting and CNC V1

## Implemented

- extended Prisma schema for persisted sheets, placements, CNC jobs, and manufacturing artifacts
- added deterministic 4x8 nesting engine under `apps/api/src/modules/nesting`
- added onion-skin logic for parts `<= 144 sq in`
- added first-pass Syntec `.NC` generation under `apps/api/src/modules/cnc`
- added sheet map SVG/HTML/JSON rendering under `apps/api/src/modules/sheetMaps`
- added manufacturing orchestration and persistence under `apps/api/src/modules/manufacturingJobs`
- added manufacturing API routes
- added manufacturing web pages for bundle and sheet inspection
- linked production bundles into manufacturing actions
- added multi-sheet and onion-skin fixture coverage
- added deterministic nesting and CNC post tests

## Intentionally left as V1 placeholder

- machine upload or controller communication
- advanced optimization heuristics
- kerf compensation strategy
- remnant management
- drilling, pockets, tabs, or notches
- production-certified Laguna/Syntec postprocessing
- machine simulation

## What the next spec should build

- kerf-aware and remnant-aware nesting improvements
- shop validation feedback loop for post tuning
- release workflow from generated jobs to machine-ready jobs
- artifact download packaging
- machine/operator verification states

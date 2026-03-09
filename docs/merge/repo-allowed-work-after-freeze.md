# Allowed Work After Freeze

## Allowed Work In Current Repo Before Cutover
- urgent bug fixes
- deploy and manual wire-up adjustments
- low-risk platform continuation work already on roadmap
- cutover-prep docs
- smoke-test fixes

## Disallowed Work In Current Repo Before Cutover
- treating this repo as a permanent Craft & Board-only platform
- creating new duplicate platform abstractions
- adding naming that deepens repo-identity confusion
- major re-org for aesthetics before repo move
- creating a parallel second repo for the same platform work

## Branch Naming Guidance
- continue platform-oriented branch names
- avoid Craft & Board-only platform framing in new branch names
- keep merge/cutover branches explicit when they are docs or transition work

## Documentation Expectations
- document platform-vs-tenant decisions in `docs/merge`
- update freeze/cutover docs when assumptions change
- call out transitional behavior instead of hiding it

## How To Handle Urgent Fixes
- land only what is needed
- prefer additive, low-risk changes
- avoid piggybacking major architecture work onto hotfixes

## How To Handle Platform Feature Work Before Cutover Completes
- it is allowed temporarily
- it should be described as FieldMetriq platform work
- it should avoid hardcoding tenant-specific architecture

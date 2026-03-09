# Trusted Auto-Apply Cleanup

## Migration

- Final migration directory: `prisma/migrations/20260308190000_trusted_auto_apply_baseline`
- Because the repo had no committed Prisma migrations yet, this cleanup created a baseline migration from the current schema state.
- `prisma/migrations/migration_lock.toml` was added with `provider = "postgresql"`.

## Route Review

- Trusted rule routes were reviewed and kept as:
  - `GET /trusted-auto-apply/rules`
  - `POST /trusted-auto-apply/rules`
  - `POST /trusted-auto-apply/rules/:id/update`
  - `POST /trusted-auto-apply/rules/:id/disable`
- This matches the repo’s current grouped resource style such as `/org/members` and avoids a broader route refactor.

## Nullable And Default Decisions

- `StageCandidateSignal.appliedMode` is nullable so legacy and still-open manual candidates remain backward-safe.
- `StageCandidateSignal.autoAppliedByRuleId` is nullable because only auto-applied candidates should reference a rule.
- `StageCandidateSignal.autoAppliedAt` is nullable because manual and legacy candidates may never auto-apply.
- `StageCandidateSignal.autoApplyRationale` is nullable because only auto-applied candidates need rule rationale.
- `TrustedAutoApplyRule.enabled` defaults to `true`, but no rule is evaluated unless a matching record exists and the machine is active.

## Safe Read Behavior

- `GET /stage-signals`
- `GET /stage-signals/:id`

Both continue to map null audit fields safely to optional response fields, so manual and legacy records do not break reads.

## Action Scope

Trusted evaluation remains limited to:

- `MARK_PART_CUT`
- `MARK_PART_EDGEBANDED`
- `MARK_BATCH_CUT_IN_PROGRESS`
- `MARK_BATCH_CUT_COMPLETE`

Job-level actions remain reviewable but are not trusted auto-apply actions in phase 1.

## Branch Safety

- The trusted auto-apply implementation itself is migration-safe and backward-safe.
- The branch is stable for the next feature from a code and schema perspective.
- Repo note: the worktree currently includes earlier stacked feature work alongside trusted auto-apply. The trusted layer is stable, but the broader branch is not isolated to trusted auto-apply only unless those stacked feature changes are split into dedicated commits or branches.

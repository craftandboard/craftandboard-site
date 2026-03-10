# Phase 9 Provider Boundary Audit

## Canonical Models Added

- `PaymentExecution`
- `PaymentProviderEvent`
- `PaymentReconciliationLog`

## Exact Route List

- `POST /proposals/:proposalId/payment-executions`
- `GET /proposals/:proposalId/payment-executions`
- `GET /payment-executions/:executionId`
- `PATCH /payment-executions/:executionId/refresh`
- `POST /payments/providers/:provider/events`
- `GET /payments/provider-events/:eventId`
- `GET /proposals/:proposalId/provider-events`
- `GET /payment-executions/:executionId/reconciliation-logs`

## Enums Introduced

- `PaymentProvider`: `STRIPE`
- `PaymentExecutionMode`: `HOSTED_CHECKOUT`, `PAYMENT_LINK`, `MANUAL_PROVIDER_SESSION`
- `PaymentExecutionStatus`: `CREATED`, `OPEN`, `COMPLETED`, `EXPIRED`, `CANCELED`, `FAILED`
- `PaymentProviderEventProcessingStatus`: `RECEIVED`, `PROCESSED`, `IGNORED`, `FAILED`
- `PaymentReconciliationAction`: `PAYMENT_MARKED_SUCCEEDED`, `PAYMENT_MARKED_FAILED`, `DEPOSIT_STATUS_SYNCED`, `EVENT_IGNORED`, `EVENT_DUPLICATE`, `EXECUTION_REFRESHED`
- `PaymentReconciliationOutcome`: `APPLIED`, `SKIPPED`, `FAILED`

## Provider Adapter Status

- Stripe adapter is stubbed and target-owned.
- No live Stripe SDK, payment intent execution, or webhook signature enforcement was introduced.
- The registry and adapter contracts are ready for live providers later without changing canonical payment/deposit models.

## Deferred

- Proposal acceptance automation
- Project conversion automation
- Lead stage automation
- Invoice generation
- Accounting sync
- Refund execution
- Stored payment methods
- Customer/contact sync

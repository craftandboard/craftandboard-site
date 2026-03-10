# Phase 8 Payment Boundary Results

## What Was Added

- Canonical target-owned deposit request and payment models.
- Repository, service, status, summary, contract, and validation layers under `apps/api/src/modules/payments`.
- Target-owned deposit/payment routes and org-scoped capability enforcement.
- Proposal payment summary composition from succeeded inbound payments.

## What Was Intentionally Excluded

- Stripe SDK/runtime integration.
- Webhook ingestion.
- Deposit collection checkout flows.
- Proposal acceptance or project conversion automation.
- Refund execution.
- Customer/contact import.

## Route List

- `POST /proposals/:proposalId/deposit-requests`
- `GET /proposals/:proposalId/deposit-requests`
- `GET /deposit-requests/:depositRequestId`
- `PATCH /deposit-requests/:depositRequestId`
- `POST /proposals/:proposalId/payments`
- `GET /proposals/:proposalId/payments`
- `GET /payments/:paymentId`
- `PATCH /payments/:paymentId`
- `GET /proposals/:proposalId/payment-summary`

## Deferred To Later Phases

- Provider execution adapters.
- Stripe checkout/session creation.
- Webhook reconciliation.
- Proposal acceptance automation.
- Customer/account linkage improvements.
- Refund execution and accounting sync.

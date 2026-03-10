# Phase 8 Payment Boundary Audit

## What Was Added

- Target-owned Prisma money boundary for `DepositRequest` and `Payment`.
- Target-owned payment capabilities, context adapters, repository, service, status adapter, summary helper, contracts, schemas, and routes.
- Read/write-safe routes for deposit requests, payments, and proposal payment summary.

## What Was Intentionally Excluded

- Stripe SDK integration.
- Checkout/payment intent creation.
- Webhook ingestion or reconciliation workers.
- Proposal acceptance automation.
- Lead/proposal/project conversion automation.
- Customer/contact import or sync.

## Exact Route List

- `POST /proposals/:proposalId/deposit-requests`
- `GET /proposals/:proposalId/deposit-requests`
- `GET /deposit-requests/:depositRequestId`
- `PATCH /deposit-requests/:depositRequestId`
- `POST /proposals/:proposalId/payments`
- `GET /proposals/:proposalId/payments`
- `GET /payments/:paymentId`
- `PATCH /payments/:paymentId`
- `GET /proposals/:proposalId/payment-summary`

## Enums Introduced

- `DepositRequestKind`: `DEPOSIT`
- `DepositRequestStatus`: `DRAFT`, `REQUESTED`, `PARTIALLY_PAID`, `PAID`, `VOID`
- `PaymentStatus`: `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELED`, `REFUNDED`
- `PaymentMethod`: `MANUAL`, `EXTERNAL_PROVIDER`
- `PaymentDirection`: `INBOUND`

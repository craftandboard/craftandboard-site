import {
  createReconciliationLogRecord,
  updatePaymentExecutionRecord,
  updateProviderEventRecord
} from "./repository.js";
import { updatePaymentStatus } from "../payments/service.js";

type ReconcileEventInput = {
  organizationId: string;
  provider: "STRIPE";
  providerEventRecordId: string;
  executionId?: string | null;
  paymentId?: string | null;
  depositRequestId?: string | null;
  paymentStatus?: "SUCCEEDED" | "FAILED" | "CANCELED" | null;
  executionStatus?: "CREATED" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELED" | "FAILED" | null;
};

type ReconcileExecutionInput = {
  organizationId: string;
  provider: "STRIPE";
  executionId: string;
  paymentId?: string | null;
  depositRequestId?: string | null;
  paymentStatus?: "SUCCEEDED" | "FAILED" | "CANCELED" | null;
  executionStatus?: "CREATED" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELED" | "FAILED";
};

export async function reconcileProviderEvent(input: ReconcileEventInput) {
  if (input.executionId && input.executionStatus) {
    await updatePaymentExecutionRecord({
      organizationId: input.organizationId,
      executionId: input.executionId,
      status: input.executionStatus,
      completedAt: input.executionStatus === "COMPLETED" ? new Date() : undefined,
      expiredAt: input.executionStatus === "EXPIRED" ? new Date() : undefined,
      canceledAt: input.executionStatus === "CANCELED" ? new Date() : undefined
    });
  }

  if (!input.paymentId || !input.paymentStatus) {
    await createReconciliationLogRecord({
      organizationId: input.organizationId,
      provider: input.provider,
      executionId: input.executionId,
      providerEventId: input.providerEventRecordId,
      paymentId: input.paymentId,
      depositRequestId: input.depositRequestId,
      action: "EVENT_IGNORED",
      outcome: "SKIPPED",
      message: "Provider event carried no canonical payment status mutation."
    });
    await updateProviderEventRecord({
      organizationId: input.organizationId,
      eventId: input.providerEventRecordId,
      processingStatus: "IGNORED",
      processedAt: new Date()
    });
    return;
  }

  await updatePaymentStatus({
    organizationId: input.organizationId,
    paymentId: input.paymentId,
    status: input.paymentStatus
  });

  await createReconciliationLogRecord({
    organizationId: input.organizationId,
    provider: input.provider,
    executionId: input.executionId,
    providerEventId: input.providerEventRecordId,
    paymentId: input.paymentId,
    depositRequestId: input.depositRequestId,
    action: input.paymentStatus === "SUCCEEDED" ? "PAYMENT_MARKED_SUCCEEDED" : "PAYMENT_MARKED_FAILED",
    outcome: "APPLIED",
    message: `Canonical payment status synced to ${input.paymentStatus}.`
  });
  await createReconciliationLogRecord({
    organizationId: input.organizationId,
    provider: input.provider,
    executionId: input.executionId,
    providerEventId: input.providerEventRecordId,
    paymentId: input.paymentId,
    depositRequestId: input.depositRequestId,
    action: "DEPOSIT_STATUS_SYNCED",
    outcome: "APPLIED",
    message: "Canonical deposit state re-synced through the Phase 8 money service."
  });
  await updateProviderEventRecord({
    organizationId: input.organizationId,
    eventId: input.providerEventRecordId,
    processingStatus: "PROCESSED",
    processedAt: new Date(),
    executionId: input.executionId,
    paymentId: input.paymentId,
    depositRequestId: input.depositRequestId
  });
}

export async function reconcileExecutionRefresh(input: ReconcileExecutionInput) {
  await updatePaymentExecutionRecord({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: input.executionStatus,
    completedAt: input.executionStatus === "COMPLETED" ? new Date() : undefined,
    expiredAt: input.executionStatus === "EXPIRED" ? new Date() : undefined,
    canceledAt: input.executionStatus === "CANCELED" ? new Date() : undefined
  });

  if (input.paymentId && input.paymentStatus) {
    await updatePaymentStatus({
      organizationId: input.organizationId,
      paymentId: input.paymentId,
      status: input.paymentStatus
    });
  }

  await createReconciliationLogRecord({
    organizationId: input.organizationId,
    provider: input.provider,
    executionId: input.executionId,
    paymentId: input.paymentId,
    depositRequestId: input.depositRequestId,
    action: "EXECUTION_REFRESHED",
    outcome: "APPLIED",
    message: `Execution refreshed to ${input.executionStatus}.`
  });
}

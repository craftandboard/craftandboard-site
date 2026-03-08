import type {
  AmazonSellerCentralFixture,
  MaterialCode,
  NormalizedOrderInput
} from "@craft-and-board/shared";

export type { AmazonSellerCentralFixture, MaterialCode, NormalizedOrderInput };

export interface AmazonImportDiagnostic {
  fileName: string;
  amazonOrderId?: string;
  amazonOrderItemId?: string;
  severity: "warning" | "error";
  message: string;
}

export interface AmazonImportPreviewRow {
  fileName: string;
  normalizedOrder: NormalizedOrderInput;
}

export interface AmazonImportPreview {
  filesProcessed: number;
  previews: AmazonImportPreviewRow[];
  warnings: AmazonImportDiagnostic[];
  errors: AmazonImportDiagnostic[];
}

export interface AmazonImportResult {
  filesProcessed: number;
  ordersCreated: number;
  orderItemsCreated: number;
  partInstancesCreated: number;
  jobsCreated: number;
  warnings: AmazonImportDiagnostic[];
  errors: AmazonImportDiagnostic[];
  orders: Array<{
    id: string;
    source: "AMAZON";
  }>;
  jobs: Array<{
    id: string;
    status: "DRAFT";
    source: "AMAZON";
    orderId: string;
    orderItemId: string;
  }>;
  parts: Array<{
    id: string;
    jobId: string;
    orderId: string;
    orderItemId: string;
    labelCode: string;
    scanCode: string;
    source: "AMAZON";
  }>;
}

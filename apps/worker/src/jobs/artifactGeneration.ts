import type { ArtifactJobType } from "@craft-and-board/shared";
import {
  generateBatchCncCsv,
  generateBatchCncJson,
  generateBatchCncMosaic,
  generateBatchLabelCsv,
  generateBatchLabelPdf,
  generateBatchTravelerPdf
} from "../../../api/src/modules/batches/service.js";
import { deliverBatchCncToWatchFolder } from "../../../api/src/modules/machineIntegration/service.js";
import { generatePackingSlipPdf } from "../../../api/src/modules/orders/service.js";

export interface ArtifactGenerationJobData {
  type: ArtifactJobType;
  organizationId: string;
  batchId?: string;
  orderId?: string;
  format?: "csv" | "mosaic" | "json";
}

export async function processArtifactGenerationJob(data: ArtifactGenerationJobData) {
  switch (data.type) {
    case "generate-cnc-csv":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchCncCsv(data.batchId, data.organizationId);
    case "generate-cnc-mosaic":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchCncMosaic(data.batchId, data.organizationId);
    case "generate-cnc-json":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchCncJson(data.batchId, data.organizationId);
    case "generate-label-csv":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchLabelCsv(data.batchId, data.organizationId);
    case "generate-label-pdf":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchLabelPdf(data.batchId, data.organizationId);
    case "generate-traveler-pdf":
      if (!data.batchId) throw new Error("batchId is required.");
      return generateBatchTravelerPdf(data.batchId, data.organizationId);
    case "generate-packing-slip":
      if (!data.orderId) throw new Error("orderId is required.");
      return generatePackingSlipPdf(data.orderId, data.organizationId);
    case "deliver-cnc-watch-folder":
      if (!data.batchId) throw new Error("batchId is required.");
      if (!data.format) throw new Error("format is required.");
      return deliverBatchCncToWatchFolder(data.batchId, data.format, data.organizationId);
    default:
      throw new Error(`Unsupported artifact job type: ${String((data as { type?: string }).type)}`);
  }
}

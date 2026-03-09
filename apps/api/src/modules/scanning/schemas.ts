import { z } from "zod";

export const scanLookupSchema = z.object({
  scanValue: z.string().trim().min(1),
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const partScanSchema = z.object({
  scanValue: z.string().trim().min(1),
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]),
  actionType: z.enum(["CHECK_IN", "CHECK_OUT", "MARK_STAGE_COMPLETE", "MOVE", "ASSIGN_CONTAINER", "REPRINT_LABEL"]),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const listScanEventsQuerySchema = z.object({
  result: z.enum(["ACCEPTED", "REJECTED", "NOOP"]).optional(),
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]).optional(),
  entityType: z.enum(["MANUFACTURING_PART", "MANUFACTURING_BATCH", "CONTAINER", "CONTAINER_LOCATION"]).optional()
});

export const createWorkflowStationRuleSchema = z.object({
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]),
  entityType: z.enum(["MANUFACTURING_PART", "MANUFACTURING_BATCH", "CONTAINER", "CONTAINER_LOCATION"]),
  fromStatus: z.string().trim().min(1),
  actionType: z.enum(["LOOKUP", "CHECK_IN", "CHECK_OUT", "MARK_STAGE_COMPLETE", "MOVE", "ASSIGN_CONTAINER", "REPRINT_LABEL"]),
  toStatus: z.string().trim().min(1),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional()
});

export const updateWorkflowStationRuleSchema = createWorkflowStationRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one workflow station rule field must be provided." }
);

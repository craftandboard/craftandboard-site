import { z } from "zod";

export const createManagedContainerSchema = z.object({
  containerCode: z.string().trim().min(1).max(80).optional(),
  containerType: z.enum(["BIN", "CART", "TOTE", "PALLET", "RACK_SLOT", "STAGING_AREA", "CONTAINER"]).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  barcodeValue: z.string().trim().min(1).max(160).optional(),
  qrValue: z.string().trim().min(1).max(160).optional(),
  capacityNotes: z.string().trim().max(500).optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "HOLD", "RETIRED", "OPEN", "SORTING", "COMPLETE", "CLOSED"]).optional(),
  currentLocationId: z.string().min(1).optional(),
  manufacturingBatchId: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

export const updateManagedContainerSchema = createManagedContainerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one container field must be provided."
  });

export const createContainerLocationSchema = z.object({
  code: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  zone: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional()
});

export const updateContainerLocationSchema = createContainerLocationSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one location field must be provided."
  });

export const activateContainerSchema = z.object({
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const assignPartToExplicitContainerSchema = z.object({
  containerId: z.string().min(1).optional(),
  containerScanValue: z.string().trim().min(1).optional(),
  partId: z.string().min(1).optional(),
  partScanValue: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.containerId || value.containerScanValue, {
  message: "containerId or containerScanValue is required."
}).refine((value) => value.partId || value.partScanValue, {
  message: "partId or partScanValue is required."
});

export const assignPartToActiveContainerSchema = z.object({
  partId: z.string().min(1).optional(),
  partScanValue: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.partId || value.partScanValue, {
  message: "partId or partScanValue is required."
});

export const unassignPartSchema = z.object({
  containerId: z.string().min(1).optional(),
  partId: z.string().min(1).optional(),
  partScanValue: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.partId || value.partScanValue, {
  message: "partId or partScanValue is required."
});

export const moveContainerSchema = z.object({
  toLocationId: z.string().min(1).optional(),
  toLocationCode: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.toLocationId || value.toLocationCode, {
  message: "toLocationId or toLocationCode is required."
});

export const listContainerAssignmentsQuerySchema = z.object({
  containerId: z.string().min(1).optional(),
  manufacturingPartId: z.string().min(1).optional(),
  activeOnly: z.coerce.boolean().optional()
});

export const scanContainerSchema = z.object({
  scanValue: z.string().trim().min(1),
  stationType: z.enum(["CUT", "EDGEBAND", "PACKAGING", "QC", "SHIPPING", "STAGING", "CONTAINER", "UNKNOWN"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const scanLocationSchema = z.object({
  locationScanValue: z.string().trim().min(1).optional(),
  locationCode: z.string().trim().min(1).optional(),
  toLocationId: z.string().min(1).optional(),
  containerId: z.string().min(1).optional(),
  containerScanValue: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.locationScanValue || value.locationCode || value.toLocationId, {
  message: "locationScanValue, locationCode, or toLocationId is required."
});

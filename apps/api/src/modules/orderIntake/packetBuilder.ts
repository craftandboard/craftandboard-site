export function buildManufacturingPacketSummary(input: {
  packetNumber: string;
  shelfJobs: Array<{
    id: string;
    salesOrderId: string;
    salesOrderItemId: string;
    quantity: number;
    normalizedSpecJson: Record<string, unknown>;
  }>;
}) {
  const orderIds = Array.from(new Set(input.shelfJobs.map((job) => job.salesOrderId)));
  const totalUnits = input.shelfJobs.reduce((sum, job) => sum + job.quantity, 0);

  return {
    packetNumber: input.packetNumber,
    jobCount: input.shelfJobs.length,
    orderCount: orderIds.length,
    totalUnits,
    jobs: input.shelfJobs.map((job) => ({
      id: job.id,
      salesOrderId: job.salesOrderId,
      salesOrderItemId: job.salesOrderItemId,
      quantity: job.quantity,
      normalizedSpecJson: job.normalizedSpecJson
    }))
  };
}

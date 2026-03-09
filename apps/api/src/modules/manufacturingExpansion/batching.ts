export function buildManufacturingBatchNumber(input: {
  batchType: "CUT" | "EDGEBAND" | "PACKAGING";
  count: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `${input.batchType}-${dateStamp}-${String(input.count + 1).padStart(3, "0")}`;
}

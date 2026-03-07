import type { NormalizedOrderInput, NormalizedOrderItemInput } from "@craft-and-board/shared";

function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export function buildPartInstances(input: {
  order: NormalizedOrderInput;
  orderItem: NormalizedOrderItemInput;
  orderCode: string;
  itemIndex: number;
}): Array<{
  name: string;
  partCode: string;
  qrPayload: string;
  instanceNumber: number;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  materialCode: NormalizedOrderItemInput["materialCode"];
  edgeBandPattern: NormalizedOrderItemInput["edgeBandPattern"];
  customerLastName: string;
  shipByDate: Date;
  status: "READY_FOR_BATCH";
}> {
  return Array.from({ length: input.orderItem.quantity }, (_, index) => {
    const instanceNumber = index + 1;
    const partCode = `${input.orderCode}-I${padNumber(input.itemIndex)}-P${padNumber(instanceNumber)}`;

    return {
      name: `${input.orderItem.productLabel} ${input.order.customerLastName}`,
      partCode,
      qrPayload: `cb://${partCode}`,
      instanceNumber,
      widthIn: input.orderItem.widthIn,
      depthIn: input.orderItem.depthIn,
      thicknessIn: input.orderItem.thicknessIn,
      materialCode: input.orderItem.materialCode,
      edgeBandPattern: "ALL_FOUR",
      customerLastName: input.order.customerLastName,
      shipByDate: new Date(input.order.shipByDate),
      status: "READY_FOR_BATCH"
    };
  });
}

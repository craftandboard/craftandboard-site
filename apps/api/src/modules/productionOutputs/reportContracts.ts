import type { ProductionReport } from "@craft-and-board/shared";

export type { ProductionReport };

export interface ShipBySummaryRow {
  customerLastName: string;
  orders: number;
  lineItems: number;
  physicalParts: number;
}

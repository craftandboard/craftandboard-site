export interface OrderItem {
  id: string;
  orderId: string;
  sku: string;
  quantity: number;
  materialCode?: string;
}

export interface Order {
  id: string;
  organizationId: string;
  externalRef?: string;
  status: "draft" | "received" | "in_production" | "completed";
  customerName: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Part {
  id: string;
  orderItemId?: string;
  batchId?: string;
  materialCode?: string;
  status: "pending" | "batched" | "cut" | "packed";
}

export interface Batch {
  id: string;
  organizationId: string;
  name: string;
  status: "draft" | "planned" | "released" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface Sheet {
  id: string;
  batchId: string;
  materialCode: string;
  widthMm: number;
  heightMm: number;
}

export interface Station {
  id: string;
  organizationId: string;
  name: string;
  type: "scan" | "assembly" | "pack" | "ship";
  createdAt: string;
  updatedAt: string;
}

export interface LabelData {
  code: string;
  orderId?: string;
  batchId?: string;
  partId?: string;
}

export interface ApiHealthResponse {
  status: "ok" | "error";
  service: "api";
  timestamp: string;
  scope: string;
}

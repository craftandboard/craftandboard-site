import type { Order } from "@craft-and-board/shared";

export function listOrders(): Order[] {
  return [
    {
      id: "ord_foundation_001",
      organizationId: "org_local",
      externalRef: "FOUNDATION-001",
      status: "draft",
      customerName: "Local Scaffold",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: []
    }
  ];
}

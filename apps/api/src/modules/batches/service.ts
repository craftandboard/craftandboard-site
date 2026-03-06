import type { Batch } from "@craft-and-board/shared";

export function listBatches(): Batch[] {
  return [
    {
      id: "bat_foundation_001",
      organizationId: "org_local",
      name: "Foundation Batch",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

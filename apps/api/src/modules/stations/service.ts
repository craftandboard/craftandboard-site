import type { Station } from "@craft-and-board/shared";

export function listStations(): Station[] {
  return [
    {
      id: "station_scan_001",
      organizationId: "org_local",
      name: "Scan In",
      type: "scan",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

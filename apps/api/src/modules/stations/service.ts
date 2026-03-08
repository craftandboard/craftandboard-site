import type { Station } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";

export type ShopFloorStationKey = "cutting" | "edgebanding" | "packing";

const STATION_CONFIG = {
  cutting: {
    key: "cutting",
    name: "Cutting Station",
    type: "scan",
    nextStatus: "CUT",
    eligibleStatuses: ["READY_FOR_BATCH", "BATCHED"] as const
  },
  edgebanding: {
    key: "edgebanding",
    name: "Edgebanding Station",
    type: "assembly",
    nextStatus: "EDGEBANDED",
    eligibleStatuses: ["CUT"] as const
  },
  packing: {
    key: "packing",
    name: "Packing Station",
    type: "pack",
    nextStatus: "PACKED",
    eligibleStatuses: ["EDGEBANDED"] as const
  }
} as const;

function toLabelCode(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

export function isShopFloorStationKey(value: string): value is ShopFloorStationKey {
  return value in STATION_CONFIG;
}

export function listStations(organizationId = LOCAL_ORG_ID): Station[] {
  const now = new Date().toISOString();

  return Object.values(STATION_CONFIG).map((station) => ({
    id: `station_${station.key}`,
    organizationId,
    name: station.name,
    type: station.type,
    createdAt: now,
    updatedAt: now
  }));
}

export async function getStationQueue(stationKey: ShopFloorStationKey, organizationId = LOCAL_ORG_ID) {
  const station = STATION_CONFIG[stationKey];

  const parts = await prisma.part.findMany({
    where: {
      organizationId,
      batchId: {
        not: null
      },
      status: {
        in: [...station.eligibleStatuses]
      }
    },
    include: {
      batch: {
        select: {
          code: true,
          status: true
        }
      },
      manufacturingJob: {
        select: {
          labelCode: true
        }
      }
    },
    orderBy: [
      {
        batch: {
          code: "asc"
        }
      },
      { updatedAt: "asc" },
      { instanceNumber: "asc" }
    ]
  });

  return {
    ok: true as const,
    station: station.key,
    nextStatus: station.nextStatus,
    parts: parts.map((part) => ({
      partId: part.id,
      scanCode: part.scanCode,
      labelCode: toLabelCode(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber),
      material: part.materialCode ?? "WHITE_MELAMINE",
      width: Number(part.widthIn),
      depth: Number(part.depthIn),
      batchId: part.batchId ?? "",
      batchCode: part.batch?.code ?? "UNASSIGNED",
      batchStatus: part.batch?.status?.toLowerCase() ?? "unassigned"
    }))
  };
}

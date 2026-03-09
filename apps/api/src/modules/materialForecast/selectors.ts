import type { EdgeBandPattern, MaterialCode, SalesChannel } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";

export const FORECAST_ELIGIBLE_ORDER_STATUSES = [
  "DRAFT",
  "IMPORTED",
  "READY_FOR_BATCH",
  "RECEIVED",
  "IN_PRODUCTION"
] as const;

export const FORECAST_ELIGIBLE_PART_STATUSES = ["PENDING", "READY_FOR_BATCH"] as const;

export type ForecastEligiblePartRecord = {
  id: string;
  orderId: string | null;
  orderItemId: string | null;
  manufacturingJobId: string | null;
  partCode: string;
  scanCode: string;
  instanceNumber: number;
  materialCode: MaterialCode | null;
  edgeBandPattern: EdgeBandPattern;
  widthIn: { toString(): string };
  depthIn: { toString(): string };
  thicknessIn: { toString(): string };
  status: string;
  order: {
    id: string;
    customerName: string;
    shipByDate: Date | null;
    status: string;
  } | null;
  manufacturingJob: {
    id: string;
    source: "CONFIGURATOR" | "AMAZON";
    channel: SalesChannel;
    labelCode: string;
    status: string;
  } | null;
};

export async function selectEligibleForecastParts(organizationId = LOCAL_ORG_ID) {
  return prisma.part.findMany({
    where: {
      organizationId,
      batchId: null,
      materialCode: {
        not: null
      },
      status: {
        in: [...FORECAST_ELIGIBLE_PART_STATUSES]
      },
      manufacturingJob: {
        is: {
          status: "DRAFT",
          batchId: null
        }
      },
      order: {
        is: {
          status: {
            in: [...FORECAST_ELIGIBLE_ORDER_STATUSES]
          }
        }
      }
    },
    include: {
      order: {
        select: {
          id: true,
          customerName: true,
          shipByDate: true,
          status: true
        }
      },
      manufacturingJob: {
        select: {
          id: true,
          source: true,
          channel: true,
          labelCode: true,
          status: true
        }
      }
    },
    orderBy: [
      { materialCode: "asc" },
      { shipByDate: "asc" },
      { createdAt: "asc" },
      { instanceNumber: "asc" }
    ]
  });
}

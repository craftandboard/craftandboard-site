import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import {
  FORECAST_ELIGIBLE_ORDER_STATUSES,
  FORECAST_ELIGIBLE_PART_STATUSES
} from "../materialForecast/selectors.js";

export async function selectForecastEdgeBandParts(organizationId = LOCAL_ORG_ID) {
  return prisma.part.findMany({
    where: {
      organizationId,
      batchId: null,
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
          customerName: true
        }
      },
      orderItem: {
        select: {
          id: true,
          sourceEdgeBandText: true
        }
      },
      manufacturingJob: {
        select: {
          id: true,
          source: true,
          labelCode: true,
          materialCode: true,
          edgeBandPattern: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
  });
}

export async function selectBatchEdgeBandParts(batchId: string, organizationId = LOCAL_ORG_ID) {
  return prisma.part.findMany({
    where: {
      organizationId,
      batchId
    },
    include: {
      order: {
        select: {
          id: true,
          customerName: true
        }
      },
      orderItem: {
        select: {
          id: true,
          sourceEdgeBandText: true
        }
      },
      manufacturingJob: {
        select: {
          id: true,
          source: true,
          labelCode: true,
          materialCode: true,
          edgeBandPattern: true
        }
      },
      batch: {
        select: {
          id: true,
          code: true,
          materialCode: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
  });
}

export async function selectOrderEdgeBandParts(orderId: string, organizationId = LOCAL_ORG_ID) {
  return prisma.part.findMany({
    where: {
      organizationId,
      orderId
    },
    include: {
      order: {
        select: {
          id: true,
          customerName: true,
          status: true
        }
      },
      orderItem: {
        select: {
          id: true,
          sourceEdgeBandText: true
        }
      },
      manufacturingJob: {
        select: {
          id: true,
          source: true,
          labelCode: true,
          materialCode: true,
          edgeBandPattern: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
  });
}

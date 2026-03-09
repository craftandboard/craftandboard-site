import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  organization: {
    upsert: vi.fn()
  },
  costProfile: {
    findFirst: vi.fn()
  },
  productionAssumptionProfile: {
    findFirst: vi.fn()
  },
  pricingPolicy: {
    findFirst: vi.fn()
  },
  packagingProfile: {
    findFirst: vi.fn()
  },
  shelfProduct: {
    findMany: vi.fn()
  },
  salesOrder: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  salesOrderItem: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  shelfJob: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  manufacturingJob: {
    upsert: vi.fn()
  },
  order: {
    upsert: vi.fn()
  },
  orderItem: {
    upsert: vi.fn()
  },
  part: {
    deleteMany: vi.fn(),
    createMany: vi.fn()
  }
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/pricing/service.js", () => ({
  createPricingScenarioSnapshot: vi.fn(async () => ({
    scenario: { id: "pricing_scenario_1" },
    result: { pricingBreakdown: { finalRunChargeCents: 1000 } }
  }))
}));
vi.mock("../modules/settings/service.js", async () => {
  const actual = await vi.importActual<any>("../modules/settings/service.js");
  return {
    ...actual,
    ensureDefaultProfiles: vi.fn(async () => undefined)
  };
});

import { persistNormalizedOrders } from "../modules/ordersImport/persistOrders.js";

describe("normalized order import persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.organization.upsert.mockResolvedValue({ id: "org_local_craft_board" });
    prismaMock.costProfile.findFirst.mockResolvedValue({ id: "cost_profile_1" });
    prismaMock.productionAssumptionProfile.findFirst.mockResolvedValue({ id: "production_profile_1" });
    prismaMock.pricingPolicy.findFirst.mockResolvedValue({ id: "pricing_policy_1" });
    prismaMock.packagingProfile.findFirst.mockResolvedValue({ id: "packaging_1" });
    prismaMock.shelfProduct.findMany.mockResolvedValue([
      {
        id: "shelf_product_1",
        materialType: "WHITE_MELAMINE",
        defaultThicknessIn: new Prisma.Decimal("0.750")
      }
    ]);
    prismaMock.salesOrder.findFirst.mockResolvedValue(null);
    prismaMock.salesOrder.create.mockResolvedValue({ id: "sales_order_1" });
    prismaMock.salesOrder.update.mockResolvedValue({ id: "sales_order_1" });
    prismaMock.salesOrderItem.findFirst.mockResolvedValue(null);
    prismaMock.salesOrderItem.create.mockResolvedValue({
      id: "sales_order_item_1",
      title: "White Shelf",
      quantity: 1,
      lengthIn: new Prisma.Decimal("24.000"),
      depthIn: new Prisma.Decimal("12.000"),
      thicknessIn: new Prisma.Decimal("0.750"),
      materialType: "WHITE_MELAMINE",
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      shelfProductId: "shelf_product_1",
      packagingProfileId: "packaging_1",
      shelfProduct: {
        id: "shelf_product_1",
        name: "3/4 White Melamine Shelf",
        materialType: "WHITE_MELAMINE",
        defaultThicknessIn: new Prisma.Decimal("0.750"),
        defaultEdgeBandPattern: "ALL_FOUR",
        packagingProfileId: "packaging_1"
      }
    });
    prismaMock.salesOrderItem.update.mockResolvedValue({ id: "sales_order_item_1" });
    prismaMock.shelfJob.findFirst.mockResolvedValue(null);
    prismaMock.shelfJob.create.mockResolvedValue({ id: "shelf_job_1" });
    prismaMock.shelfJob.update.mockResolvedValue({ id: "shelf_job_1" });
    prismaMock.manufacturingJob.upsert.mockResolvedValue({ id: "legacy_job_1" });
    prismaMock.order.upsert.mockResolvedValue({ id: "order_1" });
    prismaMock.orderItem.upsert.mockResolvedValue({ id: "item_1" });
    prismaMock.part.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.part.createMany.mockResolvedValue({ count: 1 });
  });

  it("writes canonical sales entities first and keeps legacy compatibility records", async () => {
    const result = await persistNormalizedOrders(
      [
        {
          externalOrderId: "ORDER-1",
          amazonOrderId: "ORDER-1",
          orderDate: "2026-03-08T00:00:00.000Z",
          shipByDate: "2026-03-10T00:00:00.000Z",
          customerName: "Test Customer",
          customerLastName: "CUSTOMER",
          customerFullName: "Test Customer",
          shipToName: "Test Customer",
          status: "ready_for_batch",
          rawPayload: { fixture: true },
          lineItems: [
            {
              externalOrderItemId: "LINE-1",
              amazonOrderItemId: "LINE-1",
              sku: "SKU-1",
              title: "White Shelf",
              productLabel: "White Shelf",
              normalizedLegacyXmlName: "White Shelf",
              materialCode: "WHITE_MELAMINE",
              materialLabel: "White Melamine",
              quantity: 1,
              widthIn: 24,
              depthIn: 12,
              thicknessIn: 0.75,
              edgeBandPattern: "ALL_FOUR",
              edgeBandLabel: "All four sides",
              sourceLengthIn: 24,
              sourceDepthIn: 12,
              sourceEdgeBandText: "All four sides"
            }
          ]
        }
      ],
      "org_local_craft_board"
    );

    expect(prismaMock.salesOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_local_craft_board",
        sourceType: "AMAZON",
        sourceOrderId: "ORDER-1"
      })
    });
    expect(prismaMock.salesOrderItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        salesOrderId: "sales_order_1",
        sourceLineId: "LINE-1"
      }),
      include: { shelfProduct: true }
    });
    expect(prismaMock.shelfJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        salesOrderId: "sales_order_1",
        salesOrderItemId: "sales_order_item_1"
      })
    });
    expect(prismaMock.order.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          salesOrderId: "sales_order_1"
        }),
        create: expect.objectContaining({
          salesOrderId: "sales_order_1"
        })
      })
    );
    expect(prismaMock.orderItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          salesOrderItemId: "sales_order_item_1"
        }),
        create: expect.objectContaining({
          salesOrderItemId: "sales_order_item_1"
        })
      })
    );
    expect(prismaMock.manufacturingJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shelfJobId: "shelf_job_1" }
      })
    );
    expect(result).toMatchObject({
      ordersImported: 1,
      lineItemsImported: 1,
      partsExpanded: 1
    });
  });
});

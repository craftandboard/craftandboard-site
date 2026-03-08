import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  organization: {
    upsert: vi.fn()
  },
  order: {
    upsert: vi.fn()
  },
  orderItem: {
    upsert: vi.fn()
  },
  manufacturingJob: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  part: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn()
  }
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/configurator/service.js", () => ({
  translateShelfToManufacturingPart: vi.fn(async () => ({
    partType: "SHELF",
    width: 19.25,
    depth: 12.5,
    thickness: 0.75,
    material: "WHITE_MELAMINE",
    edgeBandPattern: "ALL_FOUR",
    quantity: 2,
    unit: "IN",
    manufacturingMode: "CUT_AND_EDGE",
    labelCode: "SHELF-WM-19.25x12.5",
    grainDirection: "WIDTH",
    cutMethod: "RECTANGLE_CUT",
    source: "AMAZON"
  }))
}));

import { persistAmazonOrders } from "../modules/amazonImport/persistence.js";

describe("amazon import persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.organization.upsert.mockResolvedValue({ id: "org_local_craft_board" });
    prismaMock.order.upsert.mockResolvedValue({ id: "order_1" });
    prismaMock.orderItem.upsert.mockResolvedValue({ id: "item_1" });
    prismaMock.manufacturingJob.findFirst.mockResolvedValue(null);
    prismaMock.manufacturingJob.create.mockResolvedValue({ id: "job_1" });
    prismaMock.manufacturingJob.update.mockResolvedValue({ id: "job_1" });
    prismaMock.part.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.part.createMany.mockResolvedValue({ count: 2 });
    prismaMock.part.findMany.mockResolvedValue([
      {
        id: "part_1",
        manufacturingJobId: "job_1",
        orderId: "order_1",
        orderItemId: "item_1",
        partCode: "SHF-20260308-WHITE-0001",
        instanceNumber: 1,
        manufacturingJob: {
          labelCode: "SHELF-WM-19.25x12.5"
        }
      },
      {
        id: "part_2",
        manufacturingJobId: "job_1",
        orderId: "order_1",
        orderItemId: "item_1",
        partCode: "SHF-20260308-WHITE-0002",
        instanceNumber: 2,
        manufacturingJob: {
          labelCode: "SHELF-WM-19.25x12.5"
        }
      }
    ]);
  });

  it("creates manufacturing jobs and persisted parts from normalized amazon orders", async () => {
    const result = await persistAmazonOrders([
      {
        externalOrderId: "111-5237066-4129810",
        amazonOrderId: "111-5237066-4129810",
        amazonOrderSource: "SELLER_CENTRAL_FIXTURE",
        orderDate: "2026-03-08T00:00:00.000Z",
        purchaseDate: "2026-03-08T00:00:00.000Z",
        shipByDate: "2026-03-08T00:00:00.000Z",
        customerName: "Teresa Primorac",
        customerFullName: "Teresa Primorac",
        shipToName: "Teresa Primorac",
        customerLastName: "PRIMORAC",
        status: "ready_for_batch",
        channel: "AMAZON",
        rawPayload: { fixture: true },
        lineItems: [
          {
            externalOrderItemId: "123098226833562",
            amazonOrderItemId: "123098226833562",
            sku: 'CST-White Melamine Shelf - 3/4" Thick',
            title: "White Shelf",
            productLabel: "White Shelf",
            normalizedLegacyXmlName: "White Shelf",
            materialCode: "WHITE_MELAMINE",
            materialLabel: "White Melamine",
            quantity: 2,
            widthIn: 19.25,
            depthIn: 12.5,
            thicknessIn: 0.75,
            edgeBandPattern: "ALL_FOUR",
            edgeBandLabel: "All four sides",
            sourceLengthIn: 19,
            sourceDepthIn: 12,
            sourceEdgeBandText: "All four sides",
            sourceCustomizationJson: { fixture: true },
            notes: "fixture"
          }
        ]
      }
    ]);

    expect(prismaMock.order.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          channel: "AMAZON"
        }),
        create: expect.objectContaining({
          channel: "AMAZON"
        })
      })
    );
    expect(prismaMock.manufacturingJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: "AMAZON",
        status: "DRAFT",
        channel: "AMAZON",
        labelCode: "SHELF-WM-19.25x12.5"
      })
    });
    expect(prismaMock.part.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          manufacturingJobId: "job_1",
          status: "READY_FOR_BATCH",
          widthIn: new Prisma.Decimal("19.250")
        })
      ])
    });
    expect(result).toMatchObject({
      ordersCreated: 1,
      orderItemsCreated: 1,
      partInstancesCreated: 2,
      jobsCreated: 1,
      orders: [{ id: "order_1", source: "AMAZON" }],
      jobs: [
        {
          id: "job_1",
          status: "DRAFT",
          source: "AMAZON",
          orderId: "order_1",
          orderItemId: "item_1"
        }
      ],
      parts: [
        {
          id: "part_1",
          jobId: "job_1",
          labelCode: "SHELF-WM-19.25x12.5-P01",
          source: "AMAZON"
        },
        {
          id: "part_2",
          jobId: "job_1",
          labelCode: "SHELF-WM-19.25x12.5-P02",
          source: "AMAZON"
        }
      ]
    });
  });
});

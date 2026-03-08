import { beforeEach, describe, expect, it, vi } from 'vitest';

const txMock = vi.hoisted(() => ({
  manufacturingJob: {
    create: vi.fn(),
    update: vi.fn()
  },
  order: {
    create: vi.fn()
  },
  orderItem: {
    create: vi.fn()
  },
  part: {
    create: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock))
}));

vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../modules/settings/service.js', () => ({
  LOCAL_ORG_ID: 'org_local_craft_board',
  getMaterialProfile: vi.fn(async () => ({
    code: 'WHITE_MELAMINE'
  }))
}));

import { createManufacturingJobFromConfigurator } from '../modules/configurator/service.js';

describe('configurator persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock)
    );
    txMock.manufacturingJob.create.mockResolvedValue({ id: 'job_123' });
    txMock.order.create.mockResolvedValue({ id: 'order_123' });
    txMock.orderItem.create.mockResolvedValue({ id: 'order_item_123' });
    txMock.manufacturingJob.update.mockResolvedValue({ id: 'job_123' });
    txMock.part.create
      .mockResolvedValueOnce({ id: 'part_1' })
      .mockResolvedValueOnce({ id: 'part_2' });
  });

  it('creates a manufacturing job and persisted part rows from valid configurator input', async () => {
    const result = await createManufacturingJobFromConfigurator({
      widthIn: 19.25,
      depthIn: 12.5,
      materialCode: 'WHITE_MELAMINE',
      quantity: 2,
      channel: 'WEBSITE'
    });

    expect(txMock.manufacturingJob.create).toHaveBeenCalledTimes(1);
    expect(txMock.order.create).toHaveBeenCalledTimes(1);
    expect(txMock.orderItem.create).toHaveBeenCalledTimes(1);
    expect(txMock.part.create).toHaveBeenCalledTimes(2);
    expect(result.job).toEqual({
      id: 'job_123',
      status: 'DRAFT',
      source: 'CONFIGURATOR'
    });
    expect(result.parts).toEqual([
      {
        id: 'part_1',
        partType: 'SHELF',
        width: 19.25,
        depth: 12.5,
        thickness: 0.75,
        material: 'WHITE_MELAMINE',
        edgeBandPattern: 'ALL_FOUR',
        quantity: 1,
        unit: 'IN',
        manufacturingMode: 'CUT_AND_EDGE',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        grainDirection: 'WIDTH',
        cutMethod: 'RECTANGLE_CUT',
        source: 'CONFIGURATOR'
      },
      {
        id: 'part_2',
        partType: 'SHELF',
        width: 19.25,
        depth: 12.5,
        thickness: 0.75,
        material: 'WHITE_MELAMINE',
        edgeBandPattern: 'ALL_FOUR',
        quantity: 1,
        unit: 'IN',
        manufacturingMode: 'CUT_AND_EDGE',
        labelCode: 'SHELF-WM-19.25x12.5-P02',
        scanCode: 'PART-part_2',
        grainDirection: 'WIDTH',
        cutMethod: 'RECTANGLE_CUT',
        source: 'CONFIGURATOR'
      }
    ]);
  });
});

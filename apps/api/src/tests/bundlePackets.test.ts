import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  productionBundle: {
    findUnique: vi.fn()
  },
  artifact: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));

describe('bundle packet versioning', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('creates versioned current packet artifacts and supersedes prior ones on regeneration', async () => {
    prismaMock.productionBundle.findUnique.mockResolvedValue({
      id: 'bundle-1',
      code: '20260310-WHITE_MELAMINE',
      currentNestVersion: 2,
      currentCncVersion: 1
    });
    prismaMock.artifact.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ version: 1 }]);
    prismaMock.artifact.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.artifact.create
      .mockResolvedValueOnce({
        id: 'artifact-1',
        version: 1,
        uri: '/manufacturing/bundles/20260310-WHITE_MELAMINE/packet?version=1'
      })
      .mockResolvedValueOnce({
        id: 'artifact-2',
        version: 2,
        uri: '/manufacturing/bundles/20260310-WHITE_MELAMINE/packet?version=2'
      });

    const { generateBundlePacket } = await import('../modules/bundlePackets/service.js');

    const first = await generateBundlePacket('20260310-WHITE_MELAMINE');
    const second = await generateBundlePacket('20260310-WHITE_MELAMINE');

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(prismaMock.artifact.updateMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.artifact.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          artifactType: 'BUNDLE_PACKET_HTML',
          version: 2,
          isCurrent: true,
          generatedFrom: 'packet:nest:2:cnc:1'
        })
      })
    );
  });
});

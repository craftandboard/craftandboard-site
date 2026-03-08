import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn()
  },
  organizationMember: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/auth/service.js", () => ({
  createActivationForUser: vi.fn(async (userId: string) => ({
    token: `activation-${userId}`,
    expiresAt: new Date("2026-03-15T00:00:00.000Z"),
    path: `/activate?token=activation-${userId}`
  }))
}));

import {
  addOrganizationMember,
  listOrganizationMembers,
  updateOrganizationMemberRole
} from "../modules/org/service.js";

describe("organization member service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists members for the current organization", async () => {
    prismaMock.organizationMember.findMany.mockResolvedValue([
      {
        userId: "user_demo",
        role: "OWNER",
        user: {
          email: "demo@craftboard.local",
          name: "Craft Board Demo User"
        }
      }
    ]);

    const result = await listOrganizationMembers("org_local_craft_board");

    expect(prismaMock.organizationMember.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_local_craft_board"
      },
      include: {
        user: true
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }]
    });
    expect(result).toEqual([
      {
        userId: "user_demo",
        email: "demo@craftboard.local",
        name: "Craft Board Demo User",
        role: "OWNER"
      }
    ]);
  });

  it("adds a member safely through user and membership upserts", async () => {
    prismaMock.user.upsert.mockResolvedValue({
      id: "user_tyler",
      email: "tyler@example.com",
      name: "Tyler Phillips"
    });
    prismaMock.organizationMember.upsert.mockResolvedValue({
      userId: "user_tyler",
      role: "ADMIN",
      user: {
        email: "tyler@example.com",
        name: "Tyler Phillips"
      }
    });

    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await addOrganizationMember({
      organizationId: "org_local_craft_board",
      email: "Tyler@example.com",
      name: "Tyler Phillips",
      role: "ADMIN"
    });

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { email: "tyler@example.com" },
      update: {
        name: "Tyler Phillips"
      },
      create: {
        email: "tyler@example.com",
        name: "Tyler Phillips",
        organizationId: "org_local_craft_board"
      }
    });
    expect(prismaMock.organizationMember.upsert).toHaveBeenCalledWith({
      where: {
        organizationId_userId: {
          organizationId: "org_local_craft_board",
          userId: "user_tyler"
        }
      },
      update: {},
      create: {
        organizationId: "org_local_craft_board",
        userId: "user_tyler",
        role: "ADMIN"
      },
      include: {
        user: true
      }
    });
    expect(result.member.role).toBe("ADMIN");
    expect(result.activation?.path).toBe("/activate?token=activation-user_tyler");
  });

  it("rejects demoting the final owner", async () => {
    prismaMock.organizationMember.findUnique.mockResolvedValue({
      id: "membership_1",
      userId: "user_demo",
      role: "OWNER",
      user: {
        email: "demo@craftboard.local",
        name: "Craft Board Demo User"
      }
    });
    prismaMock.organizationMember.count.mockResolvedValue(1);

    await expect(
      updateOrganizationMemberRole({
        organizationId: "org_local_craft_board",
        userId: "user_demo",
        role: "ADMIN"
      })
    ).rejects.toThrow("Organization must retain at least one OWNER.");
  });
});

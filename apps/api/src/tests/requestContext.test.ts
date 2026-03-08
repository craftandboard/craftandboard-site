import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  organization: {
    upsert: vi.fn()
  },
  session: {
    findUnique: vi.fn(),
    delete: vi.fn()
  },
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn()
  },
  organizationMember: {
    upsert: vi.fn()
  }
}));

const settingsMocks = vi.hoisted(() => ({
  ensureDefaultProfiles: vi.fn(),
  LOCAL_ORG_ID: "org_local_craft_board",
  LOCAL_ORG_NAME: "Craft & Board Demo",
  LOCAL_ORG_SLUG: "craft-board-demo"
}));

const envMocks = vi.hoisted(() => ({
  env: {
    ALLOW_DEV_AUTH_BYPASS: true
  }
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/settings/service.js", () => settingsMocks);
vi.mock("../lib/env.js", () => envMocks);

import { DEV_USER_EMAIL, requestContextMiddleware, resolveRequestContext } from "../lib/requestContext.js";

describe("request context", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.user.upsert.mockResolvedValue({
      id: "user_demo",
      email: DEV_USER_EMAIL,
      name: "Craft Board Demo User",
      organizationId: "org_local_craft_board"
    });
    prismaMock.organization.upsert.mockResolvedValue({
      id: "org_local_craft_board",
      name: "Craft & Board Demo",
      slug: "craft-board-demo"
    });
    prismaMock.session.findUnique.mockResolvedValue(null);
    prismaMock.session.delete.mockResolvedValue({ id: "session_1" });

    prismaMock.organizationMember.upsert.mockResolvedValue({
      id: "membership_demo",
      role: "OWNER",
      organization: {
        id: "org_local_craft_board",
        name: "Craft & Board Demo",
        slug: "craft-board-demo"
      }
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_demo",
      email: DEV_USER_EMAIL,
      name: "Craft Board Demo User",
      organizationId: "org_local_craft_board",
      memberships: [
        {
          id: "membership_demo",
          organizationId: "org_local_craft_board",
          role: "OWNER",
          createdAt: new Date("2026-03-08T00:00:00.000Z"),
          organization: {
            id: "org_local_craft_board",
            name: "Craft & Board Demo",
            slug: "craft-board-demo"
          }
        },
        {
          id: "membership_alt",
          organizationId: "org_alt",
          role: "ADMIN",
          createdAt: new Date("2026-03-09T00:00:00.000Z"),
          organization: {
            id: "org_alt",
            name: "Alt Shop",
            slug: "alt-shop"
          }
        }
      ]
    });
  });

  it("creates the default dev user and membership and resolves the default org", async () => {
    const context = await resolveRequestContext();

    expect(settingsMocks.ensureDefaultProfiles).toHaveBeenCalledTimes(1);
    expect(prismaMock.organization.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.organizationMember.upsert).toHaveBeenCalledTimes(3);
    expect(context.currentUser.email).toBe(DEV_USER_EMAIL);
    expect(context.currentOrganization.slug).toBe("craft-board-demo");
    expect(context.membership.role).toBe("OWNER");
    expect(context.organizations).toHaveLength(2);
  });

  it("allows a valid organization slug override when membership exists", async () => {
    const context = await resolveRequestContext({
      userEmail: DEV_USER_EMAIL,
      organizationSlug: "alt-shop"
    });

    expect(context.currentOrganization.id).toBe("org_alt");
    expect(context.membership.role).toBe("ADMIN");
  });

  it("rejects an organization override when the user is not a member", async () => {
    await expect(
      resolveRequestContext({
        userEmail: DEV_USER_EMAIL,
        organizationSlug: "missing-org"
      })
    ).rejects.toThrow("User demo@craftboard.local is not a member of organization missing-org.");
  });

  it("middleware attaches the resolved request context", async () => {
    const req = {
      path: "/orders",
      header: vi.fn((name: string) => {
        if (name === "x-user-email") {
          return DEV_USER_EMAIL;
        }
        return undefined;
      })
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    await requestContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.requestContext).toBeDefined();
  });
});

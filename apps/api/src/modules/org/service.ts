import { prisma } from "../../lib/prisma.js";
import { createActivationForUser } from "../auth/service.js";

export type OrganizationMemberView = {
  userId: string;
  email: string;
  name: string | null;
  role: "OWNER" | "ADMIN" | "OPERATOR";
};

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMemberView[]> {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId
    },
    include: {
      user: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return members.map((member) => ({
    userId: member.userId,
    email: member.user.email,
    name: member.user.name,
    role: member.role
  }));
}

export async function addOrganizationMember(input: {
  organizationId: string;
  email: string;
  name?: string | null;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name ?? undefined
    },
    create: {
      email,
      name,
      organizationId: input.organizationId
    }
  });

  const membership = await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: user.id
      }
    },
    update: {},
    create: {
      organizationId: input.organizationId,
      userId: user.id,
      role: input.role
    },
    include: {
      user: true
    }
  });

  const member = {
    userId: membership.userId,
    email: membership.user.email,
    name: membership.user.name,
    role: membership.role
  } satisfies OrganizationMemberView;

  if (!existingUser && !user.passwordHash) {
    const activation = await createActivationForUser(user.id);

    return {
      member,
      activation: {
        path: activation.path
      }
    };
  }

  return { member };
}

export async function updateOrganizationMemberRole(input: {
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId
      }
    },
    include: {
      user: true
    }
  });

  if (!membership) {
    throw new Error("Organization member not found.");
  }

  if (membership.role === "OWNER" && input.role !== "OWNER") {
    const ownerCount = await prisma.organizationMember.count({
      where: {
        organizationId: input.organizationId,
        role: "OWNER"
      }
    });

    if (ownerCount <= 1) {
      throw new Error("Organization must retain at least one OWNER.");
    }
  }

  const updatedMembership = await prisma.organizationMember.update({
    where: {
      id: membership.id
    },
    data: {
      role: input.role
    },
    include: {
      user: true
    }
  });

  return {
    userId: updatedMembership.userId,
    email: updatedMembership.user.email,
    name: updatedMembership.user.name,
    role: updatedMembership.role
  } satisfies OrganizationMemberView;
}

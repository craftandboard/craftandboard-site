import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ["warn", "error"]
  });
}

function hasCurrentSchema(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(client && typeof (client as unknown as { manufacturingJob?: { create?: unknown } }).manufacturingJob?.create === "function");
}

export const prisma = hasCurrentSchema(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

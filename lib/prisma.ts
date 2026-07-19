/**
 * lib/prisma.ts
 *
 * Prisma client singleton — prevents multiple connections in development
 * caused by Next.js hot-reloading.
 *
 * DATABASE SWAP POINT: Import this wherever you need DB access.
 * Usage:  import { prisma } from "@/lib/prisma";
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

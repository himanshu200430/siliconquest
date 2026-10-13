import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient.
 *
 * In development Next.js hot-reloads modules, which would create a new
 * PrismaClient on every reload and exhaust the connection pool.  Storing the
 * instance on `globalThis` keeps exactly one client alive across reloads.
 *
 * In production only one instance is ever created per serverless function
 * cold-start, so the guard is harmless.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

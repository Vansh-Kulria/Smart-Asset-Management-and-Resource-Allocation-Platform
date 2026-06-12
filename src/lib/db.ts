import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

let prismaInstance: PrismaClient;

if (typeof window === "undefined") {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    // Reuse the pg connection pool in development to prevent connection leaks
    const pool = globalForPrisma.pool || new Pool({ connectionString });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.pool = pool;
    }

    const adapter = new PrismaPg(pool);

    prismaInstance =
      globalForPrisma.prisma ||
      new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
  } else {
    console.warn("Warning: DATABASE_URL environment variable is not defined. Initializing fallback PrismaClient.");
    prismaInstance =
      globalForPrisma.prisma ||
      new PrismaClient({
        log: ["error"],
      });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
} else {
  prismaInstance = null as any;
}

export const prisma = prismaInstance;

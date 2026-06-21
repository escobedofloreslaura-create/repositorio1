import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function crearPrisma() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? crearPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

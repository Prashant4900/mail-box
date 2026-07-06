import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function getPrismaAdapter() {
  let url = process.env.DATABASE_URL;
  if (!url || url === "undefined") {
    url = "file:./dev.db";
  }

  if (
    url.startsWith("file:") ||
    url.startsWith("sqlite:") ||
    url.startsWith("libsql:")
  ) {
    return new PrismaLibSql({ url });
  }

  if (url.startsWith("postgres:") || url.startsWith("postgresql:")) {
    return new PrismaPg({ connectionString: url });
  }

  return undefined;
}

const globalForPrisma = globalThis as unknown as { __prisma: PrismaClient };

const adapter = getPrismaAdapter();

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    adapter: adapter as unknown as undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

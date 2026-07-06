import nextEnv from "@next/env";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const rawUrl = process.env.DATABASE_URL;
const schemaPath = process.env.PRISMA_SCHEMA_PATH || "unknown";

console.log("-------------------------------------------------");
console.log("🔍 Prisma Database Connection Diagnostic Tool");
console.log("-------------------------------------------------");
console.log(`📂 Active Schema: ${schemaPath}`);
console.log(`🌐 Database URL:  ${rawUrl || "undefined"}`);

if (!rawUrl) {
  console.error("❌ Error: DATABASE_URL environment variable is not defined.");
  console.error("👉 Please define it in your .env file.");
  process.exit(1);
}

// Narrow type to string
const url: string = rawUrl;

function getPrismaAdapter(dbUrl: string) {
  if (
    dbUrl.startsWith("file:") ||
    dbUrl.startsWith("sqlite:") ||
    dbUrl.startsWith("libsql:")
  ) {
    return new PrismaLibSql({ url: dbUrl });
  }

  if (dbUrl.startsWith("postgres:") || dbUrl.startsWith("postgresql:")) {
    return new PrismaPg({ connectionString: dbUrl });
  }

  return undefined;
}

async function main() {
  const adapter = getPrismaAdapter(url);
  const prisma = new PrismaClient(adapter ? { adapter } : undefined);

  const startTime = Date.now();
  try {
    console.log("🔄 Connecting to database and querying User table...");
    const count = await prisma.user.count();
    const duration = Date.now() - startTime;
    console.log("-------------------------------------------------");
    console.log("✅ Connection Successful!");
    console.log(`⏱️  Latency: ${duration}ms`);
    console.log(`👥 Total users in database: ${count}`);
    console.log("-------------------------------------------------");
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log("-------------------------------------------------");
    console.error("❌ Connection Failed!");
    console.error(`⏱️  Attempt duration: ${duration}ms`);
    console.error("\nDetailed Error Info:");
    console.error(error);
    console.log("-------------------------------------------------");

    // Troubleshooting guide
    console.log("\n💡 Troubleshooting Suggestions:");
    if (url.startsWith("file:") || url.includes("dev.db")) {
      console.log("- Verify that dev.db exists and has correct permissions.");
      console.log(
        "- Run 'npm run db:migrate' to create the database file and run migrations.",
      );
    } else if (url.startsWith("postgres") || url.startsWith("mysql")) {
      console.log(
        "- Verify that Docker Compose is running ('npm run docker:up').",
      );
      console.log(
        "- Double check host, port, credentials, and database name in your .env file.",
      );
      console.log(
        "- Ensure you ran 'npm run db:generate' and 'npm run db:deploy'.",
      );
    }
    console.log("-------------------------------------------------");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

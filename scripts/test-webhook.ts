import { loadEnvConfig } from "@next/env";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env
loadEnvConfig(process.cwd());

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("❌ Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

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

const adapter = getPrismaAdapter(rawUrl);
const prisma = new PrismaClient(adapter ? { adapter } : undefined);

async function main() {
  console.log("Fetching mailbox addresses from database...");
  const addresses = await prisma.mailboxAddress.findMany();
  console.log("Registered mailbox addresses:", addresses);

  let targetAddress = addresses.find((a) => a.isActive)?.address;

  if (!targetAddress) {
    console.log(
      "No active mailbox address found. Creating 'test@domain.com'...",
    );
    const newAddress = await prisma.mailboxAddress.create({
      data: {
        address: "test@domain.com",
        displayName: "Test Mailbox",
        isActive: true,
      },
    });
    targetAddress = newAddress.address;
    console.log("Created target mailbox:", targetAddress);
  } else {
    console.log("Using active target mailbox:", targetAddress);
  }

  const payload = {
    messageId: `test-message-${Date.now()}@email.routing`,
    from: {
      address: "sender@example.com",
      name: "Sender Name",
    },
    to: [{ address: targetAddress }],
    subject: "Test Inbound Webhook Email",
    text: "Hello! This is a test email sent to verify the Cloudflare inbound webhook endpoint.",
    html: "<p>Hello! This is a test email sent to verify the Cloudflare inbound webhook endpoint.</p>",
  };

  const secret = process.env.WEBHOOK_SECRET || "dev_webhook_secret_123";
  console.log(
    `Sending webhook request with secret: "${secret}" to http://localhost:3000/api/emails ...`,
  );

  const response = await fetch("http://localhost:3000/api/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  console.log("Response status:", response.status);
  const data = await response.json();
  console.log("Response payload:", JSON.stringify(data, null, 2));
}

main()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

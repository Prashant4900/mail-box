import { prisma } from "../src/clients/prisma";
import crypto from "crypto";

async function main() {
  console.log("Starting email seeding process...");

  // 1. Ensure a user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: "admin@example.com",
        passwordHash: "dummyhash",
        role: "ADMIN",
      }
    });
    console.log(`Created dummy user: ${user.email}`);
  }

  // 2. Ensure a mailbox address exists
  let mailbox = await prisma.mailboxAddress.findFirst();
  if (!mailbox) {
    mailbox = await prisma.mailboxAddress.create({
      data: {
        address: "inbox@test.com",
        displayName: "Main Inbox",
      }
    });
    console.log(`Created mailbox address: ${mailbox.address}`);
  }

  // Grant access
  const access = await prisma.userMailboxAccess.findUnique({
    where: {
      userId_mailboxAddressId: {
        userId: user.id,
        mailboxAddressId: mailbox.id
      }
    }
  });
  if (!access) {
    await prisma.userMailboxAccess.create({
      data: {
        userId: user.id,
        mailboxAddressId: mailbox.id
      }
    });
  }

  // 3. Create at least 5 threads and 30 emails total
  console.log("Seeding threads and emails...");
  
  const threadKeys = [
    "Urgent: Q4 Roadmap Planning",
    "Welcome to the new platform",
    "Server Outage Incident Report",
    "Customer Feedback - Jane Doe",
    "Weekly Sync: Engineering",
    "Partnership Inquiry - Acme Corp"
  ];

  let emailCount = 0;

  for (const threadKey of threadKeys) {
    let inReplyTo: string | null = null;
    let references: string | null = null;
    
    // Create 6 emails per thread
    for (let i = 0; i < 6; i++) {
      const messageId = `<${crypto.randomUUID()}@test.com>`;
      const fromAddress = `user${Math.floor(Math.random() * 100)}@external.com`;
      const fromName = `User ${Math.floor(Math.random() * 100)}`;
      const subject = i === 0 ? threadKey : `Re: ${threadKey}`;
      
      await prisma.email.create({
        data: {
          mailboxAddressId: mailbox.id,
          messageId,
          inReplyTo,
          references,
          threadKey,
          fromAddress,
          fromName,
          subject,
          bodyText: `This is a test email body for thread: ${threadKey}. Message number ${i + 1}.`,
          bodyHtml: `<p>This is a test email body for thread: <b>${threadKey}</b>. Message number ${i + 1}.</p>`,
          receivedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        }
      });
      
      emailCount++;
      inReplyTo = messageId;
      references = references ? `${references} ${messageId}` : messageId;
    }
  }

  console.log(`✅ Successfully seeded ${emailCount} emails across ${threadKeys.length} threads.`);
}

main().catch(e => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

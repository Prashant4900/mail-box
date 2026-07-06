import nextEnv from "@next/env";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Mirror of the service-layer helper so the seed produces correct threadKeys
// without importing from src/ (the seed runs outside Next.js context).
function normaliseSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw|aw|wg)(\[\d+\])?:\s*/gi, "")
    .trim()
    .toLowerCase();
}

// Load env
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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

const adapter = getPrismaAdapter();
const prisma = new PrismaClient({
  adapter: adapter as unknown as undefined,
});

async function main() {
  console.log("Checking MailboxAddress...");
  const mailboxCount = await prisma.mailboxAddress.count();
  if (mailboxCount > 0) {
    console.log("MailboxAddress already has entries. Skipping seed.");
    return;
  }

  console.log("Seeding default mailbox address...");
  const mailboxAddress = await prisma.mailboxAddress.create({
    data: {
      address: "support@yourdomain.com",
      displayName: "Support Team",
      isActive: true,
    },
  });

  console.log("Seeding emails...");
  await prisma.email.createMany({
    data: [
      {
        mailboxAddressId: mailboxAddress.id,
        messageId: "seed-linear-124@mail.example.com",
        fromAddress: "notifications@linear.app",
        fromName: "Linear",
        subject: "New issue assigned to you",
        threadKey: normaliseSubject("New issue assigned to you"),
        bodyText: `Hi there,

You have been assigned a new issue in the Frontend Board project.

We need to roll out the new grayscale color palette and dense typography scale across the entire application to match the approved UI components.

Thanks,
The Linear Team`,
        bodyHtml: `<p>Hi there,</p><p>You have been assigned a new issue in the <strong>Frontend Board</strong> project.</p><p>We need to roll out the new grayscale color palette and dense typography scale across the entire application to match the approved UI components.</p><p>Thanks,<br/>The Linear Team</p>`,
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        mailboxAddressId: mailboxAddress.id,
        messageId: "seed-notion-summary@mail.example.com",
        fromAddress: "no-reply@notion.so",
        fromName: "Notion",
        subject: "Your workspace summary",
        threadKey: normaliseSubject("Your workspace summary"),
        bodyText: `Hello,

Here is your weekly summary of activity in your Notion workspace.

- Design Docs: 12 new updates from the team.
- Roadmap: 3 items moved to "In Progress".
- Feedback: 5 comments left by Alice.

Stay organized and continue building!

Best,
The Notion Team`,
        bodyHtml: `<p>Hello,</p><p>Here is your weekly summary of activity in your Notion workspace.</p><ul><li><strong>Design Docs</strong>: 12 new updates from the team.</li><li><strong>Roadmap</strong>: 3 items moved to "In Progress".</li><li><strong>Feedback</strong>: 5 comments left by Alice.</li></ul><p>Stay organized and continue building!</p><p>Best,<br/>The Notion Team</p>`,
        receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        mailboxAddressId: mailboxAddress.id,
        messageId: "seed-vercel-deploy@mail.example.com",
        fromAddress: "deployments@vercel.com",
        fromName: "Vercel",
        subject: "Deployment successful",
        threadKey: normaliseSubject("Deployment successful"),
        bodyText: `Congratulations!

Your deployment for the email-service project has completed successfully.

- URL: https://email-service-app.vercel.app
- Branch: main
- Commit: Refactored settings sections and segmented controls.

Your changes are now live and serving traffic.

Cheers,
Vercel Team`,
        bodyHtml: `<p>Congratulations!</p><p>Your deployment for the <strong>email-service</strong> project has completed successfully.</p><ul><li><strong>URL</strong>: https://email-service-app.vercel.app</li><li><strong>Branch</strong>: main</li><li><strong>Commit</strong>: Refactored settings sections and segmented controls.</li></ul><p>Your changes are now live and serving traffic.</p><p>Cheers,<br/>Vercel Team</p>`,
        receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        mailboxAddressId: mailboxAddress.id,
        messageId: "seed-alice-review@mail.example.com",
        fromAddress: "alice.smith@example.com",
        fromName: "Alice Smith",
        subject: "Design review feedback",
        threadKey: normaliseSubject("Design review feedback"),
        bodyText: `Hi Team,

I just reviewed the updated component design changes. I really like the new dense typography and the clean layout structure.

Let's merge this pull request as soon as the test suite completes.

Best regards,
Alice Smith`,
        bodyHtml: `<p>Hi Team,</p><p>I just reviewed the updated component design changes. I really like the new dense typography and the clean layout structure.</p><p>Let's merge this pull request as soon as the test suite completes.</p><p>Best regards,<br/>Alice Smith</p>`,
        receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        mailboxAddressId: mailboxAddress.id,
        messageId: "seed-github-pr@mail.example.com",
        fromAddress: "noreply@github.com",
        fromName: "GitHub",
        subject: "Review requested on PR #42",
        threadKey: normaliseSubject("Review requested on PR #42"),
        bodyText: `Hello there,

Bob has requested your review on the following pull request:

PR #42: Add cookie based auth
- Repository: email-service
- Description: Implements a secure cookie-based session token helper inside auth.ts.

Please review the diff and approve or request changes at your earliest convenience.

Thanks,
GitHub Notifications`,
        bodyHtml: `<p>Hello there,</p><p>Bob has requested your review on the following pull request:</p><p><strong>PR #42: Add cookie based auth</strong></p><ul><li><strong>Repository</strong>: email-service</li><li><strong>Description</strong>: Implements a secure cookie-based session token helper inside auth.ts.</li></ul><p>Please review the diff and approve or request changes at your earliest convenience.</p><p>Thanks,<br/>GitHub Notifications</p>`,
        receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    ],
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

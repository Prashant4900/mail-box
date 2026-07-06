-- AlterTable
ALTER TABLE "Email" ADD COLUMN "inReplyTo" TEXT;
ALTER TABLE "Email" ADD COLUMN "references" TEXT;
ALTER TABLE "Email" ADD COLUMN "threadKey" TEXT;

-- CreateTable
CREATE TABLE "UserTrashedEmail" (
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "trashedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "emailId"),
    CONSTRAINT "UserTrashedEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTrashedEmail_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MailboxAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cloudflareLinked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MailboxAddress" ("address", "createdAt", "displayName", "id", "isActive") SELECT "address", "createdAt", "displayName", "id", "isActive" FROM "MailboxAddress";
DROP TABLE "MailboxAddress";
ALTER TABLE "new_MailboxAddress" RENAME TO "MailboxAddress";
CREATE UNIQUE INDEX "MailboxAddress_address_key" ON "MailboxAddress"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

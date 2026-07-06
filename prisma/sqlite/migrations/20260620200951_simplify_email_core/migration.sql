/*
  Warnings:

  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MailboxMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Thread` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThreadLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThreadReadState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `contactId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `inReplyTo` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `references` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `threadId` on the `Email` table. All the data in the column will be lost.
  - Added the required column `fromAddress` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Contact_email_key";

-- DropIndex
DROP INDEX "Label_name_key";

-- DropIndex
DROP INDEX "MailboxMember_userId_mailboxAddressId_key";

-- DropIndex
DROP INDEX "ThreadReadState_userId_threadId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Attachment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Contact";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Label";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MailboxMember";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Thread";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ThreadLabel";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ThreadReadState";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UserReadEmail" (
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "emailId"),
    CONSTRAINT "UserReadEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserReadEmail_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSavedEmail" (
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "emailId"),
    CONSTRAINT "UserSavedEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSavedEmail_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mailboxAddressId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Email_mailboxAddressId_fkey" FOREIGN KEY ("mailboxAddressId") REFERENCES "MailboxAddress" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Email" ("bodyHtml", "bodyText", "id", "mailboxAddressId", "messageId", "receivedAt", "subject") SELECT "bodyHtml", "bodyText", "id", "mailboxAddressId", "messageId", "receivedAt", "subject" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

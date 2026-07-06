import { prisma } from "../src/clients/prisma";
import { MailQueueService } from "../src/services/mail-queue.service";

async function main() {
  console.log("Flushing mail queue...");
  await MailQueueService.processQueue();
  console.log("Queue flushed.");
  await prisma.$disconnect();
}
main().catch(console.error);

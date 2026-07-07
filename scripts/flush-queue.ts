import { prisma } from "../src/clients/prisma";

async function main() {
  console.log("Starting queue flush process...");
  
  // Example of cleaning up processed or failed email jobs
  const result = await prisma.emailJob.deleteMany({
    where: {
      status: {
        in: ["SENT", "FAILED"]
      }
    }
  });

  console.log(`✅ Flushed ${result.count} old jobs from the queue.`);
}

main().catch(e => {
  console.error("❌ Failed to flush queue:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

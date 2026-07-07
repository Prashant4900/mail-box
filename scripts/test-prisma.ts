import { prisma } from "../src/clients/prisma";

async function main() {
  try {
    console.log("Testing Prisma DB Connection...");
    
    // Perform a simple query to verify connection
    const userCount = await prisma.user.count();
    const mailboxCount = await prisma.mailboxAddress.count();
    
    console.log("✅ Successfully connected to the database.");
    console.log(`Current stats:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Mailboxes: ${mailboxCount}`);
  } catch (error) {
    console.error("❌ Failed to connect to the database:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

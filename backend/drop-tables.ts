import { prismaApp as prisma } from "./src/core/config/databaseConfig";

async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "AdminActionVote" CASCADE;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "AdminActionRequest" CASCADE;`);
  console.log("Dropped bad tables");
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { prismaApp as prisma } from "./src/core/config/databaseConfig";

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminActionRequest" (
      "id" TEXT NOT NULL,
      "requester_id" TEXT NOT NULL,
      "action_type" TEXT NOT NULL,
      "target_id" TEXT,
      "payload" JSONB,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "approvals" INTEGER NOT NULL DEFAULT 0,
      "required_approvals" INTEGER NOT NULL DEFAULT 1,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expires_at" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "AdminActionRequest_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminActionVote" (
      "id" TEXT NOT NULL,
      "request_id" TEXT NOT NULL,
      "voter_id" TEXT NOT NULL,
      "vote" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "AdminActionVote_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionRequest" DROP CONSTRAINT IF EXISTS "AdminActionRequest_requester_id_fkey";
  `);
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionRequest" ADD CONSTRAINT "AdminActionRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionVote" DROP CONSTRAINT IF EXISTS "AdminActionVote_request_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionVote" ADD CONSTRAINT "AdminActionVote_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "AdminActionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionVote" DROP CONSTRAINT IF EXISTS "AdminActionVote_voter_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AdminActionVote" ADD CONSTRAINT "AdminActionVote_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminActionVote_request_id_voter_id_key" ON "AdminActionVote"("request_id", "voter_id");
  `);

  console.log("Tables created successfully");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

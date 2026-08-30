import { prismaAdmin as prisma } from "./src/core/config/databaseConfig";

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "admin_action_requests" (
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

      CONSTRAINT "admin_action_requests_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "admin_action_votes" (
      "id" TEXT NOT NULL,
      "request_id" TEXT NOT NULL,
      "voter_id" TEXT NOT NULL,
      "vote" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "admin_action_votes_pkey" PRIMARY KEY ("id")
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "admin_action_requests" ADD CONSTRAINT "admin_action_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "admin_action_votes" ADD CONSTRAINT "admin_action_votes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "admin_action_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "admin_action_votes" ADD CONSTRAINT "admin_action_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_action_votes_request_id_voter_id_key" ON "admin_action_votes"("request_id", "voter_id");
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

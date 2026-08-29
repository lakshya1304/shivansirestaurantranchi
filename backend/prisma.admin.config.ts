import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/admin.schema.prisma",
  migrations: {
    path: "prisma/migrations/admin",
  },
  datasource: {
    url: process.env["ADMIN_DATABASE_URL"],
  },
});

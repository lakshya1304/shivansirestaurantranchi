import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/app.schema.prisma",
  migrations: {
    path: "prisma/migrations/app",
  },
  datasource: {
    url: process.env["APP_DATABASE_URL"],
  },
});

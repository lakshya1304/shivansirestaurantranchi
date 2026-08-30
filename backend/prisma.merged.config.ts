import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/merged.schema.prisma",
  datasource: {
    url: process.env["APP_DATABASE_URL"],
  },
});

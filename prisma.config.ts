import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  // Read the schema path from the environment, defaulting to sqlite for local dev
  schema: process.env.PRISMA_SCHEMA_PATH || "./prisma/sqlite/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

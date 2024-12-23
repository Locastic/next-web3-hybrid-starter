import { type Config } from "drizzle-kit";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL environment variable is not set");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  casing: "snake_case",
} satisfies Config;

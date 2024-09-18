import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { client } from "@/lib/db";

async function runMigrate() {
  const db = drizzle(client, { logger: true });

  console.log("⏳ Running migrations...");

  const start = Date.now();

  await migrate(db, { migrationsFolder: `${__dirname}/migrations` });

  const end = Date.now();

  console.log(`✅ Migration end & took ${end - start}ms`);

  process.exit(0);
}

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});

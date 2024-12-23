import { migrate } from "drizzle-orm/postgres-js/migrator";

import { migrator as db } from "@/lib/db";

async function runMigrate() {
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

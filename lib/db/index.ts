import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleConfig, sql } from "drizzle-orm";

import { getSession, SupabaseToken } from "@/lib/supabase";
import * as schema from "@/lib/db/schema";
import { decode } from "@/lib/utils";

export type Db = PostgresJsDatabase<typeof schema>;

dotenv.config();

if (!process.env.ADMIN_DATABASE_URL) {
  throw new Error("ADMIN_DATABASE_URL environment variable is not set");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export function createDrizzle(
  token: SupabaseToken | null,
  { admin, client }: { admin: Db; client: Db },
) {
  // NOTE: need to check if null token can be passed safely to request.jwt.claims?

  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          try {
            await tx.execute(sql`
          -- auth.jwt()
          select set_config('request.jwt.claims', '${sql.raw(
            JSON.stringify(token),
          )}', TRUE);
          -- auth.uid()
          select set_config('request.jwt.claim.sub', '${sql.raw(
            token?.sub ?? "",
          )}', TRUE);												
          -- set local role
          set local role ${sql.raw(token?.role ?? "anon")};
          `);
            return await transaction(tx);
          } finally {
            await tx.execute(sql`
            -- reset
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
            `);
          }
        },
        ...rest,
      );
    }) satisfies typeof client.transaction,
  };
}

const config = {
  casing: "snake_case",
  schema,
} satisfies DrizzleConfig<typeof schema>;

export const migrator = drizzle({
  client: postgres(process.env.ADMIN_DATABASE_URL),
  logger: true,
});

export const admin = drizzle({
  client: postgres(process.env.ADMIN_DATABASE_URL, { prepare: false }),
  ...config,
});

export const client = drizzle({
  client: postgres(process.env.DATABASE_URL, { prepare: false }),
  ...config,
});

export async function createDrizzleSupabaseClient() {
  const session = await getSession();

  return createDrizzle(decode(session?.access_token ?? ""), { admin, client });
}

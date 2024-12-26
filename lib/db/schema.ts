import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  bigint,
  timestamp,
  foreignKey,
  uuid,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUsers } from "drizzle-orm/supabase";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    walletAddress: text().notNull(),
    chainId: bigint({ mode: "number" }).notNull(),
    username: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
    tempId: uuid(),
  },
  (t) => [
    foreignKey({
      columns: [t.tempId],
      foreignColumns: [authUsers.id],
      name: "profiles_temp_id_fk",
    }).onDelete("set null"),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      to: "public",
      for: "select",
      using: sql`true`,
    }),
    pgPolicy("Enable update for users based on user id", {
      as: "permissive",
      to: authenticatedRole,
      for: "update",
      using: sql`(SELECT auth.uid()) = temp_id`,
      withCheck: sql`(SELECT auth.uid()) = temp_id`,
    }),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { createDrizzleSupabaseClient, Db } from "@/lib/db";
import {
  createAnonClient,
  createServiceRoleClient,
  getSession,
  Session,
} from "@/lib/supabase";

export type SupabaseClients = {
  anon: Awaited<ReturnType<typeof createAnonClient>>;
  serviceRole: Awaited<ReturnType<typeof createServiceRoleClient>>;
};

type PublicContext = {
  unsafe_db: Db;
  db: Db;
  session: Session | null;
  supabase: SupabaseClients;
};

type ProtectedContext = {
  unsafe_db: Db;
  db: Db;
  session: Session;
  supabase: SupabaseClients;
};

type ActionResult<R> =
  | { data: R; error?: never }
  | { data?: never; error: string };

type Procedure<C> = {
  input: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
  ) => {
    action: <U>(
      fn: (args: { ctx: C; input: z.infer<typeof schema> }) => Promise<U>,
    ) => (input: z.infer<typeof schema>) => Promise<ActionResult<U>>;
  };
  action: <U>(
    fn: (args: { ctx: C }) => Promise<U>,
  ) => () => Promise<ActionResult<U>>;
};

// TODO: add error cause logic
export class ActionError extends Error {
  public readonly code;
  public readonly cause?: unknown;

  constructor({
    message,
    code,
    cause,
  }: { message?: string; code: number; cause?: unknown }) {
    super(message, { cause });

    this.code = code;
    this.cause = cause;
    this.name = "ActionError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const publicProcedure: Procedure<PublicContext> = {
  input: (schema) => ({
    action: (fn) => {
      return async (input) => {
        const session = await getSession();

        const result = schema.safeParse(input);

        try {
          if (!result.success) {
            throw new ActionError({
              message: result.error.errors[0].message,
              code: 400,
            });
          }

          const db = await createDrizzleSupabaseClient();
          const supabase = {
            anon: await createAnonClient(),
            serviceRole: await createServiceRoleClient(),
          };

          const res = await db.rls(async (tx) => {
            return await fn({
              ctx: { db: tx, unsafe_db: db.admin, session, supabase },
              input,
            });
          });

          return { data: res };
        } catch (error) {
          unstable_rethrow(error);
          if (error instanceof ActionError) {
            console.error(error);
            return { error: error.message };
          }

          return { error: (error as Error).message };
        }
      };
    },
  }),
  action: (fn) => {
    return async () => {
      const session = await getSession();

      try {
        const db = await createDrizzleSupabaseClient();
        const supabase = {
          anon: await createAnonClient(),
          serviceRole: await createServiceRoleClient(),
        };

        const res = await db.rls(async (tx) => {
          return await fn({
            ctx: { db: tx, unsafe_db: db.admin, session, supabase },
          });
        });

        return { data: res };
      } catch (error) {
        unstable_rethrow(error);
        if (error instanceof ActionError) {
          console.error(error);
          return { error: error.message };
        }

        return { error: (error as Error).message };
      }
    };
  },
};

const protectedProcedure: Procedure<ProtectedContext> = {
  input: (schema) => ({
    action: (fn) => {
      return async (input) => {
        const session = await getSession();

        try {
          if (!session) {
            throw new ActionError({ message: "No session", code: 400 });
          }

          const result = schema.safeParse(input);

          if (!result.success) {
            throw new ActionError({
              message: result.error.errors[0].message,
              code: 400,
            });
          }

          const db = await createDrizzleSupabaseClient();
          const supabase = {
            anon: await createAnonClient(),
            serviceRole: await createServiceRoleClient(),
          };

          const res = await db.rls(async (tx) => {
            return await fn({
              ctx: { db: tx, unsafe_db: db.admin, session, supabase },
              input,
            });
          });

          return { data: res };
        } catch (error) {
          unstable_rethrow(error);
          if (error instanceof ActionError) {
            console.error(error);
            return { error: error.message };
          }

          return { error: (error as Error).message };
        }
      };
    },
  }),
  action: (fn) => {
    return async () => {
      const session = await getSession();

      try {
        if (!session) {
          throw new ActionError({ message: "No session", code: 400 });
        }

        const db = await createDrizzleSupabaseClient();
        const supabase = {
          anon: await createAnonClient(),
          serviceRole: await createServiceRoleClient(),
        };

        const res = await db.rls(async (tx) => {
          return await fn({
            ctx: { db: tx, unsafe_db: db.admin, session, supabase },
          });
        });

        return { data: res };
      } catch (error) {
        unstable_rethrow(error);
        if (error instanceof ActionError) {
          console.error(error);
          return { error: error.message };
        }

        return { error: (error as Error).message };
      }
    };
  },
};

export { publicProcedure, protectedProcedure };

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { getSession, type SessionData } from "@/lib/auth/session";
import { db } from "@/lib/db";

type PublicContext = {
  db: typeof db;
  session: SessionData | null
};

type ProtectedContext = {
  db: typeof db;
  session: SessionData
};

type ActionResult<R> = { data: R, error?: never } | { data?: never, error: string };

type Procedure<C> = () => {
  input: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    action: <U>(fn: (args: { ctx: C, input: z.infer<typeof schema> }) => Promise<U>) => (input: z.infer<typeof schema>) => Promise<ActionResult<U>>
  };
  action: <U>(fn: (args: { ctx: C }) => Promise<U>) => () => Promise<ActionResult<U>>
};

// TODO: add error cause logic
export class ActionError extends Error {
  public readonly code;
  public readonly cause?: unknown;

  constructor({ message, code, cause }: { message?: string, code: number, cause?: unknown }) {
    super(message, { cause });

    this.code = code;
    this.cause = cause;
    this.name = 'ActionError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const createPublicProcedure: Procedure<PublicContext> = function () {
  return {
    input: (schema) => ({
      action: (fn) => {
        return async (input) => {
          const session = await getSession();

          const result = schema.safeParse(input);

          try {
            if (!result.success) {
              throw new ActionError({ message: result.error.errors[0].message, code: 400 });
            }

            const res = await fn({ ctx: { db, session }, input });

            return { data: res };
          } catch (error) {
            unstable_rethrow(error);
            if (error instanceof ActionError) {
              console.error(error);
              return { error: error.message };
            }

            return { error: (error as Error).message };
          }
        }
      }
    }),
    action: (fn) => {
      return async () => {
        const session = await getSession();

        try {
          const res = await fn({ ctx: { db, session } });
          return { data: res };
        } catch (error) {
          unstable_rethrow(error);
          if (error instanceof ActionError) {
            console.error(error);
            return { error: error.message };
          }

          return { error: (error as Error).message };
        }
      }
    },
  }
}

const createProtectedProcedure: Procedure<ProtectedContext> = function () {
  return {
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
              throw new ActionError({ message: result.error.errors[0].message, code: 400 });
            }

            const res = await fn({ ctx: { db, session }, input });

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
      }
    }),
    action: (fn) => {
      return async () => {
        const session = await getSession();
        try {
          if (!session) {
            throw new ActionError({ message: "No session", code: 400 });
          }

          const res = await fn({ ctx: { db, session } });

          return { data: res };
        } catch (error) {
          unstable_rethrow(error);
          if (error instanceof ActionError) {
            console.error(error);
            return { error: error.message };
          }

          return { error: (error as Error).message };
        }
      }
    },
  };
}

const publicProcedure = createPublicProcedure();
const protectedProcedure = createProtectedProcedure();

export { publicProcedure, protectedProcedure };

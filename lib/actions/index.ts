import { cookies } from "next/headers";
import { z } from "zod";

import { sessionCookieName } from "@/lib/constants";
import { type SessionData, verifyToken } from "@/lib/auth/session";
import { db } from "@/lib/db";

// TODO: simplify procedure creation: use middlewares?
// TODO: add zod runtime validation

type PublicActionContext = {
  db: typeof db;
  session: SessionData | null
};

type ProtectedActionContext = {
  db: typeof db;
  session: SessionData
};

async function getSession() {
  try {
    const sessionCookie = cookies().get(sessionCookieName);

    if (!sessionCookie || !sessionCookie.value) {
      throw new Error("No session");
    }

    const sessionData = await verifyToken(sessionCookie.value);

    if (!sessionData || !sessionData.user || typeof sessionData.user.id !== "number") {
      throw new Error("Invalid session");
    }

    if (new Date(sessionData.expires) < new Date()) {
      throw new Error("Session expired");
    }

    return sessionData;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function createPublicProcedure() {
  return {
    input: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => ({
      action: <U>(fn: (args: { ctx: PublicActionContext, input: z.infer<typeof schema> }) => Promise<U>) => {
        return async (input: z.infer<typeof schema>) => {
          const session = await getSession();

          return await fn({ ctx: { db, session }, input });
        }
      },
      // TODO: fix prevState type
      formAction: <U>(fn: (args: { ctx: PublicActionContext, prevState: any, input: z.infer<typeof schema> }) => Promise<U>) => {
        return async (prevState: U, input: FormData) => {
          const session = await getSession();

          // TODO: fix input type
          return (await fn({ ctx: { db, session }, prevState, input: Object.fromEntries(input) as z.infer<typeof schema> }));
        }
      },
    }),
    action: <U>(fn: ({ ctx }: { ctx: PublicActionContext }) => Promise<U>) => {
      return async () => {
        const session = await getSession();

        return await fn({ ctx: { db, session } });
      }
    },
  };
}

function createProtectedProcedure() {
  return {
    input: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => ({
      action: <U>(fn: (args: { ctx: ProtectedActionContext, input: z.infer<typeof schema> }) => Promise<U>) => {
        return async (input: z.infer<typeof schema>) => {
          const session = await getSession();
          if (!session) {
            console.error("No session");
            return undefined;
          }

          return await fn({ ctx: { db, session }, input });
        }
      },
    }),
    action: <U>(fn: ({ ctx }: { ctx: ProtectedActionContext }) => Promise<U>) => {
      return async () => {
        const session = await getSession();

        if (!session) {
          console.error("No session");
          return undefined;
        }

        return await fn({ ctx: { db, session } });
      }
    },
  };
}

const publicProcedure = createPublicProcedure();
const protectedProcedure = createProtectedProcedure();

export { publicProcedure, protectedProcedure };

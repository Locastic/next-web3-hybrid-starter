'use server';

import { z } from "zod";
import { eq } from "drizzle-orm";

import { users } from "@/lib/db/schema";
import { ActionError, protectedProcedure } from "@/lib/actions";
import { setSession } from "@/lib/auth/session";

export const getMe = protectedProcedure.action(async ({ ctx }) => {
  const user = await ctx.db.query.users.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.walletAddress, ctx.session.user.walletAddress), eq(t.chainId, ctx.session.user.chainId)),
  });

  if (!user) {
    throw new ActionError({ message: "User not found", code: 400 });
  }

  return user;
});

export const updateMe = protectedProcedure.input(z.object({ username: z.string().min(3) })).action(async ({ ctx, input: { username } }) => {

  const [user] = await ctx.db.update(users).set({
    username,
  }).where(eq(users.id, ctx.session.user.id)).returning();

  if (!user || user.username !== username) {
    throw new ActionError({ message: "User not updated!", code: 400 });
  }

  setSession(user);

  return true;
});

export const deleteMe = protectedProcedure.action(async ({ ctx }) => {
  await ctx.db.delete(users).where(eq(users.id, ctx.session.user.id));

  return true;
});

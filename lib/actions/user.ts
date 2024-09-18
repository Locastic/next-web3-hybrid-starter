'use server';

import { z } from "zod";
import { eq } from "drizzle-orm";

import { users } from "@/lib/db/schema";
import { protectedProcedure } from "@/lib/actions";

export const getMe = protectedProcedure.action(async ({ ctx }) => {
  const user = await ctx.db.query.users.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.walletAddress, ctx.session.user.walletAddress), eq(t.chainId, ctx.session.user.chainId)),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
});

export const updateMe = protectedProcedure.input(z.object({ username: z.string() })).action(async ({ ctx, input: { username } }) => {

  const [user] = await ctx.db.update(users).set({
    username,
  }).where(eq(users.id, ctx.session.user.id)).returning();

  if (!user || user.username !== username) {
    throw new Error("User not updated!");
  }

  return true;
});

export const deleteMe = protectedProcedure.action(async ({ ctx }) => {
  await ctx.db.delete(users).where(eq(users.id, ctx.session.user.id));

  return true;
});

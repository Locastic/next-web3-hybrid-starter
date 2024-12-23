"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { profiles } from "@/lib/db/schema";
import { ActionError, protectedProcedure } from "@/lib/actions";

export const updateMe = protectedProcedure
  .input(z.object({ username: z.string().min(3) }))
  .action(async ({ ctx, input: { username } }) => {
    const profileWithUsername = await ctx.db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.username, username),
    });

    if (profileWithUsername) {
      throw new ActionError({ message: "Username already exists", code: 400 });
    }

    const [profile] = await ctx.db
      .update(profiles)
      .set({
        username,
      })
      .where(eq(profiles.id, ctx.session.user.id))
      .returning();

    if (!profile || profile.username !== username) {
      throw new ActionError({ message: "User not updated!", code: 400 });
    }

    await ctx.supabase.anon.auth.updateUser({
      data: {
        username,
        display_name: `@${username}`,
      },
    });

    await ctx.supabase.anon.auth.refreshSession();

    return true;
  });

export const deleteMe = protectedProcedure.action(async ({ ctx }) => {
  await ctx.supabase.serviceRole.auth.admin.deleteUser(ctx.session.user.id);

  return true;
});

'use server';

import { z } from "zod";
import { generateNonce, SiweMessage } from "siwe";

import { publicProcedure } from "@/lib/actions";
import { deleteSession, getSecureSession, setSession } from "@/lib/auth/session";
import { users } from "@/lib/db/schema";
import { redirect } from "next/navigation";

export const nonce = publicProcedure.action(async () => {
  const session = await getSecureSession();
  session.nonce = generateNonce();
  await session.save();

  return { nonce: session.nonce };
});

export const register = publicProcedure
  .input(
    z.object({
      username: z.string(),
    })
  )
  .action(async ({ ctx, input: { username } }) => {
    const session = await getSecureSession();

    if (!session || !session.walletAddress || !session.chainId) {
      throw new Error("No registration session");
    }

    const userWithWallet = await ctx.db.query.users.findFirst({
      where: (t, { and, eq }) => and(eq(t.walletAddress, session.walletAddress), eq(t.chainId, session.chainId))
    });

    if (userWithWallet) {
      throw new Error("User already exists with this exact wallet/chain combination");
    }

    const userWithUsername = await ctx.db.query.users.findFirst({
      where: (t, { eq }) => eq(t.username, username)
    });

    if (userWithUsername) {
      throw new Error("Username already exists");
    }

    const [user] = await ctx.db.insert(users).values({
      walletAddress: session.walletAddress,
      chainId: session.chainId,
      username,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();


    if (!user) {
      throw new Error("Failed to create user");
    }

    setSession(user);
    session.destroy();

    redirect("/dashboard");
  });

export const login = publicProcedure
  .input(
    z.object({
      message: z.string(),
      signature: z.string()
    })
  )
  .action(async ({ ctx, input: { message, signature } }) => {
    const session = await getSecureSession();

    const siweMessage = new SiweMessage(JSON.parse(message));
    const { data: fields } = await siweMessage.verify({ signature });

    if (fields.nonce !== session.nonce) {
      throw new Error("Invalid nonce");
    }

    const userWithWallet = await ctx.db.query.users.findFirst({
      where: (t, { and, eq }) => and(eq(t.walletAddress, fields.address), eq(t.chainId, fields.chainId))
    });

    if (!userWithWallet) {
      session.walletAddress = fields.address;
      session.chainId = fields.chainId;

      await session.save();

      return { new: true };
    }

    setSession(userWithWallet);
    session.destroy();

    redirect("/dashboard");
  });

export const logout = publicProcedure.action(async () => {
  deleteSession();
});

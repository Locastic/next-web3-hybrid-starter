'use server';

import { z } from "zod";
import { generateSiweNonce, parseSiweMessage, SiweMessage } from "viem/siwe";
import { redirect } from "next/navigation";

import { ActionError, publicProcedure } from "@/lib/actions";
import { deleteSession, getSecureSession, setSession } from "@/lib/auth/session";
import { users } from "@/lib/db/schema";
import { publicClient } from "@/lib/web3/server";

// function wait(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export const nonce = publicProcedure.action(async () => {
  const session = await getSecureSession();
  session.nonce = generateSiweNonce();
  await session.save();

  return { nonce: session.nonce };
});

export const verify = publicProcedure
  .input(
    z.object({
      message: z.string(),
      signature: z.string()
    })
  )
  .action(async ({ ctx, input: { message, signature } }) => {
    const session = await getSecureSession();

    const siweMessage = parseSiweMessage(message) as SiweMessage;
    const success = await publicClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature: signature as `0x${string}`
    });

    if (!success) {
      throw new ActionError({ message: "Invalid signature", code: 400 })
    }


    if (siweMessage.nonce !== session.nonce) {
      throw new ActionError({ message: "Invalid nonce", code: 400 });
    }

    session.walletAddress = siweMessage.address;
    session.chainId = siweMessage.chainId;

    await session.save();

    const userWithWallet = await ctx.db.query.users.findFirst({
      where: (t, { and, eq }) => and(eq(t.walletAddress, session.walletAddress), eq(t.chainId, session.chainId))
    });

    // await wait(4000);

    if (!userWithWallet) {
      return { type: "signup" } as const;
    }

    return { type: "signin" } as const;
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
      throw new ActionError({ message: "No registration session", code: 400 });
    }

    const userWithWallet = await ctx.db.query.users.findFirst({
      where: (t, { and, eq }) => and(eq(t.walletAddress, session.walletAddress), eq(t.chainId, session.chainId))
    });

    if (userWithWallet) {
      throw new ActionError({ message: "No registration session", code: 400 });
    }

    const userWithUsername = await ctx.db.query.users.findFirst({
      where: (t, { eq }) => eq(t.username, username)
    });

    if (userWithUsername) {
      throw new ActionError({ message: "Username already exists", code: 400 });
    }

    const [user] = await ctx.db.insert(users).values({
      walletAddress: session.walletAddress,
      chainId: session.chainId,
      username,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();


    if (!user) {
      throw new ActionError({ message: "Failed to create user", code: 400 });
    }

    setSession(user);
    session.destroy();

    redirect("/dashboard");
  });

export const login = publicProcedure
  .action(async ({ ctx }) => {
    const session = await getSecureSession();

    const userWithWallet = await ctx.db.query.users.findFirst({
      where: (t, { and, eq }) => and(eq(t.walletAddress, session.walletAddress), eq(t.chainId, session.chainId))
    });

    // await wait(2000);

    if (!userWithWallet) {
      return { new: true };
    }

    setSession(userWithWallet);
    session.destroy();

    redirect("/dashboard");
  });

export const logout = publicProcedure.action(async () => {
  await deleteSession();
});

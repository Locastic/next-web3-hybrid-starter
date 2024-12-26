"use server";

import { z } from "zod";
import { generateSiweNonce, parseSiweMessage, SiweMessage } from "viem/siwe";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import { ActionError, publicProcedure, SupabaseClients } from "@/lib/actions";
import { publicClient } from "@/lib/web3/server";
import { secureCookieName } from "@/lib/constants";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";

type SecureSession = {
  nonce: string;
  walletAddress: string;
  chainId: number;
};

// function wait(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

async function getSecureSession() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  const cookieStore = await cookies();

  return getIronSession<SecureSession>(cookieStore, {
    cookieName: secureCookieName,
    password: process.env.AUTH_SECRET,
    ttl: 5 * 60,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
    },
  });
}

async function generateSession(
  supabase: SupabaseClients,
  data: {
    id: string;
    chainId: number;
    walletAddress: string;
    username: string;
    display_name: string;
  },
) {
  const {
    data: { user: tempUser },
    error,
  } = await supabase.anon.auth.signInAnonymously({
    options: {
      data,
    },
  });

  if (error) {
    throw new ActionError({ message: error.message, code: 400 });
  }

  if (!tempUser) {
    throw new ActionError({
      message: "Cannot create anonymous user!",
      code: 400,
    });
  }

  return tempUser.id;
}

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
      signature: z.string(),
    }),
  )
  .action(async ({ ctx, input: { message, signature } }) => {
    const session = await getSecureSession();

    const siweMessage = parseSiweMessage(message) as SiweMessage;
    const success = await publicClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature: signature as `0x${string}`,
    });

    if (!success) {
      throw new ActionError({ message: "Invalid signature", code: 400 });
    }

    if (siweMessage.nonce !== session.nonce) {
      throw new ActionError({ message: "Invalid nonce", code: 400 });
    }

    session.walletAddress = siweMessage.address;
    session.chainId = siweMessage.chainId;

    await session.save();

    const profileWithWallet = await ctx.db.query.profiles.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.walletAddress, session.walletAddress),
          eq(t.chainId, session.chainId),
        ),
    });

    // await wait(4000);

    if (!profileWithWallet) {
      return { type: "signup" } as const;
    }

    return { type: "signin" } as const;
  });

export const register = publicProcedure
  .input(
    z.object({
      username: z.string(),
    }),
  )
  .action(async ({ ctx, input: { username } }) => {
    const session = await getSecureSession();

    if (!session || !session.walletAddress || !session.chainId) {
      throw new ActionError({ message: "No registration session", code: 400 });
    }

    const profileWithWallet = await ctx.db.query.profiles.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.walletAddress, session.walletAddress),
          eq(t.chainId, session.chainId),
        ),
    });

    if (profileWithWallet) {
      throw new ActionError({ message: "No registration session", code: 400 });
    }

    const profileWithUsername = await ctx.db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.username, username),
    });

    if (profileWithUsername) {
      throw new ActionError({ message: "Username already exists", code: 400 });
    }

    const [profile] = await ctx.unsafe_db
      .insert(profiles)
      .values({
        chainId: session.chainId,
        walletAddress: session.walletAddress,
        username,
      })
      .returning();

    if (!profile) {
      throw new ActionError({
        message: "Cannot create new user!",
        code: 400,
      });
    }

    const tempId = await generateSession(ctx.supabase, {
      id: profile.id,
      chainId: session.chainId,
      walletAddress: session.walletAddress,
      username,
      display_name: `@${username}`,
    });

    await ctx.unsafe_db
      .update(profiles)
      .set({
        tempId,
      })
      .where(eq(profiles.id, profile.id));

    session.destroy();

    redirect("/dashboard");
  });

export const login = publicProcedure.action(async ({ ctx }) => {
  const session = await getSecureSession();

  const profileWithWallet = await ctx.db.query.profiles.findFirst({
    where: (t, { and, eq }) =>
      and(
        eq(t.walletAddress, session.walletAddress),
        eq(t.chainId, session.chainId),
      ),
  });

  // await wait(2000);

  if (!profileWithWallet) {
    // TODO: mabye change to throwing an error?
    return { new: true };
  }

  const tempId = await generateSession(ctx.supabase, {
    id: profileWithWallet.id,
    chainId: session.chainId,
    walletAddress: session.walletAddress,
    username: profileWithWallet.username,
    display_name: `@${profileWithWallet.username}`,
  });

  await ctx.unsafe_db
    .update(profiles)
    .set({
      tempId,
    })
    .where(eq(profiles.id, profileWithWallet.id));

  session.destroy();

  redirect("/dashboard");
});

export const logout = publicProcedure.action(async ({ ctx }) => {
  if (!ctx.session) {
    throw new ActionError({
      message: "Cannot retrieve current connected user!",
      code: 400,
    });
  }

  await ctx.supabase.serviceRole.auth.admin.deleteUser(
    ctx.session.user.temp_id,
  );

  await ctx.supabase.anon.auth.signOut();
});

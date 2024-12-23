"use server";

import { z } from "zod";
import { generateSiweNonce, parseSiweMessage, SiweMessage } from "viem/siwe";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import { ActionError, publicProcedure, SupabaseClients } from "@/lib/actions";
import { publicClient } from "@/lib/web3/server";
import { secureCookieName } from "@/lib/constants";

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

async function generateSession(supabase: SupabaseClients, id: string) {
  const {
    data: { user },
    error: getUserByIdError,
  } = await supabase.serviceRole.auth.admin.getUserById(id);

  if (!user || !user.email || getUserByIdError) {
    throw new ActionError({
      message: "Couldn't retrieve user information!",
      code: 400,
    });
  }

  const {
    data: { properties },
    error: generateLinkError,
  } = await supabase.serviceRole.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });

  if (!properties || !properties.hashed_token || generateLinkError) {
    throw new ActionError({
      message: "Couldn't generate access properties!",
      code: 400,
    });
  }

  const { data, error } = await supabase.anon.auth.verifyOtp({
    type: "email",
    token_hash: properties.hashed_token,
  });

  if (!data || error) {
    throw new ActionError({
      message: "Couldn't generate access properties!",
      code: 400,
    });
  }

  // NOTE: change provider to "walletconnect" again
  await supabase.serviceRole.auth.admin.updateUserById(id, {
    app_metadata: {
      provider: "walletconnect",
      providers: ["walletconnect"],
    },
  });
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

    const { error } = await ctx.supabase.serviceRole.auth.admin.createUser({
      email: `${session.chainId}_${session.walletAddress}@internal`,
      app_metadata: {
        provider: "walletconnect",
        providers: ["walletconnect"],
        chainId: session.chainId,
        walletAddress: session.walletAddress,
      },
      user_metadata: {
        chainId: session.chainId,
        walletAddress: session.walletAddress,
        username,
        display_name: `@${username}`,
      },
    });

    if (error) {
      throw new ActionError({ message: error.message, code: 400 });
    }

    const profile = await ctx.db.query.profiles.findFirst({
      where: (t, { eq, and }) =>
        and(
          eq(t.walletAddress, session.walletAddress),
          eq(t.chainId, session.chainId),
        ),
    });

    if (!profile) {
      throw new ActionError({
        message:
          "We couldn't find user that we just created, isn't that something!",
        code: 400,
      });
    }

    await generateSession(ctx.supabase, profile.id);

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

  await generateSession(ctx.supabase, profileWithWallet.id);

  session.destroy();

  redirect("/dashboard");
});

export const logout = publicProcedure.action(async ({ ctx }) => {
  await ctx.supabase.anon.auth.signOut();
});

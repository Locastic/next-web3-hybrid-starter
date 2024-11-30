import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getIronSession } from 'iron-session';

import type { NewUser } from '@/lib/db/schema';
import { sessionCookieName, secureCookieName } from '@/lib/constants';

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set");
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
export const sessionExpiresIn = new Date(Date.now() + day);

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

type SecureSession = {
  nonce: string;
  walletAddress: string;
  chainId: number;
};

export type SessionData = {
  user: {
    id: number;
    username: string;
    walletAddress: string;
    chainId: number;
  };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSecureSession() {
  const cookieStore = await cookies();

  return getIronSession<SecureSession>(cookieStore, {
    cookieName: secureCookieName,
    password: process.env.AUTH_SECRET!,
    ttl: 5 * 60,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
    },
  });
};

export async function getSession() {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(sessionCookieName);

  if (!sessionCookie || !sessionCookie.value) {
    // console.error("No session");
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);

  if (!sessionData || !sessionData.user || typeof sessionData.user.id !== "number") {
    // console.error("Invalid session");
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    // console.error("Session expired");
    return null;
  }

  return sessionData;
}

export async function setSession(user: NewUser) {
  const cookieStore = await cookies();

  const session: SessionData = {
    user: {
      id: user.id!,
      username: user.username,
      walletAddress: user.walletAddress,
      chainId: user.chainId,
    },
    expires: sessionExpiresIn.toISOString(),
  };

  const encryptedSession = await signToken(session);

  cookieStore.set(sessionCookieName, encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: 'lax',
    expires: sessionExpiresIn,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.delete(sessionCookieName);
}

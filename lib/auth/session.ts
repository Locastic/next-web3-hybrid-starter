import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getIronSession } from 'iron-session';

import type { NewUser } from '@/lib/db/schema';
import { sessionCookieName, secureCookieName } from '@/lib/constants';

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set");
}

const minute = 60;

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

export function getSecureSession() {
  return getIronSession<SecureSession>(cookies(), {
    cookieName: secureCookieName,
    password: process.env.AUTH_SECRET!,
    ttl: 5 * minute,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
    },
  });
};

export async function getSession() {
  const sessionCookie = cookies().get(sessionCookieName);

  if (!sessionCookie || !sessionCookie.value) {
    console.error("No session");
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);

  if (!sessionData || !sessionData.user || typeof sessionData.user.id !== "number") {
    console.error("Invalid session");
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    console.error("Session expired");
    return null;
  }

  return sessionData;
}

export async function _getSession() {
  const sessionCookie = cookies().get(sessionCookieName)?.value;

  if (!sessionCookie) {
    return undefined;
  }

  try {
    const parsed = await verifyToken(sessionCookie);

    return parsed;
  } catch (error) {
    return undefined;
  }
}

export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: {
      id: user.id!,
      username: user.username,
      walletAddress: user.walletAddress,
      chainId: user.chainId,
    },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  cookies().set(sessionCookieName, encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

export function deleteSession() {
  cookies().delete(sessionCookieName);
}

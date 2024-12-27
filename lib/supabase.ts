import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";

import { getCookieOptions } from "@/lib/utils";

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type SupabaseToken = {
  aal: string;
  aud: string;
  email: string;
  exp: number;
  iat: number;
  phone: string;
  role: string;
  session_id: string;
  sub: string;
  amr?: { method: string; timestamp: number }[];
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };
  is_anonymous?: boolean;
  iss?: string;
  jti?: string;
  nbf?: string;
  user_metadata?: {
    [key: string]: any;
  };
} & {
  user_metadata: {
    id: string;
    chainId: number;
    walletAddress: `0x${string}`;
    username: string;
  };
};

export async function createAnonClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export async function createServiceRoleClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is not set",
    );
  }

  const cookieStore = await cookies();

  // NOTE: probably disable all the cookies stuff here?
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export async function getSession() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  const supabase = await createAnonClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    return null;
  }

  try {
    const key = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload: decoded }: { payload: SupabaseToken } = await jwtVerify(
      session.access_token,
      key,
    );

    const validatedSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: decoded.exp,
      expires_in: decoded.exp - Math.round(Date.now() / 1000),
      token_type: "bearer",
      user: {
        app_metadata: decoded.app_metadata,
        aud: "authenticated",
        created_at: "",
        // NOTE: decoded.sub here is the id of the temporary user, we don't want that, we want the actual id from `public.profiles`
        id: decoded.user_metadata.id,
        temp_id: decoded.sub,
        user_metadata: {
          chainId: decoded.user_metadata.chainId,
          walletAddress: decoded.user_metadata.walletAddress,
          username: decoded.user_metadata.username,
        },
      },
    };

    return validatedSession;
  } catch (err) {
    return null;
  }
}

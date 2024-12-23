import { clsx, type ClassValue } from "clsx";
import { decodeJwt } from "jose";
import { twMerge } from "tailwind-merge";
import { sepolia } from "viem/chains";
import { CookieOptionsWithName } from "@supabase/ssr";

import { SupabaseToken } from "@/lib/supabase";
import { sessionCookieName } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getChainName(chainId: number) {
  switch (chainId) {
    case sepolia.id:
      return "Sepolia";
    default:
      return "Unknown";
  }
}

export function shortenAddress(address: string): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function decode(accessToken: string) {
  try {
    return decodeJwt<SupabaseToken>(accessToken);
  } catch (error) {
    return null;
  }
}

export function getCookieOptions() {
  return {
    name: sessionCookieName,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
  } satisfies CookieOptionsWithName;
}
